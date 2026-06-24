# 採用事例・エコシステム

## 誰が使っているか

リポジトリの `ADOPTERS.md` に以下の組織が記載されている。各エントリはそのファイルに由来する ([出典 1](https://github.com/dragonflyoss/dragonfly))。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Alibaba Group | 大規模なイメージ・ファイル配布 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Ant Group | 大規模なイメージ・ファイル配布 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| DiDi | 大規模なイメージ・ファイル配布 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Kuaishou | 大規模なイメージ・ファイル配布 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Bilibili | 大規模なイメージ・ファイル配布 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| JFrog | イメージ・ファイル配布 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Datadog | lazy loading 付きのイメージ配布 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Google Cloud | click-to-deploy / GKE Marketplace 統合 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Volcano Engine | VKE / Container Registry 統合 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Baidu AI Cloud | CCE 統合 | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |
| Alibaba Cloud | ACK の P2P アクセラレーション | [ADOPTERS.md](https://github.com/dragonflyoss/dragonfly/blob/main/ADOPTERS.md) |

`ADOPTERS.md` には miHoYo・Xiaomi・Qunar・Yahoo・Meituan・JD・NetEase・Huawei・Shopee・China Unicom・ZTE・iQIYI・Lazada など、さらに多くの組織が記載されている。

## 採用のシグナル

2025-10-28 の卒業時点で、プロジェクトは 130 社・271 名による約 2.6 万コミットの貢献を報告している ([出典 5](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/))。2026-06-22 に GitHub API で観測したところ、`dragonflyoss/dragonfly` はスター 3,212・フォーク 406・オープン issue 26 で、非匿名のコントリビュータは約 105 名だった ([出典 1](https://github.com/dragonflyoss/dragonfly))。CNCF Graduated のステータスは CNCF プロジェクトページで確認できる ([出典 3](https://www.cncf.io/projects/dragonfly/))。

## エコシステム

Dragonfly は containerd や Docker のレジストリミラーとして、また Harbor を前段に置いた配布経路として統合される。lazy なイメージロードのために Nydus と連携し、Hugging Face と ModelScope のモデルソースをネイティブに扱う ([出典 8](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/))。プロジェクトは Helm チャート (`dragonflyoss/helm-charts`) とコンソール (`dragonflyoss/console`) を提供し、データプレーンのクライアントは `dragonflyoss/client` にある。

## 代替候補

Dragonfly はファイル・イメージ・AI モデルといった任意の成果物を配布でき、タスクごとに DAG を構築する中央スケジューラで親選定を最適化する。代償は複数コンポーネントの運用だ。以下の代替は、その守備範囲の一部を引き換えに運用の単純さを得る。

| 代替 | 違い |
| --- | --- |
| [Uber Kraken](https://github.com/uber/kraken) | BitTorrent ベース。tracker は接続グラフの調停だけを行い、データ転送はピア間に委譲する。大 blob でスケールするが、2020 年以降は開発が静かだ。 |
| [Spegel](https://spegel.dev/docs/architecture/) | ステートレス。containerd の既存キャッシュを再利用し、libp2p 上の Kademlia DHT でピアを発見する。K3s と RKE2 に組み込まれているが、用途はクラスタローカルな containerd ミラーに限られる。 |
