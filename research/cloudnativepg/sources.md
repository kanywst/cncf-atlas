# sources: CloudNativePG

各出典に番号を振り、ドキュメント側の引用と対応させる。初回参照日は 2026-06-26 (Web)、re-pin で再確認・追加したものは 2026-11-16。コードアンカーは pinned commit `719385f7fd67f8494daccf4b1d0aebfb43528850` (2026-11-13)。前回 pin は `7ef33bb2083ced9f9d5a2fc0df2185de21075532`。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | cloudnative-pg/cloudnative-pg (README, ソース) | <https://github.com/cloudnative-pg/cloudnative-pg> | 2026-11-16 |
| 2 | repo | ADOPTERS.md (本番採用組織リスト) | <https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md> | 2026-11-16 |
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
| 13 | repo | リリース v1.30.1 (最新安定版、2026-09-23。同日に v1.29.3) | <https://github.com/cloudnative-pg/cloudnative-pg/releases/tag/v1.30.1> | 2026-11-16 |
| 14 | repo | リリース一覧 (v1.30.0 2026-06-29、v1.30.1 / v1.29.3 2026-09-23) | <https://github.com/cloudnative-pg/cloudnative-pg/releases> | 2026-11-16 |
| 15 | repo | v1.30 リリースノート (DatabaseRole、primary Lease、in-tree Barman Cloud 1.31.0 削除予定) | <https://github.com/cloudnative-pg/cloudnative-pg/blob/main/docs/src/release_notes/v1.30.md> | 2026-11-16 |
| 16 | issue | cncf/toc#1961 Incubation 申請 (gitvote、2026-11-02 close) | <https://github.com/cncf/toc/issues/1961> | 2026-11-16 |
| 17 | issue | cncf/toc#2355 Level change: Incubation (2026-11-03 close) | <https://github.com/cncf/toc/issues/2355> | 2026-11-16 |
| 18 | PR | #11336 pending failover の停滞・巻き戻り修正 (v1.30.1 / v1.29.3 にバックポート) | <https://github.com/cloudnative-pg/cloudnative-pg/pull/11336> | 2026-11-16 |
| 19 | PR | #11370 `--status-port-tls` と HTTP フォールバック削除 (main のみ) | <https://github.com/cloudnative-pg/cloudnative-pg/pull/11370> | 2026-11-16 |
| 20 | manifest | v1.30.1 operator manifest (HTTP 200 確認) | <https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.30/releases/cnpg-1.30.1.yaml> | 2026-11-16 |

## コードアンカー (commit 719385f)

- エントリポイント: `cmd/manager/main.go:45` (`main`)、サブコマンド登録 `cmd/manager/main.go:66`-`75` (`newRootCmd` 内)。
- operator reconcile: `internal/controller/cluster_controller.go:95` (`ClusterReconciler` 型)、`:169` (`Reconcile`)、`:213` (admission)、`:227` / `:232` (プラグイン)、`:266` (inner 呼び出し)、`:309` (inner `reconcile`)、`:332` / `:344` / `:371` (defaults / image / objects)、`:408`-`430` (failover 進行中ブロック、`:427`-`428` が条件付き 1 秒 requeue)、`:447` (mTLS)、`:457` (`GetStatusFromInstances` 呼び出し)、`:478`-`487` (split-brain 検知と 5 秒 requeue)、`:590` (`handleSwitchover`)、`:599` (`reconcileResources`)、`:606` (`finalizeReconciliation`)。
- failover 段取り: `internal/controller/replicas.go:148` (`pending` 設定)、`:172` (WAL receiver 待ち)、`:179`-`185` (quorum 再確認)、`:191` (failover 実行)。`api/v1/cluster_types.go:108` (`PendingFailoverMarker`)。
- Pod 内エージェント: `internal/cmd/manager/instance/run/cmd.go:161`-`168` (deprecated `--status-port-tls`)、`:264` (プラグイン登録)、`:272` (lease runnable)、`:287`-`290` (`For(&apiv1.Cluster{})`)、`:417` / `:428` (remote/local webserver)。`internal/cmd/manager/instance/run/lease/doc.go:20`-`22`。
- HTTP クライアント: `pkg/management/postgres/webserver/client/remote/instance.go:184` (`GetStatusFromInstances`)、`:195` (`extractInstancesStatus`)、`:318` (status URL 組み立て、https 固定)。
- URL 定義: `pkg/management/url/url.go:55` (`/pg/status`)、`:79` (port 8000)。
- 型定義: `api/v1/cluster_types.go:217` (`ClusterSpec`)、`:264` / `:272` / `:280` / `:284` / `:298` / `:302` / `:306` (spec フィールド)、`:913` (`ClusterStatus`)、`:968` / `:973` (`CurrentPrimary` / `TargetPrimary`)、`:1666` (`PostgresConfiguration`)、`:1792` (`BootstrapConfiguration`)、`:2891` (`Cluster`)、`:2920` (`SecretsResourceVersion`)。`api/v1/failoverquorum_types.go:49` (`FailoverQuorum`)。
- ビルド: `Makefile:183` (`build`)、`:187` (manager)、`:191` (plugin)。`go.mod:3` (go 1.26.6)、`go.mod:50` (controller-runtime v0.25.2)。
- ライセンス: `LICENSE` (Apache-2.0)、`cmd/manager/main.go:17` (SPDX)。
- インストール手順: `docs/src/installation_upgrade.md:17`-`23`、`:39`-`43`、`docs/src/quickstart.md:94`-`120`、`:135`。
