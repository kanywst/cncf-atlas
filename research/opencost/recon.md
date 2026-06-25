# recon: OpenCost

調査メモ。自分用の密度。出典は `sources.md` の番号と対応。コードは pin した commit で検証。

## 基本情報

- repo: `opencost/opencost` (canonical: cost allocation engine 本体)。UI は `opencost/opencost-ui`、Helm は `opencost/opencost-helm-chart` で別repo
- pinned commit: `4d117aabe116695ddd11100497827983b1892959` (branch `develop`, 2026-06-19 commit `fix: guard cloudcost Status coverage read and stop ClusterMap ticker (#3865)`)
- 近いタグ: 最新安定リリースは `v2.5.3`。HEAD は `v2.6.0-rc.0` より後の develop 先端 (HEAD を直接指すタグなし)
- 言語: Go `1.26.0` (`go.mod` の `go` 行)。Go workspace で複数モジュール (`github.com/opencost/opencost`, `/core`, `/modules/prometheus-source`, `/modules/collector-source`)
- ビルド: `just build-local` / `Makefile` / `go run ./cmd/costmodel/main.go`。Docker は `Dockerfile.cross`、ローカル開発は `Tiltfile`
- メインエントリ: `cmd/costmodel/main.go:11` (`cmd.Execute(nil)`)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭 / GitHub API `license.spdx_id=Apache-2.0` で確認 (出典7))。`NOTICE`, `THIRD_PARTY_LICENSES.txt` あり
- CNCF 成熟度: Incubating (2024-10-25 昇格 (出典4)(出典5))
- カテゴリ (tools.ts CATEGORY_ORDER より): Observability

## 歴史の素材

- 起源: Kubecost が作った cost allocation engine を土台に、ベンダー中立な「OpenCost Specification」+ 実装として切り出した。仕様策定には Adobe, AWS, Google, Microsoft, New Relic, SUSE, Mindcurv, D2iQ, Armory らが参加 (出典1)(出典6)
- repo 作成日は 2019-03-27 (元は Kubecost の cost-model repo、GitHub API `created_at` (出典7))。OSS 化アナウンスは 2022 (出典6)
- CNCF Sandbox 受理: 2022-06-17 (出典3)(出典5)
- Incubating 昇格: 2024-10-25 (公式 blog は 2024-10-31、KubeCon NA で発表) (出典2)(出典4)(出典5)
- Sandbox 期間中に追加: Plugins (Datadog/OpenAI/MongoDB Atlas 等の外部コストを取り込む)、Carbon Cost Monitoring、OCI サポート (出典2)
- 2024-09 に Kubecost が IBM に買収され IBM FinOps Suite (Cloudability / Turbonomic) に合流。OpenCost は IBM Kubecost + Randoli + クラウド各社のコミュニティで維持 (出典1)
- 関係性: Kubecost 商用版の allocation model は今も OpenCost エンジンが土台。OpenCost のみ CNCF incubating。Kubecost は商用の上位互換 (出典1)

## アーキテクチャの素材

トップレベル構成 (`cmd`, `core`, `modules`, `pkg`):

- `cmd/costmodel/` 単一バイナリのエントリ。`pkg/cmd` の cobra コマンドを呼ぶだけ
- `core/` 共有ライブラリモジュール。ドメイン型 (`core/pkg/opencost`: Allocation/Asset/CloudCost/Window)、データソース抽象 (`core/pkg/source`)、storage/log/filter/clusters
- `pkg/` 本体ロジック。`pkg/costmodel` (cost model + API handler)、`pkg/cloud/<provider>` (AWS/Azure/GCP/Alibaba/Oracle/DigitalOcean/Scaleway/OTC のプライシング)、`pkg/cloudcost` (請求 API パイプライン)、`pkg/clustercache` (k8s オブジェクトキャッシュ)、`pkg/mcp` (AI agent 向け MCP サーバ)、`pkg/metrics` (Prometheus exporter)
- `modules/prometheus-source` と `modules/collector-source` はメトリクス取得の2実装。`OpenCostDataSource` インターフェース経由で差し替え可能

### 代表オペレーションの end-to-end: `GET /allocation`

namespace/pod/controller 別のコスト按分を返す中核 API。流れ:

1. `cmd/costmodel/main.go:11` -> `pkg/cmd/commands.go:35` `Execute` (cobra) -> `pkg/cmd/costmodel/costmodel.go:33` `Execute`
2. ルート登録: `pkg/cmd/costmodel/costmodel.go:55` `router.GET("/allocation", a.ComputeAllocationHandler)` (httprouter)。HTTP server は同ファイル下方で `rootMux` に wire
3. `pkg/costmodel/aggregation.go:330` `ComputeAllocationHandler`。クエリパラメータを解釈: `window` (必須, `:337` `ParseWindowWithOffset`)、`aggregate` (`:350`)、`includeIdle`/`idleByNode`/`shareIdle`/`filter` など。`:395` `a.Model.QueryAllocation(...)` を呼ぶ。フィルタは aggregation の前に適用 (cluster/node 等の属性が消える前に絞る、`:391-394` コメント)
4. `pkg/costmodel/allocation.go:32` `CostModel.ComputeAllocation`。`BatchDuration` を超える window は分割 (`:51` ループ) して個別計算し `AllocationSetRange.Accumulate` (`:125`) で畳み込む。labels/annotations/services は性能のため Properties.Intersection で伝播しないので、ここで明示的に再付与 (`:80-120`)
5. `pkg/costmodel/allocation.go:219` `computeAllocation` (小文字, 1 window 分の実体)。手順は (1) pod map 構築 `buildPodMap` (`:260`)、(2) 残りメトリクスを並列 fan-out、(3) pod map から AllocationSet を組み立て
6. fan-out: `:272` `source.NewQueryGroup()`、`:273` `ds := cm.DataSource.Metrics()`。`:275` 以降で RAM/CPU/GPU/PV/Network/NAT Gateway のクエリを `source.WithGroup(grp, ds.Query...())` で発行。Future ベースで並行実行し後で `Await`
7. `core/pkg/source/datasource.go:11` `MetricsQuerier` インターフェース (`:49` `QueryRAMBytesAllocated` 等)。これがデータソース抽象の境界
8. Prometheus 実装: `modules/prometheus-source/pkg/prom/metricsquerier.go:525` `PrometheusMetricsQuerier.QueryRAMBytesAllocated`。実 PromQL は `avg(avg_over_time(container_memory_allocation_bytes{...}[dur])) by (container, pod, namespace, node, uid, ...)` (`:527`)。`ctx.QueryAtTime` で投げ `source.NewFuture(DecodeRAMBytesAllocatedResult, ...)` を返す

要するに「使用量メトリクス (Prometheus) × プライシング (cloud provider API or CSV)」を pod 単位で掛け合わせ、idle/shared を配分して Allocation に落とす。

### 設計判断

- pull 型。OpenCost 自身は in-cluster で動き、Prometheus に貯まった k8s メトリクスを定期クエリする。請求データ (CloudCost) は cloud provider の billing API を別パイプラインで取り込む
- データソースが抽象化されている (`OpenCostDataSource`)。Prometheus 必須ではなく `collector-source` モジュールで代替可能 (`COLLECTOR_DATA_SOURCE_ENABLED`)
- workload コストは `max(request, usage)` (CLAUDE.md / spec の定義)。idle は workload に帰属しない allocation コスト

## 内部実装の素材

### 中核データ構造

- `Allocation` (`core/pkg/opencost/allocation.go:55`): あるワークロードの 1 window 分のコスト。CPU/GPU/RAM の CoreHours/Cost/Adjustment、Network (cross-zone/region/internet/NAT)、LoadBalancer、PV、Shared/External コストを全部フラットに float64 で持つ巨大 struct。`Properties *AllocationProperties` に cluster/node/namespace/pod/label 等のキー
- `AllocationSet` (`core/pkg/opencost/allocation.go:1496`) / `AllocationSetRange` (`:3225`): window 内の Allocation 集合と、その時系列レンジ。`Accumulate` で複数 window を畳む
- `Asset` interface (`core/pkg/opencost/asset.go:31`) と実体 `Node` (`:1739`), `Disk` (`:963`) など: インフラ資産 (node/disk/LB/cluster management) のコスト。idle 計算の分母になる
- `CloudCost` (`core/pkg/opencost/cloudcost.go:14`) / `CloudCostSet` (`:170`): cloud billing API 由来のサービス別コスト。allocation とは別パイプライン
- `Window` (`core/pkg/opencost/window.go:75`): `start, end *time.Time` の2ポインタ。nil で open-ended を表現。全クエリの時間軸

### 追う価値のあるパス / 非自明な選択

- bingen カスタムバイナリコーデック (`core/pkg/opencost/bingen.go`): Allocation/Asset/CloudCost を JSON でも protobuf でもなく、自前の binary codec で直列化する。`@bingen:set[name=Allocation,version=25]` のように型セットごとにバージョンを振り、新フィールドは必ず struct の末尾に append (`bingen.go:4-21` の警告)。各フィールドに `//@bingen:field[version=16]` 等の注釈 (`allocation.go:74-111`)。生成は `//go:generate bingen ...` (`bingen.go:82`)。ETL / storage で大量の cost 時系列を扱うため、後方互換を保ちつつ高速・コンパクトに保存する選択。生成コードは `opencost_codecs.go`
- pod UID ingest の many-to-one 対策 (`allocation.go:241-258`): UID を取り込むと pod 名が `<name> <uid>` に書き換わるが、UID を持たない他メトリクスとキーが合わなくなる。`podUIDKeyMap` で `default podKey -> []edited podKey` を保持してマッチさせる。同名の uncontrolled pod を取りこぼさないための工夫
- GPUAllocation のポインタ比較バグ修正 (`allocation.go:151-162` `ptrValueEqual`): バイナリ往復で等値の GPUAllocation がアドレス比較で不一致になった #3846 の対処。NaN 正規化込み

## 採用事例の素材

`ADOPTERS.MD` (pin commit) に出典付きで列挙されている組織のみ:

- Kubecost (Service Provider, Kubecost Free/Business/Enterprise の土台) (出典8)
- Grafana Labs (end user, エンジニアリング blog あり) (出典8)(出典9)
- Microsoft (Service Provider, AKS 上で OpenCost を提供) (出典8)
- Zendesk (end user) (出典8)
- National Information Solutions Cooperative (end user) (出典8)
- CloudAdmin (Service Provider) (出典8)
- mindcurv group (Consultancy) (出典8)

採用シグナル (GitHub API, 2026-06-24 参照 (出典7)): star 6,603、fork 829、open issues 239。contributor は約 169 (anon 込みで約 197)。

## 代替・エコシステム

- エコシステム: `opencost/opencost-helm-chart` (公式インストール手段)、`opencost/opencost-ui` (UI)、`opencost/opencost-plugins` (Datadog/OpenAI/MongoDB Atlas 等の外部コストプラグイン)、`opencost/opencost-integration-tests`。Prometheus に依存し `/metrics` で逆に export も可能。MCP サーバ (`pkg/mcp`) で AI agent から query
- 代替と差:
  - Kubecost (IBM): OpenCost エンジンの商用上位互換。マルチクラスタ、長期保持、SSO、アラート等を足す。OpenCost は spec + コアエンジンのみ (出典1)
  - クラウドネイティブ請求ツール (AWS Cost Explorer, GCP Billing 等): クラウド請求の粒度で k8s 内 namespace/pod 按分はしない。OpenCost は in-cluster でリアルタイムに按分
  - CAST AI / Vantage / Finout など FinOps SaaS: SaaS でベンダー固有。OpenCost は CNCF のベンダー中立仕様 + self-hosted OSS
  - kube-resource-report 等: 単純な集計でプライシング統合や idle/shared 配分はない
- 本質的な差別化: 「Kubernetes コスト監視のベンダー中立な CNCF 仕様」を持ち、実装がその spec に準拠する点。クラウド請求 API と Prometheus 使用量を pod 単位で結合し、idle/shared まで配分する

## インストール / 最小構成

前提: Kubernetes 1.20+ と Prometheus (`README.md:33-46`)。公式は Helm のみ (standalone manifest は撤去)。

```bash
helm repo add opencost https://opencost.github.io/opencost-helm-chart
helm repo update
helm install opencost opencost/opencost
```

Kubernetes なしでローカル実行する最小形 (Prometheus にポートフォワードして):

```bash
kubectl port-forward svc/prometheus-server 9080:80
PROMETHEUS_SERVER_ENDPOINT="http://127.0.0.1:9080" go run ./cmd/costmodel/main.go
```

API は既定 `:9003`。主なエンドポイント: `GET /allocation`, `/allocation/summary`, `/assets`, `/cloudCost`, `/metrics`。HA/sharded Prometheus では `PROMETHEUS_SERVER_ENDPOINT` を Thanos/Cortex/Mimir のグローバルクエリ先に向ける (`README.md:46`)。

## タグライン案

- EN: Vendor-neutral CNCF spec and engine for real-time Kubernetes and cloud cost allocation.
- JA: Kubernetes とクラウドのコストをリアルタイムに按分する、ベンダー中立な CNCF 仕様と実装。
