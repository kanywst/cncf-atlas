# 歴史

## 起源

Headlamp を作ったのは、ベルリンの Kinvolk GmbH である。Flatcar Container Linux や Inspektor Gadget で知られる会社だ。GitHub リポジトリは 2019-11-08 に作成され、最初の公開コミットは 2020 年中頃に入り、`v0.1.0` タグは 2020-10-16 付である (GitHub API)。動機は Kinvolk が既存ツールに見た欠落だった。オープンソースでモダン、かつ高度にカスタマイズ可能な Kubernetes UI が必要であり、Kubernetes Dashboard のような閲覧中心のスコープを越えて、書き込み操作・RBAC を反映したビュー・プラグイン拡張までを狙った (Headlamp ブログ, 2023-10-12)。

フロントエンドの API 層はゼロから書かれたのではない。ソース中の著作権表示がその出自を記録している。このモジュールは「originally taken from the K8dash project before modifications」であり、Apache-2.0 の下、「Copyright © 2020 Eric Herbrandson」「Copyright © 2020 Kinvolk GmbH」とある (`frontend/src/lib/k8s/apiProxy/index.ts:17-24`)。Headlamp は K8dash のクライアント側 API アクセスを出発点に、その上へ独自のバックエンド・プラグインシステム・リソースモデルを築いた。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | GitHub リポジトリ作成 (2019-11-08) |
| 2020 | Kinvolk が Headlamp をオープンソース公開。`v0.1.0` タグ (2020-10-16)、フロントの API 層は K8dash 由来 |
| 2021 | Microsoft が Kinvolk を買収 (2021-04-29)。Headlamp は Apache-2.0 のまま OSS 継続 |
| 2023 | CNCF Sandbox 受理 (2023-05-17)。公式アナウンス (2023-10-12) |
| 2025 | Kubernetes SIG UI のサブプロジェクト化。リポが `headlamp-k8s/headlamp` から `kubernetes-sigs/headlamp` へ移動 |
| 2026 | `v0.43.x` リリースライン。本稿は `dab1a6c5` (タグ `v0.43.0`) を基準にする |

## どう進化したか

Headlamp の所有者を変えつつライセンスは変えなかった転換が 2 つある。1 つ目は企業側だ。2021-04-29、Microsoft はコンテナ関連の取り組みを加速するため Kinvolk を買収し、Brendan Burns が Azure ブログで発表した。Headlamp は Apache-2.0 の OSS のまま残り、Microsoft が主要スポンサーとなった。その関係はコードベースの下流に表れている。Azure の AKS デスクトップ体験は Headlamp の上に作られている (ADOPTERS.md)。

2 つ目はガバナンスだ。Microsoft は Headlamp を CNCF に寄贈し、2023-05-17 に Sandbox レベルで受理された (CNCF プロジェクトページ、cncf/sandbox #25)。公式アナウンスは 2023-10-12 に続いた (Headlamp ブログ)。さらに 2025 年、KubeCon + CloudNativeCon Europe 2025 (ロンドン) の Microsoft キーノートで発表され、Headlamp は Kubernetes 本体プロジェクトの一部である SIG UI のサブプロジェクトになった。リポは `headlamp-k8s/headlamp` から `kubernetes-sigs/headlamp` へ移動し、README の NOTICE がその移動を記録している (README、Cloud Native Now)。コンテナイメージは当面 `ghcr.io/headlamp-k8s` に残る。

その結果、Headlamp は明記すべき二重ステータスを持つ。CNCF ランドスケープ上は依然 Sandbox プロジェクトであり、Kubernetes の内側では SIG UI サブプロジェクトである。両者は矛盾しないが、どちらか一方だけでは今のプロジェクトの居場所を言い表せない。

## 現在地

Headlamp は安定したリリース頻度で活発に開発されており、基準コミット時点で `v0.43.x` ラインが現行だ。`v0.43.0` は 2026-06-16 に公開され、本稿はその 1 コミット後の `dab1a6c5` (2026-07-06) にツリーを固定している。プロジェクトは OpenSSF Best Practices バッジと OpenSSF Scorecard を持つ (README)。掲げる方向性は、CNCF Sandbox プロジェクトであり続けつつ SIG UI サブプロジェクトとして Kubernetes のグラフィカル UI となること、そして fork ではなくプラグインで拡張されることである。
