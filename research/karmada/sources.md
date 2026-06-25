# sources: Karmada

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は 2026-06-24。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | karmada-io/karmada (README, code) | <https://github.com/karmada-io/karmada> | 2026-06-24 |
| 2 | repo | ADOPTERS.md (adopters ページへ誘導) | <https://github.com/karmada-io/karmada/blob/master/ADOPTERS.md> | 2026-06-24 |
| 3 | site | Karmada Adopters (実名リスト) | <https://karmada.io/adopters/> | 2026-06-24 |
| 4 | site | Karmada 公式サイト (概要, Push/Pull) | <https://karmada.io/> | 2026-06-24 |
| 5 | blog | Karmada brings Kubernetes multi-cloud capabilities to CNCF Incubator (起源, incubation, 数値) | <https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/> | 2026-06-24 |
| 6 | project | Karmada CNCF プロジェクトページ | <https://www.cncf.io/projects/karmada/> | 2026-06-24 |
| 7 | blog | Karmada and Open Cluster Management: two new approaches (代替比較) | <https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/> | 2026-06-24 |
| 8 | blog | Karmada launches Adopter Group | <https://www.cncf.io/blog/2025/03/26/karmada-launches-adopter-group/> | 2026-06-24 |
| 9 | press | Karmada Finally Brings Multicloud Control to Kubernetes (The New Stack) | <https://thenewstack.io/karmada-finally-brings-multicloud-control-to-kubernetes/> | 2026-06-24 |
| 10 | api | GitHub REST API repos/karmada-io/karmada (stars/forks/contributors/releases) | <https://api.github.com/repos/karmada-io/karmada> | 2026-06-24 |

## path:line アンカー (commit 658499d)

| 主題 | path:line |
| --- | --- |
| controller-manager entrypoint | `cmd/controller-manager/controller-manager.go:30` |
| detector Reconcile / ApplyPolicy / BuildResourceBinding | `pkg/detector/detector.go:231,441,822` |
| scheduler scheduleNext / doScheduleBinding / scheduleResourceBinding | `pkg/scheduler/scheduler.go:359,395,571,590,600,610` |
| generic scheduler Schedule / filter / score | `pkg/scheduler/core/generic_scheduler.go:71,119,154,166,174` |
| SelectClusters / AssignReplicas | `pkg/scheduler/core/common.go:34,51` |
| Score 上下限 | `pkg/scheduler/framework/interface.go:39-42` |
| binding controller ensureWork | `pkg/controllers/binding/binding_controller.go:70,110`, `pkg/controllers/binding/common.go:53,80-96,109,134` |
| execution controller syncToClusters | `pkg/controllers/execution/execution_controller.go:82,151,266,311,324,332` |
| execution space 命名 | `pkg/util/names/names.go:80,92` |
| ResourceBindingSpec / TargetCluster | `pkg/apis/work/v1alpha2/binding_types.go:71,89,100,287` |
| Work / WorkSpec | `pkg/apis/work/v1alpha1/work_types.go:44,57,77,84` |
| PropagationPolicy / Placement | `pkg/apis/policy/v1alpha1/propagation_types.go:52,62,223,471` |
| Resource Interpreter interface | `pkg/resourceinterpreter/interpreter.go:50` |
| Lua VM | `pkg/resourceinterpreter/customized/declarative/luavm/lua.go:46,74,129,185` |
| karmadactl init | `pkg/karmadactl/cmdinit/cmdinit.go:121` |
