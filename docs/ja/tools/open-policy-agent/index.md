# Open Policy Agent (OPA)

> 認可の判定をアプリケーションコードから切り離し、Rego というクエリ言語で評価する汎用ポリシーエンジン。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [open-policy-agent/opa](https://github.com/open-policy-agent/opa)
- **ドキュメント基準コミット**: `f75131f` (v1.17.1 と v1.18.0-dev の間, 2026-06-18)

## 何をするものか

OPA はポリシーエンジンである。Rego で書いたポリシーと、input と呼ぶ JSON ドキュメントを渡すと、判定を返す。allow/deny、違反のリスト、フィルタされたフィールド集合など、ポリシーが計算したものが何であれ返す。エンジン自体は Kubernetes や HTTP、特定ドメインの知識を一切持たない。構造化データに対して Rego を評価し、構造化データを返すだけである。

配布形態は単一の Go バイナリ `opa`。同じバイナリが、ポリシーの評価・テスト用 CLI (`opa eval`、`opa test`)、ポリシー決定点 (PDP) として動く常駐 REST サーバ (`opa run --server`)、そして `rego` API で他プログラムに直接埋め込む Go パッケージ群として動く。ポリシーとそれが必要とする外部データは bundle にまとめられ、OPA が HTTP または OCI で pull する。

OPA はシステムの判定境界に位置する。アプリやプロキシが「このリクエストは許可されるか」と問い、OPA がポリシーから答える。これにより認可ロジックが 1 か所に集まり、バージョン管理・テスト・サービス間共有が可能になる。アプリコードに散らばらない。

## いつ使うか

- 多数のサービスで一貫した認可判定が必要で、ポリシーを各サービスのコードと分離して一度だけ書きたい場合。
- API 認可・Kubernetes admission・CI/CD ゲート・IaC など、異種のレイヤを横断して 1 つの言語と 1 つのエンジンでポリシーを強制したい場合。
- ハードコードした条件分岐ではなく、バージョン管理・テスト可能な成果物として判定を外部化したい場合。
- スコープが Kubernetes admission だけなら、Rego の学習コストを避けられる Kubernetes ネイティブなエンジン (Kyverno など) の方が向く。
- アプリ層の認可だけが目的で、関係ベースアクセス制御のような専用モデルを好む場合は向かない。

## このディープダイブの構成

- [歴史](./history): Styra での起源、CNCF graduation、OPA 1.0、2025 年の Apple 移籍。
- [アーキテクチャ](./architecture): パッケージ構成とポリシークエリの流れ。
- [採用事例・エコシステム](./adoption): 出典付き採用組織、GitHub シグナル、代替候補。
- [内部実装](./internals): ソースから読んだ評価パスと中核データ構造。
- [はじめに](./getting-started): インストールと最初の動くポリシー判定。

## 出典

1. [open-policy-agent/opa on GitHub](https://github.com/open-policy-agent/opa) (2026-06-23)
2. [OPA ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) (2026-06-23)
3. [OPA GOVERNANCE.md](https://github.com/open-policy-agent/opa/blob/main/GOVERNANCE.md) (2026-06-23)
4. [OPA MAINTAINERS.md](https://github.com/open-policy-agent/opa/blob/main/MAINTAINERS.md) (2026-06-23)
5. [OPA v1.0.0 release notes](https://github.com/open-policy-agent/opa/releases/tag/v1.0.0) (2026-06-23)
6. [Open Policy Agent - CNCF project page](https://www.cncf.io/projects/open-policy-agent-opa/) (2026-06-23)
7. [CNCF announces OPA graduation](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/) (2026-06-23)
8. [InfoQ: Open Policy Agent Graduates at CNCF](https://www.infoq.com/news/2021/02/opa-cncf-graduation/) (2026-06-23)
9. [Styra: Open Policy Agent 101, a Beginner's Guide](https://www.styra.com/blog/open-policy-agent-101-a-beginners-guide/) (2026-06-23)
10. [openpolicyagent.org docs](https://www.openpolicyagent.org/docs) (2026-06-23)
11. [OPA 1.0 is Coming](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368) (2026-06-23)
12. [Note from Teemu, Tim and Torin to the OPA community](https://blog.openpolicyagent.org/note-from-teemu-tim-and-torin-to-the-open-policy-agent-community-2dbbfe494371) (2026-06-23)
13. [Cloud Native Now: Apple Buys Styra Brains, OPA Remains Open](https://cloudnativenow.com/features/apple-buys-styra-brains-opa-remains-open/) (2026-06-23)
14. [Open Source For You: Apple Acquires OPA Developers](https://www.opensourceforu.com/2025/08/apple-acquires-open-policy-agent-developers-while-cncf-retains-control-of-open-source-project/) (2026-06-23)
15. [Nirmata: Kubernetes Policy Comparison, Kyverno vs OPA Gatekeeper](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/) (2026-06-23)
16. [policyascode.dev: OPA Gatekeeper vs Kyverno](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/) (2026-06-23)
