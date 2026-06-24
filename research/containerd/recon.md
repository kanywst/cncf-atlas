# recon: containerd

調査メモ。containerd は OCI 準拠のコンテナランタイム/デーモン。Kubernetes の CRI と Docker/Moby の下回りを担う「業界標準」のコア実装。自分用の密度。出典は URL と `file:line` で残す。

## 基本情報

- repo: `containerd/containerd` (<https://github.com/containerd/containerd>)
- pinned commit: `e96fd14b81ba273a38d0506056669ba571fea0bf` (main, commit date 2026-06-19)
- 近いタグ: `version/version.go:23` が `Version = "2.3.0+unknown"` なので main 上の直近タグは `v2.3.0`。リリース系列の最新タグは `v2.3.2` (release/2.3 ブランチ)。v2.x 系が現行メジャー
- 言語 / ビルド: Go (`go.mod:3` で `go 1.26.3`、module は `github.com/containerd/containerd/v2`)。ビルドは `make` / `make binaries` (`Makefile:205`, `:277`)。`cmd/containerd` がデーモン、`cmd/ctr` がデバッグ用 CLI、`cmd/containerd-shim-runc-v2` が runc 用 shim
- ライセンス: Apache-2.0 (`LICENSE` は Apache 2.0 全文 191 行、`NOTICE` 同梱)。GitHub API の `spdx_id` も `Apache-2.0` で一致確認
- CNCF 成熟度: Graduated (2019-02-28 卒業。CNCF 5 番目の卒業プロジェクト)
- カテゴリ: Runtime (CNCF landscape の Container Runtime)
- エントリポイント: `cmd/containerd/main.go:28` の `func main()`。`command.App()` を `app.Run(os.Args)` するだけ。ビルトインプラグイン群を `import _ "github.com/containerd/containerd/v2/cmd/containerd/builtins"` で副作用 import して登録する (`main.go:24`)
- 主要依存: `github.com/opencontainers/runtime-spec v1.3.0` (`go.mod`)。runc 自体はバイナリ依存 (実行時に exec)。ttrpc / gRPC / containerd 系サブモジュール (`containerd/plugin` 等) を vendoring

## 歴史の素材

- 起源: 2014 年に Docker 社内で Docker engine の「下回りランタイムマネージャ」として誕生。runc プロセス群を管理する層。基盤は 2015 年に libcontainer が OCI 既定実装 runc になった流れに連なる (出典: containerd `ADOPTERS.md`, CNCF graduation 発表)。
- Docker 1.11 で Docker engine のコアランタイムとして統合。`docker run` 時に dockerd が containerd に lifecycle を委譲し、containerd が runc 経由でカーネルを叩く構成になった (出典: Docker blog "containerd vs Docker", DataCamp 解説)。
- CNCF 寄贈: 2017-03-29 に Incubating で受理 (Docker が独立プロジェクトとして切り出し寄贈)。2019-02-28 に Graduated 昇格。Kubernetes, Prometheus, Envoy, CoreDNS に続く 5 番目の卒業 (出典: CNCF graduation 発表 2019-02-28)。
- 卒業時点の規模 (CNCF 発表): committer 14 名、commit 4,406、contributor 166 名。参加企業に Alibaba, Cruise Automation, Docker, Facebook, Google, Huawei, IBM, Microsoft, NTT, Tesla 等。
- メジャーの節目: 1.0 (2017) で安定 API、CRI プラグインを内蔵化。2.0 系で module path が `/v2` に、CRI まわりの整理や sandbox API の拡充が進む。pin 時点は 2.3 系。

## アーキテクチャの素材

containerd は単一デーモン `containerd` が gRPC (既定 UNIX socket `/run/containerd/containerd.sock`) でサービス群を公開し、内部は「プラグインの集合体」として構成される。トップレベルのコード配置:

- `cmd/`: 実行バイナリ。`containerd` (デーモン)、`ctr` (デバッグ CLI)、`containerd-shim-runc-v2` (runc shim)、`containerd-stress`、`gen-manpages` 等
- `core/`: ドメインロジック本体。`content` (CAS ブロブストア)、`images`、`snapshots` (overlayfs 等のレイヤ管理)、`diff` (レイヤ展開/差分)、`containers` (メタデータ)、`runtime` (タスク/shim 抽象)、`metadata` (bolt による永続化)、`remotes` (レジストリ pull/push)、`sandbox`、`leases` (GC リース)、`mount`、`transfer`
- `plugins/`: 上記 core を gRPC サービスや CRI として配線するプラグイン実装。`plugins/services/*` が gRPC サービス、`plugins/cri` が Kubernetes CRI 実装、`plugins/snapshots`、`plugins/content` など
- `client/`: Go クライアント SDK (`client.New(...)` で daemon に接続)
- `api/`: protobuf 定義と生成コード
- `internal/`, `pkg/`, `contrib/`, `integration/`, `vendor/`

プラグインモデルが設計の核。各機能は `plugin.Registration` (`vendor/github.com/containerd/plugin/plugin.go:61`) として登録される。構造体は `Type` / `ID` / `Config` / `Requires []Type` (依存プラグイン型) / `InitFn func(*InitContext)` を持ち、デーモン起動時に依存解決して順次初期化される。`cmd/containerd/builtins` の副作用 import で何を組み込むか (CRI、各 snapshotter 等) を決める。

リクエストの流れ (例: `ctr run` / kubelet の CRI): クライアント -> gRPC サービス (`plugins/services/tasks`) -> core runtime (`core/runtime/v2` の TaskManager) -> shim バイナリを exec -> shim が ttrpc サーバを立てて runc を駆動。デーモンと shim は別プロセスで ttrpc (軽量 gRPC 亜種) で会話する。

## 内部実装の素材

代表的なコア操作 = 「タスク (= 実行中コンテナ) の作成」を端から端まで追う。これが containerd の最重要パス。

ステップ1 (gRPC サービス受け口): TaskService.Create は `plugins/services/tasks/local.go:171` の `(*local).Create`。コンテナのメタデータを引き、`runtime.CreateOpts` を組み立てる (`local.go:239`)。Spec / Rootfs マウント / IO / Runtime 名 / SandboxID を詰める。既存タスク重複チェック後、`rtime.Create(ctx, r.ContainerID, opts)` を呼ぶ (`local.go:277`)。`rtime` は v2 ランタイム = TaskManager。

ステップ2 (TaskManager: bundle 作成とマウント): `core/runtime/v2/task_manager.go:159` の `(*TaskManager).Create`。まず `NewBundle` で OCI bundle ディレクトリ (config.json と rootfs) をディスク上に作る (`task_manager.go:160`)。次に rootfs マウントを `m.mounts.Activate` で活性化 (`task_manager.go:189`)。失敗時は bundle 削除と mount deactivate を defer で巻き戻す。

ステップ3 (shim バイナリの起動): `task_manager.go:213` で `m.manager.Start(ctx, taskID, bundle, opts)`。実体は `core/runtime/v2/shim_manager.go:299` の `(*ShimManager).startShim`。`resolveRuntimePath` で runtime 名 (`io.containerd.runc.v2` 等) を実 fs パスに解決し、`shimBinary(...)` を構築 (`shim_manager.go:316`)、`b.Start(...)` を呼ぶ。

ステップ4 (shim プロセス exec と接続確立): `core/runtime/v2/binary.go:66` の `(*binary).Start`。`client.Command(..., Action: "start", ...)` で shim バイナリの起動コマンドを組む (`binary.go:69`、`Action: "start"` が `binary.go:80`)。`cmd.CombinedOutput()` で実行し (`binary.go:117`)、shim が stdout に印字したアドレス文字列を `parseStartResponse` で解析 (`binary.go:133`)、`makeConnection` で ttrpc 接続を張る (`binary.go:138`)。再起動後の復元用に `bootstrap.json` を書き出す (`binary.go:144`)。戻り値は `shim{bundle, client, address, version}` (`binary.go:149`)。

ステップ5 (タスク本体の生成 RPC): `task_manager.go:220` で接続済み shim を `newShimTask` でラップし、`shimTask.Create(ctx, opts)` (`task_manager.go:232`) を ttrpc 越しに呼ぶ。ここで shim プロセス側が runc に container を作らせる。`IsNotImplemented` なら API バージョンを下げて再試行する downgrade パスもある (`task_manager.go:237-249`)。失敗時は shim を delete/shutdown して掃除する (`task_manager.go:252-272`)。

中核データ構造:

- `runtime.CreateOpts` (`core/runtime/runtime.go:36`): タスク作成の入力一式。`Spec typeurl.Any` (OCI runtime spec)、`Rootfs []mount.Mount`、`IO`、`Runtime string` (`io.containerd.NAME.VERSION` 形式)、`SandboxID`、`Checkpoint` 等。
- `containers.Container` (`core/containers/containers.go:30`): 永続メタデータ。`ID` (namespace 内で一意・不変)、`Image`、`Runtime RuntimeInfo` (必須・不変)、`Spec typeurl.Any`、`SnapshotKey` (rootfs スナップショット参照)。タスクではなく「コンテナ定義」を表す。
- `runtime/v2.Bundle` (`core/runtime/v2/bundle.go:122`): `ID` / `Path` / `Namespace`。ディスク上の OCI bundle ディレクトリの抽象。`Delete()` で atomic に掃除。
- `runtime/v2.ShimManager` (`core/runtime/v2/shim_manager.go:177`): shim 群のライフサイクル管理。`shims *runtime.NSMap[ShimInstance]` (namespace 別の shim 集合)、`containerdAddress` / `containerdTTRPCAddress`、`runtimePaths sync.Map` (runtime 名 -> パスのキャッシュ)、`events *exchange.Exchange`。
- `runtime/v2.shim` (`core/runtime/v2/shim_manager.go:408`): 1 shim プロセスへのハンドル。`bundle *Bundle` / `client any` (ttrpc クライアント) / `address` / `version`。
- `plugin.Registration` (`vendor/github.com/containerd/plugin/plugin.go:61`): デーモン全体の組み立て単位。`Type` / `ID` / `Requires []Type` / `InitFn`。

非自明な設計判断: shim を「コンテナ (または pod sandbox) ごとに常駐する別プロセス」にして、デーモンとは ttrpc で疎結合にしている (`binary.go` の exec + ttrpc 接続、`bootstrap.json` の書き出し)。狙いは2つ。1つ目は containerd デーモンを再起動・アップグレードしても実行中コンテナが死なないこと。shim と runc プロセスは生き続け、再接続時に `restoreBootstrapParams` (`shim_manager.go:343`) で復元する。2つ目はコンテナの reparent と exit 収集を shim に任せ、デーモンを薄く保てること。`onClose` コールバック内の `cleanupAfterDeadShim` (`shim_manager.go:326`) で shim 死亡時の後始末と taskExit イベント発行を行う。さらにデーモン-shim 間は gRPC ではなく ttrpc を使い、shim あたりのメモリを抑える。プラグイン化 (`Registration.Requires` による依存 DI) と合わせて「最小核 + 差し替え可能な周辺」を実現している。

最小利用 (バイナリ運用): containerd デーモン + runc + CNI plugins を入れ、`containerd config default > /etc/containerd/config.toml` で既定設定を出力し起動する。動作確認は `ctr image pull docker.io/library/hello-world:latest` のあと `ctr run docker.io/library/hello-world:latest test`。Kubernetes では kubelet が CRI socket (`/run/containerd/containerd.sock`) 経由で使う。Go から使うなら `client.New("/run/containerd/containerd.sock")`。

## 採用事例の素材

出典付き (リポジトリ同梱 `ADOPTERS.md` に明記の組織・製品のみ。捏造なし):

- Docker / Moby engine: containerd は元々 Docker engine の下回り。今も `docker` の実行基盤 (`ADOPTERS.md`)。
- Google Kubernetes Engine (GKE): 1.14 から提供、1.19 から既定ランタイム、Autopilot は launch 時から containerd のみ (`ADOPTERS.md`)。
- Amazon EKS / AWS Fargate / Bottlerocket: EKS は 1.21 から CRI として提供 (1.22 で既定)、Fargate は containerd + Firecracker、Bottlerocket は OS のコアランタイム (`ADOPTERS.md`)。
- Azure Kubernetes Service (AKS): Linux ノード 1.19+ / Windows 1.20+ で containerd (`ADOPTERS.md`)。
- IBM Cloud Kubernetes Service (IKS): 1.11+ で CRI ランタイム (`ADOPTERS.md`)。
- k3s (Rancher/SUSE): 軽量 Kubernetes の組み込みランタイム (`ADOPTERS.md`)。
- Talos Linux / Deckhouse / VMware TKG・TCE: いずれも既定 CRI ランタイムとして採用 (`ADOPTERS.md`)。
- Kata Containers / Firecracker (firecracker-containerd): v2 shim を独自実装して containerd から VM ベースのコンテナを駆動 (`ADOPTERS.md`)。
- OpenFaaS faasd / Balena / LinuxKit / BuildKit / Cloud Foundry Guardian: いずれも containerd を実行基盤に採用 (`ADOPTERS.md`)。

採用シグナル (数値): GitHub stars 20,870 / forks 3,979 (GitHub API, 2026-06-22 取得)。CNCF LFX Insights は total contributors 6,382 (前年比 +10%)、contributing organizations 1,667、最初の commit 2015-07-17、Health Score "Excellent (83)" と報告 (CNCF プロジェクトページ)。

## 代替・エコシステム

- 直接の代替 (CRI ランタイム): CRI-O (Kubernetes 専用に絞った OCI ランタイム、Red Hat 主導)、Docker/Moby (内部で containerd を使うため厳密には競合でなく上位)、Mirantis cri-dockerd。本質差: containerd は Kubernetes 専用ではなく汎用ランタイム API を持ち、CRI はその一プラグイン。CRI-O は CRI 表面だけに特化し小さい。
- OCI ランタイム (containerd の下で exec される実体): runc (既定)、crun (C 実装で軽量・高速)、gVisor runsc (ユーザ空間カーネルで隔離)、Kata Containers / Firecracker (VM 隔離)、youki (Rust)。containerd は shim v2 抽象でこれらを差し替えられる。
- エコシステム/統合: nerdctl (Docker 互換 CLI、約 10k stars)、BuildKit (イメージビルド)、stargz-snapshotter / SOCI (遅延 pull)、runwasi (Wasm を shim 経由で実行、Rust)、CNI (ネットワーク)、各種 snapshotter (overlayfs, devmapper, zfs, btrfs)。
- 隣接: Podman (daemonless、containerd を使わず conmon + crun)。Docker とは「Docker が上位、containerd が下位コア」という階層関係。

## 確認した一次情報の所在

- コード: 上記 `core/runtime/v2/*`, `plugins/services/tasks/local.go`, `cmd/containerd/main.go`, `core/containers/containers.go`, `vendor/github.com/containerd/plugin/plugin.go`
- ライセンス/バージョン: `LICENSE`, `NOTICE`, `go.mod`, `version/version.go`, `ADOPTERS.md`
