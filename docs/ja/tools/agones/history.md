# 歴史

## 起源

Agones は 2017 年に Google と Ubisoft の共同プロジェクトとして始まった。両社はそれぞれ専用ゲームサーバ向けに非公開のクラスタ管理とスケーリングのコードを書いており、それを Kubernetes のコントローラとカスタムリソースに基づくアプローチで置き換えるのが狙いだった。README はその目標を端的に述べている。Kubernetes は標準のツールと API を使って専用ゲームサーバプロセスを作成・実行・管理・スケールするネイティブな能力を得る、というものだ (`README.md:14`, `README.md:18`)。

Google Cloud は 2018-03-14 に Agones を公開し、v0.1 alpha として OSS リリースした (出典 4)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | Google と Ubisoft の協業として発足 (出典 2)。 |
| 2018 | 2018-03-14 に Google Cloud が v0.1 alpha として公開・OSS 化 (出典 4)。 |
| 2026 | issue #4421 "Moving Agones to CNCF" を 2026-01-13 に起票 (出典 6)。 |
| 2026 | 2025-12-21 に CNCF Sandbox へ受理 (出典 3)。 |
| 2026 | リポジトリを `googleforgames/agones` から `agones-dev/agones` org へ移管。2026-03-23 にコミュニティ主導ガバナンスへの移行を告知 (出典 2)。 |

## どう進化したか

中核モデルは初期リリースから安定している。宣言的な `GameServer` リソース、それを調停するコントローラ、そしてゲームバイナリが自身のライフサイクルを報告できる SDK サイドカーである。上位リソースは時間をかけてその上に積み上げられた。`GameServerSet` は同一のゲームサーバ群を所定数維持し、`Fleet` はそのセットのローリング更新を司り、`FleetAutoscaler` がスケールし、`GameServerAllocation` でマッチメイカが Ready なサーバを確保する。これらは今日 `pkg/apis` 配下に定義されている同じリソース群である (`pkg/apis/agones/v1/gameserver.go:197`, `pkg/apis/agones/v1/fleet.go:41`)。

直近で最も大きな転換はコードではなくガバナンスである。長年 Google 主導だった Agones は CNCF に寄贈され Sandbox に入った。リポジトリはベンダ中立な org に移り、開発はコミュニティ主導ガバナンスへ開かれていく (出典 2)。基準コミット時点でプロジェクトは `1.59.0-dev` 線上にある (`install/helm/agones/Chart.yaml:18` が `appVersion: "1.59.0-dev"` を固定)。

## 現在地

Agones はマイナーリリースを頻繁に出している (基準コミットに最も近いタグは `v1.58.x` 系で、`1.59.0-dev` が進行中: `install/helm/agones/Chart.yaml:19`)。基準コミットは `PortRanges` フィーチャゲートを Beta から Stable に昇格させており、これはプロジェクトが続けるフィーチャゲート駆動の進化の一例だ。CNCF 受理後の方針は、創設企業を超えてメンテナの裾野を広げ、Kubernetes ネイティブかつクラウド非依存の設計を保ちながらオープンなコミュニティガバナンスで運営することである (出典 2, `GOVERNANCE.md`)。
