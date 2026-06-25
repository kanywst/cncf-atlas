# recon: Karmada

調査メモ。出典は URL 添付。path:line は pin した commit のもの。

## 基本情報

- repo: `karmada-io/karmada` (<https://github.com/karmada-io/karmada>)
- pinned commit: `658499d7080640f78c3d9f5cbf9db58428a902a3` (2026-06-22, master)
- 近いタグ: `v1.19.0-alpha.0` (2026-05-30)。直近 stable リリースは `v1.18.0` (2026-05-30 公開)
- 言語 / ビルド: Go (go 1.26.4, `go.mod:1` module `github.com/karmada-io/karmada`) / `make` (Makefile の `all`/`karmadactl` ターゲットが `cmd/*` をクロスビルド)
- ライセンス: Apache-2.0。検証済み: `LICENSE` 冒頭が Apache License Version 2.0、GitHub API `licenseInfo.key=apache-2.0`
- CNCF 成熟度: Incubating (2023-12-12 昇格、Sandbox は 2021-09-14)
- カテゴリ (tools.ts): Orchestration & Scheduling
- 一言 (en): Kubernetes-native control plane that propagates and schedules workloads across many clusters and clouds.
- 一言 (ja): 複数クラスタ/クラウドへワークロードを Kubernetes ネイティブ API のまま配布・スケジューリングするコントロールプレーン。

## 全体像

Karmada は独立した「Karmada コントロールプレーン」(専用 karmada-apiserver + etcd) を立て、そこにリソーステンプレート (素の Deployment 等) と Karmada 独自 CRD を保存する。メンバークラスタを登録し、テンプレートを各クラスタへ配布する。アプリ側は無改造。コンポーネント (`cmd/` 配下、各々 `func main` から `app.NewXxxCommand` を呼ぶ cobra アプリ):

- `karmada-controller-manager` (`cmd/controller-manager/controller-manager.go:30`): detector と各種コントローラ群を駆動する中核。
- `karmada-scheduler` (`cmd/scheduler`): ResourceBinding にクラスタを割り当てる。
- `karmada-agent` (`cmd/agent`): Pull モードでメンバークラスタ側から接続し Work を適用。
- `karmada-aggregated-apiserver` (`cmd/aggregated-apiserver`): `cluster/proxy` などの集約 API。
- `karmada-search` (`cmd/karmada-search`): 全クラスタ横断のリソース検索/キャッシュ。
- `karmada-descheduler` / `karmada-scheduler-estimator` (`cmd/descheduler`, `cmd/scheduler-estimator`): 再スケジュールとメンバー実残容量見積もり。
- `karmada-metrics-adapter` (`cmd/metrics-adapter`): 複数クラスタメトリクス集約 (federated HPA 用)。
- `karmada-webhook` (`cmd/webhook`): admission。
- `karmadactl` / `kubectl-karmada` (`cmd/karmadactl`, `cmd/kubectl-karmada`): CLI。`init` でコントロールプレーンを構築 (`pkg/karmadactl/cmdinit/cmdinit.go:121` `NewCmdInit`)。
- `operator/`: Karmada インスタンスを CRD (`Karmada`) で宣言管理する operator。

Push/Pull 2 モード: Push はコントロールプレーンが直接メンバー API を叩く。Pull は karmada-agent がメンバー側で動いて取りに来る (<https://github.com/karmada-io/karmada> README)。

## 中核オペレーションを端から端まで (Deployment 1 個の配布)

素の Deployment を karmada-apiserver に作り、`PropagationPolicy` で対象クラスタを宣言したときの流れ。

1. 検知とポリシー適用: `pkg/detector/detector.go:231` `ResourceDetector.Reconcile` がテンプレート変更を拾い、マッチした PropagationPolicy に `ApplyPolicy` (`detector.go:441`)。`ClaimPolicyForObject` でポリシー所有権を主張し、`BuildResourceBinding` (`detector.go:822`) が `workv1alpha2.ResourceBinding` を生成。RB は spec.Resource にテンプレート参照、spec.Placement にポリシーの配置ルールを持つ。
2. スケジューリング: `pkg/scheduler/scheduler.go:359` `scheduleNext` から `doScheduleBinding` (`scheduler.go:395`)。`placementChanged` / replicas 変化 / 明示再スケジュール / Duplicated などの判定で `scheduleResourceBinding` (`scheduler.go:571`) を呼ぶ。affinities の有無で `scheduleResourceBindingWithClusterAffinity` (`scheduler.go:590`) へ。ここで `s.Algorithm.Schedule(...)` (`scheduler.go:600`)。
3. スケジューリングアルゴリズム本体: `pkg/scheduler/core/generic_scheduler.go:71` `Schedule`。順に `findClustersThatFit` (Filter プラグイン, `generic_scheduler.go:119`、各クラスタで `RunFilterPlugins` `:154`)、`prioritizeClusters` (Score プラグイン, `:166`、`RunScorePlugins` `:174`)、`selectClusters` (`:196`, `SelectClusters` は `core/common.go:34`)、`assignReplicas` (`:201`, `AssignReplicas` は `core/common.go:51`)。結果を scheduler が RB.spec.Clusters (`[]TargetCluster`) に patch (`patchScheduleResultForResourceBinding`, `scheduler.go:610`)。Score の上下限は `framework/interface.go:39-42` で 0..100。
4. Work 生成: `pkg/controllers/binding/binding_controller.go:70` `ResourceBindingController.Reconcile` から `syncBinding` (`:110`)、そして `pkg/controllers/binding/common.go:53` `ensureWork`。spec.Clusters を回し、各クラスタごとに workload を DeepCopy し interpreter の `ReviseReplica` で割当値に上書き (`common.go:86-96`)。テンプレートの replicas をそのまま使うと scheduler の quota を迂回するため必ず上書きする旨が `common.go:80-85` のコメントにある。続けて `ApplyOverridePolicies` (`common.go:109`)、`CreateOrUpdateWork` で `workv1alpha1.Work` を生成。Work は per-cluster の execution space namespace `karmada-es-<cluster>` に置く (`names.GenerateExecutionSpaceName`, `pkg/util/names/names.go:80,92`; 命名は `common.go:78,134`)。
5. メンバークラスタへ適用: `pkg/controllers/execution/execution_controller.go:82` `Controller.Reconcile` から `syncWork` (`:151`)、`syncToClusters` (`:266`)。Work.Spec.Workload.Manifests を 1 つずつ unstructured に Unmarshal し、`tryCreateOrUpdateWorkload` (`:311`) で `ObjectWatcher.Create`/`Update` (`:324`,`:332`) を呼んでメンバー API に適用。成功で Work に Applied condition を立てる (`:302`)。

逆向きに status コントローラ群 (`pkg/controllers/status`) がメンバーの実状態を Work から RB、テンプレートへ集約する。

## 中核データ構造

- `workv1alpha2.ResourceBindingSpec` (`pkg/apis/work/v1alpha2/binding_types.go:71`): スケジューリングの作業台。`Resource ObjectReference`, `Replicas`, `ReplicaRequirements`, `Placement`、スケジュール結果の `Clusters []TargetCluster` (`:100`)。新しめの `Components []Component` (`:89`) はマルチ pod テンプレート (分散学習等) 向けで `MultiplePodTemplatesScheduling` feature gate で有効化、旧 Replicas/ReplicaRequirements を置換する設計。
- `workv1alpha2.TargetCluster` (`binding_types.go:287`): 1 クラスタと割当レプリカ数。スケジュール結果の単位。
- `workv1alpha1.Work` / `WorkSpec` (`pkg/apis/work/v1alpha1/work_types.go:44,57`): メンバークラスタへ実際に届ける封筒。`Workload.Manifests []Manifest` (`:77,84`) は `runtime.RawExtension` で任意 K8s リソースを内包。`SuspendDispatching` で配布停止、`PreserveResourcesOnDeletion` で Work 削除時にメンバー側リソースを残すか制御。
- `policyv1alpha1.PropagationPolicy` / `PropagationSpec` (`pkg/apis/policy/v1alpha1/propagation_types.go:52,62`): `ResourceSelectors []ResourceSelector` (`:223`) で対象を選び `Placement` (`:471`) で配置ルール。ClusterPropagationPolicy はクラスタスコープ版。
- メンバークラスタ登録は `clusterv1alpha1.Cluster` (`pkg/apis/cluster`)。Filter/Score はこの Cluster を評価対象にする (`generic_scheduler.go:134` で snapshot から取得)。

## 非自明な設計判断: Lua による Resource Interpreter Framework

任意の CRD を Karmada に教えるため、Go を再コンパイルせず Lua スクリプトで解釈ロジックを差し込める。`pkg/resourceinterpreter/interpreter.go:50-` がインタフェース (`GetReplicas`, `ReviseReplica`, `AggregateStatus` などの operation)。declarative 実装は `pkg/resourceinterpreter/customized/declarative/luavm/lua.go:46` `New` で gopher-lua (`github.com/yuin/gopher-lua v1.1.1`, `go.mod`) の VM をプール生成し、`RunScript` (`lua.go:74`) でユーザ定義の `GetReplicas`/`ReviseReplica` 関数 (`lua.go:129,185`) を呼ぶ。`ResourceInterpreterCustomization` CRD に Lua を載せる方式。ビルトイン解釈は `default/native` と `default/thirdparty/resourcecustomizations` (Flux/Argo/Ray/Kubeflow/Flink などの customizations.yaml を同梱) にある。上流コードに手を入れず Deployment 以外の workload (FlinkDeployment, RayJob, PyTorchJob 等) のレプリカ分割や status 集約を成立させる。これが「アプリ無改造でマルチクラスタ化」を任意 CRD まで広げる肝。

他の効きどころ:

- 実行空間 namespace `karmada-es-<cluster>` に Work を隔離 (`names.go:80`)。
- ensureWork が常にスケジュール結果でレプリカを上書きしテンプレート値を信用しない (`common.go:80-96`) ことで quota/queue 迂回を防ぐ。
- scheduler-estimator と descheduler でメンバーの実残容量に基づく動的再配置。

## 採用事例 (出典あり)

- 起源は Huawei Cloud 主導と First Automobile Works, ICBC, SPD Bank, Qutoutiao, VIPKid, xiaohongshu の共同発起 (2021)。CNCF blog (<https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/>)。
- 公式 adopters ページ (<https://karmada.io/adopters/>, 参照 2026-06-24) の実名: Alibaba Cloud, Bilibili, Bloomberg, DaoCloud, Huawei, iFLYTEK, iQIYI, JDCloud, Kuaishou, Li Auto, Netease, Qihoo 360, RedNote, Scatter Lab, SenseTime, Shopee, Sina, Tongcheng Travel, Trip.com, VIPKID, Vivo, Wellhub, ZTO, WPS, Transwarp, Dewu ほか (計 40+ 組織)。
- リポジトリ `ADOPTERS.md` は実名を持たず `karmada.io/adopters` と issue #4540 へ誘導するだけ。実名は adopters ページが一次情報。
- 2025-03 に正式な Adopter Group プログラム発足 (<https://www.cncf.io/blog/2025/03/26/karmada-launches-adopter-group/>)。

## 採用シグナル (数値)

- GitHub stars 5,503 / forks 1,149 / open issues 746 / watchers 71 (GitHub API, 2026-06-24)。
- contributors: GitHub API ページネーションで 307 アカウント (2026-06-24)。CNCF incubation 時点 (2023-12) で「60+ 組織・20+ 国から 500+ contributors、maintainer 7 名」と公表 (CNCF blog)。注: API の 307 は bot 含むアカウント数、500+ は累積コミッタ数で粒度が違う。
- 直近 stable `v1.18.0` (2026-05-30 公開, GitHub releases)。

## 代替・エコシステム

- 代替: Open Cluster Management (OCM, CNCF, Red Hat ACM の土台。ガバナンス寄り)、Rancher Fleet (GitOps 寄り、ラベルターゲティング)、Clusternet (CNCF Sandbox)、deprecated な KubeFed (Karmada はその後継)。差: Karmada は K8s ネイティブ API テンプレートに加え独立した Propagation/Override Policy とクラスタ横断の動的スケジューリング/レプリカ分割を持つ点が自動化寄りで強い。OCM は placement と policy/governance 寄り。Fleet は Git 駆動配布で progressive rollout は弱い (CNCF blog 2022-09-26)。
- エコシステム/統合: Flux/Argo の customizations を同梱し GitOps と併用可。multi-cluster Service (MCS) でサービスディスカバリ、FederatedHPA/CronFederatedHPA で横断オートスケール、karmada-search で横断クエリ。Flink/Ray/Kubeflow 等の CRD を thirdparty interpreter で対応。
