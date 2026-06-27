# 歴史

## 起源

Cadence は 2015 年、Uber の Seattle オフィスで作り始められた。Maxim Fateev と Samar Abbas が合流して作ったもので、2 人とも以前から同じ問題に取り組んでいた。AWS Simple Workflow Service と Azure Durable Task Framework である。Cadence はその durable execution の発想を、別のスタックでセルフホスト型のシステムとして再実装した ([ia40 インタビュー](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev))。

コードは 2017 年に OSS 化された。README は今もこのプロジェクトを "open-source platform since 2017" と記している (`README.md:8`)。GitHub リポジトリの作成日は 2017-02-21 である。Uber 内部ではゼロから 3 年で約 100 ユースケースに成長し、HashiCorp / Coinbase / DoorDash などの外部企業が採用した ([ia40 インタビュー](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | Fateev と Abbas が Uber Seattle で Cadence を開始 ([ia40](https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev))。 |
| 2017 | OSS 化。GitHub リポジトリ作成は 2017-02-21 (`README.md:8`)。 |
| 2019 | 創業者 2 人が Uber を離れ Temporal を創業、Cadence を fork ([Amplify Partners](https://www.amplifypartners.com/blog-posts/our-investment-in-temporal))。 |
| 2025 | 2025-05-22 に CNCF Sandbox 受理 ([CNCF](https://www.cncf.io/projects/cadence-workflow/))。 |
| 2026 | 最新の安定リリース `v1.4.0` を 2026-02-27 に公開。 |

## どう進化したか

このプロジェクト史上最大の分岐は文字通り fork だった。2019 年、オリジナルの創業者 2 人が Uber を離れて Temporal を創業し、Cadence のコードベースを fork した ([Amplify Partners](https://www.amplifypartners.com/blog-posts/our-investment-in-temporal))。Temporal はワイヤフォーマットを Thrift から protobuf へ、トランスポートを独自 RPC から gRPC へ移行し、MIT ライセンスで配布している。共通の系譜は今も Cadence ツリーの中に見える。ソースファイル冒頭には、ソフトウェアの一部の著作権を Temporal Technologies に帰属させる行が残っている (`service/history/engine/engineimpl/start_workflow_execution.go:2`)。

Cadence は Uber の管理下にとどまり、Apache-2.0 プロジェクトとして進化を続けた。Go モジュールパスは今も `github.com/uber/cadence` のままで (`go.mod:1`)、これは元の所有者の名残である。一方 GitHub organization は現在 `cadence-workflow` になっている。

2025 年 5 月、Uber は Cadence を CNCF に寄贈し、Sandbox プロジェクトとして受理された ([Uber Blog](https://www.uber.com/us/en/blog/cadence-workflow-joins-the-cloud-native-computing-foundation/)、[cncf/sandbox issue #368](https://github.com/cncf/sandbox/issues/368))。リポジトリは `cadence-workflow` GitHub organization へ移り、コミュニティチャットは CNCF Slack ワークスペースの `#cadence-users` チャンネルへ移った。

## 現在地

Cadence は中立ホストを持つ CNCF Sandbox プロジェクトであり、4 名の Technical Steering Committee と複数のメンテナによって運営されている (`MAINTAINERS.md`)。ビルドは Go 1.24 を使う (`go.mod:3`)。最新の安定リリースは `v1.4.0` (2026-02-27) で、その上に `v1.4.1-prerelease31` のような prerelease タグが切られている。プロジェクトは公式 Go / Java SDK と Web UI を別リポジトリとして提供し、ここで扱うサーバエンジンが現在も活発に開発される中核である。
