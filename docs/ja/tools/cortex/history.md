# 歴史

## 起源

Cortex は 2016 年 6 月の設計文書 "Project Frankenstein: A Multi Tenant, Scale Out Prometheus" に始まり、続いて PromCon 2016 で同名のトークが行われた。発案は Tom Wilkie (当時 Weaveworks、後に Grafana Labs) と Prometheus 共同作者 Julius Volz で、Weaveworks の hosted Prometheus サービスのエンジンとして動いていた ([Grafana Labs blog](https://grafana.com/blog/cortex-the-scalable-prometheus-project-has-advanced-to-incubation-within-cncf/))。

発端となった課題は、単体の Prometheus が 1 台のマシンのスループットとストレージで頭打ちになり、HA 構成も弱く、1 クラスタ内で多数の独立した Prometheus テナントを隔離できないこと。Cortex は remote write を中央で受信し水平にシャーディングすることでこれに対処する ([CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | "Project Frankenstein" 設計文書と PromCon トーク。Weaveworks 発。 |
| 2018 | CNCF Sandbox 受理 (2018-09-20)。 |
| 2020 | CNCF Incubating 昇格 (2020-08-20)。Thanos と同時アナウンス。 |
| 2026 | 能動的な開発が継続。`v1.21.1` を 2026-06-04 にリリース。 |

## どう進化したか

最大のアーキテクチャ転換はストレージだった。当初の chunks storage エンジンは `v1.10.0` で deprecated となり、Prometheus TSDB と Thanos のオブジェクトストレージブロックを基盤とする blocks storage に置き換わった。この移行を通じて、Cortex は shipper・store-gateway・compactor のコードを Thanos と共有するようになった ([CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/))。

ガバナンスも同じ歩調で成熟した。incubation 時点でプロジェクトは 4 社にまたがる 8 名の maintainer (Grafana Labs, Microsoft, Splunk, Weaveworks) を報告し、EA・Gojek・REWE Digital を 1500 万 active series を超える本番ユーザとして挙げた ([CNCF blog](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/))。

2022 年に Grafana Labs は Cortex を Grafana Mimir に fork した。この fork は事実だが、Cortex を止めたわけではない。upstream リポジトリは独立にリリースを出し続けている。

## 現在地

Cortex は能動的に開発が続く CNCF Incubating プロジェクトのまま。pinned コミット `42c26e7` は 2026-06-23 に push され、リポジトリは archived されておらず、`v1.21.1` が 2026-06-04 にリリースされた。一部のサードパーティ比較記事は Mimir fork 後の Cortex を停滞または maintenance mode と書くが、その主張はリポジトリの最近のリリースとコミットに矛盾するため、本書では採用しない。
