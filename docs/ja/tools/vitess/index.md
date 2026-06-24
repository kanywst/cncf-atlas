# Vitess

> MySQL を水平方向にシャーディングし、そのシャーディングを単一の MySQL 互換エンドポイントの裏に隠すクラスタリングシステム。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [vitessio/vitess](https://github.com/vitessio/vitess)
- **ドキュメント基準コミット**: `7924743` (2026-06-22, `main`)

## 何をするものか

Vitess はアプリケーションと MySQL サーバ群の間に位置する。アプリは VTGate と呼ばれるステートレスなプロキシに、あたかも単一の MySQL サーバであるかのように接続する。VTGate は各クエリをパースし、実行計画を立て、適切なシャードへルーティングする。シャーディングのロジックはアプリではなく Vitess 側に置かれる。

Vitess のデプロイは論理データベース (keyspace) を複数のシャードに分割し、各シャードは primary と replica の MySQL グループで支える。VTTablet と呼ばれるサイドカーが各 MySQL インスタンスの隣で動き、クエリ実行・コネクションプール・ヘルスチェック・バックアップを担う。コントロールプレーン (vtctld, VTOrc, VTAdmin) がスキーマ変更・リシャーディング・フェイルオーバを担う。トポロジのメタデータは etcd・ZooKeeper・Consul に保存される。

Vitess は 2010 年に YouTube で、単一サーバの限界を超えて MySQL をスケールさせるために始まった。既に MySQL を運用していて 1 台では足りなくなり、アプリを書き換えず MySQL ワイヤプロトコルも捨てずにスケールアウトしたいチーム向けである。

## いつ使うか

- 1 台の primary ではデータ量や書き込み負荷を支えきれない規模で MySQL を運用している。
- シャード選択のロジックをアプリのコードに埋め込まずにシャーディングしたい。
- 多数の MySQL インスタンスにまたがるオンラインリシャーディング・非ブロッキングなスキーマ変更・管理されたフェイルオーバが必要。
- Kubernetes 上で、多数のバックエンドに対し単一の MySQL エンドポイントを見せるプロキシ層が欲しい。

1 台の MySQL でまだ負荷をさばけるなら不向きである。Vitess はトポロジサービス・プロキシ・サイドカーという運用層を増やし、それは規模が出て初めて見合う。また完全なクロスシャード ACID 分離の代替にもならない。クロスシャードトランザクションにはアプリが理解しておくべき制約が伴う。

## このディープダイブの構成

- [歴史](./history): YouTube での起源・CNCF 卒業・進化の経緯。
- [アーキテクチャ](./architecture): コンポーネントとクエリの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ VTGate のクエリパス。
- [はじめに](./getting-started): examples からのローカルクラスタ。

## 出典

1. [vitessio/vitess (GitHub)](https://github.com/vitessio/vitess)
2. [ADOPTERS.md](https://github.com/vitessio/vitess/blob/main/ADOPTERS.md)
3. [CNCF Announces Vitess Graduation (2019-11-05)](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/)
4. [Vitess on CNCF projects](https://www.cncf.io/projects/vitess/)
5. [CNCF Vitess Project Journey Report](https://www.cncf.io/reports/vitess-project-journey-report/)
6. [SiliconANGLE: Vitess powering YouTube graduates CNCF](https://siliconangle.com/2019/11/05/vitess-database-clustering-system-powering-youtube-graduates-cncf-incubation/)
7. [Vitess Docs: History](https://vitess.io/docs/22.0/overview/history/)
8. [Tinybird: Citus Alternatives](https://www.tinybird.co/blog/Citus-Alternatives)
9. [PingCAP: Best Distributed SQL Databases](https://www.pingcap.com/compare/best-distributed-sql-databases/)
10. [Vitess project home](https://vitess.io/)
