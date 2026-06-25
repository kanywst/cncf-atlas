# 採用事例・エコシステム

## 誰が使っているか

以下の採用企業は、CNCF の Incubating 昇格告知か、リポジトリの `ADOPTERS.md` のいずれかに名指しされている。各々に出典を付け、推測は含めない。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Alibaba Cloud PAI | ディープラーニングコンテナ、本番 | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| Weibo | 本番のデータ高速化 | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| Bilibili | 本番のデータ高速化 | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| Qihoo 360 | 本番のデータ高速化 | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| OPPO | 本番のデータ高速化 | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| NetEase Games (网易互娱) | 本番のデータ高速化 | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| China Telecom Cloud (天翼云) | 本番のデータ高速化 | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |
| Xiaomi | 採用企業として名指し | [CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/) |
| Inceptio Technology | 自動運転ワークロード | [CNCF blog](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/) |
| Metabit Trading, JoinQuant | クオンツ金融 | [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md) |

CNCF の告知はさらに Huya・Zuoyebang・Unisound・DP Technology などを挙げる。`ADOPTERS.md` は Tencent Cloud・Baidu AI Cloud・Xiaomi を testing / staging フェーズとしても追っている。

## 採用のシグナル

- GitHub スター: 1,942、フォーク: 1,265 ([GitHub API](https://api.github.com/repos/fluid-cloudnative/fluid)、観測 2026-06-24)。CNCF blog はこれを "1.9k stars" と丸めている。
- コントリビュータ: CNCF blog は 979 と記載 (DevStats、ドキュメント等を含む all-time)。GitHub contributors API では約 480 (観測 2026-06-24)。
- リリース: CNCF blog は 28 リリースと記載。最新タグは `v1.0.8` (2025-10-31)。
- 成熟度: 2026-01-08 に CNCF Incubating へ移行 ([CNCF プロジェクトページ](https://www.cncf.io/projects/fluid/))。

## エコシステム

Fluid はキャッシュ・ストレージエンジンと競合せず統合する。Alluxio・JuiceFS・JindoFS/JindoCache (Alibaba)・Vineyard (インメモリ中間データ)・EFC (Alibaba 弾性ファイルキャッシュ)、`ThinRuntime` 経由で 3FS や Curvine。UFS バックエンドは S3・OSS・HDFS・NFS など。Kubernetes 側ではスケジューラ (データアフィニティ)・CSI・メトリクス用 Prometheus と連携し、Arena や KubeDL といった AI 学習ジョブ管理とよく併用される。

## 代替候補

| 代替 | 違い |
| --- | --- |
| 素の Alluxio / JuiceFS を自前運用 | キャッシュエンジンを自分で運用・チューニングする。Fluid はこれらを CRD で包み、データアフィニティスケジューリングとマルチエンジン抽象を加える。 |
| クラウド CSI ドライバ (EFS・FSx・OSS) | 永続ストレージを提供する。Fluid の価値はリモートデータのノードローカルキャッシュとスケジューリングで、記録の正本になることではない。 |
| CubeFS, Rook/Ceph | これらは分散ストレージシステム (記録の正本) である。Fluid は他所にあるデータへのアクセスを高速化するオーケストレーション層である。 |
