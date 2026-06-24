# recon: CRI-O

調査メモ。出典は URL を添える。path:line は pinned commit 基準。

## 基本情報

- repo: `cri-o/cri-o`
- pinned commit: `68f2617bf26cc328f3d6edb030ed830362f4b76b` (2026-06-22 09:31 UTC, `main`)
- 近いタグ: shallow clone のため `git describe` 不可。`internal/version/version.go:6` の `Version = "1.37.0"` より、このコミットは未リリースの 1.37 開発線上。直近リリース済みタグは `v1.36.1` (2026-06-03)。`ReleaseMinorVersions = {1.36, 1.35, 1.34}`。
- 言語 / ビルド: Go (`go 1.26.3`, `go.mod:1`)。ビルドは `make binaries` -> `bin/crio: $(GO_BUILD) ... ./cmd/crio` (`Makefile:212-213`)。
- ライセンス: Apache License 2.0。`LICENSE:1-3` で確認、`gh` の `licenseInfo.key=apache-2.0` とも一致。
- CNCF 成熟度: Graduated (2023-07-19 graduate)。
- カテゴリ: Runtime。

CRI-O は単一バイナリ `crio` を吐く CRI 実装。CLI は提供しない (テスト用の `crictl` は別物)。エントリポイントは `cmd/crio/main.go`。urfave/cli v2 で起動し、gRPC サーバを cmux 多重化で立てる (`cmd/crio/main.go:21,26` の `cmux` / `grpc` import)。

スコープは README が明示する。ランタイムは [runc](https://github.com/opencontainers/runc) などの OCI 実装に委譲、イメージは containers/image、ストレージは containers/storage、ネットワークは CNI に委譲する (`README.md:113-119`)。CRI-O 自身は kubelet と OCI ランタイムの接着に徹する。

## 歴史の素材

- 2016: Kubernetes が CRI (Container Runtime Interface) を導入。kubelet が再コンパイルなしに別ランタイムを差せるプラグイン境界。CRI-O は当初 `OCID` の名で Red Hat 主導、Kubernetes incubator で Red Hat と Google の開発者により開始。出典: [CNCF announcement (2023-07-19)](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)、[Red Hat blog](https://www.redhat.com/en/blog/red-hat-contributes-cri-o-cloud-native-computing-foundation)。
- repo 作成は 2016-09-09 (`gh api repos/cri-o/cri-o .created_at`)。
- 2019-04-08: CNCF TOC が Incubating として受け入れ。出典: [CNCF to host CRI-O (2019-04-08)](https://www.cncf.io/blog/2019/04/08/cncf-to-host-cri-o/)。当時のメンテナは Red Hat / Intel / SUSE、利用は Lyft / Red Hat / SUSE 等。
- 2023-07-19: Graduated に昇格。Incubation 中に 11 マイナー / 約 100 パッチ / 4000+ commit、数万クラスタ規模。Graduation 条件として governance 更新、Code of Conduct、security list、Ada Logics による security audit (CNCF + OSTIF coordinate)、エンドユーザ確保とインタビューを実施。出典: 同 CNCF announcement、[InfoQ (2023-09)](https://www.infoq.com/news/2023/09/cncf-crio-graduation/)。
- 名前の `o` と pod の由来: 初期は Podman (libpod) が CRI-O 内にあり、Docker CLI 風の体験を提供していた。出典: 同 CNCF announcement。

## アーキテクチャの素材

トップレベル構成 (リポジトリ root):

- `cmd/crio/` - エントリポイント。`main.go` / `daemon_linux.go`。
- `server/` - CRI gRPC サーバ実装。112 個の `.go`。`RuntimeService` と `ImageService` の各 RPC が `container_*.go` / `sandbox_*.go` / `image_*.go` に分かれる。
- `internal/oci/` - OCI ランタイム抽象。`RuntimeImpl` interface (`oci.go:60-86`) と 3 実装 (`runtime_oci.go` = conmon+runc/crun, `runtime_pod.go` = conmonrs, `runtime_vm.go` = Kata 等 VM)。
- `internal/lib/` - `ContainerServer` (Server が embed する中核) と `sandbox/` の `Sandbox` 型。
- `internal/storage/` - containers/storage (`go.podman.io/storage`) ラッパ。イメージ pull / レイヤ / コンテナ rootfs。
- `internal/config/`, `pkg/config/` - `crio.conf` 設定モデル。
- `internal/hostport/` と CNI 連携の `server/sandbox_network_linux.go`。
- `internal/nri/` - Node Resource Interface プラグイン。`internal/resourcestore/` - 非同期作成のリソース予約と cleanup。

`Server` 構造体 (`server/server.go:69-104`): `*lib.ContainerServer` を embed し、CRI の `UnimplementedImageServiceServer` / `UnimplementedRuntimeServiceServer` を埋める。注目フィールド: `pullOperationsInProgress map[pullArguments]*pullOperation` と `pullOperationsLock` で同一イメージの並列 pull を 1 本化 (`server.go:84-88,106-126`)、`resourceStore *resourcestore.ResourceStore` で作成途中リソースを退避、`nri *nriAPI`、`hooksRetriever`。

### 代表オペレーションの end-to-end: RunPodSandbox

kubelet が Pod を起こす起点 RPC。トレース:

1. `server/sandbox_run.go:68` `RunPodSandbox` はプラットフォーム実装 `runPodSandbox` (`sandbox_run_linux.go:409`) に委譲。
2. `libsandbox.NewBuilder()` で sandbox を組み立て、`GenerateNameAndID()` で OCI 名 `<ns>-<name>-<attempt>` と ID を採番 (`sandbox_run_linux.go:413-438`)。
3. `reservePodNameOrGetExisting` で名前予約 (冪等性: 既存なら即 return)、`resourcestore` に "sandbox creating" stage を記録、失敗時 cleanup を `resourceCleaner.Add` で積む (`sandbox_run_linux.go:440-468`)。
4. hostNetwork でなければ `waitForCNIPlugin` で CNI 準備待ち (`sandbox_run_linux.go:472-476`)。
5. pause(infra) イメージで storage に sandbox を作成: `StorageRuntimeServer().CreatePodSandbox(...)` (`sandbox_run_linux.go:535-547`)。`ErrDuplicateName` を明示処理。
6. OCI spec を `runtime-tools/generate` で組み立て (cgroup parent / path は `s.config.CgroupManager().SandboxCgroupPath` `:1148`)、`config.json` を bundle に書く (`sandbox_run_linux.go:1343`)。
7. infra コンテナ生成: `runtimeType` が VM/pod でなければ `oci.NewContainer(...)` (`sandbox_run_linux.go:1294`)、VM 系は `NewSpoofedContainer` (`:1310`)。
8. `createAndStartInfraContainer` (`sandbox_run_linux.go:1350`): `addInfraContainer` -> `createContainerPlatform` -> hooks PreStart -> `generateCRIEvent(CONTAINER_CREATED)` -> `Runtime().StartContainer` (`:1372`) -> 状態を disk に永続化。
9. ネットワーク確立: `s.networkStart(ctx, sb)` で IP と CNI result を取得 (`sandbox_run_linux.go:1489`)。
10. rootfs マウント: `StorageRuntimeServer().StartContainer(sboxID)` (`sandbox_run_linux.go:1587`)。

作成途中の失敗は `resourceCleaner` の LIFO cleanup で巻き戻る (`defer` 内 `:444-453`)。

### 非自明な設計判断: conmon による監視プロセス分離

CRI-O はコンテナを直接 fork しない。`runtime_oci.go` の create は OCI ランタイム (runc/crun) を直接実行せず、監視デーモン `conmon` を起動し、`conmon` に `-r <runtime path>` と `--runtime-arg root=<root>` を渡して runc を間接起動する (`internal/oci/runtime_oci.go:145-160,217`)。`cmd := cmdrunner.Command(r.handler.MonitorPath, args...)` の `MonitorPath` が conmon。これで crio デーモンを再起動してもコンテナの親 (conmon) は生き続け、stdio/log/exit-code 回収・端末割当・OOM 処理を担う。`RuntimeImpl` を 3 実装に切る抽象 (`oci.go:60`) により、同じ CRI 経路で runc(conmon) と conmonrs と Kata(VM) を runtime handler ごとに差し替えられる (`oci.go:184` の `RuntimeType`)。

## 内部実装の素材

中核データ構造:

- `Server` (`server/server.go:69-104`): CRI サーバ本体。embed した `*lib.ContainerServer` 経由で Runtime/Store/StorageRuntimeServer にアクセス。並列 pull 抑止マップを内包。
- `oci.RuntimeImpl` interface (`internal/oci/oci.go:60-86`): Create/Start/Stop/Exec/Attach/Checkpoint などコンテナライフサイクル RPC を定義。`Runtime` 型が handler 名 -> 実装の `runtimeImplMap` を持つ (`oci.go:95-98`)。
- `oci.Container` (`internal/oci/container.go:44`): 1 コンテナ。`criContainer *types.Container`、`bundlePath` (/var/run, リブートで消える) と `dir` (/var/lib, 永続) を分離保持、`spec *specs.Spec`、`state`、`monitorProcess *os.Process` (conmon)、`opLock`/`metaLock`/`stopLock` の細粒度ロック、`execPIDs` など。
- `libsandbox.Sandbox` (`internal/lib/sandbox/sandbox.go:33`): 1 Pod。`netns/ipcns/utsns/userns` の namespace ハンドル、`infraContainer *oci.Container`、`containers memorystore.Storer[*oci.Container]`、`ips`、`portMappings`、`stateMutex` で created/stopped/networkStopped を保護。
- `config.RuntimeHandler` (`pkg/config`): runtime handler 1 個分の設定。`RuntimePath` / `MonitorPath` / `RuntimeType` / `AllowedAnnotations` / `PlatformRuntimePaths` など。`oci.go:108-124` の `ValidateRuntimeHandler` が空 path を弾く。

追う価値のあるパス: `server/sandbox_run_linux.go` (Pod 作成 1631 行)、`server/container_create_linux.go` (コンテナ作成)、`internal/oci/runtime_oci.go` (conmon 起動)、`internal/storage/` (pull と rootfs)。

## 採用事例の素材

出典: [ADOPTERS.md](https://github.com/cri-o/cri-o/blob/main/ADOPTERS.md) に記載の組織のみ (捏造なし)。

- Red Hat OpenShift Container Platform - OpenShift 4 以降は CRI-O が唯一サポートされる CRI 実装。出典: [Red Hat blog: OCP4 defaults to CRI-O](https://www.redhat.com/en/blog/red-hat-openshift-container-platform-4-now-defaults-cri-o-underlying-container-engine)。
- Oracle Linux Cloud Native Environment / Oracle Kubernetes Engine (runc と Kata を扱える点を評価)。出典: [Oracle docs: CRI-O](https://docs.oracle.com/en/operating-systems/olcne/2/kubernetes/crio_concept.html)。
- SUSE CaaS Platform (v4 で既定ランタイム)、openSUSE Kubic、Digital Science、HERE Technologies、Particule、Nestybox (Sysbox 配布)、Lyft (2017 から)、Reddit、Adobe、PITS Global Data Recovery Services。いずれも ADOPTERS.md 記載。

採用シグナル (2026-06-22 時点、`gh api repos/cri-o/cri-o`): stars 5,628 / forks 1,179 / watchers 119 / open issues 133。contributors は GitHub API 列挙で約 326。直近リリース `v1.36.1` (2026-06-03)。

## 代替・エコシステム

- 主要代替: [containerd](https://github.com/containerd/containerd) (CNCF Graduated, より汎用で Docker と Kubernetes 両対応、plugin/snapshotter 設計)。CRI-O は Kubernetes 専用に絞り、Kubernetes マイナーとバージョンを揃える (`v1.x` が k8s `1.x` に対応)。
- Docker の dockershim は k8s 1.24 で kubelet から除去され、CRI-O と containerd が事実上の選択肢。
- 委譲先 (エコシステム): runc / crun (OCI runtime)、conmon / conmonrs (監視)、containers/image と containers/storage (Podman/Buildah と共有)、CNI (ネットワーク)、Kata Containers (VM 分離 sandbox を runtime handler 経由)、NRI プラグイン。
- 本質的差: CRI-O は kubelet 専用で最小、k8s と歩調を揃える。汎用 CLI も daemon としての image builder も持たず、スコープ外を README が明記する (`README.md:102-107`)。

## インストール / 最小起動

- パッケージ: 公式 docs の [install.md](https://github.com/cri-o/cri-o/blob/main/install.md)。OBS リポジトリや bundle tarball を提供。
- 前提: OCI runtime (runc または crun) と conmon、CNI plugins が必要 (`README.md:113-119`)。
- ソースビルド: `make binaries` で `bin/crio` (`Makefile:183,212`)。
- 最小起動: `crio` デーモンを起動し、kubelet を `--container-runtime-endpoint=unix:///var/run/crio/crio.sock` に向ける。kubeadm 連携は `tutorials/kubeadm.md`、kind は `tutorials/crio-in-kind.md`、検証は `crictl` (`tutorials/crictl.md`)。
