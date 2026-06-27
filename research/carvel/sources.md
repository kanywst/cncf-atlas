# sources: Carvel (kapp-controller)

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | carvel-dev/kapp-controller (主実装) | <https://github.com/carvel-dev/kapp-controller> | 2026-06-26 |
| 2 | repo | carvel-dev/carvel (umbrella / community) | <https://github.com/carvel-dev/carvel> | 2026-06-26 |
| 3 | blog | Introduction to Carvel | <https://carvel.dev/blog/introduction-to-carvel-blog-post/> | 2026-06-26 |
| 4 | blog | Carvel Sets Sail for the CNCF Sandbox (VMware OSS) | <https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/> | 2026-06-26 |
| 5 | blog | Project Carvel has joined the CNCF | <https://carvel.dev/blog/carvel-cncf-sandbox/> | 2026-06-26 |
| 6 | case-study | CNCF project page: Carvel (Sandbox, 受理 2022-09-14) | <https://www.cncf.io/projects/carvel/> | 2026-06-26 |
| 7 | docs | kapp-controller (Carvel docs) | <https://carvel.dev/kapp-controller/> | 2026-06-26 |
| 8 | blog | Comparing Kubernetes deployment tools (NETWAYS) | <https://nws.netways.de/blog/2024/07/16/comparing-kubernetes-deployment-tools-what-we-got-today> | 2026-06-26 |
| 9 | repo | kapp-controller releases (v0.60.3 assets) | <https://github.com/carvel-dev/kapp-controller/releases> | 2026-06-26 |

## GitHub シグナル (gh API, 2026-06-26)

| 指標 | kapp-controller | carvel (umbrella) |
| --- | --- | --- |
| stars | 315 | 409 |
| forks | 125 | n/a |
| open issues | 203 | n/a |
| contributors | 約 76 (anon 込み) | n/a |
| created | 2019-11-06 | 2019-04-24 |
| last push | 2026-06-22 | n/a |
| license | Apache-2.0 | n/a |

## コード参照 (pinned commit `be1faefd135d62d901a0ad4b4904b30c6c0dc7c3`, tag v0.60.3)

| 主題 | path:line |
| --- | --- |
| main エントリ | `cmd/controller/main.go:19` |
| Version ldflags 注入コメント | `cmd/controller/main.go:16-17` |
| sidecarexec 分岐 | `cmd/controller/main.go:35-38` |
| sidecarexecMain | `cmd/controller/sidecarexec.go:12` |
| AllowedCmdNames 列挙 | `cmd/controller/sidecarexec.go:20-26` |
| Run セットアップ | `cmd/controller/run.go:61` |
| manager.New | `cmd/controller/run.go:82` |
| apiserver 起動 | `cmd/controller/run.go:47-58` |
| app reconciler 登録 | `cmd/controller/run.go:118-141` (NewReconciler `:129`) |
| config 同期初回 reconcile | `cmd/controller/run.go:93-98` |
| sidecar cmdRunner 取得 | `cmd/controller/run.go:64-69` |
| Reconciler.Reconcile | `pkg/app/reconciler.go:74` (委譲 `:100`) |
| App.Reconcile | `pkg/app/app_reconcile.go:19` |
| reconcileFetchTemplateDeploy | `pkg/app/app_reconcile.go:105` (fetch `:128` / template `:154` / deploy `:177`) |
| App.fetch / vendir.Run | `pkg/app/app_fetch.go:22` / `:48` |
| App.template / 分岐 | `pkg/app/app_template.go:15` / `:35-44` |
| App.deploy / kapp.Deploy 呼び出し | `pkg/app/app_deploy.go:15` / `:38` |
| Kapp.Deploy / exec | `pkg/deploy/kapp.go:53` / `:73` / `:79` |
| allowlist 強制 | `pkg/sidecarexec/cmd_exec.go:40-41` |
| sidecar server set 化 | `pkg/sidecarexec/server.go:35-39` |
| 集約 API server (kube-aggregator) | `pkg/apiserver/apiserver.go:43-44`, `:149` |
| App / AppSpec 型 | `pkg/apis/kappctrl/v1alpha1/types.go:24` / `:48` |
| PackageInstall / Spec | `pkg/apis/packaging/v1alpha1/package_install.go:24` / `:47` (PackageRef `:85`) |
| PackageRepository / Spec | `pkg/apis/packaging/v1alpha1/package_repository.go:20` / `:41` |
| Package / PackageMetadata | `pkg/apiserver/apis/datapackaging/types.go:30` / `:16` |
