# 歴史

## 起源

OpenFeature は、feature flag のコードが特定ベンダーに縛られるのを止めるために存在する。それ以前は各 flag 製品 (LaunchDarkly / Split / ConfigCat ほか) が独自 SDK を出していたため、flag システムを採用・置換するにはアプリ全体の評価呼び出しを書き換える必要があった。OpenFeature はベンダー中立な評価 API と `provider` の差し込み点を定め、アプリコードに触れずに flag バックエンドを変えられるようにした (5)(7)。

このプロジェクトは 2022 年に Flagsmith が CNCF Sandbox として提出し、複数の flag ベンダーから公の支持を得たコミュニティ主導の標準化として成長した。2 つのベンダーの合併から生まれたわけではない (7)(4)。

本ディープダイブが読む参照バックエンドである flagd のリポジトリは 2022-05-26 に作成された (11)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2022 | Flagsmith が OpenFeature を CNCF に提出。flagd リポジトリは 2022-05-26 作成 (7)(11) |
| 2022 | 2022-06-17 に CNCF Sandbox 受理 (3) |
| 2023 | 2023-11-21 に TOC が Incubating 昇格を投票、2023-12-19 に公表 (3)(4) |
| 2023 | CNCF ブログが end user として eBay / Google / SAP / Spotify を明記 (4) |
| 2026 | 本書が基準とするコミットの flagd タグ `flagd/v0.16.0` (1) |

## どう進化したか

OpenFeature は評価 API と各言語 SDK として始まった。リモート評価は後発だ。OFREP (OpenFeature Remote Evaluation Protocol) はネットワーク越しに flag を評価するワイヤフォーマットを標準化し、flagd がこれを実装する (1)(12)。

flagd 自体はモノレポで、3 つの成果物を独立にリリースする。`flagd` デーモン、再利用ライブラリ `core`、そして `flagd-proxy` だ (1)。評価面は古いクライアントを壊さず拡張されてきた。flagd は 3 つのプロトコルバージョン (非推奨の schema v1 / evaluation v1 / 任意の value と variant を持つ evaluation v2) を同一 HTTP ハンドラ上で提供し、リクエスト時に多重化する (`flagd/pkg/service/flag-evaluation/connect_service.go:177-181`)。

## 現在地

OpenFeature は CNCF Incubating プロジェクトだ (3)(4)。flagd は活発に開発される参照バックエンド (2026-06-24 時点の GitHub API でコントリビュータ約 75 名、stars 934、forks 119) (11)。モノレポは `flagd` / `core` / `flagd-proxy` を別系列でリリースし続けており、基準コミットでは `flagd/v0.16.0` と `core/v0.16.0` を指す (1)。掲げる方向性は、評価 API を安定かつベンダー中立に保ちつつ、sync ソースとリモート評価のサポートを広げることだ (5)(12)。
