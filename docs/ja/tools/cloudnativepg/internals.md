# 内部実装

> コミット `719385f` (2026-11-13) のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/manager` | 単一バイナリのエントリポイント。`controller`・`instance`・`backup`・`bootstrap` などのサブコマンドを登録する cobra ルート (`cmd/manager/main.go:66`-`75`)。 |
| `internal/controller` | operator 側の reconciler 群。リソース種別ごとに 1 つ。`cluster_controller.go` がメインループ。 |
| `internal/cmd/manager/instance` | Pod 内で動く instance manager のサブコマンド (`run`・`initdb`・`join`・`pgbasebackup`・`restore`)。 |
| `internal/management/controller` | PostgreSQL 内のオブジェクトを SQL で調停する Pod 内 reconciler (`database_controller.go` ほか)。 |
| `pkg/management/postgres` | PostgreSQL プロセス管理、web server、ステータス抽出。 |
| `pkg/management/url` | instance manager の HTTP エンドポイントのパスとポート。 |
| `api/v1` | `postgresql.cnpg.io/v1` API group の CRD Go 型。 |
| `internal/cnpi` | gRPC プラグイン機構 CNPG-i (CloudNativePG Plugin Interface) のクライアント側。 |

## 中核データ構造

システム全体は `Cluster` CRD と、`api/v1/cluster_types.go` 内の少数の関連型を中心に回る。

- `Cluster` (`api/v1/cluster_types.go:2891`) はトップレベルのリソースで、`Spec` と `Status` を持つ標準的な Kubernetes 形。
- `ClusterSpec` (`api/v1/cluster_types.go:217`) は desired state。`Instances` (`:264`)、同期レプリケーションの quorum を司る `MinSyncReplicas` と `MaxSyncReplicas` (`:272`, `:280`)、`PostgresConfiguration` (`:284`)、`ReplicationSlots` (`:298`)、`Bootstrap` (`:302`)、`ReplicaCluster` (`:306`) を持つ。
- `ClusterStatus` (`api/v1/cluster_types.go:913`) は observed state。`CurrentPrimary` と `TargetPrimary` (`:968`, `:973`) の対がフェイルオーバー/スイッチオーバーの進行を表す。両者が異なれば操作進行中で、reconciler はまさにその条件を `internal/controller/cluster_controller.go:408`-`409` で読む。
- `PostgresConfiguration` (`api/v1/cluster_types.go:1666`) は `postgresql.conf` の宣言的な形。
- `BootstrapConfiguration` (`api/v1/cluster_types.go:1792`) は新規クラスタの初期化方法 (initdb・pg_basebackup・recovery) を選ぶ。
- `SecretsResourceVersion` (`api/v1/cluster_types.go:2920`) は管理対象 Secret それぞれの `resourceVersion` を status に保持し、operator がローテーションを検知できるようにする。

実行時の対応物が `ClusterReconciler` (`internal/controller/cluster_controller.go:95`)。controller-runtime の `client.Client` を埋め込み、Pod 問い合わせ用の `InstanceClient`、プラグインリポジトリ、operator の TLS クライアント証明書を持つ。

## 追う価値のあるパス

split-brain 検知は追うのに良いループだ。operator が Pod ごとの HTTP 応答を安全判断にどう変えるかが見える。

operator は mTLS (mutual Transport Layer Security、相互 TLS) で全インスタンスから状態を集める:

```go
    instancesStatus := r.InstanceClient.GetStatusFromInstances(ctx, resources.instances)
```

この呼び出しは `internal/controller/cluster_controller.go:457`。クライアント実装は active Pod に絞り、各 Pod を問い合わせる:

```go
    statusURL := url.Build("https", pod.Status.PodIP, url.PathPgStatus, url.StatusPort)
```

これは `pkg/management/postgres/webserver/client/remote/instance.go:318`。[#11370](https://github.com/cloudnative-pg/cloudnative-pg/pull/11370) で Pod ごとの HTTP フォールバックが削除されてから、スキームは `https` 固定になった。`url.PathPgStatus` は `/pg/status` (`pkg/management/url/url.go:55`)、`url.StatusPort` は `8000` (`pkg/management/url/url.go:79`)。応答は `PostgresqlStatusList` になる。

reconcile ループに戻り、operator は何個の Pod が自身を primary と主張するか数える:

```go
    if primaryNames := instancesStatus.PrimaryNames(); len(primaryNames) > 1 {
```

このガードは `internal/controller/cluster_controller.go:478`。primary が複数見えたとき、operator は強制解決しない。old-primary 検知をログし、status をダンプし、5 秒後に requeue する (`:484`-`487`)。降格された旧 primary が新しい役割を認識するのを待つためだ。端から端までの呼び出しチェーン:

```text
Reconcile (cluster_controller.go:169)
  -> reconcile (cluster_controller.go:309)
    -> GetStatusFromInstances (cluster_controller.go:457)
      -> remote client GET https://<podIP>:8000/pg/status (remote/instance.go:318)
    -> instancesStatus.PrimaryNames() > 1 ? requeue 5s (cluster_controller.go:478)
    -> handleSwitchover (cluster_controller.go:590)
    -> finalizeReconciliation -> PhaseHealthy (cluster_controller.go:606)
```

## 読んで驚いた点

instance manager は受動的なエージェントではなく、それ自体が完全な Kubernetes コントローラだ。各 Pod 内で controller-runtime マネージャを構築し、operator が watch するのと同じ `Cluster` リソースに対して reconciler を登録する:

```go
    err = ctrl.NewControllerManagedBy(mgr).
        For(&apiv1.Cluster{}).
        Named("instance-cluster").
        Complete(reconciler)
```

これが `internal/cmd/manager/instance/run/cmd.go:287`-`290`。つまり 1 つの `Cluster` オブジェクトが同時に 2 方向から reconcile される。中央の operator と、各 Pod のローカルの両方だ。他スタックで etcd + Patroni がやる仕事を Kubernetes API サーバがやっている。

第 2 の非自明点は、フェイルオーバーが段階を踏んで進むことだ。primary が落ちると、operator はまず replica を名指しせず、`TargetPrimary` に `pending` というマーカー (`api/v1/cluster_types.go:108`) を設定する (`internal/controller/replicas.go:148`)。次にすべての WAL receiver (primary から WAL をストリーミングで受け取る replica 側のプロセス) が止まるのを待ち (`:172`)、`FailoverQuorum` が有効なら同期レプリケーションの quorum を再確認し (`:179`-`185`)、そこで初めて最も進んだ replica を昇格させる (`:191`)。`CurrentPrimary` と `TargetPrimary` が食い違う間、メインループは毎周回で旧 primary を unhealthy とマークする (`internal/controller/cluster_controller.go:408`-`430`)。2026 年 9 月まではこのブロックが常に 1 秒後に requeue していたため、reconciler は `pending` のフェイルオーバーを完了できるか確かめるコードに到達せず、フェイルオーバーが止まったままになることがあった。[#11336](https://github.com/cloudnative-pg/cloudnative-pg/pull/11336) (v1.30.1 と v1.29.3 にバックポート) は早期 requeue を target が Pod 名のときに限定し (`:427`-`428`)、`pending` のフェイルオーバーは `handleSwitchover` まで進むようになった。複数 primary のケースは今も 5 秒待ち、速さを犠牲にしてクラスタが自己修復する余地を与える。
