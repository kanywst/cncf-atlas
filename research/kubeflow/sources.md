# sources: kubeflow

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日はすべて 2026-06-24。path:line 系は pinned commit `5beeae1a86b14be2b141a459d92ea2dd01d0aa17`（`kubeflow/pipelines`）に対して有効。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | kubeflow/pipelines (実装リポ、pinned `5beeae1`) | <https://github.com/kubeflow/pipelines> | 2026-06-24 |
| 2 | repo | kubeflow/kubeflow (アンブレラ gateway、commit `59d0326` で確認) | <https://github.com/kubeflow/kubeflow> | 2026-06-24 |
| 3 | case-study | CNCF project page: Kubeflow (Incubating, joined 2023-07-25) | <https://www.cncf.io/projects/kubeflow/> | 2026-06-24 |
| 4 | blog | Kubeflow blog: applied to become a CNCF incubating project | <https://blog.kubeflow.org/kubeflow-applied-cncf-incubating/> | 2026-06-24 |
| 5 | blog | Kubernetes blog: Announcing Kubeflow 0.1 (2018-05-04) | <https://kubernetes.io/blog/2018/05/04/announcing-kubeflow-0.1/> | 2026-06-24 |
| 6 | blog | Google Cloud: What's new in Kubeflow Pipelines v2 | <https://cloud.google.com/blog/products/ai-machine-learning/whats-new-in-kubeflow-pipelines-v2/> | 2026-06-24 |
| 7 | reference | Wikipedia: Kubeflow (origin / 2017 KubeCon NA 発表) | <https://en.wikipedia.org/wiki/Kubeflow> | 2026-06-24 |
| 8 | repo-file | ADOPTERS.md (Capital One / IBM Research / Red Hat / Sophotech) | <https://github.com/kubeflow/pipelines/blob/master/ADOPTERS.md> | 2026-06-24 |
| 9 | docs | KFP standalone installation guide | <https://www.kubeflow.org/docs/components/pipelines/operator-guides/installation/> | 2026-06-24 |
| 10 | docs | Kubeflow Pipelines overview | <https://www.kubeflow.org/docs/components/pipelines/overview/> | 2026-06-24 |
| 11 | api | GitHub REST API repos/kubeflow/pipelines (stars 4157 / forks 2009 / Apache-2.0 / created 2018-05-12 / latest release 2.16.1 2026-05-05) | <https://api.github.com/repos/kubeflow/pipelines> | 2026-06-24 |

## コード上の主要アンカー (commit `5beeae1`)

| 主題 | path:line |
| --- | --- |
| API server entrypoint (gRPC `:8887` / REST `:8888`) | `backend/src/apiserver/main.go:73`,`:74`,`:340` |
| RunServer.CreateRun (gRPC handler) | `backend/src/apiserver/server/run_server.go:514` |
| ResourceManager.CreateRun (run 生成中核) | `backend/src/apiserver/resource/resource_manager.go:651` |
| 決定論的 UUID で recurring run を冪等化 | `backend/src/apiserver/resource/resource_manager.go:682` |
| Argo Workflow CR 作成 / DB 永続化 | `backend/src/apiserver/resource/resource_manager.go:769`,`:799` |
| ExecutionSpec interface (engine 中立抽象) | `backend/src/common/util/execution_spec.go:77` |
| Template interface / TemplateType (V1/V2) | `backend/src/apiserver/template/template.go:118`,`:40` |
| driver.Container (入力解決→cache→MLMD execution) | `backend/src/v2/driver/container.go:47`,`:173`,`:190`,`:216` |
| driver.Execution struct | `backend/src/v2/driver/driver.go:152` |
| Persistence Agent の status 書き戻し | `backend/src/agent/persistence/worker/workflow_saver.go:72` |
| ScheduledWorkflow controller syncHandler | `backend/src/crd/controller/scheduledworkflow/controller.go:433` |
| IR proto (PipelineSpec ほか) | `api/v2alpha1/pipeline_spec.proto:50` |
