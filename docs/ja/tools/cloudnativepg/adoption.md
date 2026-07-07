# 採用事例・エコシステム

## 誰が使っているか

以下の組織は、CloudNativePG を本番で運用していると公言した企業のみを日付付きで記録するプロジェクトの `ADOPTERS.md` に載っている。各行はそのファイルを出典とする。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| EDB | DBaaS の BigAnimal の PostgreSQL を CloudNativePG 上で稼働。創設組織 (2023-02-21)。 | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| IBM | OpenShift 上の IBM Cloud Pak 製品の組み込み SQL DB (2024-02-20)。 | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Google Cloud | GKE と Marketplace で提供 (2024-03-12)。 | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Microsoft Azure | AKS 向け PostgreSQL HA デプロイ手順を Microsoft Learn で公開 (2024-08-22)。 | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Akamai Technologies | Akamai App Platform 内のプラットフォーム管理 PostgreSQL (2024-11-20)。 | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Mirakl | 300+ クラスタ・計 8 TB を運用 (2025-02-03)。 | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Vera Rubin Observatory | 望遠鏡システムと天文データ公開 (2025-06-17)。 | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |
| Ericsson | 5G ネットワーク製品向けの PostgreSQL (2026-06-17)。 | [ADOPTERS.md](https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md) |

同ファイルにはさらに Tesla (2026-03-31)、Belastingdienst (オランダ税務局, 2026-04-02)、Nutanix NKP (2025-11-19)、compute 層に採用する PostgreSQL プラットフォーム各社 (Tembo・ParadeDB・Xata・pgEdge) も載っている。

## 採用のシグナル

- GitHub スター: `cloudnative-pg/cloudnative-pg` リポジトリで約 8,883 (2026-06-28 観測)。
- コントリビュータ: GitHub contributors API の最終ページから測って約 226 名 (2026-06-28 観測)。
- リリース頻度: 維持された安定マイナーライン (v1.29.1, 2026-05-08) と、`main` の `releases/` に同梱されたリリース候補 (`v1.30.0-rc1`) で準備される次のマイナー。
- CNCF ステータス: 2025 年 1 月に Sandbox 入り (cncf/sandbox issue #128)、メンテナは次に Incubation を公言。

## エコシステム

- **可観測性**: operator が Prometheus 向け `PodMonitor` を生成し、quickstart は Grafana ダッシュボード付きの kube-prometheus-stack 連携を案内する。
- **バックアップ**: WAL (Write-Ahead Log、先行書き込みログ) アーカイブとベースバックアップを barman-cloud 経由でオブジェクトストレージ (S3 互換) へ。現在は CNPG-i (CloudNativePG Plugin Interface) プラグイン (`cloudnative-pg/barman-cloud`) としてパッケージ化。
- **コネクションプーリング**: `Pooler` CRD がクラスタの前段に PgBouncer をプロビジョニングする。
- **配布**: OperatorHub.io、Helm chart、Bitnami と Tanzu Application Catalog で公開。

## 代替候補

PostgreSQL on Kubernetes の operator 領域は混戦だ。誠実な差は以下:

| 代替 | 違い |
| --- | --- |
| Crunchy Data PGO | 商用色が強い老舗 operator。創設者によるトレードオフの比較記事がある ([出典](https://www.gabrielebartolini.it/articles/2026/05/cloudnativepg-and-crunchy-pgo-an-honest-opinionated-comparison/))。 |
| Zalando postgres-operator | Patroni と Spilo を土台にし、外部 HA ツールに依存する。Kubernetes API のみで完結する CloudNativePG の設計とは対照的。 |
| StackGres (OnGres) | PostgreSQL の周囲に重めの管理 UI とサイドカー群を追加する。 |
| KubeDB (AppsCode) | マルチエンジン operator (PostgreSQL だけでなく多数の DB を扱う)。高度な機能は商用ライセンス。 |

CloudNativePG を選ぶのは、外部 DCS なし・イミュータブル Pod のベンダー中立な CNCF operator が欲しいとき。Patroni を運用上すでに標準化しているなら Patroni 系 operator を、多数の DB エンジンを 1 つの operator で扱いたいなら KubeDB を選ぶ。
