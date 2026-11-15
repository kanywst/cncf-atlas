# recon: Open Cluster Management

調査メモ。出典は URL 添付 (番号は `sources.md`)。`path:line` は pin した commit のもの。permalink の基点は <https://github.com/open-cluster-management-io/ocm/tree/b4e4b232350d6967008372423e5aa7a967d80a9f>。

## 基本情報

- repo: `open-cluster-management-io/ocm` (<https://github.com/open-cluster-management-io/ocm>)
- pinned commit: `b4e4b232350d6967008372423e5aa7a967d80a9f` (2026-11-13, main, "awsirsa: support pre-provisioned hub IAM roles and access entries (#1814)") (S12)
- 近いタグ: `v1.4.0` (2026-10-07 公開)。pin はその後の main (S12)
- 取得方法: sandbox が `git clone` の hooks テンプレートコピーを拒否したので、codeload の tarball (`/tar.gz/b4e4b23...`) を `src/` に展開。sha は `git ls-remote ... HEAD` で確認。`.git` はない
- 言語 / ビルド: Go (`go.mod:3` `go 1.26.0`, `k8s.io/client-go v0.37.2` は `go.mod:38`) / `make` (images, `images-kind`, `load-images-kind` を `solutions/setup-dev-environment/local-up.sh:25,27` が使う)
- 規模: `pkg/` 非テスト Go で約 44k 行。内訳 registration 13.4k / operator 8.0k / work 9.0k / addon 5.7k / placement 4.3k / server 1.6k (`find pkg/<x> -name '*.go' ! -name '*_test.go' | xargs cat | wc -l`)。`vendor/` あり (API 型は `vendor/open-cluster-management.io/api`、addon-framework と sdk-go も vendor)
- ライセンス: Apache-2.0 (GitHub API `license.spdx_id`) (S19)
- CNCF 成熟度: Incubating (TOC 投票クローズ 2026-11-04、Sandbox 受け入れは 2021-11-09) (S3, S5, S6)
- カテゴリ (tools.ts): Orchestration & Scheduling (既存 card エントリのまま)
- 注意: pin 時点の README はまだ "CNCF sandbox project" と書いている (`README.md:10`)。昇格直後で未更新。サイト側は TOC issue を根拠に Incubating と書く

## 歴史の素材

- 起源: IBM と Red Hat が開発した (S4)。Red Hat Advanced Cluster Management for Kubernetes (RHACM) の upstream で、Red Hat は founding member として RHACM の基盤に OCM を使うと ADOPTERS に書いている (S2)
- 最初期のコード: `open-cluster-management-io/registration` の Initial commit が 2020-03-30 (S10)。`api` repo は 2020-03-11、`work` は 2020-04-16、`registration-operator` は 2020-04-27、`addon-framework` は 2020-08-24、`placement` は 2021-04-22、`clusteradm` は 2021-05-20 に作成 (GitHub API `created_at`) (S19)
- CNCF Sandbox: 2021-11-09 受け入れ (S3)。onboarding issue は cncf/sandbox#227 (2021-11-09 作成) (S8)
- 2022-10 時点: 70+ contributors、15+ 社。KubeFed アーカイブ後の後継を自任 (S9)。KubeFed repo は現在 archived (`kubernetes-retired/kubefed`) (S20)
- コード統合: 2023-05-25 に `consolidate-code-from-0.11.0` ブランチで registration / work / placement / registration-operator の各 repo を `ocm` に merge (例: merge commit `d49263f7e6`) (S11)。統合後の最初のリリースが `ocm` repo の v0.11.0 (2023-09-18) (S12)。旧 repo (registration, work, placement, registration-operator) は archived (S19)
- v1.0.0: 2025-06-16 (S12)。CEL によるクラスタ選択と Argo CD pull-model add-on (S4)
- v1.1 (2025-10-22): gRPC ベースの hub-spoke 接続、Kueue MultiKueue と OpenTelemetry の add-on (S4, S12)
- v1.2 (2026-01-30): Placement の高度な設定、hosting cluster の自動解決、argocd-agent 連携 (S4, S12)
- v1.3 (2026-05-09): ManifestWork のリソース適用順序、AddOnTemplate API が v1beta1 (S4, S12)
- v1.4 (2026-10-07): PlacementDecision を SIG Multicluster の PlacementDecision API に同期、ManifestWork の apply metrics と apply logs、NetworkPolicy (S4, S12)
- Incubation 申請: cncf/toc#1884 (2025-09-17 作成、2026-11-04 クローズ) (S5)。due diligence PR cncf/toc#2334 は 2026-11-04 merge (S7)。level change issue cncf/toc#2360 (2026-11-04) (S6)。CNCF 発表ブログは 2026-11-10 (S4)
- 申請時の数字: 27 maintainers / 8 組織 (Red Hat, Guidewire, eBay, AppsCode, Spectro Cloud など)、537 contributors / 84 組織 / 16 カ国、1,100 stars、1,370 PR (S4)

## アーキテクチャの素材

hub-spoke。hub 側は Cluster Manager、各 managed cluster 側に agent の klusterlet (S1)。

hub 側のコンポーネント (`pkg/cmd/hub/` に cobra コマンド):

- registration-controller (`pkg/cmd/hub/registration.go`): ManagedCluster の受け入れ、cluster namespace と RBAC の作成、CSR 承認、lease 監視
- work webhook と ManifestWorkReplicaSet controller (`pkg/cmd/hub/work.go`)
- placement-controller (`pkg/cmd/hub/placement.go`): Placement をスケジュールして PlacementDecision を書く
- addon-manager (`pkg/cmd/hub/addon.go:20` `Use = "manager"`)
- gRPC server (`pkg/cmd/hub/grpc_server.go`、`cmd/server/main.go:37-38` "Server for transport resources"): agent が hub の kube-apiserver の代わりに gRPC で話すための経路 (v1.1 以降) (S4)
- operator (`pkg/cmd/hub/operator.go`): ClusterManager CR から hub 側一式を配備 (`pkg/operator/operators/clustermanager`)

spoke 側 (`pkg/cmd/spoke/`):

- registration agent (`pkg/registration/spoke/spokeagent.go`)
- work agent (`pkg/work/spoke/spokeagent.go`)
- klusterlet operator (`pkg/operator/operators/klusterlet`)
- Klusterlet の `Mode` は Default / Hosted / Singleton / SingletonHosted (`vendor/open-cluster-management.io/api/operator/v1/types_klusterlet.go:407-416`)。Singleton は registration と work agent を 1 deployment で動かす。Hosted は agent をクラスタ外の management cluster で動かす

設計判断:

- Pull 型: work agent は hub 上の自分の namespace から ManifestWork を pull して適用する。hub に managed cluster の資格情報を置かない (S1)。コードでは informer を `workinformers.WithNamespace(o.agentOptions.SpokeClusterName)` で絞る (`pkg/work/spoke/spokeagent.go:257`)、client も `ManifestWorks(o.agentOptions.SpokeClusterName)` (`:261`)
- cluster namespace: 受け入れたクラスタごとに hub に同名 namespace を作る (`pkg/registration/hub/managedcluster/controller.go:220-239`)。そこが work と addon の置き場で、RBAC の境界
- double opt-in: agent が ManagedCluster と CSR を作り、hub 管理者が `hubAcceptsClient` を true にし CSR を承認して初めて成立 (S1)。`hubAcceptsClient` は `vendor/open-cluster-management.io/api/cluster/v1/types.go:64`
- 転送ドライバ: work agent の `--workload-source-driver` は kube / mqtt / grpc / kafka (`pkg/work/spoke/options.go:56-57`、既定 kube は `:40`)。kube 以外は CloudEvents クライアント (sdk-go) を組む (`pkg/work/spoke/spokeagent.go:212-243`)
- 登録ドライバ: csr (既定) / awsirsa / grpc (`pkg/registration/register/factory/options.go:80-89` の `Driver()`)。token は add-on の KubeClient 認証用のみ (`:24-26`)。spoke 側 `RegisterDriver` (`pkg/registration/register/interface.go:69-94`)、hub 側 `HubDriver` (`interface.go:125-142`)
- SIG Multicluster との整合: ClusterProfile を ManagedClusterSetBinding に応じて作る hub controller (`pkg/registration/hub/clusterprofile/lifecycle_controller.go:39-42`)、OCM の PlacementDecision を SIG MC の PlacementDecision に同期する controller (`pkg/placement/controllers/sigplacementdecision/controller.go:30-31`)。どちらも feature gate `ClusterProfile` / `SIGPlacementDecision` で既定 off、Alpha (`vendor/open-cluster-management.io/api/feature/feature.go:139,150`)。API は `sigs.k8s.io/cluster-inventory-api` (S16)

### 端から端まで 1: クラスタ登録

1. agent 起動。kubeconfig は 4 種 (management / spoke / bootstrap / hub) と 4 シナリオがコメントで説明されている (`pkg/registration/spoke/spokeagent.go:88-116`)。hub kubeconfig が無効なら bootstrap kubeconfig で一時的な BootstrapController を立てる (`:276-315`)
2. ManagedCluster 作成: `managedClusterCreatingController.sync` が hub に ManagedCluster が無ければ作る (`pkg/registration/spoke/registration/creating_controller.go:52-92`)。bootstrap 資格情報が失効したあとは Unauthorized を握りつぶす (`:55-58`)
3. CSR: CSR ドライバが CSR を作る (`pkg/registration/register/csr/certificate.go:196-212`)。subject は org `system:open-cluster-management:<cluster>`、CN `system:open-cluster-management:<cluster>:<agent>`。hub 側の `validateCSR` が label と org と CN の一致を厳密に検査 (`pkg/registration/register/csr/approve_reconciler.go:133-201`)
4. 承認: renewal reconciler は常に有効で、CSR の username が CN と一致し SAR が通れば自動承認 (`approve_reconciler.go:60-90`)。bootstrap reconciler (approvalUsers) は alpha gate `ManagedClusterAutoApproval` (既定 off, `vendor/.../api/feature/feature.go:136`) が有効なときだけ追加 (`pkg/registration/register/csr/hub_driver.go:181-185`、本体 `approve_reconciler.go:108-128`)。更新 (renewal) は SubjectAccessReview で `register.open-cluster-management.io/managedclusters/clientcertificates` の `renew` 権限を確認 (`:204-224`)
5. 受け入れ: hub の `managedClusterController.sync` が `HubAcceptsClient` を見る (`pkg/registration/hub/managedcluster/controller.go:164`)。false で既に accepted なら RBAC と rolebinding を外して `HubAcceptedCondition=False` (`:164-215`)。true なら namespace、finalizer、cluster 別 RBAC と rolebinding を apply し `hubDriver.CreatePermissions` (`:217-260`)。auto approval feature では初回 join だけ自動 accept、以後は管理者が拒否できる (`:155-162`)
6. 証明書が出たら一時 controller を止めて本体 controller 群を起動 (`spokeagent.go:328-337`)。証明書は残寿命が 20-25% のランダム閾値を切ると再 CSR (`pkg/registration/register/csr/csr.go:509-520`、`jitter(0.2, 0.25)`)
7. heartbeat: spoke の lease controller が `leaseDurationSeconds` (既定 60) ごとに `RenewTime` を更新 (`pkg/registration/spoke/lease/lease_controller.go:67-81,135`)。hub は 5 倍の猶予を過ぎると `ManagedClusterConditionAvailable=Unknown` (`pkg/registration/hub/lease/controller.go:27,115-122,140-157`)

### 端から端まで 2: ManifestWork の適用

1. hub の cluster namespace に ManifestWork を作る。spec は `Workload` / `DeleteOption` / `ManifestConfigs` / `Executor` (`vendor/open-cluster-management.io/api/work/v1/types.go:37-56`)
2. work agent の `ManifestWorkController.sync` (`pkg/work/spoke/controllers/manifestcontroller/manifestwork_controller.go:132-211`)。finalizer が無ければ何もしない (`:157-161`)、Complete なら更新しない (`:163-166`)
3. AppliedManifestWork を spoke に作る。名前は `<hubHash>-<workName>` (`manifestwork_controller.go:213-240`)。hub 側オブジェクトの spoke 側の影で、適用したリソースの記録と GC の起点
4. reconciler 2 段: `manifestworkReconciler` と `appliedManifestWorkReconciler` (`manifestwork_controller.go:98-110`)
5. 適用: manifests を kind 順にソート (`manifestwork_reconciler.go:44-56` の `resourceApplyOrder`、Namespace/CRD が rank 0、RBAC 1、... workload 5、webhook 6、未登録 1000) し stable sort (`:257-287`)。conflict は `retry.RetryOnConflict` で再試行 (`:151-163`)
6. 1 件ずつ: Complete 済みは skip (`:340-346`)、Executor の権限を `validator.Validate` で確認 (`:351-358`、SAR は `pkg/work/spoke/auth/basic/auth.go:35,62`)、update strategy で applier を選ぶ (`:363-375`)。applier は CreateOnly / ServerSideApply / Update / ReadOnly (`pkg/work/spoke/apply/apply.go:31-37`)。既定は Update (`manifestwork_reconciler.go:366`)
7. status: manifest ごとに Applied condition、全部 true なら work の `WorkApplied=True` (`:166-226`)。権限エラーは error にせず requeue (`:180-189`)。SSA conflict は error 集計から外す (`:191-195`)
8. 再同期: 通常 `wait.Jitter(4m, 0.5)` で requeue (`manifestwork_controller.go:40,175`)
9. 不要リソースの削除: `appliedManifestWorkReconciler` が前回の AppliedResources と今回の差分を出して消す (`appliedmanifestwork_reconciler.go:90-99`)
10. 状態の吸い上げ: `AvailableStatusController` が `status-sync-interval` (既定 10s) で回る (`pkg/work/spoke/options.go:38,52`、`statuscontroller/availablestatus_controller.go:103`)。well-known status feedback は Deployment/Job/Pod など (`pkg/work/spoke/statusfeedback/rules/rule.go:76-78`)
11. 削除時の伝播: `DeleteOption` は Foreground / Orphan / SelectivelyOrphan (`vendor/.../work/v1/types.go:401-407`)

### 端から端まで 3: Placement

1. Placement は namespace スコープ。ManagedClusterSet を namespace に ManagedClusterSetBinding で bind し、その中から選ぶ (`vendor/.../cluster/v1beta1/types_placement.go:18-26`)
2. `schedulingController.syncPlacement` (`pkg/placement/controllers/scheduling/scheduling_controller.go:214-284`): 有効な binding (`:227`) → 対象 clusterset (`:233`) → 候補クラスタ (`:236`) → `scheduler.Schedule` (`:243`) → decision group 生成 (`:245`) → `bind` (`:269`) → status
3. scheduler: filter は predicate と tainttoleration (`schedule.go:168-176`)。prioritizer の既定 weight は Balance と Steady が 1、ほかは 0 (`schedule.go:148-160`)。スコア合計は score × weight の和 (`:277-281`)。同点は名前順 (`:285-292`)。`NumberOfClusters` で切り詰め (`:325-338`)
4. PlacementDecision は 1 つあたり最大 100 クラスタ。超えたら分割 (`scheduling_controller.go:49,466-474`)
5. 消費側: PlacementDecision はただのリスト。Argo CD の ClusterDecisionResource generator など誰でも読める (S1, S2)。ManifestWorkReplicaSet は placementRefs と rolloutStrategy を持ち (`vendor/.../work/v1alpha1/types_manifestworkreplicaset.go:54,63,103`)、rollout handler で配る先を決めて cluster namespace ごとに ManifestWork を作る (`pkg/work/hub/controllers/manifestworkreplicasetcontroller/manifestworkreplicaset_deploy_reconcile.go:107-120,390`)

### Add-on

- ClusterManagementAddOn (hub 全体で 1 つ、`InstallStrategy` は `vendor/.../addon/v1beta1/types_clustermanagementaddon.go:51`) と ManagedClusterAddOn (cluster namespace に 1 つ)
- 開発者は `AgentAddon` interface (`Manifests` と `GetAgentAddonOptions`) を実装 (`vendor/open-cluster-management.io/addon-framework/pkg/agent/interface.go:32-49`)
- addon manager は `Manifests` の結果を ManifestWork `addon-<name>-deploy-*` に包んで cluster namespace に置く (`vendor/.../addon-framework/pkg/addonmanager/controllers/agentdeploy/default_sync.go:29-77`、名前は `.../addonmanager/constants/*.go:24-25`)。つまり addon の配布も ManifestWork に乗る
- addon agent の hub 資格情報: spoke の registration agent が addon ごとに driver を `Fork` して CSR を出す (`pkg/registration/spoke/addon/registration_controller.go:223`、`pkg/registration/register/csr/csr.go:305`)
- コードを書かない addon: AddOnTemplate (`pkg/addon/templateagent/template_agent.go:80-123`)。v1.3 で v1beta1 (S4)

## 内部実装の素材

- ディレクトリ: `pkg/registration` (hub/spoke/register)、`pkg/work` (hub/spoke/webhook)、`pkg/placement` (controllers/plugins)、`pkg/addon` (hub の addon manager と template agent)、`pkg/operator` (clustermanager/klusterlet)、`pkg/server` (gRPC)、`pkg/singleton`
- 中核データ構造: `ManagedClusterSpec` (`vendor/.../cluster/v1/types.go:48-76`: HubAcceptsClient, LeaseDurationSeconds, Taints)、`ManifestWorkSpec` (`vendor/.../work/v1/types.go:37-56`)、`PlacementSpec` (`vendor/.../cluster/v1beta1/types_placement.go:58-102`: ClusterSets, NumberOfClusters, Predicates, PrioritizerPolicy, Tolerations, DecisionStrategy)、`ManagedClusterSet` の `ClusterSelector` (`vendor/.../cluster/v1beta2/types_managedclusterset.go:33-76`)
- 意外だった点:
  - CSR 検査が CN を `:` で 2 分割して cluster 名と agent 名の一致まで見る (`approve_reconciler.go:176-198`)
  - 証明書の再発行閾値にジッター (20-25%) を入れて、大量クラスタが同時に CSR を出すのを避けている (`csr.go:518`)
  - AppliedManifestWork の名前に hubHash を入れる。1 つの managed cluster が複数 hub を持つ構成で衝突しない (`manifestwork_controller.go:215`)
  - 権限不足 (Executor の SAR 失敗) は error ではなく condition に落として短い間隔で requeue (`manifestwork_reconciler.go:180-189`)
  - 適用順は kind の固定ランク表。CRD を先に、webhook を最後に (`manifestwork_reconciler.go:44-56`)
  - 1 PlacementDecision 100 件上限は etcd オブジェクトサイズ対策と読める (`scheduling_controller.go:49`)。コメントで理由は明記されていない。推測なので書くなら「上限がある」だけ

## 採用事例の素材

すべて ADOPTERS.md @ pin (S2)。CNCF 発表ブログも一部を再掲 (S4)。

- Alibaba Cloud (Vendor, 2021): ACK One の Fleet 管理が OCM ベース (S2, S4)。KubeCon China 2021 で Alibaba の 2 名が KubeVela と OCM の組み合わせを発表 (S14)
- Ant Group (End user, 2021): 世界中に数十クラスタ、各数千ノード (S2)
- AppsCode (End user, Contributor, 2022): ACE プラットフォームの多クラスタ管理基盤、KubeDB 向け addon (S2)
- eBay (End user, 2024): 190+ クラスタへのアプリ配布。ManifestWork と Placement で Argo CD の Project/Application を包み、各クラスタの Argo CD が適用 (S2, S4)
- RamenDR (Integration, 2024): Placement 拡張として DR (S2)
- Red Hat (Vendor, 2021): RHACM の基盤 (S2)
- Spectro Cloud (Vendor, 2025): Mural (S2)
- Xiaohongshu (End user, 2022): 初期採用 (S2)
- Guidewire (End user, 2025): AWS IAM ベースの登録 (EKS) を実装して寄贈 (S2)。pin commit 自体も awsirsa 関連
- Groww (End user, 2025): セル型デプロイ、ManifestWork を段階的に生成する独自 rollout controller (S2, S4)
- KubeStellar Console (Integration, 2025) (S2)
- VESSL AI (End user, Contributor, 2025): GPU クラウドの多クラスタ管理 (S2, S4)
- 2022 の CNCF ブログが TietoEvry / Expedia Group / ESET を「探索中または利用中」と書くが、個人名ベースの言及で強度が弱い。ページには出さない (S9)
- 指標: 1,133 stars、193 forks (GitHub API, 2026-11-15) (S19)。GitHub contributors API は 106 (ocm repo 単体)。CNCF の 537 は org 全体の数字と思われるので出典を分けて書く (S4)

## 代替・エコシステム

- 統合 (ADOPTERS の Ecosystem 節) (S2): Argo CD (ClusterDecisionResource generator)、Argo CD Agent、Cluster API、Clusternet addon、Fluid、Helm、Istio (multicluster-mesh)、KubeStellar、KubeVela、Kueue (MultiKueue)、Meshery、OpenTelemetry、Submariner
- Karmada (CNCF Incubating): 専用の karmada-apiserver を立て、素の Deployment をテンプレートとして受け取り PropagationPolicy で配る。Push / Pull 両モード。OCM は hub が普通の Kubernetes で、配る単位は ManifestWork という封筒、pull が基本。site 内 `/tools/karmada/`
- Clusternet (CNCF Sandbox): 同じく hub-spoke。OCM 上の addon としても提供 (S2)。site 内 `/tools/clusternet/`
- KubeFed: アーカイブ済み (S20)。OCM は後継を自任 (S9)、`solutions/migrate-kubefed` がある
- KubeStellar: OCM の上に乗る (start-from-ocm ドキュメント) (S2)
- Argo CD 単体の multi-cluster: Argo CD が各クラスタの資格情報を持って push する。OCM と組むと pull 型にできる (argocd pull add-on、argocd-agent) (S4)
- クラスタのプロビジョニングはしない。Cluster API と組む (`solutions/cluster-api`) (S1)

## Getting started の素材

- 公式 quick start は 2 行: clusteradm を install、`local-up.sh` で kind 3 クラスタ (S13)
- `local-up.sh` の中身 (`solutions/setup-dev-environment/local-up.sh:17-69`): `kind create cluster` ×3 → `clusteradm init --wait --context kind-hub` → `clusteradm get token` で join コマンドを得る → 各クラスタで `clusteradm join ... --force-internal-endpoint-lookup` → `clusteradm accept --clusters cluster1,cluster2,local-cluster --wait` → `kubectl get managedclusters`
- ManifestWork を作る: `clusteradm create work nginx -f manifests/nginx.yaml --cluster cluster1` (`solutions/deploy-manifests/README.md`)
