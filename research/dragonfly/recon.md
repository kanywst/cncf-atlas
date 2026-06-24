# recon: Dragonfly

調査メモ。P2P ベースのファイル / イメージ配布アクセラレータ。本リポは scheduler と manager (Go) の実装。データプレーンの client (dfdaemon/dfget) は Rust で別リポ `dragonflyoss/client`。deep-dive の主対象はこの `dragonflyoss/dragonfly`。

## 基本情報

- repo: `dragonflyoss/dragonfly` (旧 `Dragonfly2`、さらに旧 `alibaba/Dragonfly`)
- pinned commit: `0041afa00d64585052476d99b4b00a62111a88ed` (2026-06-22, main)
- 近いタグ: 直近の安定版は `v2.4.3` (2026-03-11)。HEAD は `v2.4.4-rc.3` (2026-06-09) より後の main コミット。shallow clone のため `git describe` は不可。
- 言語 / ビルド: Go (go.mod `go 1.25.5`, module `d7y.io/dragonfly/v2`) / `make build` で `build-manager` と `build-scheduler` (`hack/build.sh` 経由)。コンテナは `make docker-build`。
- ライセンス: Apache-2.0 (`LICENSE` 先頭で確認、`gh` の `license.spdx_id` も `Apache-2.0`)。
- CNCF 成熟度: Graduated (2025-10-28 卒業)。`README.md` のバッジでも Graduated 表記。
- カテゴリ (tools.ts CATEGORY_ORDER から): Runtime (コンテナ / AI モデルのイメージ・成果物配布の実行基盤レイヤ)。
- エントリポイント: `cmd/scheduler/main.go:23` → `cmd.Execute()`、`cmd/manager/main.go`。バイナリは scheduler と manager の 2 つ。

## 歴史の素材

- 2015 年 Alibaba Cloud 社内で誕生。日次配布数が 2 万、アプリ規模が 1 万超になり配布失敗率が増えたのが発端。出典: [Alibaba Cloud blog: P2P-Based Intelligent Image Acceleration System of Dragonfly](https://www.alibabacloud.com/blog/p2p-based-intelligent-image-acceleration-system-of-dragonfly_599645)。
- 2017 年末 OSS 化、Kubernetes / コンテナイメージ共有に転用。Alibaba 社内では月 3.4PB を配布していた。出典: [The New Stack: Dragonfly Brings Peer-to-Peer Image Sharing to Kubernetes](https://thenewstack.io/dragonfly-brings-peer-to-peer-image-sharing-to-kubernetes/)。
- CNCF Sandbox 受理 2018-11-13。出典: [CNCF projects: Dragonfly](https://www.cncf.io/projects/dragonfly/)。
- Dragonfly 1.0.0 で Go へ全面書き換え。これを評価され 2020-04-09 に Incubating へ昇格。出典: [CNCF blog: TOC votes to move Dragonfly into CNCF incubator](https://www.cncf.io/blog/2020/04/09/toc-votes-to-move-dragonfly-into-cncf-incubator/)。
- 2.0 でアーキテクチャを Manager / Scheduler / Seed Peer / Peer の役割分割に再設計。旧 `alibaba/Dragonfly` はアーカイブされ `Dragonfly2`、現 `dragonflyoss/dragonfly` へ移行。
- 2025-10-28 Graduated。卒業時点で 130 社 271 名が 2.6 万コミット。出典: [The New Stack: CNCF Dragonfly Speeds Container, Model Sharing with P2P](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/)。
- 近年は AI/ML モデル配布へ拡張。`hf://` (Hugging Face) / `modelscope://` をネイティブ対応。Rust 実装の Vortex P2P 転送プロトコル (TLV 形式) を導入。出典: [CNCF blog: Peer-to-Peer acceleration for AI model distribution with Dragonfly](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/)。
- 第三者セキュリティ監査を Trail of Bits が 2023 年に実施 (`README.md` Security Audit 節、`docs/security/dragonfly-comprehensive-report-2023.pdf`)。

## アーキテクチャの素材

役割は 4 つ。Dragonfly 2.0 では「supernode が全 4MB チャンクを集中制御する」旧 1.x モデルではなく、scheduler がタスクごとに peer の P2P グラフ (DAG) を構築する方式である点に注意 (Web 記事の一部は 1.x の記述なので混同しないこと)。

- Manager (`manager/`): 動的設定・クラスタ管理・コンソール UI・RBAC (`manager/permission/rbac`)・OAuth (`manager/auth/oauth`)・DB (`manager/database`)。他ロールの設定配布のハブ。
- Scheduler (`scheduler/`): P2P スケジューリングの頭脳。peer の登録を受け、どの親 peer から piece を引くかを決める。
- Seed Peer / Peer: 実データ転送はクライアント (別リポ Rust `dfdaemon`)。本リポの scheduler は gRPC で指示を返すだけ。
- gRPC サービスは v1 (`service_v1.go`) と v2 (`service_v2.go`) が併存。v2 が現行。API 定義は外部 module `d7y.io/api/v2` (`go.mod` 参照)。

リクエストの流れ (peer 登録 → 親割当)、すべて scheduler 内:

1. `cmd/scheduler/main.go:23` 起動。
2. `scheduler/service/service_v2.go:121` `AnnouncePeer` が双方向ストリームを受け、`stream.Recv()` ループで request 種別を switch (`service_v2.go:144`)。
3. `RegisterPeerRequest` の場合 `service_v2.go:157` → `handleRegisterPeerRequest` (`service_v2.go:1300`)。host/task/peer リソースを解決し (`handleResource`)、登録過多時はジッタ付き指数バックオフで thundering herd を抑制 (`service_v2.go:1325`, seed peer はレイテンシ理由でスキップ `:1324`)。
4. task の `SizeScope` で分岐 (`service_v2.go:1386`)。EMPTY は即 `EmptyTaskResponse`。NORMAL/TINY/SMALL/UNKNOW は `service_v2.go:1434` で `scheduling.ScheduleCandidateParents` を呼ぶ。
5. `scheduler/scheduling/scheduling.go:113` `ScheduleCandidateParents` がリトライループ。`RetryBackToSourceLimit` / `RetryLimit` 超過時は back-to-source 指示 (`NeedBackToSourceResponse`) を返す (`scheduling.go:150`, `:175`)。
6. `scheduling.go:187` `FindCandidateParents` → 見つかれば DAG に親→子エッジ追加 (`scheduling.go:198` `AddPeerEdge`)、`NormalTaskResponse` をストリームで送信 (`scheduling.go:219`)。

設計判断 (非自明):

- スケジューラはタスク単位の DAG (`scheduler/resource/standard/task.go:157` `DAG dag.DAG[*Peer]`) で peer 間の依存を持ち、親候補追加前に `CanAddEdge` でサイクル検出する (`pkg/graph/dag/dag.go:277`, `ErrCycleBetweenVertices` `dag.go:46`)。P2P トポロジが循環してデッドロックするのを構造的に防ぐ。
- 親選定は全 peer 走査ではなく「ランダムサンプル」から filter する (`scheduling.go:497` `LoadRandomPeers(filterParentLimit)`)。巨大クラスタでも O(サンプル数) に抑える狙い。

## 内部実装の素材

中核データ構造:

- `Task` (`scheduler/resource/standard/task.go:107`): 配布対象 1 件。`URL`, `Digest`, `PieceLength`, `TotalPieceCount`, `Pieces *sync.Map`, 状態機械 `FSM *fsm.FSM` (`task.go:151`)、peer トポロジ `DAG dag.DAG[*Peer]` (`task.go:157`)、`BackToSourcePeers` 集合。`atomic.*` を多用し並行更新前提。
- `Peer` (`scheduler/resource/standard/peer.go:158`): タスク上の 1 ダウンロード主体。`FSM` (`peer.go:189`)、`NeedBackToSource`、`BlockParents`、AnnouncePeer ストリーム参照を保持。
- `Host` (`scheduler/resource/standard/host.go:140`): 物理/仮想ノード。`Type` (Normal / SuperSeed)、`Network` (IDC / Location)、`DisableShared`、`ConcurrentRegisterCount` などスケジューリングの入力。
- `dag.DAG[T]` (`pkg/graph/dag/dag.go:50`): 汎用ジェネリック有向非巡回グラフ。`AddEdge` / `CanAddEdge` / `DeleteVertexInEdges` / DFS (`dag.go:373`)。
- 評価器 `evaluatorDefault` (`scheduler/scheduling/evaluator/evaluator_default.go`): 親候補のスコアリング。

追う価値のあるパス: 親選定スコア式 (この deep-dive の representative core operation の核心)。

- `evaluator_default.go:87` `EvaluateParents` が `sort.Slice` で `evaluateParents(i) > evaluateParents(j)` 降順ソート。
- `evaluator_default.go:108` `evaluateParents` の総合スコア式 (`:107` のコメントにも明記):

```text
TotalScore = LoadQuality*0.6 + IDCAffinity*0.2 + LocationAffinity*0.1 + HostType*0.1
```

- LoadQuality 自体も合成 (`evaluator_default.go:132`): `PeakBandwidthUsage*0.5 + BandwidthDuration*0.3 + Concurrency*0.2`。重み定数は `evaluator_default.go:30-67`。
- 永続タスク / 永続キャッシュ用には別の重み (IDC 0.7 / Location 0.3) を用意 (`evaluator_default.go:55-67`)。
- filter 段 (`scheduling.go:488` `filterCandidateParents`) で blocklist、`DisableShared`、同一 host 除外 (循環 DL 防止 `:514`)、DAG 不在、normal host で in-degree 0 かつ未完了の除外 (`:528`)、`IsBadParent` (`:538`)、`CanAddEdge` (`:544`) を順に適用してから評価器へ。

task ID 生成: `pkg/idgen/task_id.go:165` `TaskIDV2ByURLBased` (URL + piece length + tag + application + filtered query params + revision の合成)。content-addressable 系は `TaskIDV2ByContent` (`:181`)。

## 採用事例の素材

`ADOPTERS.md` に多数記載 (出典: リポジトリ内ファイル)。捏造なし。

- Public cloud で click-to-deploy / 統合: Google Cloud (GKE Marketplace)、Volcano Engine (VKE / CR)、Baidu AI Cloud (CCE)、Alibaba Cloud (ACK P2P acceleration)。
- 大規模イメージ/ファイル配布として記載の組織: Alibaba Group, Ant Group, DiDi, Kuaishou, Bilibili, Lazada, JFrog, miHoYo, Xiaomi, Qunar, Yahoo, Meituan, JD, NetEase, Huawei, Shopee, China Unicom, ZTE, iQIYI など。
- Datadog は lazy loading 付きイメージ配布と記載 (`ADOPTERS.md` 末尾)。
- 規模感の対外発信: 卒業時に 130 社 271 contributors / 2.6 万コミット ([The New Stack](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/))。
- GitHub 指標 (2026-06-22, `gh api repos/dragonflyoss/dragonfly`): stars 3,212 / forks 406 / open issues 26。non-anon contributors 約 105 名 (`gh api .../contributors --paginate`)。

## 代替・エコシステム

- Uber Kraken (`uber/kraken`): BitTorrent ベース、tracker は接続グラフのみ調停しデータ転送は peer 間に委譲。大 blob でスケール、HA とクラスタ間レプリケーション。ただし開発停滞気味 (直近リリース 2020-05)。出典: [GitHub uber/kraken](https://github.com/uber/kraken)。
- Spegel (`spegel-org/spegel`): ステートレス、containerd の既存キャッシュを再利用、Kademlia DHT + libp2p。K3s / RKE2 に組み込み。containerd 限定でクラスタローカルミラー用途。出典: [spegel.dev architecture](https://spegel.dev/docs/architecture/)。
- 本質的な差: Dragonfly は任意の成果物 / AI モデル / ファイルを配布でき、scheduler による DAG ベースの中央スケジューリングで親選定を最適化する。CNCF Graduated で開発が活発。optional な content-addressable filesystem (Nydus 連携) で OCI 起動を加速する。代償は運用の複雑さ (containerd 設定の daemonset 配布、manager/scheduler/seed の構成)。
- エコシステム統合: containerd / Docker registry mirror、Harbor、Nydus (lazy loading)、Hugging Face / ModelScope、Helm chart (`dragonflyoss/helm-charts`)、console (`dragonflyoss/console`)。
- インストール / 最小構成: Kubernetes + Helm が推奨。`helm repo add dragonfly https://dragonflyoss.github.io/helm-charts/` の後 `helm install dragonfly dragonfly/dragonfly` で manager / scheduler / seed peer / dfdaemon を展開し、containerd の registry mirror を Dragonfly proxy に向ける。出典: [d7y.io Kubernetes quick start](https://d7y.io/docs/getting-started/quick-start/kubernetes/)。
