# Headlamp

> Headlamp は Kubernetes 向けの拡張可能な Web / デスクトップ UI であり、あらゆるクラスタ API へ自前のバックエンドプロキシ経由で到達し、プラグインが実行時にページを追加できる。

- **カテゴリ**: Developer Tools
- **CNCF 成熟度**: Sandbox (2023-05-17 採択)。加えて 2025 年より Kubernetes SIG UI のサブプロジェクト
- **言語**: Go (バックエンド) と TypeScript/React (フロントエンド)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [kubernetes-sigs/headlamp](https://github.com/kubernetes-sigs/headlamp)
- **ドキュメント基準コミット**: `dab1a6c5` (タグ `v0.43.0`, 2026-07-06)

## 何をするものか

Headlamp は Kubernetes クラスタを操作するためのグラフィカルインターフェースである。よくあるリソース (Pod、Deployment、Service など) を一覧・詳細表示し、編集し、スケールやログ閲覧、port-forward といったクラスタ操作を実行する。同じコードから 2 通りに動く。Go バックエンドが配信するブラウザアプリと、その同じバックエンド・フロントエンドを Electron で梱包した Linux/macOS/Windows 向けデスクトップアプリである。

フロントエンドは Kubernetes API サーバを直接叩かない。すべてのリクエストは Go バックエンドを経由し、バックエンドが kubeconfig コンテキストを保持し、Bearer トークンを注入し、対象クラスタへリバースプロキシする。この間接化により、1 つの Headlamp インスタンスが複数クラスタを管理でき、トークンをブラウザから隠せ、CORS を完全に回避できる。認可はクラスタに委ねられる。Headlamp は呼び出しをプロキシするだけで、許可するかどうかは kube-apiserver が判断する。

もう 1 つの特徴はプラグインシステムだ。フロントエンドはプラグインの JavaScript を実行時に読み込み、各プラグインにレジストリを渡す。プラグインはこれを通じてサイドバー項目・ルート・詳細ビューのセクションを追加できる。ベンダーはこれを使い、fork するのではなく Headlamp の上に自社製品の UI を載せる。Headlamp は Kubernetes Dashboard・Lens・k9s と同じ棚に位置する。メトリクスやトレースのツールではなく、クラスタ運用のための UI である。

## いつ使うか

- 複数クラスタを 1 か所から管理する Web / デスクトップ UI が欲しく、トークンをブラウザではなくサーバ側に保持したい。
- 自分のプラットフォーム向けに UI を拡張したく (カスタムリソース、製品固有のビュー)、fork せずに済ませたい。実行時プラグイン API がそこに合う。
- Web (ブラウザ配信、クラスタ内) とローカルデスクトップアプリの両方を同一コードベースから動かせる、Apache-2.0 のツールが欲しい。
- ターミナル中心・キーボード駆動のナビゲータが欲しいなら不向き。その領域は k9s のほうが得意。
- Observability プラットフォームではない。クラスタ状態を表示しメトリクスを見せることはできるが、Prometheus や Grafana のように時系列データを保存・クエリするものではない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [kubernetes-sigs/headlamp (GitHub)](https://github.com/kubernetes-sigs/headlamp) (参照 2026-07-08)
2. [Headlamp ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) (参照 2026-07-08)
3. [Headlamp README.md NOTICE (Kubernetes SIG UI への移管)](https://github.com/kubernetes-sigs/headlamp/blob/main/README.md) (参照 2026-07-08)
4. [Headlamp プロジェクトページ (CNCF)](https://www.cncf.io/projects/headlamp/) (参照 2026-07-10)
5. [\[Sandbox\] Headlamp, cncf/sandbox Issue #25](https://github.com/cncf/sandbox/issues/25) (参照 2026-07-10)
6. [Headlamp now in the CNCF Sandbox (Headlamp ブログ, 2023-10-12)](https://headlamp.dev/blog/2023/10/12/cncf-sandbox/) (参照 2026-07-10)
7. [Microsoft acquires Kinvolk (Azure ブログ, 2021-04-29)](https://azure.microsoft.com/en-us/blog/microsoft-acquires-kinvolk-to-accelerate-containeroptimized-innovation/) (参照 2026-07-10)
8. [Headlamp Project to Provide GUI for Kubernetes (Cloud Native Now, KubeCon EU 2025)](https://cloudnativenow.com/kubecon-cloudnativecon-europe-2025/headlamp-project-to-provide-graphical-user-interface-for-kubernetes/) (参照 2026-07-10)
9. [Headlamp ドキュメントサイト](https://headlamp.dev/) (参照 2026-07-10)
10. [Headlamp プラグイン機能ドキュメント](https://headlamp.dev/docs/latest/development/plugins/functionality/) (参照 2026-07-10)
11. [GitHub REST API repos/kubernetes-sigs/headlamp](https://api.github.com/repos/kubernetes-sigs/headlamp) (参照 2026-07-08)
12. [Headlamp: A multicluster management UI for Kubernetes (InfoWorld)](https://www.infoworld.com/article/3964051/headlamp-a-multicluster-kubernetes-user-interface.html) (参照 2026-07-10)
