# 採用事例・エコシステム

## 誰が使っているか

ドキュメント基準コミット時点のプロジェクトの `ADOPTERS.MD` に列挙された組織のみを挙げる。出典のある採用事例だけを載せている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Kubecost | サービスプロバイダ。Kubecost Free/Business/Enterprise の土台が OpenCost | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| Grafana Labs | エンドユーザ。エンジニアリングブログで紹介 | [Grafana Labs ブログ](https://grafana.com/blog/2023/02/02/how-grafana-labs-uses-and-contributes-to-opencost-the-open-source-project-for-real-time-cost-monitoring-in-kubernetes/) |
| Microsoft | サービスプロバイダ。AKS 上で OpenCost を提供 | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| Zendesk | エンドユーザ | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| National Information Solutions Cooperative | エンドユーザ | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| CloudAdmin | サービスプロバイダ | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |
| mindcurv group | コンサルティング | [ADOPTERS.MD](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD) |

## 採用のシグナル

`opencost/opencost` の GitHub API より、2026-06-24 観測: star 6,603、fork 829、open issue 239。contributor は約 169、匿名込みで約 197。OpenCost は CNCF Incubating プロジェクトで、Sandbox (受理 2022-06-17) から 2024-10-25 に Incubating へ昇格した。

## エコシステム

OpenCost は複数リポジトリに分かれている。`opencost/opencost-helm-chart` (公式インストール手段)、`opencost/opencost-ui` (UI)、`opencost/opencost-plugins` (Datadog・OpenAI・MongoDB Atlas 等の外部コストプラグイン)、`opencost/opencost-integration-tests` だ。使用量メトリクスのため Prometheus に依存し、自身のコストメトリクスも `/metrics` で公開するため、監視スタックの消費者でもあり供給者でもある。`pkg/mcp` の MCP サーバで AI agent からコストデータをクエリできる。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Kubecost (IBM) | OpenCost エンジン上に構築された商用上位版。マルチクラスタ・長期保持・SSO・アラートを足す。OpenCost は仕様 + コアエンジンのみ。 |
| クラウドネイティブ請求 (AWS Cost Explorer・GCP Billing) | クラウド請求の粒度でレポートし、クラスタ内 namespace/pod 按分はしない。OpenCost はクラスタ内でリアルタイムに按分する。 |
| FinOps SaaS (CAST AI・Vantage・Finout) | ベンダー固有のホスティング提供。OpenCost はベンダー中立な CNCF 仕様 + セルフホスト OSS。 |
| kube-resource-report | 単純な集計で、プライシング統合や idle/shared 配分はない。 |

選び方: ベンダー中立・セルフホストで pod 単位までコストを分解し idle と shared を帰属させたいなら OpenCost。マルチクラスタ集約・長期保持・SSO・アラートを自前で作らず揃えたいなら、商用 Kubecost か FinOps SaaS。
