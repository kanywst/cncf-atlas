# 歴史

## 起源

Linkerd は 2015 年から 2016 年頃に Buoyant の William Morgan と Oliver Gould が開発した。Twitter で動いていた Scala/JVM の RPC ライブラリ Finagle を下敷きにし、そのパターンをマイクロサービス向けの独立したネットワーキング層として再構成した。Linkerd は「サービスメッシュ」という用語を一般に広めたプロジェクトである (出典 4, 13)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | Buoyant が JVM ベースの Linkerd 1.x をリリース (出典 4, 13) |
| 2017 | CNCF に参加。Kubernetes・Prometheus・OpenTracing・Fluentd に続く 5 番目のホストプロジェクト (出典 4) |
| 2018 | Linkerd 2.x として全面リライト。データプレーンが Rust 製マイクロプロキシになり、CNCF プロジェクトとして初の Rust 採用 (出典 1, 6) |
| 2018 | CNCF Incubating ティアに受理 (出典 3) |
| 2021 | CNCF Graduated に到達。サービスメッシュとして史上初の卒業 (出典 1, 2) |
| 2024 | 第三者セキュリティ監査を実施、結果は 2025 年 2 月に公開 (出典 10) |

## どう進化したか

決定的な転換は 2018 年の 1.x から 2.x へのリライトである。Linkerd 1.x は JVM ベースで重かった。2.x 系はデータプレーンを `linkerd2-proxy` (Rust 製の専用マイクロプロキシ) に置き換え、Linkerd を CNCF 初の Rust 採用プロジェクトにした (出典 1, 6)。proxy が汎用 Envoy ビルドではないことが、Linkerd の低レイテンシ・小メモリフットプリントという評判の源泉である。

CNCF は、Linkerd が 2021 年に欧州・北米で 118% 成長し、それらの地域で Istio の採用を上回ったと報告した (出典 9)。2024 年には CNCF TAG Contributor Strategy がガバナンスレビューを実施し、ベンダー中立性を確認した (出典 11)。

## 現在地

Linkerd は動きの速い edge リリースチャネルで出荷される。このディープダイブはタグ `edge-26.6.3` 付近に固定している。コントロールプレーンと CLI は `linkerd/linkerd2` (出典 5)、データプレーンの proxy は `linkerd/linkerd2-proxy` (出典 6) で開発される。Buoyant が主要な商用バッカーであり続け、Buoyant Enterprise for Linkerd と Buoyant Cloud を提供する。プロジェクトは CNCF Graduated を維持し、中立なガバナンスモデルが確認されている (出典 3, 11)。

## 出典

- 出典 1: [CNCF Announces Linkerd Graduation](https://www.cncf.io/announcements/2021/07/28/cloud-native-computing-foundation-announces-linkerd-graduation/)
- 出典 2: [Announcing Linkerd's Graduation (linkerd.io)](https://linkerd.io/2021/07/28/announcing-cncf-graduation/)
- 出典 3: [Linkerd (CNCF projects page)](https://www.cncf.io/projects/linkerd/)
- 出典 4: [Linkerd Joins the CNCF (2017)](https://linkerd.io/2017/01/24/linkerd-joins-the-cloud-native-computing-foundation/)
- 出典 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- 出典 6: [linkerd/linkerd2-proxy (Rust data plane)](https://github.com/linkerd/linkerd2-proxy)
- 出典 9: [Linkerd surpasses Istio adoption with 118% growth in 2021](https://www.cncf.io/blog/2022/03/04/linkerd-surpasses-istio-adoption-in-europe-and-north-america-with-118-growth-in-2021/)
- 出典 10: [Linkerd 2024 Security Audit](https://linkerd.io/2025/02/18/linkerd-2024-security-audit/)
- 出典 11: [CNCF TAG Contributor Strategy: Linkerd governance review (#648)](https://github.com/cncf/tag-contributor-strategy/issues/648)
- 出典 13: [What is a service mesh? (linkerd.io)](https://linkerd.io/what-is-a-service-mesh/)
