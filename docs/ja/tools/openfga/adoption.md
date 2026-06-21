# 採用事例・エコシステム

## 誰が使っているか

CNCF の Incubation 発表は、本番利用を公に表明した組織が 37 社あると述べ、そのうち数社を貢献内容とともに名指ししている (3)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Okta | エンジンの起源。Auth0/Okta FGA の基盤 | [CNCF ブログ](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |
| Auth0 | OpenFGA 上に構築した商用マネージド FGA | [CNCF ブログ](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |
| Grafana Labs | SQLite ストレージアダプタを寄贈。メンテナを輩出 | [CNCF ブログ](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |
| GitPod | エンジニアが公式メンテナに就任 | [CNCF ブログ](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |
| TwinTag | MySQL ストレージアダプタを寄贈 | [CNCF ブログ](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/) (3) |

個人コントリビュータの Maurice Ackel が Terraform Provider を寄贈した (3)。二次情報では Docker や Canonical も利用者として挙げられるが、一次情報である CNCF 本文では名指しされていないため、ここでは未確認の二次情報としてのみ記す (3)(7)。

## 採用のシグナル

- CNCF 成熟度は Sandbox (2022-09-14 受理) から Incubating (TOC 投票 2025-10-28、発表 2025-11-11) へ進んだ (3)(4)(5)。
- Incubation 時点で本番利用を公に表明した組織が 37 社 (3)。
- リリースは活発。このディープダイブは `v1.18.0` (2026-06-17) のドキュメントコミット 1 つ後に固定している (1)。
- メンテナ陣は複数企業 (Okta、Grafana、GitPod) にまたがり、これは CNCF が Incubation で重視するシグナルである (3)。

## エコシステム

- **SDK** は 5 言語: Go、.NET、JavaScript、Java、Python (3)(1)。
- **エディタ連携**: モデル DSL 用の VS Code / IntelliJ 拡張 (3)。
- **CLI** (`fga`): ストア管理とモデルテストの実行 (3)(1)。
- **デプロイ**: Helm チャート (Artifact Hub) と Terraform Provider (3)。
- **可観測性**: OpenTelemetry トレーシング、Prometheus メトリクス、Grafana 連携 (1)。
- **相互運用**: OpenID AuthZEN 互換エンドポイント ([`pkg/server/authzen.go`](https://github.com/openfga/openfga/blob/9a556d8a134db308a7690f328dade79104922c8a/pkg/server/authzen.go))。
- **マネージド提供**: Auth0/Okta FGA は同じエンジン上に構築されている (2)(3)。

## 代替候補

以下の直接的な代替 3 つはいずれも Zanzibar 系の ReBAC システムである (7)。OpenFGA は開発者体験 (モデル DSL、Playground、CLI、5 つの SDK)、ステートレスで水平スケールする設計、CNCF backing を伴うセルフホスト/マネージドの両提供で差別化する。デフォルト整合性は緩く、強整合性は `HIGHER_CONSISTENCY` でオプトインする (7)。

| 代替 | 違い |
| --- | --- |
| SpiceDB (AuthZed) | 最も完全な Zanzibar 整合性モデル (zookie / at-least-as-fresh)、CockroachDB や Spanner を含む豊富なストレージ、Watch API。管理 UI / 監査は薄め (7) |
| Ory Keto | Ory エコシステムに統合された Go 実装。シンプルだが整合性制御は粗め (7) |
| OPA / Rego | ABAC 向けの policy-as-code。関係グラフ走査ではなくリクエストコンテキスト上のルールを評価する (7) |
| Cedar (AWS) | 関係タプルストアではなく専用のポリシー言語 (7) |
