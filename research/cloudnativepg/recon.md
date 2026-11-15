# recon: CloudNativePG

調査メモ。PostgreSQL を Kubernetes 上で運用する CNCF Incubating の operator。出典 URL と `file:line` を必ず添える。アンカーは `research/cloudnativepg/src` 配下の実ファイルで確認済み。

## 基本情報

- repo: `cloudnative-pg/cloudnative-pg`
- pinned commit: `719385f7fd67f8494daccf4b1d0aebfb43528850` (2026-11-13, default branch `main`)。`git ls-remote https://github.com/cloudnative-pg/cloudnative-pg HEAD` で一致確認 (2026-11-16)。
- 前回 pin: `7ef33bb2083ced9f9d5a2fc0df2185de21075532` (2026-06-26)。差分は 382 commits。
- 最新リリース: `v1.30.1` と `v1.29.3` (どちらも 2026-09-23)。`v1.30.0` は 2026-06-29。出典 <https://github.com/cloudnative-pg/cloudnative-pg/releases>。`main` の `releases/` 最新 manifest は `cnpg-1.30.1.yaml`、1.31 の RC はまだ無い (`pkg/versions/versions.go:26` が `1.30.1`)。
- 言語 / ビルド: `go.mod:3` で go 1.26.6 (toolchain go1.27.4) / `make build` (`go build -o bin/manager ./cmd/manager` と `go build -o bin/kubectl-cnpg ./cmd/kubectl-cnpg`)。`Makefile:183` の `build` ターゲット、`Makefile:187` / `Makefile:191`。
- ライセンス: Apache License 2.0。`LICENSE` ヘッダおよび各 Go ファイル冒頭の `SPDX-License-Identifier: Apache-2.0` (例 `cmd/manager/main.go:17`) で確認。
- CNCF 成熟度: Incubating。Sandbox 承認は 2025 年 1 月。Incubation 申請 cncf/toc#1961 は gitvote で 2026-11-02 に close (`vote/closed`)、level change issue cncf/toc#2355 は 2026-11-03 close。出典 <https://github.com/cncf/toc/issues/1961>、<https://github.com/cncf/toc/issues/2355>。
- カテゴリ (tools.ts の CATEGORY_ORDER から): Storage & Database
- コード規模: Go ファイル 1,032 個 (前回 967)。controller-runtime `v0.25.2` ベースの Kubernetes operator (`go.mod:50`)。

CRD (CustomResourceDefinition) は API group `postgresql.cnpg.io/v1`。主要 CRD は `Cluster` のほか `Backup` / `ScheduledBackup` / `Pooler` / `Database` / `DatabaseRole` / `Publication` / `Subscription` / `ImageCatalog` / `ClusterImageCatalog` / `FailoverQuorum`。型定義は `api/v1/` に並ぶ (`config/crd/bases/` に 11 個)。`DatabaseRole` は v1.30.0 で追加 (v1.29.1 の `config/crd/kustomization.yaml` には無い)。出典 `docs/src/release_notes/v1.30.md:276` <https://github.com/cloudnative-pg/cloudnative-pg/blob/main/docs/src/release_notes/v1.30.md>。

エントリポイントは 2 つ。

- operator 本体: `cmd/manager/main.go:45` の `func main()`。pin 間でルート組み立てが `newRootCmd` に切り出された。cobra ルートに `backup` / `bootstrap` / `controller` / `instance` / `show` / `walarchive` / `walrestore` / `versions` / `pgbouncer` / `debug` をぶら下げる (`cmd/manager/main.go:66`-`75`)。`controller` 以外のサブコマンドはログの sampling を無効化する (`loggingOptions`)。同一バイナリが operator (controller) としても Pod 内エージェント (instance manager) としても動く。
- kubectl プラグイン: `cmd/kubectl-cnpg` (`make build-plugin` で `bin/kubectl-cnpg` を生成、`Makefile:191`)。

## 歴史の素材

- 起源は 2ndQuadrant (後に EDB が買収) の PostgreSQL/Kubernetes 専門家。GOVERNANCE に「originally conceived by PostgreSQL experts and Kubernetes administrators within 2ndQuadrant」と明記。出典: GOVERNANCE.md / EDB 紹介記事。
- 2022-04-21 に EDB がプロプライエタリ製品 "Cloud Native Postgres" を `CloudNativePG` に改名して OSS 化、1400 超のコミット履歴付きで公開し v1.15.0 をリリース。出典: EDB ブログ <https://www.enterprisedb.com/blog/introducing-cloudnativepg-new-open-source-kubernetes-operator-postgres>。
- 2022-05 に EDB が IP をベンダー中立な CloudNativePG コミュニティへ寄贈。Apache-2.0 + コミュニティ governance へ移行。出典: 同 EDB ブログ、DEV 記事 <https://dev.to/floord/they-grow-up-so-fast-donating-your-open-source-project-to-a-foundation-or-the-cloudnativepg-1999>。
- CNCF Sandbox 申請は `cncf/sandbox` issue #128 (2024-09-24 起票、"2025 January Review" マイルストーン)。gitvote ラベル `gitvote/passed` / `gitvote/closed` で可決。実質承認は 2025 年 1 月。出典: <https://github.com/cncf/sandbox/issues/128>、EDB ブログ <https://www.enterprisedb.com/blog/cloudnativepg-officially-joins-cncf-sandbox-milestone-cloud-native-postgresql>、The New Stack <https://thenewstack.io/postgresql-operator-cloudnativepg-hits-the-cncf-sandbox/>。
- Incubation を目標と公言。出典: Gabriele Bartolini (CloudNativePG 創設者の 1 人) のブログ <https://www.gabrielebartolini.it/articles/2025/11/kubecon-na-atlanta-2025-a-recap-and-cloudnativepgs-path-to-cncf-incubation/>。
- 2026-11-02 に Incubation 申請 cncf/toc#1961 の TOC 投票が締切、Incubating へ。出典 <https://github.com/cncf/toc/issues/1961>、<https://github.com/cncf/toc/issues/2355>。
- v1.30.0 (2026-06-29): `DatabaseRole` CRD、primary `Lease` (昇格の mutex、`.spec.primaryLease`)、Pooler の image catalog 参照など。in-tree Barman Cloud サポートは 1.31.0 で削除予定と告知。出典 `docs/src/release_notes/v1.30.md:247`-`300` <https://github.com/cloudnative-pg/cloudnative-pg/blob/main/docs/src/release_notes/v1.30.md>。
- v1.30.1 / v1.29.3 (2026-09-23): failover 停滞の修正 (#11336) などをバックポート。出典 <https://github.com/cloudnative-pg/cloudnative-pg/releases/tag/v1.30.1>、<https://github.com/cloudnative-pg/cloudnative-pg/pull/11336>。

## アーキテクチャの素材

中核は「2 階層の reconcile」。operator (controller-runtime マネージャ) が `Cluster` CRD を watch し、各 PostgreSQL Pod の中で動く instance manager が同じ `Cluster` CRD を watch する。外部 DCS (etcd/Consul/ZooKeeper) や Patroni/repmgr/Stolon に依存せず、Kubernetes API 自体を真実の源とする。これが他 operator との最大の差別点。出典: README / 公式ドキュメント。

トップレベルのコンポーネント。

- `cmd/manager` / `internal/cmd/manager`: 単一バイナリのサブコマンド群 (`backup`, `bootstrap`, `controller`, `instance`, `show`, `walarchive`, `walrestore`, `versions`, `pgbouncer`, `debug`)。`cmd/manager/main.go:66`-`75`。
- `internal/controller`: operator 側の reconciler 群。`Cluster` / `Backup` / `ScheduledBackup` / `Pooler` / `Database` / `DatabaseRole` / `Plugin` ごとに 1 controller。
- `internal/management/controller`: instance manager 側 (Pod 内) の reconciler。`database_controller.go` などが PostgreSQL 内オブジェクトを SQL で調停する。
- `pkg/management/postgres`: PostgreSQL プロセス管理、webserver (local/remote)、ステータス抽出。
- `pkg/management/url`: instance manager の HTTP エンドポイント定義。`/pg/status` (`pkg/management/url/url.go:55`)、ポート 8000 (`pkg/management/url/url.go:79`)。
- status ポートは常に TLS。pin 間に #11370 (2026-09-07 merge、`6595c4a86`) が `--status-port-tls` フラグと `GetStatusSchemeFromPod` による HTTP フォールバックを削除。v1.24 からデフォルト TLS だったため。古い Pod の argv 用にフラグは deprecated として残る (`internal/cmd/manager/instance/run/cmd.go:161`-`168`、1.30 サポート終了後に削除予定)。main のみで、release-1.30 には入っていない (`git tag --contains 6595c4a86` が空)。出典 <https://github.com/cloudnative-pg/cloudnative-pg/pull/11370>。
- primary Lease: `internal/cmd/manager/instance/run/lease/`。Lease (coordination.k8s.io/v1) をクラスタ名で作り、保持者だけが primary として動ける (`lease/doc.go:20`-`22`)。runnable 生成は `internal/cmd/manager/instance/run/cmd.go:272`、型 `Runnable` は `lease/runnable.go:101`、設定は `api/v1/cluster_types.go:549` の `PrimaryLease`。旧 pin にも存在、v1.30.0 の新機能。
- `internal/cnpi` + 依存 `github.com/cloudnative-pg/cnpg-i`: CNPG-i (CloudNativePG Plugin Interface) という gRPC ベースのプラグイン機構。バックアップ等を Unix ソケット越しのサイドカープラグインに委譲する。

operator 本体の reconcile 起点は `ClusterReconciler.Reconcile`。`internal/controller/cluster_controller.go:169`。`getCluster` で取得 (`:177`)、削除中なら finalizer 処理 (`:182`-`:211`)、admission/webhook guard で desired state を補正 (`:213`)、CNPG-i プラグインをロード (`:232` の `cnpgiClient.WithPlugins`)、その後 inner loop `r.reconcile` を呼ぶ (`:266`)。

`ClusterReconciler` 構造体は controller-runtime の `client.Client` を埋め込み、`InstanceClient remote.InstanceClient` (Pod への HTTP クライアント)、`Plugins repository.Interface`、`OperatorClientCert *tls.Certificate` を持つ。`internal/controller/cluster_controller.go:95`-`108`。Pod 通信は mTLS (mutual TLS、相互 TLS) で、operator が client cert を提示する (`internal/controller/cluster_controller.go:447` の `certs.NewTLSConfigForContext`)。

### 代表的な中核操作のエンドツーエンド: Cluster reconcile 1 周

1. `Reconcile` (operator プロセス) が `Cluster` を取得し、admission guard と CNPG-i プラグインロードを通す。`internal/controller/cluster_controller.go:169`, `:213`, `:232`。
2. inner `reconcile` がデフォルト補正・イメージ解決・補助オブジェクト (Service / Secret / ConfigMap / PDB 等) 生成を行う。`internal/controller/cluster_controller.go:309`, `setDefaults` `:332`, `reconcileImage` `:344`, `createPostgresClusterObjects` `:371`。
3. 各 Pod の instance manager に HTTP (mTLS) で問い合わせ、レプリケーション状態を集約する。`r.InstanceClient.GetStatusFromInstances(ctx, resources.instances)`。`internal/controller/cluster_controller.go:457`。
4. クライアント実装は active Pod を絞り込み、各 Pod の `https://<podIP>:8000/pg/status` を叩いて `PostgresqlStatusList` を組み立て、ソートする。`pkg/management/postgres/webserver/client/remote/instance.go:184` (`GetStatusFromInstances`)、`:195` (`extractInstancesStatus` 呼び出し)、URL 組み立ては `:318` の `url.Build("https", podIP, url.PathPgStatus, url.StatusPort)` (#11370 以降 https 固定)。
5. primary が複数見えたら (split-brain 検知) 5 秒後 requeue して auto-healing を待つ。`internal/controller/cluster_controller.go:478`-`487`。switchover/failover 進行中は旧 primary を毎周回 unhealthy にマーク (`:408`-`430`)。target が Pod 名なら 1 秒後 requeue (`:427`-`428`)。target が `pending` マーカー (`api/v1/cluster_types.go:108`) なら requeue せず先へ進み `handleSwitchover` で完了させる。この分岐は #11336 (`1a9772003`, 2026-09-19、v1.30.1/v1.29.3 にバックポート) で入った。以前は無条件 1 秒 requeue で pending failover が停滞・巻き戻りしえた。出典 <https://github.com/cloudnative-pg/cloudnative-pg/pull/11336>。
6. 健全なら switchover 判定 (`handleSwitchover` `:590`)、リソース調停 (`reconcileResources` `:599`)、最後に `finalizeReconciliation` で `PhaseHealthy` を最後のステータス変更として登録する。`:606`。
7. Pod 側: instance manager は `instance run` サブコマンドで自前の controller-runtime マネージャを立ち上げ、`ctrl.NewControllerManagedBy(mgr).For(&apiv1.Cluster{}).Named("instance-cluster").Complete(reconciler)` で同じ `Cluster` CRD を watch する。`internal/cmd/manager/instance/run/cmd.go:287`-`290`。さらに local webserver / remote webserver を runnable として登録する (`:417` `NewRemoteWebServer`, `:428` `NewLocalWebServer`)。operator の問い合わせ先 (`/pg/status` ほか) はこの remote webserver。

要するに operator は「DBA の判断」を担い、instance manager は「Pod 内で実際に PostgreSQL を起動・昇格・設定反映する手」を担う。両者が同じ `Cluster` リソースを介して協調する。

## 内部実装の素材

### 中核データ構造 (3-5)

- `Cluster` (`api/v1/cluster_types.go:2891`): トップの CRD。`Spec ClusterSpec` と `Status ClusterStatus` を持つ標準 K8s 形。
- `ClusterSpec` (`api/v1/cluster_types.go:217`): desired state。`Instances int` (`:264`)、`MinSyncReplicas` (`:272`) / `MaxSyncReplicas` (`:280`) で同期レプリケーションの quorum、`PostgresConfiguration` (`:284`)、`Bootstrap *BootstrapConfiguration` (`:302` / 型は `:1792`)、`ReplicaCluster` (`:306`)、`ReplicationSlots` (`:298`) など。
- `ClusterStatus` (`api/v1/cluster_types.go:913`): observed state。`CurrentPrimary` (`:968`) と `TargetPrimary` (`:973`) の不一致が failover/switchover の進行を表す (reconcile の `:408`-`430` がこれを読む)。
- `PostgresConfiguration` (`api/v1/cluster_types.go:1666`): `postgresql.conf` 相当の宣言的設定。
- `PostgresqlStatusList` (`pkg/management/postgres` パッケージ): 各 Pod から HTTP で集めた実レプリケーション状態の集合。`PrimaryNames()` で primary 数を数え split-brain を検知する (`internal/controller/cluster_controller.go:478`)。
- `SecretsResourceVersion` (`api/v1/cluster_types.go:2920`): superuser / replication / app 各 Secret の resourceVersion を status に保持し、Secret ローテーションを検知する。

### 非自明な設計判断

外部 DCS を持たず、Kubernetes API を高可用性の合意ストアとして使う点が最大の非自明点。さらにその実装として「instance manager 自身が Kubernetes コントローラ」である。各 Pod 内のエージェントが API server を直接 watch し、`For(&apiv1.Cluster{})` で reconcile する (`internal/cmd/manager/instance/run/cmd.go:287`-`290`)。operator (中央) と instance manager (各 Pod) が同じ CRD を共有する二重 reconcile アーキテクチャになっている。Patroni のような etcd 依存をなくし、Pod 障害時の primary 切替も operator が Kubernetes API 経由で調停する。

もう一つは CNPG-i (CloudNativePG Plugin Interface)。バックアップ等を本体から切り離し、Unix ソケット越しの gRPC サイドカープラグインに委譲する設計。reconcile 冒頭でクラスタが必要とするプラグイン名を集めてロードし (`internal/controller/cluster_controller.go:227` `getPluginsNeededForReconcile`, `:232`)、instance manager 側は `RegisterUnixSocketPluginsInPath` でサイドカープラグインを登録する (`internal/cmd/manager/instance/run/cmd.go:264`、戻り値は pin 間に `availablePluginNames` へ改名)。barman-cloud ベースのバックアップも従来の内蔵方式からプラグイン (`cloudnative-pg/barman-cloud` v0.7.0、`go.mod:13`) へ移行中。in-tree 版は 1.31.0 で削除予定 (`docs/src/release_notes/v1.30.md:253`-`256`)。

### 追う価値のあるパス

- failover/switchover 判定: `internal/controller/cluster_controller.go` の `handleSwitchover` (`:590`、`ErrQuorumCheckFailed` 待ちは `:808`) と `internal/controller/replicas.go` / `replicas_quorum.go`。failover の段取り: `pending` を target に設定 `replicas.go:148` → WAL receiver 停止待ち `:172` → FailoverQuorum 有効時に quorum 再確認 `:179`-`185` (#11336 で追加) → 最も進んだ replica へ failover `:191`。
- FailoverQuorum CRD: 同期レプリケーション下でデータ消失を避ける failover ガード。`api/v1/failoverquorum_types.go:49` (`FailoverQuorum`)、`:60` (`FailoverQuorumStatus`)。
- bootstrap (initdb / pgbasebackup / restore): `internal/cmd/manager/instance/{initdb,join,pgbasebackup,restore}`。
- Pod 内 SQL 調停 (Database/Role/Publication/Subscription): `internal/management/controller/database_controller.go` ほか。

## 採用事例の素材

`ADOPTERS.md` (リポジトリ内、本番利用を公言した組織のみ。日付付き) から出典の確かなもの。前回 pin からの差分は 4 行追加 + REWE 行の連絡先削除のみ (`git diff 7ef33bb HEAD -- ADOPTERS.md`)。

- EDB (@gbartolini, 2023-02-21): DBaaS の BigAnimal が CloudNativePG 上で PostgreSQL を稼働。創設組織。
- IBM (@pgodowski, 2024-02-20): IBM Cloud Pak 製品群の組み込み SQL DB として OpenShift 上で利用。
- Google Cloud (@mastersingh24, 2024-03-12): GKE + Marketplace で提供。
- Microsoft Azure (@KenKilty, 2024-08-22): AKS 上の PostgreSQL HA デプロイ手順を Learn で公開。
- Akamai Technologies (2024-11-20): Akamai App Platform のプラットフォーム管理 PostgreSQL に利用。
- Mirakl (@ThomasBoussekey, 2025-02-03): 300+ クラスタ / 8 TB を運用 (規模の具体値あり)。
- Tembo / ParadeDB / Xata / pgEdge: PostgreSQL プラットフォーム各社が compute 層に採用。
- Vera Rubin Observatory (2025-06-17): 望遠鏡システムと天文データ公開に利用。
- Tesla (2026-03-31)、Ericsson (2026-06-17, 5G ネットワーク製品)、Belastingdienst (オランダ税務局, 2026-04-02)、Nutanix NKP (2025-11-19)。
- 新規 (pin 間): amaiko (2026-10-23, Teams 向け AI アシスタント、環境ごとに 3 インスタンス cluster)、Wordfully (2026-10-25)、CageForge (2026-10-28, Cozystack + Proxmox、barman-cloud で S3 互換へ backup)、CoreWeave (2026-11-11, マネージド PostgreSQL「CoreWeave Database (CWDB)」を顧客の CKS クラスタ内で提供 + 社内基盤 DB)。

出典はすべて <https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md>。GitHub シグナル: スター 9,596、フォーク 818、コントリビュータ約 242 名 (`gh api repos/cloudnative-pg/cloudnative-pg/contributors?per_page=1` の Link ヘッダ末尾 `page=242`、いずれも 2026-11-16 時点)。前回はスター 8,883 / 約 226 名 (2026-06-28)。出典 <https://github.com/cloudnative-pg/cloudnative-pg>。

## 代替・エコシステム

PostgreSQL on Kubernetes の operator は混戦。

- Crunchy Data PGO (Postgres Operator): 商用色が強い老舗。CloudNativePG 創設者による比較記事あり <https://www.gabrielebartolini.it/articles/2026/05/cloudnativepg-and-crunchy-pgo-an-honest-opinionated-comparison/>。
- Zalando postgres-operator: Patroni + Spilo ベース。外部 HA ツール (Patroni) に依存する点が設計思想として対照的。
- StackGres (OnGres)、KubeDB (AppsCode): 他の主要 operator。
- 本質的な差: CloudNativePG は (1) ベンダー中立な CNCF コミュニティ governance、(2) Patroni/etcd を使わず Kubernetes API を直接 HA に使う即時 failover、(3) immutable infrastructure (Pod は使い捨て、イメージは digest 固定)、(4) CNPG-i による拡張。出典: README / CNCF ブログ <https://www.cncf.io/blog/2024/11/20/cloud-neutral-postgres-databases-with-kubernetes-and-cloudnativepg/>。

統合先: Prometheus / Grafana (PodMonitor を operator が生成、kube-prometheus-stack 連携を quickstart が案内)、barman-cloud (WAL/ベースバックアップを S3 等オブジェクトストレージへ)、Pooler CRD 経由の PgBouncer、OperatorHub.io / Helm chart 配布、Bitnami / Tanzu Application Catalog。

## インストールと最小構成 (実行可能な手順)

1. operator manifest を適用する (最新安定版 v1.30.1。インストールガイドが示す `release-1.30` ブランチの URL。2026-11-16 に HTTP 200 を確認):

    ```bash
    kubectl apply --server-side -f \
      https://raw.githubusercontent.com/cloudnative-pg/cloudnative-pg/release-1.30/releases/cnpg-1.30.1.yaml
    ```

2. 3 ノードの `Cluster` を作る (`cluster-example.yaml` として保存):

    ```yaml
    apiVersion: postgresql.cnpg.io/v1
    kind: Cluster
    metadata:
      name: cluster-example
    spec:
      instances: 3
      storage:
        size: 1Gi
    ```

3. 適用して Pod 生成を確認する:

    ```bash
    kubectl apply -f cluster-example.yaml
    kubectl get pods -l cnpg.io/cluster=cluster-example
    ```

出典: `docs/src/installation_upgrade.md:17`-`23`、`docs/src/quickstart.md:94`-`120`、`docs/src/quickstart.md:135`。`kubectl cnpg` プラグイン (`cmd/kubectl-cnpg`) を入れると `kubectl cnpg install generate ...` で manifest 生成や運用操作ができる (`docs/src/installation_upgrade.md:39`-`43`)。注: `main` の quickstart の `cluster-example.yaml` は pin 間に `postgresql.synchronous` (method `any`, number 1) が追加された。release-1.30 の quickstart は従来どおり `instances` + `storage` のみなので、getting-started は release-1.30 側に合わせた。
