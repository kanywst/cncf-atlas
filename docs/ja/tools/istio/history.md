# 歴史

## 起源

Istio は 2016 年に Google で始まった。Google は自社の本番トラフィックパターンを基に、IBM のオープンソースのトラフィック管理と Lyft の Envoy proxy を組み合わせて作った。Envoy は先にオープンソース化されており、Google はデータプレーンにこれを採用した。当初の想定は Nginx 寄りだった ([Tetrate](https://tetrate.io/blog/how-the-istio-service-mesh-became-critical-infrastructure-for-cloud-native-applications))。

2017 年 5 月、Google・IBM・Lyft が Istio 0.1 を公開した。アプリ内ではなく各ワークロードの隣のプロキシがトラフィック管理・ポリシー・可観測性を担うサイドカー方式を、サービスメッシュとして確立した ([Tetrate](https://tetrate.io/blog/how-the-istio-service-mesh-became-critical-infrastructure-for-cloud-native-applications))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | Google で開発開始。IBM のトラフィック管理と Lyft の Envoy をベースに |
| 2017 | Google・IBM・Lyft が Istio 0.1 を公開 |
| 2018 | Istio 1.0 |
| 2022 | CNCF に Incubating プロジェクトとして受理 (9/28) |
| 2023 | CNCF を Graduated (7/12) |
| 2025 | ambient mesh が GA |

## どう進化したか

Istio は 2022-09-28 に CNCF へ Incubating プロジェクトとして受理された。Google の donate の判断は Kubernetes など他の基盤的プロジェクトと比べて遅く、当時話題になった ([CNCF blog](https://www.cncf.io/blog/2022/09/28/istio-sails-into-the-cloud-native-computing-foundation/))。

2023-07-12 に Istio は graduate し、Kubernetes・Prometheus・Linkerd と並ぶ最高成熟度に入った ([CNCF announcement](https://www.cncf.io/announcements/2023/07/12/cloud-native-computing-foundation-reaffirms-istio-maturity-with-project-graduation/); [TechCrunch](https://techcrunch.com/2023/07/12/istio-graduates/))。

最大のアーキテクチャ転換は graduation 後に来た。2022 年から Istio はサイドカーレスのデータプレーン ambient mesh を導入し、2025 年に GA とした。ambient はデータプレーンを 2 層に分ける。per-node の Rust プロキシ ztunnel が L4 の mTLS とルーティングを担い、L7 には任意で namespace または service 単位の waypoint Envoy を立てる ([Istio blog](https://istio.io/latest/blog/2025/ambient-performance/))。名前の Istio はギリシャ語で「帆」、Kubernetes の海事テーマの流れである。

## 現在地

プロジェクトは定期的なマイナーリリースを刻む。ドキュメント基準コミット時点で直近のリリースタグは 1.30.1、master の `VERSION` ファイルは 1.31 (未リリースの開発ライン) を指す。制御プレーンは `istio/istio` にあり、ambient の L4 プロキシ ztunnel は別の Rust リポジトリ `istio/ztunnel` にある。掲げる方向性は、サイドカーモードを維持しつつ ambient を推奨デフォルトのデータプレーンにすることである。
