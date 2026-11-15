# Meshery

> Kubernetes とその周辺インフラをセルフホストで管理するツール。やりたい構成を design として書くと、Meshery が構成要素どうしの関係を検査し、サーバが 1 つ以上のクラスタに適用する。

- **カテゴリ**: Provisioning & Infrastructure
- **CNCF 成熟度**: Incubating
- **言語**: Go (サーバと CLI)、TypeScript/React (UI)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [meshery/meshery](https://github.com/meshery/meshery)
- **ドキュメント基準コミット**: `68d542af` (2026-11-15、`master`、`v1.0.79` の後)

## 何をするものか

Meshery は Web UI と CLI (`mesheryctl`) を備えたサーバである。Kubernetes クラスタを接続すると、そこで何が動いているかと、自分が管理できるリソースの種類を把握する。2019 年に Istio や Linkerd などのサービスメッシュを管理するための management plane として始まり、今は Kubernetes リソース全般と、数百の統合を扱う。各統合は **model**、つまりある技術のリソース種別を定義する JSON の集まりとして記述される ([CNCF ブログ](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/))。

作業の単位は **design** である。design は欲しいコンポーネント (Deployment、Istio の VirtualService、Namespace など) とその間の関係を並べた宣言的な文書だ。Meshery はその関係を評価し (たとえば namespaced なリソースに必要な Namespace を追加する)、それから design を配備する。配備は push 型である。Meshery Server が接続中の各クラスタの kubeconfig を持ち、自分で API server にリソースを適用する。その後に reconcile ループは回さない。クラスタの中身を知るためには、MeshSync というコンポーネントがクラスタの状態を監視し、変化をサーバに送り返す。

README は Meshery を、視覚的で協調的な GitOps を備えた「self-service engineering platform」と呼んでいる。想定する利用者は、インフラを共有して把握し、適用前に変更を準備したいプラットフォームチームや運用チームである ([README](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/README.md))。Meshery はクラスタのコントロールプレーンの外側にいる。Kubernetes API のクライアントであり、UI とリソース種別のレジストリとデータベースを持った `kubectl` に近い。

## いつ使うか

- Kubernetes のインフラを図や文書として設計し、部品どうしの関係を確認し、1 か所から複数のクラスタに配備したいとき。
- 配備する design と並べて、クラスタ内に何があるかの最新の一覧 (MeshSync 経由) を持ちたいとき。
- サービスメッシュなどのアドオンを管理していて、それらのリソース種別を知っているツールを 1 つにまとめたいとき。負荷試験も組み込まれている (Meshery は fortio を使う)。

Git を真実の源にして継続的に drift を直したい場合には向かない。Meshery は 1 回の要求につき 1 回 design を適用する。Argo CD や Flux は Git から pull して継続的に reconcile し、Crossplane は Kubernetes API そのものを通して reconcile する。

## このディープダイブの構成

- [歴史](./history): 起源、マイルストーン、存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が使い、周りに何があるか。
- [内部実装](./internals): 重要なコードパスをソースから読む。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [meshery/meshery リポジトリ (`68d542af`)](https://github.com/meshery/meshery/tree/68d542afa9e40e15e3d032bf3ed1d10eb2347b62)
2. [GitHub API repos/meshery/meshery](https://api.github.com/repos/meshery/meshery)
3. [meshery/meshery のリリース](https://github.com/meshery/meshery/releases)
4. [CNCF プロジェクトページ: Meshery](https://www.cncf.io/projects/meshery/)
5. [cncf/landscape `landscape.yml`](https://github.com/cncf/landscape/blob/master/landscape.yml)
6. [cncf/toc#1386 Meshery Incubation Application](https://github.com/cncf/toc/issues/1386)
7. [Meshery becomes a CNCF Incubating project (CNCF ブログ)](https://www.cncf.io/blog/2026/10/07/meshery-becomes-a-cncf-incubating-project/)
8. [CNCF Adopts Meshery to Advance Service Mesh Management (Layer5)](https://layer5.io/company/news/cncf-adopts-meshery-to-advance-service-mesh-management/)
9. [Meshery lands in the CNCF Landscape (Layer5)](https://layer5.io/blog/announcements/meshery-lands-in-the-cncf-landscape)
10. [Meshery v1.0 is Generally Available](https://meshery.io/blog/meshery-v1.0-general-availability/)
11. [Meshery docs: Architecture](https://docs.meshery.io/concepts/architecture)
12. [Meshery docs: Logical Concepts](https://docs.meshery.io/concepts/logical)
13. [meshery/meshery ADOPTERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/ADOPTERS.md)
14. [Meshery docs: Quick Start Guide](https://docs.meshery.io/installation/quick-start)
15. [Meshery の環境変数](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/docs/content/en/installation/advanced/environment-variables.md)
16. [meshery/meshery MAINTAINERS.md](https://github.com/meshery/meshery/blob/68d542afa9e40e15e3d032bf3ed1d10eb2347b62/MAINTAINERS.md)
17. [Meshery DevStats](https://meshery.devstats.cncf.io/)
18. [cncf/toc#1264 最初の Incubation 申請](https://github.com/cncf/toc/issues/1264)
19. [コミット: Port OPA/Rego policy engine to native Go](https://github.com/meshery/meshery/commit/31b22b91c95a72df2fc456a8a45694ddcafc08d2)
