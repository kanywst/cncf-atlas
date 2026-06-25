# 歴史

## 起源

Thanos は 2017 年末、ロンドンの Improbable で Bartłomiej Płotka と Fabian Reinartz が始め、2018 年初頭に公開された。動機は実運用上の課題だった: Prometheus を、際限なく大きくなるローカルディスクに頼らずに、長期保存とグローバルビューへスケールさせること。Prometheus コア開発者の Fabian Reinartz と Bartłomiej Płotka は、その設計と起源をカンファレンストーク [Fabian Reinartz and Bartlomiej Plotka: Thanos](https://www.youtube.com/watch?v=l8syWgJ98sk) で語っている。

名前は設計を映している: 複数コンポーネントが組み合わさり、Prometheus 単体にはない力を与える。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | Improbable で Bartłomiej Płotka と Fabian Reinartz が開始。 |
| 2018 | プロジェクトを公開。 |
| 2019 | CNCF に Sandbox プロジェクトとして受理 (2019-07-14)。 |
| 2020 | CNCF Incubating へ昇格 (2020-08-19)。 |
| 2026 | 直近の安定版 `v0.41.0` (2026-02-12)、`v0.42.0-rc.0` を 2026-06-23 に切り出し。 |

## どう進化したか

Thanos は当初、既存の Prometheus サーバーへのサイドカー + オブジェクトストレージ拡張として始まった: サイドカーが TSDB ブロックを上げて StoreAPI を公開し、store gateway がそのブロックを返し、querier が全体をマージする。push 型の取り込みパスである Receive コンポーネントは後から追加され、スクレイプできないワークロードが Thanos に remote-write できるようになった。今は 2 つの取り込みスタイルが並立し、[recon ノート](https://github.com/thanos-io/thanos) はこれをプロジェクトの 2 つの入口と表現している。

ガバナンスは単一企業から CNCF のマルチベンダ運営へ移った。[TOC の incubation 告知](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) がその一歩を示し、`MAINTAINERS.md` に挙がる core maintainer は Google、Polar Signals、Vinted、Red Hat、AWS、Shopify、Cloudflare など複数の所属にまたがる。

## 現在地

Thanos は CNCF Incubating プロジェクト ([CNCF プロジェクトページ](https://www.cncf.io/projects/thanos/) 参照) で、マルチベンダ運営下にある。リリースはおおむね 6 週ごとに、GitHub Releases の単一バイナリと `quay.io/thanos/thanos` コンテナイメージとして出る。[CNCF TAG Security 自己評価](https://tag-security.cncf.io/community/assessments/projects/thanos/self-assessment/) がセキュリティ姿勢を文書化している。
