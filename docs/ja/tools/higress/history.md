# 歴史

## 起源

Higress は Alibaba 社内で生まれた。解こうとした問題は具体的だった。同社は nginx フォークである Tengine を運用しており、nginx は経路変更のたびに設定を reload する。long-lived な接続を保持するサービスにとって、その reload は破壊的だった。加えて nginx モデルは gRPC や、Alibaba 独自の RPC フレームワークである Dubbo への負荷分散が弱かった。Higress はその reload ペナルティなしにトラフィックをルーティングし、これらのプロトコルを扱うために作られた (README)。

Alibaba Cloud はこれを基盤に商用 API ゲートウェイ製品を構築し、99.99% 可用性をうたう。社内では Higress が通義百煉 (Tongyi Bailian) の model studio や PAI 機械学習プラットフォームといった中核 AI アプリケーションを支える (README)。GitHub リポジトリの作成は 2022-10-27 (リポジトリメタデータ)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2022 | GitHub にリポジトリ作成 (2022-10-27) |
| 2023-2025 | `v0.x` から `v1.0.0` を経て `v2.x` 系へ進み、AI ゲートウェイと MCP サーバホスティングへ軸足を移す |
| 2026 | CNCF が Higress の Sandbox 参加を公表 (2026-03-25)。本書は `bd9c4c5` (タグ `v2.2.3`、2026-06-25 の近傍) に対して記述 |

## どう進化したか

プロジェクトの歩みで最も明確な変化はスコープである。初期は nginx-reload と Dubbo の問題に向けた Ingress・マイクロサービスゲートウェイだった。`v2.x` 系を通じて重心は AI に移った。多数の LLM プロバイダを前段に置く `ai-proxy` プラグイン、キャッシュなどの AI 特化プラグイン、そして MCP (Model Context Protocol) サーバのホスティングである。CNCF の公表は Higress を、Envoy と Istio の上に構築され、トラフィック・マイクロサービス・AI の各ゲートウェイを単一コントロールプレーンに統合する AI ネイティブ API ゲートウェイと説明する (CNCF ブログ)。

もう 1 つの変化はガバナンスである。2026-03-25、CNCF は Higress が TOC 投票を通過し Sandbox として参加したと公表した。この寄贈に伴い、canonical リポジトリは `higress-group` 組織へ移った。ただし 1 点は移動しなかった。`go.mod` の Go モジュールパスは今も `github.com/alibaba/higress/v2` であり、リポジトリが `higress-group` 配下に移っても import は Alibaba パスのままだ (`go.mod:1`)。

## 現在地

Higress はアクティブな CNCF Sandbox プロジェクトである。`v2.x` 系が現行で、`v2.2.3` は 2026-06-25 にタグ付けされ、基準コミット `bd9c4c5` はその数コミット先の `main` にある。開発の中心はルーティングコアの上に載る AI ゲートウェイと MCP ホスティング機能だ。プロジェクトは 2026-07-09 時点で約 182 contributors、8,816 stars、1,186 forks を示す (リポジトリシグナル)。単一ベンダー起源より広い contributor 層だが、主たる推進役は依然として Alibaba である。
