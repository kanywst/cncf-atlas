# recon: Karmada

調査メモ。出典は URL 添付。path:line は pin した commit のもの。

## 基本情報

- repo: `karmada-io/karmada` (<https://github.com/karmada-io/karmada>)
- pinned commit: `aad59e116bec4196dfbd366932324e98ee11dd76` (2026-11-13, master, `git ls-remote` で HEAD 一致を確認 2026-11-16)。旧 pin `658499d7080640f78c3d9f5cbf9db58428a902a3` (2026-06-22) から 270 コミット
- 近いタグ: `git describe` = `v1.20.0-beta.0-28-gaad59e116`。最新 stable は `v1.19.1` (2026-10-31)、同日に `v1.18.4` / `v1.17.7` / `v1.20.0-beta.0` (<https://github.com/karmada-io/karmada/releases>)
- 言語 / ビルド: Go (go 1.26.10, `go.mod:3`, module `github.com/karmada-io/karmada`) / `make` (Makefile の `all`/`karmadactl` ターゲットが `cmd/*` をクロスビルド)
- ライセンス: Apache-2.0。検証済み: `LICENSE` 冒頭が Apache License Version 2.0、GitHub API `licenseInfo.key=apache-2.0`
- CNCF 成熟度: Graduated。TOC 投票 2026-09-03 close (<https://github.com/cncf/toc/issues/1572>)、level change 2026-09-04 close (<https://github.com/cncf/toc/issues/2289>)、CNCF 発表 2026-09-08 上海 KubeCon China (<https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/>)。Incubating は 2023-12-12、Sandbox は 2021-09-14
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
5. メンバークラスタへ適用: `pkg/controllers/execution/execution_controller.go:97` `Controller.Reconcile` が先に `helper.RegisterInformerHandlerAndCheckSynced` (`:151`) でメンバー側 informer を登録 (未 sync でも dynamic client で続行)、`syncWork` (`:189`)、`syncToClusters` (`:304`)。Work.Spec.Workload.Manifests を 1 つずつ unstructured に Unmarshal し、`tryCreateOrUpdateWorkload` (`:349`) で `ObjectWatcher.Create`/`Update` (`:362`,`:370`) を呼んでメンバー API に適用。成功で Work に Applied condition を立てる (`:340`)。
6. ドリフト: execution controller の `onAdd`/`onUpdate`/`onDelete` (`:485,520,593`) が managed-by ラベルと Work 参照 annotation からオーナー Work を引き、`enqueueWork` で再キュー。自分の書き込み (resourceVersion が version record と一致) と、`prune.RemoveIrrelevantFields` (`pkg/resourceinterpreter/default/native/prune/prune.go:66,81` で managedFields / status を除去) 後に差分なしの update は無視。PR #7552 (2026-08-19 merge, <https://github.com/karmada-io/karmada/pull/7552>) で work status controller から updateResource / handleDeleteEvent / recreateResourceIfNeeded を削除し、メンバー書き込みを execution controller に一本化。

逆向きに status コントローラ群 (`pkg/controllers/status`) がメンバーの実状態を Work から RB、テンプレートへ集約する。#7552 以降は報告専用。

## 中核データ構造

- `workv1alpha2.ResourceBindingSpec` (`pkg/apis/work/v1alpha2/binding_types.go:71`): スケジューリングの作業台。`Resource ObjectReference`, `Replicas`, `ReplicaRequirements`, `Placement`、スケジュール結果の `Clusters []TargetCluster` (`:102`)。新しめの `Components []Component` (`:98`) はマルチ pod テンプレート (分散学習等) 向けで `MultiplePodTemplatesScheduling` feature gate で有効化、旧 Replicas/ReplicaRequirements を置換する設計。
- `workv1alpha2.TargetCluster` (`binding_types.go:287`): 1 クラスタと割当レプリカ数。スケジュール結果の単位。PR #7833 (2026-08-20 merge, <https://github.com/karmada-io/karmada/pull/7833>) で `Components []TargetComponent` (`:299`, 型 `:303`) 追加。`core/common.go:72-81`: gate 有効 かつ components > 1 のとき全候補クラスタに各 component の replicas をそのまま記録 (分割はしない)。gate は Alpha / default off (`pkg/features/features.go:192`)。
- `workv1alpha1.Work` / `WorkSpec` (`pkg/apis/work/v1alpha1/work_types.go:44,57`): メンバークラスタへ実際に届ける封筒。`WorkloadTemplate` (`:77`) の `Manifests []Manifest` (`:80`)、`type Manifest` (`:84`) は `runtime.RawExtension` で任意 K8s リソースを内包。`SuspendDispatching` で配布停止、`PreserveResourcesOnDeletion` で Work 削除時にメンバー側リソースを残すか制御。
- `policyv1alpha1.PropagationPolicy` / `PropagationSpec` (`pkg/apis/policy/v1alpha1/propagation_types.go:52,62`): `ResourceSelectors []ResourceSelector` (field `:69`, type `:223`) で対象を選び `Placement` (field `:90`, type `:445`) で配置ルール。旧 pin から deprecated の PurgeMode `Immediately`/`Graciously` が削除され `Directly`/`Gracefully`/`Never` のみ。ClusterPropagationPolicy はクラスタスコープ版。
- メンバークラスタ登録は `clusterv1alpha1.Cluster` (`pkg/apis/cluster`)。Filter/Score はこの Cluster を評価対象にする (`generic_scheduler.go:134` で snapshot から取得)。

## 非自明な設計判断: Lua による Resource Interpreter Framework

任意の CRD を Karmada に教えるため、Go を再コンパイルせず Lua スクリプトで解釈ロジックを差し込める。`pkg/resourceinterpreter/interpreter.go:43` がインタフェース (`GetReplicas`, `ReviseReplica`, `AggregateStatus` などの operation)。declarative 実装は `pkg/resourceinterpreter/customized/declarative/luavm/lua.go:46` `New` で gopher-lua (`github.com/yuin/gopher-lua v1.1.1`, `go.mod`) の VM をプール生成し、`RunScript` (`lua.go:74`) でユーザ定義の `GetReplicas`/`ReviseReplica` 関数 (`lua.go:129,185`) を呼ぶ。`ResourceInterpreterCustomization` CRD に Lua を載せる方式。ビルトイン解釈は `default/native` と `default/thirdparty/resourcecustomizations` (Flux/Argo/Ray/Kubeflow/Flink/Volcano/Spark Operator/Kruise/Kyverno の customizations.yaml を同梱、`ls pkg/resourceinterpreter/default/thirdparty/resourcecustomizations`) にある。上流コードに手を入れず Deployment 以外の workload (FlinkDeployment, RayJob, PyTorchJob 等) のレプリカ分割や status 集約を成立させる。これが「アプリ無改造でマルチクラスタ化」を任意 CRD まで広げる肝。

他の効きどころ:

- 実行空間 namespace `karmada-es-<cluster>` に Work を隔離 (`names.go:80`)。
- ensureWork が常にスケジュール結果でレプリカを上書きしテンプレート値を信用しない (`common.go:80-96`) ことで quota/queue 迂回を防ぐ。
- scheduler-estimator と descheduler でメンバーの実残容量に基づく動的再配置。

## 採用事例 (出典あり)

- 起源は Huawei Cloud 主導と First Automobile Works, ICBC, SPD Bank, Qutoutiao, VIPKid, xiaohongshu の共同発起 (2021)。CNCF blog (<https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/>)。
- 公式 adopters ページ (<https://karmada.io/adopters/>, 参照 2026-11-16) は 48 組織: Alibaba Cloud, Alibaba's Qwen App, Bilibili, Bloomberg, BOE, Brain-inspired, CECloud, Cibfintech.com, DaoCloud.io, Dewu, Ecloud, EHang, GMI Cloud, GongJiKeJi, HelloGroup, Huawei, Hurricane Engines, iFLYTEK, iQIYI, ISCAS, JDCloud, Jiajiayue Group, Kuaishou, Li Auto, Longbridge, Mafengwo, Neen S.p.A, Netease, Qihoo 360, RedNote, Scatter Lab, SenseTime, Shopee, Sina, Songke Intelligence, Tongcheng Travel, Transwarp, Trip.com, Unicom Digital Tech, Unionbigdata, VIPKID, Vivo, Wellhub, WPS, Xiaomi, Youzan, Zhejiang Lab, ZTO。
- Graduation アナウンス (<https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/>): Alibaba Cloud, Bilibili, Huawei, iFLYTEK, JDCloud, Kuaishou, RedNote, SenseTime, Trip.com, Vivo, WPS, ZTO を名指し、global adopters として Bloomberg, Wellhub。maintainer Michas Szacillo は Bloomberg Streaming Platform の Engineering Team Lead。
- リポジトリ `ADOPTERS.md` (旧 pin から変更なし) は実名を持たず `karmada.io/adopters` と issue #4540 へ誘導するだけ。実名は adopters ページが一次情報。
- 2025-03 に正式な Adopter Group プログラム発足 (<https://www.cncf.io/blog/2025/03/26/karmada-launches-adopter-group/>)。

## 採用シグナル (数値)

- GitHub stars 5,765 / forks 1,252 / open issues+PR 917 / watchers 72 (<https://api.github.com/repos/karmada-io/karmada>, 2026-11-16)。旧: 5,503 / 1,149 / 746 / 71 (2026-06-24)。
- contributors: GitHub API `contributors?per_page=1` の last page で 325 アカウント (bot 含む、anon 込みは 396) (2026-11-16)。旧 307。Graduation アナウンス: 1,214+ contributors / 292 組織 / maintainer 6 組織。incubation 時点 (2023-12): 60+ 組織・20+ 国から 500+、maintainer 7 名 (CNCF blog)。粒度が違うので比較不可。
- リリース: `v1.18.0` 2026-05-30、`v1.19.0` 2026-08-31、`v1.19.1` / `v1.18.4` / `v1.17.7` 2026-10-31、`v1.20.0-alpha.1` 2026-09-24、`v1.20.0-beta.0` 2026-10-31 (<https://github.com/karmada-io/karmada/releases>)。
- feature gate (`pkg/features/features.go:186,187,192`): PriorityBasedScheduling Beta/default on (旧 pin は Alpha/off)、PriorityBasedPreemptiveScheduling Alpha/off、MultiplePodTemplatesScheduling Alpha/off。detector は gate 有効時 PriorityClass の PreemptionPolicy を SchedulePriority に写す (`pkg/detector/detector.go:879-882`)。

## 代替・エコシステム

- 代替: Open Cluster Management (OCM, CNCF, Red Hat ACM の土台。ガバナンス寄り)、Rancher Fleet (GitOps 寄り、ラベルターゲティング)、Clusternet (CNCF Sandbox)、deprecated な KubeFed (Karmada はその後継)。差: Karmada は K8s ネイティブ API テンプレートに加え独立した Propagation/Override Policy とクラスタ横断の動的スケジューリング/レプリカ分割を持つ点が自動化寄りで強い。OCM は placement と policy/governance 寄り。Fleet は Git 駆動配布で progressive rollout は弱い (CNCF blog 2022-09-26)。
- エコシステム/統合: Flux/Argo の customizations を同梱し GitOps と併用可。multi-cluster Service (MCS) でサービスディスカバリ、FederatedHPA/CronFederatedHPA で横断オートスケール、karmada-search で横断クエリ。Flink/Ray/Kubeflow 等の CRD を thirdparty interpreter で対応。
