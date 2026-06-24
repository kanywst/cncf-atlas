# recon: cilium

調査メモ。`cilium/cilium` がメインの実装リポ (agent + eBPF datapath + operator + Hubble の中核)。Hubble UI / cilium-cli / Tetragon は別リポだが、deep-dive の主対象はこのモノレポ。出典は URL を添える。`file:line` は pinned commit のもの。

## 基本情報

- repo: cilium/cilium
- pinned commit: `fe36ad62130243ba43159521bd384ef56d0918f0` (2026-06-22, `main` ブランチ先端)。`VERSION` は `1.20.0-dev`。HEAD は未リリースの開発版。直近の安定リリースタグは `v1.19.5` (shallow clone のため HEAD からの `git describe` は不可、`git ls-remote --tags` で確認)。
- 言語 / ビルド: Go (`go.mod` は `go 1.26.0`) + C (eBPF datapath, `bpf/` 配下を clang/LLVM で BPF バイトコードにコンパイル)。ビルドは Makefile (`make build` が各サブディレクトリの make を再帰実行、`Makefile:66`)。agent バイナリは `cilium-agent`。
- ライセンス: Apache-2.0。`LICENSE` は Apache License 2.0 全文、ソース冒頭は `// SPDX-License-Identifier: Apache-2.0`。GitHub API も `spdx_id: Apache-2.0` を返す。eBPF の C コードは別途 GPL-2.0 (カーネル要件) のものが混在するが、リポ全体のライセンスは Apache-2.0。
- CNCF 成熟度: Graduated (2023-10-11)。
- カテゴリ (tools.ts の CATEGORY_ORDER から): Service Mesh & Networking
- エントリポイント: agent は `daemon/main.go:8`。`hive.New(cmd.Agent)` で Hive (DI フレームワーク) を組み、`cmd.Execute(cmd.NewAgentCmd(...))` で起動 (`daemon/main.go:11-14`)。cobra コマンド名は `cilium-agent` (`daemon/cmd/root.go:25`)。CNI プラグインバイナリは別 main (`plugins/cilium-cni/main.go:16`, `cmd.PluginMain()`)。

## 歴史の素材

- 2015 年末、Thomas Graf・Daniel Borkmann・André Martins・Madhu Challa らが開始。Linux カーネルネットワーキング (Open vSwitch / iptables) 出身者が、コンテナの動的・短命な性質に従来のネットワークが追いつかないと判断し、eBPF で「intent と identity ベースの高性能コンテナネットワーク」を作るという発想。当初は IPv6 only だった (時代に早すぎた)。出典: [Cloud Native Now: The Cilium Story So Far](https://cloudnativenow.com/features/the-cilium-story-so-far/), [Heavybit Kubelist Podcast Ep.30](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-30-cilium-and-ebpf-with-thomas-graf-of-isovalent)。
- プロジェクト開始の翌年に Thomas Graf と Dan Wendlandt が Isovalent (当初 Covalent) を共同創業。両者は Nicira / Open vSwitch 時代からの繋がり。出典: [Cloud Native Now](https://cloudnativenow.com/features/the-cilium-story-so-far/)。
- CNCF の歩み: Incubating 受理 2021-10-13 → Graduated 2023-10-11。CNI として初の Graduated プロジェクト。Kubernetes に次ぐ commit 数の多さ (graduation 時点)。graduation 申請は 2022-10-27、約 1 年後に graduate。出典: [CNCF announcement 2023-10-11](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/), [CNCF project page](https://www.cncf.io/projects/cilium/)。
- 2023-12-21、Cisco が Isovalent 買収を発表 (Cilium 最初のコードから 7 年後)。Cisco は以前から Isovalent の Series A 投資家。Thomas Graf は Cisco Security の CTO 兼 VP Engineering に。Cilium / Tetragon は引き続きオープンソースとして CNCF 下で運営。出典: [The Register 2023-12-22](https://www.theregister.com/2023/12/22/cisco_acquires_isovalent), [The New Stack: Cisco Gets Cilium](https://thenewstack.io/cisco-gets-cilium-what-it-means-for-developers/)。

## アーキテクチャの素材

中核は 2 層。ユーザ空間の Go エージェント (各ノードに DaemonSet で 1 つ) と、カーネル内の eBPF datapath (`bpf/` の C を clang でコンパイルし tc/XDP フックにアタッチ)。エージェントは設定を計算して eBPF プログラムと map に反映し、実トラフィック処理はカーネルで完結する。

トップレベル構成:

- `daemon/`: cilium-agent 本体。`daemon/cmd/` に cobra root と Hive cell 群 (`daemon/cmd/cells.go`)。エージェントは Hive という Cilium 自製の DI / ライフサイクルフレームワーク (`pkg/hive`) でモジュール (cell) を組み立てる。`daemon/main.go:9-13`。
- `plugins/cilium-cni/`: Kubelet が pod ごとに呼ぶ CNI プラグイン。`cmd/cmd.go` が `Add` / `Del` を実装。エージェントとは Unix ソケット経由の REST API で会話する。
- `pkg/endpoint/`: Endpoint (= ネットワーク的に隔離されたワークロード、典型的には pod) の状態機械と再生成ロジック。Cilium のオーケストレーションの心臓部。
- `pkg/identity/`, `pkg/labels/`: ラベル集合を security identity (数値 ID) にマッピング。ポリシーは IP ではなく identity で書かれる。
- `pkg/policy/`: ネットワークポリシーを解決して per-endpoint の `MapState` (eBPF policy map の中身) に落とす。
- `pkg/ipcache/`: IP から identity への対応をクラスタ全体で管理し eBPF map に同期。
- `pkg/datapath/`: datapath 抽象。`pkg/datapath/loader/` が eBPF object のコンパイル・テンプレート化・ロードを担う。
- `pkg/maps/`: 各種 eBPF map (lxcmap, policymap, ctmap = conntrack, など) の Go 側ラッパ。
- `operator/`: クラスタスコープの処理 (IPAM の CIDR 割当、identity GC、CRD 管理) を担う単一 Deployment。
- `hubble/`, `hubble-relay/`: eBPF 由来のフローイベントを使った可観測性レイヤ。

### 中核オペレーションを端から端まで: pod 起動時の Endpoint 作成と datapath 反映

新しい pod がスケジュールされてから、その pod 用の eBPF プログラムがカーネルにロードされるまでを追う。

1. CNI ADD。Kubelet が `cilium-cni` を呼ぶ。`Cmd.Add` (`plugins/cilium-cni/cmd/cmd.go:523`) が IPAM でアドレス確保、コンテナ netns 内に veth/インターフェース設定 (`configureIface`, cmd.go:814)。同期ビルドを要求するため `ep.SyncBuildEndpoint = true` をセット (cmd.go:838、コメントに `GH-4409` 参照)、エージェントの REST API に `c.EndpointCreate(ep)` を投げる (`plugins/cilium-cni/cmd/cmd.go:842`)。
2. API ハンドラ。エージェント側は `PUT /endpoint/{id}` から `EndpointPutEndpointIDHandler.Handle` (`pkg/endpoint/api/endpoint_api_handler.go:195`)、そして `endpointAPIManager.CreateEndpoint` (`pkg/endpoint/api/endpoint_api_manager.go:88`)。
3. Endpoint 構築と manager 登録。`createEndpoint` (`pkg/endpoint/endpoint.go:597`) で Endpoint 構造体を生成し、`endpointManager.AddEndpoint(ep)` でノードスコープの一意 ID を割当 (`endpoint_api_manager.go:293`)。ラベルが無ければ `reserved:init` identity を暫定付与 (`endpoint_api_manager.go:284-290`、コメントが init identity のライフサイクル doc を参照)。
4. identity 解決から再生成トリガ。K8s pod なら `ep.RunMetadataResolver` が pod ラベルを再取得して identity を確定し再生成を起動 (`endpoint_api_manager.go:303`)。まだ起動していなければ明示的に `RegenerateWithDatapath` レベルで `ep.Regenerate(regenMetadata)` (`endpoint_api_manager.go:324-331`)。
5. 再生成パイプライン。`Endpoint.Regenerate` (`pkg/endpoint/policy.go:867`) がビルドキューに積み、`regenerate` (`pkg/endpoint/policy.go:458`)、`regeneratePolicy` (`pkg/endpoint/policy.go:172`) でポリシーを `MapState` に解決し、`regenerateBPF` (`pkg/endpoint/bpf.go:360`) へ。`regenerateBPF` はまず `<-e.orchestrator.DatapathInitialized()` を待ち `compilationLock.RLock()` を取る (bpf.go:368-377、ベースプログラムのコンパイルと競合させないための明示ロック)。
6. ヘッダ生成からコンパイル/ロード。`writeHeaderfile` が endpoint 固有の定数を `lxc_config.h` に書き出し (`pkg/endpoint/bpf.go:139`, 呼び出し `bpf.go:428`)、`realizeBPFState` (`pkg/endpoint/bpf.go:568`)、`orchestrator.ReloadDatapath` (`pkg/endpoint/bpf.go:587`) が eBPF object をロードし tc/XDP にアタッチ。`ReloadDatapath` は内部で後述の ELF テンプレートキャッシュ (`pkg/datapath/loader/cache.go`) を使う。
7. 同期完了待ち。CNI が `SyncBuildEndpoint` を立てているので、エージェントは `ep.WaitForFirstRegeneration(ctx)` で最初の datapath ビルド完了まで待ってから REST 応答を返す (`endpoint_api_manager.go:337-340`)。これで CNI ADD が返った時点で pod の eBPF datapath が稼働済みになる。

## 内部実装の素材

中核データ構造:

1. Endpoint (`pkg/endpoint/endpoint.go:126`)。pod 1 個 = Endpoint 1 個。`ID uint16` (ノード内一意)、`loader` / `orchestrator` / `compilationLock` (datapath ビルド用)、`policyRepo` (`policy.PolicyRepository`)、`lxcMap` (lxcmap への参照)、`mutex lock.RWMutex` を持つ。状態機械 (waiting-for-identity から regenerating, ready) を内包し、再生成は直列化される。
2. Identity (`pkg/identity/identity.go:27`)。`ID NumericIdentity` と `Labels labels.Labels`、高速検索用 `LabelArray`、`ReferenceCount` を持つ。ラベル集合に対し数値 identity を 1 個割り当てるのが Cilium のポリシーモデルの根幹。`IdentityMap = map[NumericIdentity]labels.LabelArray` (identity.go:62)。
3. IPCache (`pkg/ipcache/ipcache.go:117`)。IP/CIDR と security identity の双方向対応をクラスタ全体で保持し、eBPF の ipcache map に同期。パケット処理時にカーネルが送信元/宛先 IP を identity に解決するための土台。`IPIdentityPair` (`pkg/identity/identity.go` 付近) は kvstore に JSON 書き込みされる STABLE API。
4. MapState / mapStateEntry (`pkg/policy/mapstate.go:98`, `:616`)。解決済みポリシーを `Key` (identity + port + protocol + traffic direction) から entry の形で保持。これがそのまま eBPF policy map の内容になる。`MapState = mapState` (`pkg/policy/resolve.go:456`)、外部公開 entry は `types.MapStateEntry` (mapstate.go:32)。
5. templateCfg (`pkg/datapath/loader/template.go:44`)。後述の ELF テンプレート用に、実 endpoint 設定の条件分岐部分だけを通し、静的データはダミー値に差し替えるラッパ。

非自明な設計判断:

- eBPF datapath は per-endpoint に再コンパイルせず、テンプレート ELF をクローンして定数だけ差し替える。`pkg/datapath/loader/cache.go` の `objectCache.fetchOrCompile` (`cache.go:175`) が設定のハッシュ (`baseHash.hashTemplate`, cache.go:179) ごとに 1 度だけ clang コンパイルし (cache.go:163 `compileDatapath`、ログ `"Compiled new BPF template"` cache.go:170)、同一ハッシュは ELF のコピーを返す。endpoint 固有値 (ID, MAC, IP, identity) はロード直前に ELF へ差し替える。`templateCfg` のダミー値は 32bit ごとに非ゼロにしてあり (`template.go:34-38` のコメント)、これはコンパイラが `.data` セクションに領域を確保する (ゼロ初期化だと `.bss` 参照になり差し替え不能になる) ことを保証するため。pod 1 個ごとに数百 ms の clang 起動を避けるための核心的最適化。
- テンプレートは万一そのままデバイスに attach されても無害になるよう設計。テンプレートの identity は `world` (最小権限) を返し (`template.go:71-75`)、IPv4 は RFC5737 のドキュメント用プレフィックス (非ルータブルアドレス) を返す (`template.go:90-93`)。
- ポリシーは IP ではなく identity ベース。pod がスケールしても IP の増減ではなく identity (= ラベル集合) でポリシーが書けるため、ルール数が pod 数に比例しない。`Identity` と `IPCache`、`MapState` の 3 つでこのモデルが成立する。
- エージェントは Hive (自製 DI) でモジュール化。`hive.New(cmd.Agent)` (`daemon/main.go:11`) で cell 群を依存解決・ライフサイクル管理。起動順序とシャットダウンが宣言的に書ける。

## 採用事例の素材

リポ内 `USERS.md` に 174 件のユーザエントリ (自己申告、production 限定がルール)。出典付きの著名どころのみ:

- Google (GKE Dataplane V2 は Cilium ベース), Amazon Web Services (AWS), Alibaba Cloud, DigitalOcean, Equinix, Exoscale, Gcore, Civo, CoreWeave などクラウド/インフラ事業者。出典: [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md)。
- Datadog, Adobe, Capital One, GitLab, ByteDance, Kakao, IKEA IT AB, Confluent, Elastic Path, Guidewire, Daimler Truck AG, Canonical, F5, Cybozu, Bitnami などのエンドユーザ/ベンダ。出典: [USERS.md](https://github.com/cilium/cilium/blob/main/USERS.md)。
- CNCF の Project Journey Report が採用規模を別途追跡。出典: [CNCF Cilium Project Journey Report](https://www.cncf.io/reports/cilium-project-journey-report/)。

採用シグナル (GitHub `cilium/cilium`, gh API 取得 2026-06-22): stars 24,565 / forks 3,842 / watchers 307、created 2015-12-16、open issues 1,004。コントリビュータは GitHub contributors API のページネーション末尾でおよそ 1,300+ (anon 含む)。CNCF graduation 時点で「7 社のメンテナ + 800 人超の個人コントリビュータ」と公表。出典: [GitHub API repos/cilium/cilium](https://api.github.com/repos/cilium/cilium), [CNCF announcement 2023-10-11](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/)。

ガバナンス: メンテナ/コミッタは `MAINTAINERS.md` に列挙 (Isovalent/Cisco 所属が多数だが Ledger 等の社外コミッタも在籍)。ガバナンス文書とコントリビュータラダーは別リポ `cilium/community` の `GOVERNANCE.md` / `CONTRIBUTOR-LADDER.md`。出典: [MAINTAINERS.md](https://github.com/cilium/cilium/blob/main/MAINTAINERS.md), [cilium/community GOVERNANCE.md](https://github.com/cilium/community/blob/main/GOVERNANCE.md)。

## 代替・エコシステム

層が複数にまたがるので競合も層ごとに違う。

- CNI / ネットワーク層の代替: Calico, Flannel, Weave Net, Antrea, AWS VPC CNI。Cilium の差別化は eBPF datapath による identity ベースポリシーと kube-proxy 置換 (iptables を使わない L4 ロードバランシング)、L7 awareness。Calico も eBPF データプレーンを持つが、Cilium は eBPF が第一級。出典: [CNCF announcement](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/)。
- サービスメッシュ層: Istio / Linkerd と一部競合。Cilium Service Mesh はサイドカーレス (eBPF + per-node Envoy) を売りにする。出典: [The New Stack: Cilium CNCF Graduation](https://thenewstack.io/cilium-cncf-graduation-could-mean-better-observability-security-with-ebpf/)。
- 可観測性: Hubble (同プロジェクト) がフロー可視化。Tetragon (姉妹プロジェクト、eBPF ランタイムセキュリティ) と組む。
- 統合先: GKE Dataplane V2, EKS, AKS で採用/選択可能。kube-proxy 置換、BGP, WireGuard/IPsec 暗号化, ClusterMesh (マルチクラスタ), Gateway API/Ingress, Egress Gateway。

最小セットアップ: kind か任意の K8s クラスタを用意し、cilium-cli で `cilium install`、`cilium status` で確認、`cilium connectivity test` で疎通検証。Helm chart でも導入可。詳細手順とバージョン整合は [Cilium 公式 Getting Started](https://docs.cilium.io/en/stable/gettingstarted/) を参照 (write 段でバージョン確認のうえ反映)。
