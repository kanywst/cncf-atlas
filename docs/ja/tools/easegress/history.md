# 歴史

## 起源

Easegress はクラウドネイティブ基盤ソフトウェアを手がけた企業 MegaEase が開発した。前身は Ease Gateway と呼ばれ、のちに Easegress へ改名された (MegaEase 製品ページ)。動機はこうだ。既存のゲートウェイはクラウドネイティブ以前の設計で、監視やサービスディスカバリが弱かった。よくある Nginx + C + Lua のスタックは拡張が難しく、C は難解で Lua は表現力に欠ける。そこで MegaEase は次世代ゲートウェイを Go で作ることにした (MegaEase「The Next Generation Service Gateway」)。

GitHub リポジトリは 2021-05-28 に作成され、最初のリリース v1.0.0 は 2021-06-02 に出た (GitHub API)。プロジェクトは当初 `megaease/easegress` として公開され、のちに独立 org の `easegress-io` へ移った。Go のモジュールパスは今も `github.com/megaease/easegress/v2` であり、その出自の名残になっている (`go.mod:1`)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | リポジトリ作成 (2021-05-28)、初回リリース v1.0.0 (2021-06-02) |
| 2022 | v2.0.0: プロトコル非依存の pipeline とトラフィックオーケストレーションの刷新 |
| 2023 | CNCF Sandbox 採択 (2023-12-19) |
| 2026 | v2.11.x 系が活発。本稿は `3bdb192` (タグ `v2.11.0` の近傍) を基準 |

## どう進化したか

明確な転換点は 2 番目のメジャーリリース v2.0.0、2022 年 8 月頃だ。トラフィックオーケストレーションを刷新し、プロトコル非依存の pipeline を導入した (MegaEase v2.0 発表)。この発表はメンテナが正した設計ミスにも触れている。v1.x では resilience 機能 (サーキットブレーカ・タイムアウト・リトライ) を独立した filter にしていたが、これは制御ロジックと業務ロジックを混ぜる誤りだった。v2.0 ではこれらを Proxy filter に埋め込む形へ変えた。この判断は今のコードにも表れている。Proxy は `InjectResiliencePolicy` を実装し、ポリシを自分の pool へ配る (`pkg/filters/proxies/httpproxy/proxy.go:362`)。resilience は pipeline の独立したホップとしては存在しない。

もう 1 つの転換はガバナンスだ。Easegress は 2023-12-19 に CNCF Sandbox へ採択された。Copa・KCL・Kuasar などと同じバッチである (CNCF プロジェクトページ; cncf/sandbox #193)。この時期にリポジトリは MegaEase の名前空間からベンダ中立な `easegress-io` org へ移ったが、内部のモジュールパスはそのまま残された。

直近の開発は AI/LLM ゲートウェイ機能へ向かっている。ツリーには `pkg/filters/aigatewayproxy` と `pkg/object/aigatewaycontroller` があり、OpenAI や Anthropic といったプロバイダへのプロキシと、Anthropic と OpenAI のリクエスト形式間の変換を実装している。

## 現在地

Easegress は活発な CNCF Sandbox プロジェクトである。基準コミット `3bdb192` は `main` 上で、タグ `v2.11.0` (2026-03-17) の直後に位置し、コードベースは Go 1.26 を対象とする (`go.mod:3`)。リポジトリは MegaEase の名前空間を離れて `easegress-io` org 配下にある。本ディープダイブで使ったソースクローンは depth 1 の shallow clone のため、`git blame` などコミット単位の履歴は追えない。したがって上記のマイルストーンは個々のコミットではなく、リリース・ブログ記事・CNCF の記録に紐づけている。
