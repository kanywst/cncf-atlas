# Backstage

> 開発者ポータルを構築するためのフレームワーク。ソフトウェアカタログ・テンプレート・ドキュメントを、自分で所有する 1 つの社内アプリに組み上げる。

- **カテゴリ**: Developer Tools
- **CNCF 成熟度**: Incubating
- **言語**: TypeScript
- **ライセンス**: Apache-2.0
- **リポジトリ**: [backstage/backstage](https://github.com/backstage/backstage)
- **ドキュメント基準コミット**: `bccd96d` (2026-06-24, master, version `1.53.0-next.0`)

## 何をするものか

Backstage はデプロイしてそのまま使うポータルではない。自分のポータルを作るために使うフレームワークである。リポジトリは Yarn workspaces のモノレポで、`packages/*` がフレームワーク本体 (`@backstage/*` パッケージ群)、`plugins/*` が 159 個のプラグインディレクトリ (`@backstage/plugin-*`) を持つ。採用者はこれらを 1 つの React アプリと Node バックエンドに組み合わせ、社内の開発者ポータルとして運用する。

製品の中心は Software Catalog である。サービス・API・リソースと、それらを所有するチーム、そして全体の relations を追跡する。カタログの上に Software Templates (Scaffolder)、TechDocs (コードの隣にある Markdown から描画する docs-as-code)、Search、Permissions、Auth が乗る。2016 年に Spotify 社内で "System Z" というツールとして始まり、2020 年に OSS 化されて CNCF へ寄贈され、現在は Incubating 成熟度にある。

カタログは CRUD ストアのようには振る舞わない。Kubernetes を意図的に模した eventually-consistent な reconcile ループを回す。各レコードは `apiVersion`・`kind`・`metadata`・`spec`・`relations` を持つ Entity であり、処理エンジンがそれらを上流ソースから継続的に更新し続ける。

## いつ使うか

- サービス・チーム・ツールが増え、エンジニアが「自分は何を所有しているか」「この依存先の所有者は誰か」を見つけられなくなり、それを一箇所で答えたいとき。
- ポータルをコードとして所有したいとき。固定スキーマの SaaS 製品ではなく、自分のプラグインで拡張できる React アプリが欲しい場合。
- ポータルの構築と運用に数名のエンジニアを割けるとき。Backstage はフレームワークなので、立ち上げまでの時間は数日ではなく数週間。
- 1 日でターンキーに動く開発者ポータルが欲しく、固定データモデルで満足できる場合は不向き。マネージド提供や SaaS 型 IDP の方が合う。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと、entity が処理を流れる経路。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [backstage/backstage リポジトリ](https://github.com/backstage/backstage) (README, ADOPTERS.md, LICENSE, NOTICE, package.json, GitHub API 統計)、参照日 2026-06-24。
2. [Backstage docs: What is Backstage](https://backstage.io/docs/overview/what-is-backstage/)、参照日 2026-06-24。
3. [From Spotify to Open Source: The Backstory of Backstage](https://logz.io/blog/from-spotify-to-open-source/)、参照日 2026-06-24。
4. [Backstage has been accepted into the CNCF Sandbox](https://backstage.io/blog/2020/09/23/backstage-cncf-sandbox/)、参照日 2026-06-24。
5. [Backstage project joins the CNCF Incubator](https://www.cncf.io/blog/2022/03/15/backstage-project-joins-the-cncf-incubator/)、参照日 2026-06-24。
6. [KubeCon EU: Backstage, Crossplane and Others Preparing for CNCF Graduation (InfoQ)](https://www.infoq.com/news/2024/03/kubecon-cncf-incubated-projects/)、参照日 2026-06-24。
7. [Celebrating Five Years of Backstage (Spotify Engineering)](https://engineering.atspotify.com/2025/4/celebrating-five-years-of-backstage)、参照日 2026-06-24。
8. [CNCF Backstage Documentary Highlights Project Evolution](https://www.cncf.io/announcements/2026/03/25/cncf-backstage-documentary-highlights-project-evolution-from-development-to-global-open-source-standard-for-platform-engineering/)、参照日 2026-06-24。
9. [Backstage project page (CNCF)](https://www.cncf.io/projects/backstage/)、参照日 2026-06-24。
10. [Top Backstage Alternatives (Port) と Gartner 2025 IDP Market Guide の引用](https://www.port.io/blog/top-backstage-alternatives)、参照日 2026-06-24。
