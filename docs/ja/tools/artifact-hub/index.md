# Artifact Hub

> Cloud Native パッケージを索引する CNCF 運営の Web アプリ。20 種類超のアーティファクトを横断で発見・導入・公開できるが、アーティファクト自体はホストしない。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Incubating
- **言語**: Go (バックエンド)、TypeScript + React (Web)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [artifacthub/hub](https://github.com/artifacthub/hub)
- **ドキュメント基準コミット**: `0d8b1c0` (タグ v1.22.0 より後、author date 2026-05-12)

## 何をするものか

Artifact Hub は Cloud Native アーティファクトの検索・発見レイヤだ。登録済みリポジトリからパッケージを索引し、メタデータを正規化し、検索・フィルタ・詳細ページを Web UI と HTTP API で提供する。アーティファクト自体は保存しない。各パッケージページは元ソースへリンクし、インストール手順は公開元のレジストリやリポジトリを指す。

バックエンドは Go で書かれ、4 つのバイナリを出す。`hub` (HTTP API サーバ)、`tracker` (索引生成)、`scanner` (脆弱性レポート)、`ah` (CLI) だ。ビジネスロジックの相当部分は PostgreSQL の PL/pgSQL 関数にあり、Go 層は JSON を渡して呼び出す。フロントは `hub` API を叩く React の SPA。

対応するアーティファクト種別は 20 を超え、Helm チャート、OLM オペレータ、Tekton の task / pipeline、Krew プラグイン、Falco ルール、OPA / Gatekeeper ポリシー、Kyverno ポリシー、KEDA スケーラ、Backstage プラグインなどを含む。公開インスタンス `artifacthub.io` は CNCF が運用する。

## いつ使うか

- Cloud Native アーティファクト (Helm チャート、OLM オペレータ、Tekton task など) を公開し、CNCF ユーザが既に検索している 1 か所で見つけてほしいとき。
- アーティファクトを利用する側で、多数の個別 Hub を巡回せず、セキュリティスキャン結果・署名・バージョン履歴を備えた単一の検索面が欲しいとき。
- 自組織のリポジトリの社内索引を、公式 Helm チャートで動かしたいとき。

アーティファクトの実バイトをホスト・配信する必要がある場合は向かない。Artifact Hub は索引とリンクだけなので、ホスティングは OCI レジストリや Harbor が担う。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [artifacthub/hub ソース、`0d8b1c0` でピン留め](https://github.com/artifacthub/hub)
2. [README (artifacthub/hub)](https://github.com/artifacthub/hub/blob/master/README.md)
3. [architecture.md (artifacthub/hub)](https://github.com/artifacthub/hub/blob/master/docs/architecture.md)
4. [リポジトリガイド (Artifact Hub docs)](https://artifacthub.io/docs/topics/repositories/)
5. [Artifact Hub becomes a CNCF incubating project (CNCF)](https://www.cncf.io/blog/2024/09/17/artifact-hub-becomes-a-cncf-incubating-project/)
6. [Artifact Hub プロジェクトページ (CNCF)](https://www.cncf.io/projects/artifact-hub/)
7. [CNCF Artifact Hub, a One-Stop Shop for Cloud Native Config (The New Stack)](https://thenewstack.io/cncf-artifact-hub-a-one-stop-shop-for-cloud-native-config/)
8. [リリース v1.22.0 (artifacthub/hub)](https://github.com/artifacthub/hub/releases/tag/v1.22.0)
