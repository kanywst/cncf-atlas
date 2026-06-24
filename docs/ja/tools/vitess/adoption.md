# 採用事例・エコシステム

## 誰が使っているか

リポジトリの `ADOPTERS.md` には GitHub・Slack・Square・Pinterest・Shopify・Etsy・HubSpot・New Relic・JD.com・FlipKart・PlanetScale・Uber・Twitter・YouTube・Axon・BetterCloud・CloudSigma・Vinted・Weave などの組織が記載されている ([出典 2](https://github.com/vitessio/vitess/blob/main/ADOPTERS.md))。CNCF 卒業告知では、このうち数社が本番または各段階の利用者として明記されている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| YouTube | ペタバイト級データ、秒間数百万クエリ | [出典 5](https://www.cncf.io/reports/vitess-project-journey-report/) |
| Slack | 約 6,000 サーバの Vitess fleet | [出典 5](https://www.cncf.io/reports/vitess-project-journey-report/) |
| GitHub | 本番利用、卒業時に明記 | [出典 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/) |
| JD.com | 本番利用、卒業時に明記 | [出典 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/) |
| Pinterest | 本番利用、卒業時に明記 | [出典 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/) |
| Square | 本番利用、卒業時に明記 | [出典 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/) |

Project Journey Report は、判明している最大規模のデプロイは約 70,000 サーバとしている ([出典 5](https://www.cncf.io/reports/vitess-project-journey-report/))。

## 採用のシグナル

- 2026-06-23 に GitHub API で観測した指標: stars 21,053、forks 2,356、contributors 約 327 ([出典 1](https://github.com/vitessio/vitess))。
- 2019-11-05 から CNCF Graduated、8 番目の卒業プロジェクト ([出典 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/))。
- 2020-04 時点のコントリビュータ構成: Google 36%、PlanetScale 25% ([出典 5](https://www.cncf.io/reports/vitess-project-journey-report/))。
- 2019-02 に CNCF 出資のセキュリティ監査を通過 ([出典 3](https://www.cncf.io/announcements/2019/11/05/cloud-native-computing-foundation-announces-vitess-graduation/))。

## エコシステム

- **トポロジバックエンド**: etcd・ZooKeeper・Consul がクラスタのメタデータを保存する (`go/vt/topo/`)。
- **Kubernetes**: vitess-operator が Vitess を Kubernetes 上にデプロイする (`examples/operator/operator.yaml`)。
- **バックアップストレージ**: S3・GCS・Ceph がサポート対象 (`examples/local/ceph_backup_config.json`)。
- **VReplication**: MoveTables・Reshard・Materialize・オンライン DDL を支えるエンジン。
- **PlanetScale**: Vitess 上に構築されたマネージド/サーバレス提供で、最大級のスポンサーの一つ ([出典 8](https://www.tinybird.co/blog/Citus-Alternatives))。

## 代替候補

Vitess はシャード配置を明示的に宣言・制御する MySQL 互換ミドルウェアである。主要な代替はデータモデルと、シャーディングをどこまで隠すかで違う。

| 代替 | 違い |
| --- | --- |
| PlanetScale | MySQL 向けのマネージド/サーバレス Vitess。ブランチングと非ブロッキングなスキーマ変更を追加 ([出典 8](https://www.tinybird.co/blog/Citus-Alternatives)) |
| Citus | PostgreSQL のシャーディング拡張。設定は単純だが Vitess ほど凝ったシャード管理は持たない ([出典 8](https://www.tinybird.co/blog/Citus-Alternatives)) |
| CockroachDB / TiDB / YugabyteDB | 自動シャーディングと serializable なクロスシャード一貫性を持つ NewSQL。シャードキーの明示宣言は不要 ([出典 9](https://www.pingcap.com/compare/best-distributed-sql-databases/)) |

既に MySQL を運用し、MySQL ワイヤプロトコルが欲しく、シャード配置を明示的に制御したいなら Vitess を選ぶ。シャーディングとクロスシャード ACID をデータベース側に任せたいなら NewSQL を選ぶ。Vitess はクロスシャードトランザクションを 2PC でアトミックに行うが、完全なクロスシャード分離は提供せず、その点はアプリが考慮する前提である。
