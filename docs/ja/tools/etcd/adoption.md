# 採用事例・エコシステム

## 誰が使っているか

最大の採用層は暗黙的です。すべての Kubernetes クラスタは主データストアとして etcd を使うため、Kubernetes ユーザはそのまま etcd ユーザです。プロジェクトの `ADOPTERS.md` は冒頭でまさにこの点を述べています [7]。それを超えて、同ファイルは組織名とユースケースを列挙しています。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| 全 Kubernetes ユーザ | クラスタのコントロールプレーンデータストア | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Huawei | 社内利用 | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Tencent Games | 社内利用 | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Salesforce.com | 社内利用 | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Yandex | 社内利用 | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Grab | 社内利用 | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| OpenTable | サービスディスカバリとクラスタ設定管理 | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| PingCAP | Placement Driver (PD) コンポーネント | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Qiniu Cloud | 社内利用 | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| QingCloud | 社内利用 | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |
| Meitu | 社内利用 | [ADOPTERS.md](https://github.com/etcd-io/etcd/blob/main/ADOPTERS.md) |

## 採用のシグナル

GitHub REST API から 2026-06-22 に取得: `etcd-io/etcd` はスター 51,872、フォーク 10,394、オープン issue 266。コントリビュータ数は 1,000 を超えます (匿名込みのコントリビュータ一覧は 1,179 を超えてページングされます)。コミット数は CoreOS 系の作者が最多で、Google が次点です。CNCF の Project Journey Report は、2018 年の寄贈から 2020 年の卒業までの成長を記録しています [4]。

## エコシステム

Go クライアント `clientv3` と gRPC API により、ほとんどの言語でバインディングが得られます。`etcdctl` と `etcdutl` CLI はサーバに同梱されます。etcd はメトリクスで Prometheus と連携し、ストレージバックエンドに bbolt を使います。その Raft 実装 `go.etcd.io/raft` は etcd 以外でも再利用されており、CockroachDB や TiKV (後者は派生) が含まれます。公式コンテナイメージは `gcr.io/etcd-development/etcd` (primary) と `quay.io/coreos/etcd` (secondary) で公開されています [7]。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Apache ZooKeeper | ZAB 合意と階層的な znode ツリー。協調用途の古参で、etcd の gRPC/MVCC/lease モデルは持たない |
| HashiCorp Consul | KV ストアの上にサービスディスカバリとヘルスチェックを追加。よりサービスメッシュ寄りの広い製品 |
| Google Chubby | 非 OSS の設計上の祖先。汎用 KV ストアではなくロックサービス |

強整合で小さなデータセットを扱い、revision ベースの watch と lease が欲しいとき、とりわけ既に Kubernetes エコシステムにいてデフォルトが etcd であるときは etcd を選びます。ZooKeeper は既存資産やクライアントライブラリへの投資がある場合に。Consul は生の強整合 KV ストアより、サービスディスカバリとヘルスチェックが主要要件のときに選びます。
