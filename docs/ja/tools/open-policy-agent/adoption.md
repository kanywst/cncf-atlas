# 採用事例・エコシステム

## 誰が使っているか

プロジェクトの `ADOPTERS.md` が公開言及付きの組織を列挙し、CNCF graduation 発表も複数の本番利用者を名指しした。以下の項目はすべてそのいずれかが出典である。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Atlassian | 異種クラウド横断のマイクロサービス API 認可。Slauth (AAA) に組み込み、ポリシーを S3 で配布 | [ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) |
| Netflix, Goldman Sachs, Pinterest, T-Mobile | CNCF graduation 発表で本番利用者として名指し | [CNCF graduation 発表](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/) |
| Capital One, Chef, Cloudflare, Tripadvisor, SAP | 採用組織として記載 | [ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) |
| Appsflyer | 数百のマイクロサービスの認可を中央 OPA に委譲 | [ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) |
| Bisnode (Dun & Bradstreet) | マイクロサービス認可、Kubernetes 認可・admission control、CI/CD。JVM 連携ツールを公開 | [ADOPTERS.md](https://github.com/open-policy-agent/opa/blob/main/ADOPTERS.md) |

## 採用のシグナル

GitHub API 計測 (2026-06-23): star 11,884、fork 1,595、watcher 131、open issue 366 ([open-policy-agent/opa](https://github.com/open-policy-agent/opa))。graduation 時点で 90 名超の contributor と約 30 組織、maintainer は Google・Microsoft・VMware・Styra の 4 社だった ([CNCF graduation 発表](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/))。OPA 1.0 時点では 5,000 を超える commit と 400 名超の contributor が報告された ([OPA 1.0 ブログ](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368))。

## エコシステム

- OPA Gatekeeper は OPA を CRD 駆動の Kubernetes admission controller として動かす (Google・Microsoft 発、CNCF 寄贈)。OPA の代替ではなく上に乗る層である。
- Envoy / Istio は外部認可 (ext_authz) で OPA をサイドカー PDP として使い、API 認可に用いる。
- conftest・Terraform・CI/CD パイプラインは OPA を IaC・パイプラインの policy gate として使う。
- 配布の仕組みには bundle (ポリシー + データを HTTP/OCI で pull)、decision logging、status プラグインがある。

## 代替候補

OPA は Rego を備えた汎用ポリシーエンジンである。誠実なトレードオフはスコープと学習コストの天秤だ。Kubernetes admission だけが必要なら Kubernetes ネイティブなエンジンの方が軽量、スタック全体で 1 つのポリシー言語を使いたいなら OPA の汎用性が効く ([Nirmata 比較](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/)、[policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/))。

| 代替 | 違い |
| --- | --- |
| Kyverno (CNCF Incubating) | Kubernetes 専用。ポリシーが Kubernetes の YAML リソースで、mutation/generation に対応。フットプリントが軽く (controller デプロイ 1 つ)、Rego 不要だが Kubernetes に限定される。OPA/Gatekeeper は validation 中心で Rego 学習コストが高い反面、クロスプラットフォームに届く ([Nirmata](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/)、[policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/))。 |
| AWS Cedar / Amazon Verified Permissions | アプリ層の認可言語。OPA の汎用認可と領域が重なるが、Kubernetes admission ではなくアプリのアクセス判定を狙う。 |
