# 歴史

## 起源

Envoy は Lyft で始まった。Matt Klein は 2015 年 5 月に Twitter から Lyft へ移った。当時 Lyft はモノリスから 30 以上のマイクロサービスへ移行中だった。チームはネットワークの挙動が見えずにいた。ELB も CloudWatch も P50/P99 レイテンシを出せず、障害の切り分けが難しかった。ネットワークの可観測性が新しいプロキシの最大の動機だった ([How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f))。

NGINX や HAProxy は高速だが L4/L7 ルーティング以上のことはほとんどできず、ポリグロットなサービス群には Finagle 型の言語別ライブラリも合わなかった。Lyft は性能のためモダン C++ で書くアウトオブプロセスプロキシを選んだ。開発は 2015 年 5 月に始まり、MVP は 2015 年 9 月初旬に本番デプロイされた ([How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | Lyft で開発開始 (5 月)。MVP を本番デプロイ (9 月初旬)。 |
| 2016 | Lyft の全サービスがクライアントサイド LB で Envoy 経由に (年初)。2016-09-14 に OSS 公開。 |
| 2017 | 2017-09-13、CNCF の 11 番目のホストプロジェクトとして寄贈。 |
| 2018 | 2018-11-28、Kubernetes・Prometheus に次ぐ 3 番目の graduated プロジェクトに。 |

## どう進化したか

2016 年初頭には Lyft の全サービスがクライアントサイド LB で Envoy 経由となり、その夏にはエッジとサービス間の両方をカバーして、数百サービス・毎秒数百万リクエストを処理していた ([How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f))。

2016-09-14 の OSS 公開直後に Google・Apple・Microsoft・eBay のエンジニアから反応があり、採用は想定を超えた ([5 years of Envoy OSS](https://mattklein123.dev/2021/09/14/5-years-envoy-oss/))。この外部の関心が xDS 設定 API を育て、Envoy を他のコントロールプレーンが駆動できるデータプレーンへと変えた。

Envoy は 2017-09-13 に CNCF の 11 番目のホストプロジェクトとして参加し ([Envoy joins the CNCF](https://eng.lyft.com/envoy-joins-the-cncf-dc18baefbc22))、2018-11-28 に Kubernetes・Prometheus に続いて graduated した ([CNCF プロジェクトページ](https://www.cncf.io/projects/envoy/))。

## 現在地

リポジトリは API バージョン `3.0.0` を固定し (`API_VERSION.txt`)、`VERSION.txt` は `1.39.0-dev` を持つ。最も近いタグは 2026-06-10 リリースの `v1.38.2`。ガバナンスは [GOVERNANCE.md](https://github.com/envoyproxy/envoy/blob/main/GOVERNANCE.md) に記され、メンテナの階層と投票プロセスを定義している。CNCF プロジェクトページは数千人のコントリビュータを擁する graduated プロジェクトとして掲載している ([CNCF プロジェクトページ](https://www.cncf.io/projects/envoy/))。
