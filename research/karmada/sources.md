# sources: Karmada

各出典に番号を振り、ドキュメント側の引用と対応させる。初回アクセス 2026-06-24、re-pin (2026-11-16) で 1-3, 10 を再取得し 11-15 を追加。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | karmada-io/karmada (README, code) | <https://github.com/karmada-io/karmada> | 2026-11-16 |
| 2 | repo | ADOPTERS.md (adopters ページへ誘導) | <https://github.com/karmada-io/karmada/blob/master/ADOPTERS.md> | 2026-11-16 |
| 3 | site | Karmada Adopters (実名リスト, 48 組織) | <https://karmada.io/adopters/> | 2026-11-16 |
| 4 | site | Karmada 公式サイト (概要, Push/Pull) | <https://karmada.io/> | 2026-06-24 |
| 5 | blog | Karmada brings Kubernetes multi-cloud capabilities to CNCF Incubator (起源, incubation, 数値) | <https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/> | 2026-06-24 |
| 6 | project | Karmada CNCF プロジェクトページ | <https://www.cncf.io/projects/karmada/> | 2026-06-24 |
| 7 | blog | Karmada and Open Cluster Management: two new approaches (代替比較) | <https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/> | 2026-06-24 |
| 8 | blog | Karmada launches Adopter Group | <https://www.cncf.io/blog/2025/03/26/karmada-launches-adopter-group/> | 2026-06-24 |
| 9 | press | Karmada Finally Brings Multicloud Control to Kubernetes (The New Stack) | <https://thenewstack.io/karmada-finally-brings-multicloud-control-to-kubernetes/> | 2026-06-24 |
| 10 | api | GitHub REST API repos/karmada-io/karmada (stars/forks/contributors/releases) | <https://api.github.com/repos/karmada-io/karmada> | 2026-11-16 |
| 11 | announcement | Cloud Native Computing Foundation Announces Karmada Graduation (2026-09-08, 数値・要件・採用企業) | <https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/> | 2026-11-16 |
| 12 | issue | cncf/toc#1572 Karmada Graduation Application (2026-09-03 close) | <https://github.com/cncf/toc/issues/1572> | 2026-11-16 |
| 13 | issue | cncf/toc#2289 Karmada move from Incubation to Graduation (2026-09-04 close) | <https://github.com/cncf/toc/issues/2289> | 2026-11-16 |
| 14 | releases | karmada-io/karmada releases (v1.19.0 / v1.19.1 / v1.20.0-beta.0 の日付) | <https://github.com/karmada-io/karmada/releases> | 2026-11-16 |
| 15 | pr | karmada-io/karmada#7552 メンバー書き込みを execution controller に一本化 (2026-08-19 merge) | <https://github.com/karmada-io/karmada/pull/7552> | 2026-11-16 |
| 16 | pr | karmada-io/karmada#7833 component スケジュール結果を TargetCluster に記録 (2026-08-20 merge) | <https://github.com/karmada-io/karmada/pull/7833> | 2026-11-16 |

## path:line アンカー (commit aad59e1, 旧 pin 658499d から再検証済み 2026-11-16)

| 主題 | path:line |
| --- | --- |
| controller-manager entrypoint | `cmd/controller-manager/controller-manager.go:30` |
| detector Reconcile / ApplyPolicy / BuildResourceBinding | `pkg/detector/detector.go:231,441,822` |
| scheduler scheduleNext / doScheduleBinding / scheduleResourceBinding | `pkg/scheduler/scheduler.go:359,395,571,590,600,610` |
| generic scheduler Schedule / filter / score | `pkg/scheduler/core/generic_scheduler.go:71,119,154,166,174` |
| SelectClusters / AssignReplicas | `pkg/scheduler/core/common.go:34,51` |
| Score 上下限 | `pkg/scheduler/framework/interface.go:39-42` |
| binding controller ensureWork | `pkg/controllers/binding/binding_controller.go:70,110`, `pkg/controllers/binding/common.go:53,80-96,109,134` |
| execution controller Reconcile / informer 登録 / syncWork / syncToClusters / Applied / tryCreateOrUpdate / Create / Update / onAdd / onUpdate / onDelete | `pkg/controllers/execution/execution_controller.go:97,151,189,304,340,349,362,370,485,520,593` |
| execution space 命名 | `pkg/util/names/names.go:80,92` |
| ResourceBindingSpec / Components / Clusters / TargetCluster / TargetCluster.Components / TargetComponent | `pkg/apis/work/v1alpha2/binding_types.go:71,98,102,287,299,303` |
| Work / WorkSpec / WorkloadTemplate / Manifests / Manifest | `pkg/apis/work/v1alpha1/work_types.go:44,57,77,80,84` |
| PropagationPolicy / PropagationSpec / ResourceSelectors / Placement field / ResourceSelector type / Placement type | `pkg/apis/policy/v1alpha1/propagation_types.go:52,62,69,90,223,445` |
| Resource Interpreter interface | `pkg/resourceinterpreter/interpreter.go:43` |
| Lua VM | `pkg/resourceinterpreter/customized/declarative/luavm/lua.go:46,74,129,185` |
| karmadactl init | `pkg/karmadactl/cmdinit/cmdinit.go:121` |
| AssignReplicas の component 記録 | `pkg/scheduler/core/common.go:72-81` |
| feature gate 既定値 | `pkg/features/features.go:186,187,192` |
| prune (managedFields / status 除去) | `pkg/resourceinterpreter/default/native/prune/prune.go:66,81` |
