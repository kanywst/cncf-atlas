# Cedar

> Cedar はきめ細かな認可のためのオープンソースのポリシー言語と評価エンジン。ポリシーを解析可能にし、エンジン自体を形式検証できるよう設計されている。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Sandbox
- **言語**: Rust
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cedar-policy/cedar](https://github.com/cedar-policy/cedar)
- **ドキュメント基準コミット**: `991bacf` (2026-06-25)

## 何をするものか

Cedar は認可 (authorization、認証済みの主体が特定の操作を行ってよいかの判定) のポリシーを書くための言語と、それを評価するエンジンである。アプリケーションはエンジンに、4 つの部分 (principal、action、resource、context) からなるリクエスト、ポリシー集合、エンティティ集合を渡す。エンジンは `Allow` か `Deny` の 1 つの決定を返す。

Cedar は Amazon 発で、Amazon Verified Permissions と AWS Verified Access のエンジンとして動いている。2023 年 5 月に Apache-2.0 でオープンソース化され、2025-10-08 に CNCF Sandbox に受理された。本リポジトリのリファレンス実装は Rust で書かれ、`cedar-policy` クレート、コマンドラインインターフェース (CLI)、JavaScript / TypeScript 向けの WebAssembly (wasm) バインディング、Language Server Protocol (LSP) サーバとして公開されている。

Cedar が汎用ポリシーエンジンと異なる点は、言語が意図的に制限され、ポリシーが健全 (sound)・完全 (complete)・決定可能 (decidable) な論理符号化を許すことである。この制限により、Satisfiability Modulo Theories (SMT、充足可能性モジュロ理論) ソルバでポリシーの性質を証明する記号コンパイラ (`cedar-policy-symcc`) を提供でき、形式モデルに対する verification-guided development (検証主導開発) でエンジンを開発できる。

## いつ使うか

- リクエスト単位のきめ細かな認可判定が必要で、ポリシーをアプリケーションコードから切り離したい。
- ロールベース・属性ベース・関係ベースのアクセス制御 (RBAC、ABAC、ReBAC) を 1 つのポリシー言語で表現したい。
- ポリシーを静的に解析したい。2 つのポリシー集合が等価であること、あるポリシーが決して誤らないこと、あるポリシーが別のポリシーを含意することを証明したい。
- 別建てのネットワークサービスではなく、小さく組み込めるエンジン (Rust クレート、wasm モジュール、CLI) が欲しい。

任意のデータ変換を行う汎用ルールエンジンが必要な場合や、判定が Cedar の制限された言語で表現できないロジックに依存する場合は、向いていない。その場合は Open Policy Agent のような汎用エンジンの方が近い。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cedar-policy/cedar リポジトリ](https://github.com/cedar-policy/cedar)
2. [Cedar on CNCF (Sandbox)](https://www.cncf.io/projects/cedar/)
3. [Cedar Joins CNCF as a Sandbox Project (AWS Open Source Blog)](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/)
4. [Introducing Cedar, an open-source language for access control (AWS What's New)](https://aws.amazon.com/about-aws/whats-new/2023/05/cedar-open-source-language-access-control/)
5. [Using Open Source Cedar to Write and Enforce Custom Authorization Policies (AWS Open Source Blog)](https://aws.amazon.com/blogs/opensource/using-open-source-cedar-to-write-and-enforce-custom-authorization-policies/)
6. [Cedar: A new approach to policy management for Kubernetes (CNCF Blog)](https://www.cncf.io/blog/2025/03/28/cedar-a-new-approach-to-policy-management-for-kubernetes/)
7. [Cedar Policy Language Reference Guide](https://docs.cedarpolicy.com/)
8. [cedar-policy/cedar release v4.11.2](https://github.com/cedar-policy/cedar/releases/tag/v4.11.2)
