# recon: clusterpedia

調査メモ。自分用の密度。出典は URL 付き。コードの anchor は `research/clusterpedia/src` 配下の pinned commit で実際に開いて確認済み。

## 基本情報

- repo: `clusterpedia-io/clusterpedia`
- pinned commit: `bece343b72527405e1a3ff86aca449e7ed9fe3d9` (2026-04-30, main の merge commit #854) / 近いタグ: `v0.9.1` (2026-04-16 release。HEAD は v0.9.1 より先の main)
- 言語 / ビルド: Go (`go 1.23.0`、`go.mod:3`) / `make all` で4バイナリ (`Makefile:21`: `apiserver binding-apiserver clustersynchro-manager controller-manager`)
- ライセンス: Apache License 2.0 (`LICENSE` 冒頭、`gh api` の `spdx_id` も `Apache-2.0`)。検証済み
- CNCF 成熟度: Sandbox (2022-06-17 acceptance、[CNCF project page](https://www.cncf.io/projects/clusterpedia/))
- カテゴリ: Orchestration & Scheduling (マルチクラスタの集約/検索コントロールプレーン。後述の理由で選定)

用語 (このページ初出を展開):

- CRD = Custom Resource Definition (Kubernetes のカスタム資源定義)
- GVR = GroupVersionResource (API グループ/バージョン/リソース名の3つ組)
- SQL = Structured Query Language
- ORM = Object Relational Mapping (ここでは gorm)
- API = Application Programming Interface
- UID = Unique Identifier
- RBAC = Role Based Access Control

## 一言で

複数 Kubernetes クラスタの資源を1つの relational DB (MySQL / PostgreSQL) に同期して貯め、Kubernetes Aggregated API として「kubectl でそのまま叩ける」横断検索エンドポイントを生やすもの。orchestration ではなく read/search 寄り。本家いわく「クラスタ版 Wikipedia」。

## 歴史の素材

- 2021 末に DaoCloud が OSS 化。repo の GitHub `created_at` は 2021-10-08 (`gh api repos/clusterpedia-io/clusterpedia`)。創始者/sponsor は Iceber Gu (Cai Wei, DaoCloud)。出典: [Clusterpedia.io blog](https://clusterpedia.io/blog/2022/03/01/demo-video-clusterpedia-complex-retrieval-of-resources-in-a-multi-cloud-environment/)、[DaoCloud docs](https://docs.daocloud.io/en/community/clusterpedia)。
- 名前は Wikipedia から。「同期 + 検索 + ゆくゆくは簡易コントロール」という思想 ([README.md](https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md))。
- 2022-06-17 CNCF Sandbox 受理 ([CNCF project page](https://www.cncf.io/projects/clusterpedia/))。
- 背景文脈: KubeFed の EOL 後、マルチクラスタ管理の空白を Karmada (orchestration) と Clusterpedia (search/observability) が別角度から埋めた、という整理が一般的 ([CNCF blog: Karmada and OCM](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/))。
- リリースの刻み: 直近の安定タグ `v0.9.1` (2026-04-16, `gh api .../releases/latest`)。k8s バージョン追従タグ (`v0.9.1-k8s1.32.13` 等) を別途切る運用。

## アーキテクチャの素材

README の "Architecture" は4部構成 (`README.md:95` 以降)。

- Clusterpedia APIServer: Kubernetes Aggregated API として登録、統一入口を提供。実体は `genericServer.InstallAPIGroup` (`pkg/apiserver/apiserver.go:156`)、scheme install は `install.Install(Scheme)` (`pkg/apiserver/apiserver.go:44`)。`PrepareRun().RunWithContext` で起動 (`pkg/apiserver/apiserver.go:173`)。
- ClusterSynchro Manager: 各クラスタの informer を回して資源を storage に書く側。`ClusterSynchro` (`pkg/synchromanager/clustersynchro/cluster_synchro.go:84` の `New`)。
- Storage Layer: storage component を抽象化したインターフェース層。`StorageFactory` (`pkg/storage/storage.go:20`) と `ResourceStorage` (`pkg/storage/storage.go:39`)。
- Storage Component: 実体の MySQL / PostgreSQL 等。デフォルト実装は `internalstorage` (`pkg/storage/internalstorage/`)。

バイナリは4つ (`cmd/`):

- `apiserver`: 検索 API 専用 (`cmd/apiserver/main.go`)。
- `clustersynchro-manager`: 同期専用。
- `binding-apiserver`: apiserver + synchro manager を1プロセスに同居させた all-in-one。`synchromanager.NewManager(...)` を `go ...Run(...)` で起動している (`cmd/binding-apiserver/app/binding_apiserver.go:73`-`74`)。
- `controller-manager`: ClusterImportPolicy 等の controller 群。

入口の CRD は `PediaCluster` (`cluster.clusterpedia.io/v1alpha2`)。これがクラスタ認証情報 + 同期対象資源の宣言を兼ねる (`README.md:105` 付近)。型: `PediaCluster` (`staging/src/github.com/clusterpedia-io/api/cluster/v1alpha2/types.go:59`)、`ClusterSpec` (同 `:70`)、`Kubeconfig []byte` (同 `:72`)、`SyncResources []ClusterGroupResources` (同 `:92`)。例 (`examples/pediacluster.yaml`) は apiserver+token/cert と `syncResources` に `apps/deployments`, `/pods` を並べる形。

設計判断のキモ: storage を network 越しの接続性問題からは切り離している。README が明言する通り「Clusterpedia はマルチクラスタの network 接続性は解かない」(submariner/skupper/tower 併用が前提)。あくまで「中央 DB に状態を集約 → 横断 read」がスコープ。

## 内部実装の素材

### 代表オペレーションを端から端まで: マルチクラスタ list/search

「`kubectl get deployments -A` をクラスタ横断で叩く」が1本の代表パス。HTTP request が Aggregated API に入ってから DB の `SELECT` に落ちるまでを追う。

1. `ResourceHandler.ServeHTTP` (`pkg/kubeapiserver/resource_handler.go:42`) が入口。`requestInfo.Verb` を見て分岐 (`resource_handler.go:53`)。list/watch のときだけ "forward" 用 labelSelector の trim を判定する (`resource_handler.go:54`)。
2. clusterName 指定があれば PediaCluster lister で存在チェック (`resource_handler.go:91`)。資源が同期対象として discovery に載ってなければ delegate に流す (`resource_handler.go:107`)。
3. GVR (GroupVersionResource) + subresource から REST storage を引く: `r.rest.GetResourceREST(...)` (`resource_handler.go:117`)。
4. verb=list なら標準の `handlers.ListResource(storage, nil, reqScope, false, r.minRequestTimeout)` に委譲 (`resource_handler.go:154`)。ここで Kubernetes apiserver の汎用 list handler に乗る = だから kubectl 互換。
5. handler は `RESTStorage.List` (`pkg/kubeapiserver/resourcerest/storage.go:110`) を呼ぶ。まず `resolveListOptions` (`resourcerest/storage.go:77`) で URL query を `internal.ListOptions` に decode (`resourcerest/storage.go:80`)、namespace/cluster を options に詰め、owner 検索時は単一クラスタ必須を強制 (`resourcerest/storage.go:92`)。
6. `s.Storage.List(ctx, objs, options)` (`resourcerest/storage.go:145`) で storage layer 抽象へ。
7. internalstorage 実装 `ResourceStorage.List` (`pkg/storage/internalstorage/resource_storage.go:222`)。`genListObjectsQuery` (`resource_storage.go:203`) が `db.Model(&Resource{}).Where(s.gvrKeyMap())` で土台クエリを組み (`resource_storage.go:217`)、`applyListOptionsToResourceQuery` (`resource_storage.go:218`) で検索条件を載せる。
8. 条件→SQL 変換の本丸は `applyListOptionsToQuery` (`pkg/storage/internalstorage/util.go:184`)。cluster/namespace/name は IN 句 (`util.go:188`, `:196`, `:204`)、`since`/`before` は `created_at` 比較 (`util.go:210`, `:214`)。label selector は1つ1つ JSON path クエリに変換して `query.Where(jsonQuery)` (`util.go:231`, `:248`)。fuzzy name は `name LIKE ?` (`util.go:260`)。enhanced field selector も同様に `object` JSON の任意 path へ (`util.go:288`)。order by は明示時のみ付与 (`util.go:326`)、limit/offset でページング (`util.go:342`, `:348`)。
9. 結果は `result.From(query)` (`resource_storage.go:234`) で DB から取り、`object.ConvertTo(s.config.Codec, ...)` で各行の JSON を runtime.Object に decode して list に詰め直す (`resource_storage.go:303`-`321`)。remaining count / continue token もここで設定 (`resource_storage.go:244`-`255`)。

書き込み側 (synchro) は逆向きで、informer event → `ResourceStorage.Create` (`resource_storage.go:67`) / `Update` (`resource_storage.go:110`) が同じ `Resource` テーブルに upsert する。

### 中核データ構造 (3-5個)

- `Resource` (`pkg/storage/internalstorage/types.go:90`): DB の主テーブル1行。GVR + Kind + Cluster/Namespace/Name + OwnerUID + UID + ResourceVersion を列に持ち、資源本体は `Object datatypes.JSON` (`types.go:105`) として丸ごと1カラムに JSON 格納。複合 unique index `uni_group_version_resource_cluster_namespace_name` で同期の冪等性を担保。
- `internal.ListOptions` (`staging/src/github.com/clusterpedia-io/api/clusterpedia/types.go:50`): 検索条件の集合体。`Names`/`ClusterNames`/`Namespaces` (`:53`-`:55`)、owner 系、`EnhancedFieldSelector` (`:71`)、`ExtraLabelSelector` (`:74`)、生クエリ用 `URLQuery` (`:77`)。Kubernetes 標準の ListOptions を超えた検索語彙を表現する。
- `PediaCluster` / `ClusterSpec` (`.../cluster/v1alpha2/types.go:59`, `:70`): クラスタ登録 CRD。`Kubeconfig` (`:72`) もしくは apiserver+証明書で接続し、`SyncResources` (`:92`) で同期対象 GVR を宣言。`SyncAllCustomResources bool` (`:95`) で CRD 全同期も可能。
- `JSONQueryExpression` (`pkg/storage/internalstorage/json_builder.go:46`、生成は `JSONQuery(...)` `json_builder.go:54`): label/field selector を DB 方言別 (mysql/sqlite/postgres) の JSON path 述語に落とす gorm clause。`Build` (`json_builder.go:120`) が mysql は `JSON_UNQUOTE`、sqlite は `CAST as TEXT`、postgres は専用 path を出し分ける。
- storage 抽象の `StorageFactory` / `ResourceStorage` interface (`pkg/storage/storage.go:20`, `:39`): バックエンドを差し替えるための契約。`List`/`Get`/`Create`/`Update`/`Delete`/`Watch` を定義。

### 非自明な設計判断

「資源を JSON カラム1本に丸ごと突っ込み、label/field selector を実行時に DB の JSON path 述語へ変換する」点 (`types.go:105` + `json_builder.go`)。label を別テーブルに正規化せず、`object->>'$.metadata.labels.<key>'` 系の式で直接フィルタする。利点はスキーマが資源種別に依らず1枚で済み、任意フィールド検索 (enhanced field selector) も同じ機構で実現できること。代償は JSON 関数依存で DB 方言ごとに分岐が要り (`json_builder.go:128` mysql/sqlite vs `:171` postgres)、列インデックスが効きにくいこと。

関連する小さな判断:

- デフォルトで `ORDER BY` を付けない。性能理由を明記 (`util.go:324` のコメントが PR #44 を参照)。
- storage layer は `init()` で名前登録するプラグイン方式。`internalstorage` は `storage.RegisterStorageFactoryFunc("internal", NewStorageFactory)` を `init` 内で呼ぶ (`pkg/storage/internalstorage/register.go:28`-`29`、登録関数本体は `pkg/storage/register.go:9`)。さらに Go の `plugin.Open` で `.so` を動的ロードする口もある (`pkg/storage/plugin.go:9`)。
- 生 SQL / parameterized SQL 検索は feature gate 制 (`util.go:217`-`222` が `AllowRawSQLQuery` / `AllowParameterizedSQLQuery` を見て URL query を where 句化)。

## 採用事例の素材

- repo に `ADOPTERS` ファイルは無い (確認済み)。明示的な adopters リストは未整備。
- 強い裏取りができる「named adopter」は今回見つからず。捏造しない。最大の関係者は開発元の DaoCloud (maintainer 3人中2人が DaoCloud 所属、`MAINTAINERS.md`)。
- 代わりに GitHub シグナルで規模を示す (後述)。

GitHub シグナル (`gh api repos/clusterpedia-io/clusterpedia`、参照日 2026-06-27):

- Stars: 878
- Forks: 126
- Contributors: 41 (`gh api --paginate contributors` の login 数。Link header の last page も 41)
- Open issues: 65
- 最終 push: 2026-06-18

Maintainer (`MAINTAINERS.md`): Calvin Chen (@calvin0327, DaoCloud)、Iceber Gu (@Iceber, DaoCloud)、wuyingjun (@wuyingjun-lucky, China Mobile Cloud)。Governance は role 階層 (Member/Reviewer/Approver/Maintainer) を OWNERS ファイルで定義 (`GOVERNANCE.md`)。

## 代替・エコシステム

- 統合先 (補完関係): Cluster API、Karmada、Clusternet、vCluster、KubeVela 等のマルチクラウド基盤が管理するクラスタを自動 import できる ([README.md](https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md))。Clusterpedia は orchestration を奪わず、その上に「横断 read/search」を足す位置取り。
- network 接続性は範囲外。submariner / skupper / tower 等と併用する前提 ([README.md](https://github.com/clusterpedia-io/clusterpedia/blob/main/README.md))。
- 本質的に違うもの (alternative ではなく別レイヤ):
  - Karmada (CNCF Incubating, Huawei 由来): クロスクラスタの workload orchestration/federation。Clusterpedia は「検索/observability」、Karmada は「配置/スケジューリング」。両者は競合でなく組合せ ([CNCF blog](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/))。
  - Open Cluster Management: governance/policy 寄りの fleet 管理。
- 近い思想の素朴な代替: 各クラスタ個別に `kubectl` する、もしくは Prometheus/observability スタックで状態を集約する。Clusterpedia の差別化は「Kubernetes OpenAPI 互換のまま」「kubectl/client-go がそのまま使える」「異なる Kube バージョンの資源を同一 version で引ける版数変換」。

## 入口と最小構成 (getting started 用素材)

- インストールは Helm が主。chart は `clusterpedia-io/clusterpedia-helm` (storage subchart に bitnami/postgresql, bitnami/mysql)。PostgreSQL がデフォルト ([Quickly Deploy Clusterpedia with Helm](https://clusterpedia.io/blog/2022/04/11/quickly-deploy-clusterpedia-with-helm/))。
- 最小フロー: (1) chart 取得 → `helm dependency build` で bitnami subchart 解決、(2) `helm install ... --set installCRDs=true --set persistenceMatchNode=<node>`、(3) `PediaCluster` を `kubectl apply` してクラスタ import (`examples/pediacluster.yaml`)、(4) `kubectl get deployments -A` 等を Clusterpedia の Aggregated API context 越しに叩く。raw でも `kubectl get --raw "/apis/clusterpedia.io/v1beta1/resources/apis/apps"` (`README.md:47`)。
- 公式手順は [Installation](https://clusterpedia.io/docs/installation/) / [Import Clusters](https://clusterpedia.io/docs/usage/import-clusters/) / [Sync Cluster Resources](https://clusterpedia.io/docs/usage/sync-resources/)。

## カテゴリ選定の理由

候補は Orchestration & Scheduling か Observability。資源の横断検索という機能は observability 的だが、Clusterpedia は metrics/trace/log を扱わず、Kubernetes 資源そのものをマルチクラスタで同期/集約/制御する control-plane コンポーネント (PediaCluster CRD, Aggregated API, synchro manager) である。Karmada/OCM と同じ「マルチクラスタ管理」棚に並ぶのが自然なので Orchestration & Scheduling を選ぶ。

## tagline 案

- EN: Wikipedia for your Kubernetes fleet: sync every cluster into one database and search resources across all of them with plain kubectl.
- JA: 全 Kubernetes クラスタの資源を1つの DB に同期し、kubectl のまま横断検索できる「クラスタの百科事典」。
