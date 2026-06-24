# 採用事例・エコシステム

## 誰が使っているか

リポジトリは production と testing を区分した `ADOPTERS.md` を持ちます。以下に挙げる採用組織はすべてそのファイル (S1)、または CNCF の卒業発表 (S3) によるものです。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| JD.com | 2018 年から本番。3000+ ワークロード、50+ PB、5000+ サーバ。広告・検索・AI 学習 | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |
| OPPO | Kubernetes ベース AI プラットフォームのバックエンドストレージ | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |
| NetEase (网易) | Elasticsearch のバックエンド、2+ PB | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |
| Meizu, BEIKE, LinkSure, Reconova, BIGO, Vipshop | production に記載 | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |
| Xiaomi, Shopee, CreditEase, TD Tech | production または testing テーブルに記載 | [ADOPTERS.md](https://github.com/cubefs/cubefs/blob/master/ADOPTERS.md) |

卒業時点で CNCF は、2025 年 1 月時点で 200 超の組織が CubeFS を利用し、約 350 PB を管理していると報告しています (S3, S4)。

## 採用のシグナル

- GitHub: stars 5,593、forks 703 (gh API, 2026-06-22)。
- コントリビュータ: GitHub contributors API は 127 ページ目まで (約 127 アカウント, 2026-06-22)。CNCF は別集計で 27 から 379 へ、42 社にまたがって増えたと報告 (S3, S4)。
- 組織: CNCF は Sandbox から卒業までの期間で採用が約 10 から 200 超に増えたとしています (S3)。
- リリース: 最新は 2025-12-23 付の v3.5.3 (S10)。

## エコシステム

- CSI ドライバ: `cubefs/cubefs-csi`、別リポジトリのサブプロジェクト (S1)。
- Helm chart: `cubefs/cubefs-helm`、別リポジトリのサブプロジェクト (S1)。
- クライアント面: ObjectNode 経由の S3 SDK、Hadoop FileSystem、POSIX FUSE。
- 可観測性: `util/exporter` 経由の Prometheus メトリクス。

## 代替候補

CubeFS は原典論文で Ceph と直接比較され、メタデータ操作を CephFS / RADOS に対してベンチマークしています (S7)。同じ領域の他システムは次のとおりです。

| 代替 | 違い |
| --- | --- |
| Ceph (CephFS/RADOS) | CRUSH 配置でオブジェクト・ブロック・ファイルを統合。CubeFS が比較した SIGMOD のベースライン (S7) |
| MinIO | S3 オブジェクトストレージ専用。POSIX や HDFS のファイルセマンティクスはない |
| JuiceFS | メタデータをインメモリ B-Tree ではなく外部 DB に置く POSIX ファイルシステム |
| Alluxio | 既存ストアの上のキャッシュ/データオーケストレーション層。一次ストアではない |
| HDFS | CubeFS が提供する HDFS 互換 API は HDFS の置換を狙う |

本質的な差: CubeFS はファイルとオブジェクトを 1 システムで提供し、ボリュームごとに multi-replica かイレイジャーコーディングを選べます。メタデータをメモリに保持しメモリ使用量で配置するので、容量拡張時の rebalance を不要にすると論じています (S7)。そして Master はデータパスに介在しません。
