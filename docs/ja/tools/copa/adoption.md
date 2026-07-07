# 採用事例・エコシステム

## 誰が使っているか

以下の組織はプロジェクトの [adopters ページ](https://project-copacetic.github.io/copacetic/website/adopters) に記載されている (参照 2026-06-28)。Copa をどう統合しているかで分けてある。別ツールから呼ぶ CLI としての利用か、GitHub Action を通じた利用かである。このディープダイブは同ページが引くものだけを載せ、それ以外は加えない。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Kubescape | Copa 経由でイメージをパッチ。スキャン工程に Grype を使う | [adopters ページ](https://project-copacetic.github.io/copacetic/website/adopters) |
| Devtron | CI/CD パイプライン内の Copacetic プラグイン | [adopters ページ](https://project-copacetic.github.io/copacetic/website/adopters) |
| Helmper | Helm チャート内で参照されるイメージをパッチ | [adopters ページ](https://project-copacetic.github.io/copacetic/website/adopters) |
| Verity | Copa CLI を利用 | [adopters ページ](https://project-copacetic.github.io/copacetic/website/adopters) |
| AKS Periscope, Azure Workload Identity, AI Kit, Unoplat | Copa の GitHub Action を利用 | [adopters ページ](https://project-copacetic.github.io/copacetic/website/adopters) |

## 採用のシグナル

2026-06-28 時点 (`gh repo view project-copacetic/copacetic`): スター 1,652、フォーク 120。GitHub contributors API のページネーションではおよそ 48 名のコントリビュータ。プロジェクトは CNCF Sandbox (2023-09-19 受理) で、README に OpenSSF Best Practices バッジ (project 8031) と OpenSSF Scorecard バッジを掲示している (`src/README.md:5-6`)。リリースは定期的にタグ付けされ、`v0.14.1` が 2026-05-18、ドキュメント基準コミット `0f6f0ab` はその後の `main` 上にある。

## エコシステム

Copa はスキャナとコンテナランタイム/レジストリの間に位置する。内蔵のレポートパーサは Trivy を扱い、他のスキャナは `copa-<scanner>` プラグインバイナリで連携する。Grype ベースのフローはこの仕組みで動く (`src/pkg/report/report.go:52-55`)。コアの CLI の周りには、GitHub Actions 用の [copa-action](https://github.com/project-copacetic/copa-action) と、GUI フロー向けの Docker Desktop Extension がある。出力では Docker/Podman へのロード、レジストリへのプッシュ、ローカル OCI レイアウトへの書き出しができ、何をパッチしたかを記述する OpenVEX 文書を出力する。

## 代替候補

Copa の特徴は、スキャナのレポートを駆動源として既存イメージを追加レイヤーとしてパッチし、イメージ発行者でない者でも実行できる点にある。

| 代替 | 違い |
| --- | --- |
| 更新済みベースイメージでの再ビルド | きれいなイメージが得られるが、Dockerfile・ビルドコンテキスト・発行パイプラインの制御が要る。Copa はそれらが無い状況でパッチする |
| Chainguard / Wolfi イメージ | 既存イメージをパッチするのではなく、新たに再ビルドした最小ベースを出して修正する。Copa は既に使われているイメージの寿命を延ばす (`src/README.md:29-54`) |
| 派生 Dockerfile での `apt upgrade` | 古いパッケージを全て更新しレイヤーを再ビルドする。Copa はスキャナが指摘したパッケージだけに手を入れ、変更を 1 レイヤーに留める |
