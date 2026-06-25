# recon: Container Network Interface (CNI)

調査メモ。出典は URL 付き。コードは `src/` (gitignore) を読んで `path:line` を残す。

## 基本情報

- repo: `containernetworking/cni` ([GitHub](https://github.com/containernetworking/cni))
- pinned commit: `7c270076995b6a35f4774ce94dafcf266d1c6925` (2025-12-15) / 近いタグ: `v1.3.0` (2025-04-07、HEAD はこれより後の main)
- 言語 / ビルド: Go (go.mod `go 1.21`, `src/go.mod:3`) / `go build ./...`、テストは `./test.sh` (ginkgo + `go test`)
- ライセンス: Apache-2.0 (検証済み: `src/LICENSE:1` が Apache License Version 2.0、`gh repo view` の `licenseInfo.key=apache-2.0`)
- CNCF 成熟度: Incubating (2017-05-23 受諾、CNCF プロジェクトページで確認)
- カテゴリ (tools.ts): Service Mesh & Networking
- main エントリポイント: `src/cnitool/main.go` (CLI `cnitool`、cobra)。ライブラリ本体は `src/libcni` と `src/pkg/skel`

重要: このリポジトリは「仕様 + Go ライブラリ + 参照ツール」であって、データプレーンを持つ CNI 実装ではない。実プラグイン (bridge / host-local 等) は別リポジトリ `containernetworking/plugins`、Calico/Cilium/Flannel 等はサードパーティ。`src/README.md:13` が明記。

## 歴史の素材

- 起源は CoreOS の rkt コンテナエンジンのプラグイン機構。rkt は 2014-12 に登場し、appc (App Container) 仕様を中心に設計された。CNI はその networking 部分を切り出して多組織共通仕様に発展。出典: [CNCF hosts CNI](https://www.cncf.io/blog/2017/05/23/cncf-hosts-container-networking-interface-cni/)、rkt の CNCF 受諾発表 [CNCF/rkt 2017-03-29](https://www.cncf.io/announcements/2017/03/29/cloud-native-computing-foundation-becomes-home-pod-native-container-engine-project-rkt/)。
- 設計思想: 「ネットワーク接続性とコンテナ削除時のリソース回収だけに関心を持つ」最小仕様 (`src/README.md:11-13`)。
- 競合との分岐: Docker の Container Network Model (CNM, libnetwork) に対し、CNI はランタイム非依存・軽量。Kubernetes が CNM ではなく CNI を採用したことで事実上の標準になった。出典: [Nuage: CNM v CNI](https://www.nuagenetworks.net/blog/container-networking-standards/)。
- CNCF 受諾: 2017-05-23 に TOC が 10 番目のホストプロジェクトとして Incubating で受諾。出典: [CNCF hosts CNI](https://www.cncf.io/blog/2017/05/23/cncf-hosts-container-networking-interface-cni/)、[CNCF project page](https://www.cncf.io/projects/container-network-interface-cni/)。
- リポジトリ作成日: 2015-04-05 (`gh repo view createdAt`)。
- マイルストーン (コードから確認できる仕様バージョンの足跡): spec 0.4.0 で CHECK と DEL 時の cached result を導入 (`src/libcni/api.go:549-553`, `593-601`)、1.0.0 で result 型を整理、1.1.0 で GC と STATUS コマンドを追加 (`src/libcni/api.go:818`, `857`、`src/pkg/types/100/types.go:30` の `ImplementedSpecVersion = "1.1.0"`)。

## アーキテクチャの素材

CNI は 2 つのロールに分かれ、コードでも明確に分離している。

1. ランタイム側 (consumer): `src/libcni` がランタイム (containerd / CRI-O / kubelet 経由) に組み込まれ、設定をパースしプラグインを exec する。`src/libcni/api.go:17-21` のコメントが「これは CNI 仕様の実装本体であり runtime provider にバンドルされる」と明言。
2. プラグイン側 (provider): `src/pkg/skel/skel.go` がプラグインバイナリの骨組み。環境変数で渡されたコマンドをディスパッチし、コールバック (`Add`/`Del`/`Check`/`GC`/`Status`) を呼ぶ。

プロトコルは「実行ファイル + 環境変数 + stdin JSON」。ライブラリ呼び出しではなくプロセス境界。

- 設定はディスク上の JSON (conflist)。`src/libcni/conf.go:92` `NetworkConfFromBytes` がパースし、`Plugins []*PluginConfig` のチェーンを構築。
- コマンドは環境変数 `CNI_COMMAND` / `CNI_CONTAINERID` / `CNI_NETNS` / `CNI_IFNAME` / `CNI_ARGS` / `CNI_PATH` で渡す。生成は `src/pkg/invoke/args.go:56-73` `AsEnv()`。
- ネットワーク設定本体は stdin に JSON で渡す。`src/pkg/invoke/raw_exec.go:34-41`。
- 結果はプラグインの stdout に JSON で返る。`src/pkg/invoke/exec.go:121-137` `ExecPluginWithResult`。

設計判断 (非自明): プラグインのバージョン折衝とコンバージョン。result の `cniVersion` が空だと spec 上は 0.1.0 だが、libcni は後方互換のため「config のバージョンと同じ」とみなす hack を入れている。`src/pkg/invoke/exec.go:39-78` `fixupResultVersion`、issue #895 を明記したコメント付き。さらに result 型はバージョン間コンバータを `init()` で登録する仕組み (`src/pkg/types/100/types.go:34-53`)。これで 0.1.0〜1.1.0 の result を相互変換し、チェーン内の prevResult を常に config バージョンに揃える。

## 内部実装の素材

### 代表操作: ADD を端から端まで追う (conflist のプラグインチェーン実行)

1. `src/libcni/api.go:515` `AddNetworkList`。`list.Plugins` を順に回し、各プラグインの result を次の `prevResult` として渡す。チェーン全体が成功したら `cacheAdd` で `/var/lib/cni/results/<net>-<container>-<if>` に結果をキャッシュ (`api.go:519-527`、キャッシュパスは `api.go:252-257`)。
2. `src/libcni/api.go:490` `addNetwork`。まず `c.exec.FindInPath(net.Network.Type, c.Path)` でプラグインバイナリを解決 (`api.go:492`)。次に `ValidateContainerID` / `ValidateNetworkName` / `ValidateInterfaceName` で入力検証 (`api.go:496-504`)。
3. `src/libcni/api.go:155` `buildOneConfig` → `InjectConf`。config JSON に `name` / `cniVersion` / `prevResult` を注入し、さらに `injectRuntimeConfig` (`api.go:191`) で runtime の capability 引数 (portMappings 等) のうちプラグインが宣言した capability にマッチするものだけを `runtimeConfig` dict に入れる。
4. `src/libcni/api.go:511` `invoke.ExecPluginWithResult(ctx, pluginPath, newConf.Bytes, c.args("ADD", rt), c.exec)`。`c.args` は `src/libcni/api.go:891` で `invoke.Args{Command:"ADD", ...}` を作る。
5. `src/pkg/invoke/exec.go:126` `exec.ExecPlugin(...)` → `src/pkg/invoke/raw_exec.go:34` `RawExec.ExecPlugin`。`exec.CommandContext` でバイナリを起動、stdin に config、env に CNI_* を渡す。"text file busy" 時は最大 5 回リトライ (`raw_exec.go:44-57`、プラグイン書き込み直後の競合対策)。
6. プラグイン側は `src/pkg/skel/skel.go:232` `pluginMain` で受ける。`getCmdArgsFromEnv` (`skel.go:59`) が env を検証、`CNI_COMMAND=ADD` を switch (`skel.go:245`) して `funcs.Add` を呼ぶ。ADD 後は `CNI_NETNS` がプラグイン自身の netns と同一でないかを `ns.CheckNetNS` で確認 (`skel.go:250-256`)。
7. 戻りの stdout JSON を `src/pkg/invoke/exec.go:131` `fixupResultVersion` でバージョン補正し、`create.Create(resultVersion, fixedBytes)` で `types.Result` 具象型 (例 `types/100.Result`) を生成 (`exec.go:136`)。
8. エラー時はプラグインが stdout に `types.Error` JSON を出して非ゼロ終了する規約。`src/pkg/invoke/raw_exec.go:72-84` `pluginErr` がそれをパースして Go の error に戻す。

DEL は逆順 (`src/libcni/api.go:603` `for i := len-1; i>=0; i--`)。GC/STATUS は spec 1.1.0 以上でのみ発火 (`api.go:818`, `857`)。

### 中核データ構造 (3-5 個)

- `PluginConf` (= `NetConf` alias): プラグイン 1 個分の設定。`cniVersion` / `name` / `type` / `capabilities` / `ipam` / `dns` / `prevResult` を持つ。`src/pkg/types/types.go:64-78`。
- `NetworkConfigList`: conflist 全体。`Plugins []*PluginConfig` のチェーン + `DisableCheck` / `DisableGC`。`src/libcni/api.go:79-87`。
- `RuntimeConf`: 1 回の呼び出しに渡すランタイム側の引数。`ContainerID` / `NetNS` / `IfName` / `Args` / `CapabilityArgs`。`src/libcni/api.go:54-68`。
- `Result` (interface) と現行実装 `types/100.Result`: `Interfaces []*Interface` / `IPs []*IPConfig` / `Routes []*types.Route` / `DNS`。interface 定義は `src/pkg/types/types.go:128-142`、現行 struct は `src/pkg/types/100/types.go:90-96`。`Interface` (`100/types.go:270`) は `Name`/`Mac`/`Mtu`/`Sandbox`/`SocketPath`/`PciID`、`IPConfig` (`100/types.go:298`) は `Interface *int`/`Address`/`Gateway`。
- `types.Error`: `Code uint` / `Msg` / `Details`。well-known コードは `src/pkg/types/types.go:233-247` (例 `ErrIncompatibleCNIVersion=1`, `ErrTryAgainLater=11`, `ErrInternal=999`)。

### 非自明な設計判断 (もう一つ)

result のキャッシュ。CHECK / DEL / GC は「過去に ADD で返した result」を必要とする。libcni は spec 0.4.0 以上でディスク (`/var/lib/cni/results/`) に `cachedInfo` (`src/libcni/api.go:225-236`) として保存し、`getCachedResult` (`api.go:366`) が古い形式 (`getLegacyCachedResult`) へのフォールバックも持つ。さらに GC は「キャッシュにあるが valid-attachments に無い attachment」を自前で DEL してから、spec 1.1.0 以上ならプラグインに GC コマンドを送る二段構え (`api.go:770-842`)。`#1101` で spec の変数名ミスに対応するため `cni.dev/valid-attachments` と `cni.dev/attachments` の両方を注入するワークアラウンドが残っている (`api.go:824-826`)。

## 採用事例の素材

named adopter は「CNI を消費する側」として実在・引用可能なもののみ。

- Kubernetes: kubelet が pod 作成時に CNI プラグインを呼ぶ。出典: [Kubernetes Network Plugins docs](https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/)。
- containerd / CRI-O: `src/libcni/api.go:19-20` のコメントが「containerd や cri-o が runc/hcsshim を呼ぶ前にこれを使う」と名指し。
- CNI を実装するデータプレーン (= ecosystem 側、後述): Cilium / Calico / Flannel / Multus / AWS VPC CNI。これらは「CNI 仕様の実装」であり CNI リポジトリのユーザー。
- GKE Dataplane V2 と Azure CNI Powered by Cilium がマネージドで Cilium を採用。出典: [CNI comparison 2026](https://oneuptime.com/blog/post/2026-02-20-kubernetes-cni-comparison/view)。

捏造しない: CNI コアリポには ADOPTERS.md は無い。上記は仕様の消費者であって「CNI ライブラリの直接利用組織リスト」ではない点を write 段で誤魔化さないこと。

## 代替・エコシステム

- 直接の代替仕様: Docker の Container Network Model (CNM / libnetwork)。Kubernetes は CNI を採用し CNM は事実上敗退。差: CNI はランタイム非依存・最小、CNM は Docker 結合度が高い。出典: [Nuage blog](https://www.nuagenetworks.net/blog/container-networking-standards/)。
- CNI 仕様を実装するデータプレーン (補完であって CNI コアの代替ではない):
  - Flannel: 最小構成のオーバーレイ。NetworkPolicy 非対応。
  - Calico: BGP ルーティング + 強力な NetworkPolicy、eBPF データプレーンも。
  - Cilium: eBPF ネイティブ、L7 ポリシー、observability、サービスメッシュ機能。
  - Multus: 複数 CNI を多重化し pod に複数 NIC を付与するメタプラグイン。
  - AWS VPC CNI 等クラウド固有プラグイン (CNI chaining で Cilium と併用可)。

  出典: [Kubernetes CNI comparison 2026](https://oneuptime.com/blog/post/2026-02-20-kubernetes-cni-comparison/view)、[Civo: Calico vs Flannel vs Cilium](https://www.civo.com/blog/calico-vs-flannel-vs-cilium)。
- 公式参照プラグイン集: [containernetworking/plugins](https://github.com/containernetworking/plugins) (bridge, host-local, macvlan, ipvlan, portmap, bandwidth など)。

## 採用シグナル (数値 + 日付)

- GitHub stars: 6,054 / forks: 1,149 (`gh repo view containernetworking/cni`、2026-06-24)。
- contributors: 約 148 (GitHub API contributors のページネーション last page、per_page=1、2026-06-24)。
- 最新タグ付きリリース: `v1.3.0` (2025-04-07、`gh release view`)。pinned HEAD はこれより後の main (2025-12-15)。

## install / 最小動作セット

CNI 仕様自体はバイナリ配布ではない。最小で動かすには (a) ランタイム or `cnitool`、(b) 実プラグインバイナリ、(c) conflist JSON が要る。

- `cnitool` 入手: `go install github.com/containernetworking/cni/cnitool@latest` (`src/cnitool/main.go`、サブコマンド `add`/`check`/`del`/`gc`/`status` は `src/cnitool/cmd/*.go`)。
- 実プラグイン: `containernetworking/plugins` を `./build_linux.sh` でビルドし `CNI_PATH` のディレクトリに置く。
- conflist 例 (`name` 必須、`src/pkg/skel/skel.go:216-229` の `validateConfig` が空 name を弾く): `bridge` + `host-local` IPAM のチェーンを `/etc/cni/net.d/10-mynet.conflist` に置く。
- 実行: `CNI_PATH=./bin cnitool add mynet /var/run/netns/testing`。手順出典: [Documentation/cnitool.md](https://github.com/containernetworking/cni/blob/main/Documentation/cnitool.md)、[SPEC.md](https://github.com/containernetworking/cni/blob/main/SPEC.md)。

## タグライン案

- EN: A minimal, runtime-agnostic spec plus Go libraries that let any container runtime hand pod networking to pluggable executables.
- JA: コンテナランタイムが Pod のネットワーク設定を差し替え可能な実行ファイルに委譲するための、最小でランタイム非依存な仕様と Go ライブラリ。
