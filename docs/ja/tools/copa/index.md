# Copacetic

> Copacetic (Copa) は、既存のコンテナイメージに対し、修正済みパッケージだけを新しいレイヤーとして適用することで既知の脆弱性をパッチする。スキャナのレポートを駆動源とし、Dockerfile からの再ビルドを伴わない。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Sandbox (2023-09-19 受理)
- **言語**: Go (`go 1.25.11`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [project-copacetic/copacetic](https://github.com/project-copacetic/copacetic)
- **ドキュメント基準コミット**: `0f6f0ab` (main, 2026-06-24)

## 何をするものか

Copacetic はコンテナイメージをその場でパッチするコマンドラインツールである。Trivy などのスキャナが出した脆弱性レポートを読み、修正済みのパッケージバージョンを解決し、そのパッケージだけを取得して、BuildKit を使ってイメージに追加レイヤーとして書き込む。結果として、脆弱な OS パッケージが更新された新しいイメージタグが得られる。これを元の Dockerfile やビルドコンテキストなしで生成する (`src/README.md:38-42`)。

プロジェクトは 3 つの設計目標を掲げる。再ビルドを要求せず既存イメージをそのままパッチすること、スキャナやパッケージマネージャの既存エコシステムを置き換えず協調すること、そしてイメージ発行者でない者 (プラットフォームやセキュリティのチーム) がパッチを適用できるようにすることである (`src/README.md:46-54`)。CLI 自体は小さく、Cobra を通して配線された `patch` コマンドと `generate` コマンドを持つ (`src/main.go:42-43`)。重い処理は BuildKit (Docker の背後にあるビルドエンジン) に委譲され、パッチ後のイメージをビルドグラフとして解く。

Copacetic は、自分で作っていないイメージを運用し、既知の CVE を含まない状態に保つよう求められるチーム向けである。上流のベースイメージ再ビルドを待つと数日かかることがあり、Dockerfile が存在しないなら Dockerfile のフォークで `apt upgrade` を再実行することもできない。Copa はスキャナのレポートを最小限のパッチレイヤーに変えることで、その隙間を埋める。

## いつ使うか

- 自分で作っていないイメージを運用しており、発行者が新しいベースイメージを出す前に OS パッケージの CVE を素早く修正したい。
- パッチを小さな追加レイヤーに留め、イメージの残りのキャッシュを壊さずに保ちたい。
- スキャナのレポートで駆動し、指摘されたパッケージだけに手を入れたい。
- パッケージマネージャをイメージ内で実行できない distroless やシェルなしのイメージをパッチしたい。
- Dockerfile を自分で管理していて更新済みベースで単純に再ビルドできるなら不向き。その場合はパッチを重ねるよりきれいな結果になる。
- スキャナではない。Copa は Trivy などのレポートを消費する側であり、脆弱性自体は見つけない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとパッチの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動くパッチ。

## 出典

1. [project-copacetic/copacetic (GitHub)](https://github.com/project-copacetic/copacetic) (参照 2026-06-28)
2. [Copacetic README](https://github.com/project-copacetic/copacetic/blob/main/README.md) (参照 2026-06-28)
3. [Copacetic ソース (固定コミット 0f6f0ab)](https://github.com/project-copacetic/copacetic/tree/0f6f0ab2c3ee4590530a621094502047fad127cf) (参照 2026-06-28)
4. [Releases](https://github.com/project-copacetic/copacetic/releases) (参照 2026-06-28)
5. [CNCF プロジェクトページ: Copa](https://www.cncf.io/projects/copa/) (参照 2026-06-28)
6. [CNCF Sandbox onboarding issue #152](https://github.com/cncf/sandbox/issues/152) (参照 2026-06-28)
7. [CNCF Sandbox application issue #41](https://github.com/cncf/sandbox/issues/41) (参照 2026-06-28)
8. [Microsoft Open Source: Project Copacetic](https://opensource.microsoft.com/blog/2024/09/18/project-copacetic-quick-and-efficient-container-image-patching/) (参照 2026-06-28)
9. [Copacetic adopters ページ](https://project-copacetic.github.io/copacetic/website/adopters) (参照 2026-06-28)
10. [Copacetic installation ドキュメント](https://project-copacetic.github.io/copacetic/website/installation) (参照 2026-06-28)
11. [Copacetic quick start](https://project-copacetic.github.io/copacetic/website/quick-start) (参照 2026-06-28)
12. [project-copacetic/copa-action (GitHub Action)](https://github.com/project-copacetic/copa-action) (参照 2026-06-28)
