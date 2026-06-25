# 歴史

## 起源

Emissary-Ingress は 2014 年、後に Ambassador Labs へ改名する Datawire 社で、Ambassador API Gateway という名前で誕生した。CEO の Richard Li によれば、Envoy の作者 Matt Klein が Microservices Practitioner Summit で行った講演に触発され、その 3〜4 ヶ月後に最初の Envoy ベース版を作ったという ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/))。1.0 リリースは 2020 年 1 月である ([CNCF blog](https://www.cncf.io/blog/2021/04/13/emissary-ingress-formerly-ambassador-is-now-a-cncf-incubating-project/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2014 | Datawire で Ambassador API Gateway として誕生、Envoy Proxy を基盤に構築 |
| 2020 | バージョン 1.0 リリース |
| 2021 | CNCF へ寄贈し Emissary-Ingress へ改名、Incubating として直接受理 |

## どう進化したか

プロジェクトは 2021-04-13 に CNCF へ寄贈され、同時に Ambassador から Emissary-Ingress へ改名した。Richard Li は、会社名に紐づく Ambassador の商標を CNCF へ譲渡できなかったため新しい名前を選んだ (「emissary」は別種の「ambassador」) と説明している。Sandbox を経ずいきなり Incubating に受理されたのは、旧名で既に著名なプロジェクトだったためである。CNCF で Contour に次ぐ 2 番目の Ingress コントローラとなった ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)、[CNCF projects](https://www.cncf.io/projects/emissary-ingress/))。

OSS の Emissary-Ingress は今も商用 Ambassador Edge Stack のコアであり、Edge Stack はその上に ACME/TLS 自動化、OAuth/OIDC、レート制限、開発者ポータルを重ねる ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/))。

## 現在地

執筆時点の最新リリースは `v4.1.0` (2026-05-19) で、このディープダイブはタグ `v4.0.1` 付近のコミット `65b0dd9ae` に固定している。The New Stack によれば、親会社の Ambassador Labs は直接の関与から手を引き、プロジェクトはコミュニティ運営色を強めた ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/))。ガバナンスは [GOVERNANCE.md](https://github.com/emissary-ingress/emissary/blob/master/Community/GOVERNANCE.md) に文書化されている。
