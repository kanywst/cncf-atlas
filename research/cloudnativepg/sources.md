# sources: CloudNativePG

各出典に番号を振り、ドキュメント側の引用と対応させる。参照日は 2026-06-26 (Web)。コードアンカーは pinned commit `7ef33bb2083ced9f9d5a2fc0df2185de21075532`。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | cloudnative-pg/cloudnative-pg (README, ソース) | <https://github.com/cloudnative-pg/cloudnative-pg> | 2026-06-26 |
| 2 | repo | ADOPTERS.md (本番採用組織リスト) | <https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md> | 2026-06-26 |
| 3 | repo | governance/GOVERNANCE.md | <https://github.com/cloudnative-pg/governance/blob/main/GOVERNANCE.md> | 2026-06-26 |
| 4 | repo | cncf/sandbox issue #128 (Sandbox 申請、gitvote passed) | <https://github.com/cncf/sandbox/issues/128> | 2026-06-26 |
| 5 | blog | Introducing CloudNativePG (EDB, OSS 化発表) | <https://www.enterprisedb.com/blog/introducing-cloudnativepg-new-open-source-kubernetes-operator-postgres> | 2026-06-26 |
| 6 | blog | CloudNativePG Officially Joins the CNCF Sandbox (EDB) | <https://www.enterprisedb.com/blog/cloudnativepg-officially-joins-cncf-sandbox-milestone-cloud-native-postgresql> | 2026-06-26 |
| 7 | blog | They grow up so fast: donating your OSS project (DEV, IP 寄贈の経緯) | <https://dev.to/floord/they-grow-up-so-fast-donating-your-open-source-project-to-a-foundation-or-the-cloudnativepg-1999> | 2026-06-26 |
| 8 | news | PostgreSQL Operator CloudNativePG Hits the CNCF Sandbox (The New Stack) | <https://thenewstack.io/postgresql-operator-cloudnativepg-hits-the-cncf-sandbox/> | 2026-06-26 |
| 9 | blog | Cloud Neutral Postgres Databases with Kubernetes and CloudNativePG (CNCF) | <https://www.cncf.io/blog/2024/11/20/cloud-neutral-postgres-databases-with-kubernetes-and-cloudnativepg/> | 2026-06-26 |
| 10 | blog | CloudNativePG and Crunchy PGO: an honest comparison (G. Bartolini) | <https://www.gabrielebartolini.it/articles/2026/05/cloudnativepg-and-crunchy-pgo-an-honest-opinionated-comparison/> | 2026-06-26 |
| 11 | blog | KubeCon NA Atlanta 2025 recap and path to CNCF Incubation (G. Bartolini) | <https://www.gabrielebartolini.it/articles/2025/11/kubecon-na-atlanta-2025-a-recap-and-cloudnativepgs-path-to-cncf-incubation/> | 2026-06-26 |
| 12 | docs | CloudNativePG ドキュメント (公式サイト) | <https://cloudnative-pg.io/documentation/> | 2026-06-26 |
| 13 | repo | リリース v1.29.1 (最新安定版) | <https://github.com/cloudnative-pg/cloudnative-pg/releases/tag/v1.29.1> | 2026-06-26 |

## コードアンカー (commit 7ef33bb)

- エントリポイント: `cmd/manager/main.go:45` (`main`)、サブコマンド登録 `cmd/manager/main.go:60`-`68`。
- operator reconcile: `internal/controller/cluster_controller.go:95` (`ClusterReconciler` 型)、`:169` (`Reconcile`)、`:310` (inner `reconcile`)、`:456` (`GetStatusFromInstances` 呼び出し)、`:477` (split-brain 検知)、`:589` (`handleSwitchover`)、`:605` (`finalizeReconciliation`)。
- Pod 内エージェント: `internal/cmd/manager/instance/run/cmd.go:259` (プラグイン登録)、`:277`-`280` (`For(&apiv1.Cluster{})`)、`:397` / `:407` (remote/local webserver)。
- HTTP クライアント: `pkg/management/postgres/webserver/client/remote/instance.go:183` (`GetStatusFromInstances`)、`:320` (status URL 組み立て)。
- URL 定義: `pkg/management/url/url.go:55` (`/pg/status`)、`:79` (port 8000)。
- 型定義: `api/v1/cluster_types.go:217` (`ClusterSpec`)、`:900` (`ClusterStatus`)、`:1590` (`PostgresConfiguration`)、`:1716` (`BootstrapConfiguration`)、`:2770` (`Cluster`)、`:2799` (`SecretsResourceVersion`)。`api/v1/failoverquorum_types.go:49` (`FailoverQuorum`)。
- ビルド: `Makefile:174` (`build`)、`:177` (manager)、`:180` (plugin)。`go.mod:3` (Go 1.26.4)、`go.mod:47` (controller-runtime v0.24.1)。
- ライセンス: `LICENSE` (Apache-2.0)、`cmd/manager/main.go:17` (SPDX)。
- インストール手順: `docs/src/installation_upgrade.md:17`-`22`、`:41`、`docs/src/quickstart.md:94`-`115`、`:130`。
