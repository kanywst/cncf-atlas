# 採用事例・エコシステム

## 誰が使っているか

プロジェクトは出典付きの ADOPTERS ファイルを維持し、利用者を end user / vendor / solution provider に分類している。以下の名前のある採用組織は、いずれもそのファイル内の引用か外部リンクを伴う。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Intuit | Argo ベースの chaos workflow | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md)、[トーク](https://youtu.be/Uwqop-s99LA?t=720) |
| Orange | クラウドインフラの resiliency | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| Mercedes-Benz | resilience テスト (org 別ストーリー) | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| Adidas | resilience テスト (org 別ストーリー) | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| Lenskart | resilience テスト (org 別ストーリー) | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| iFood | resilience テスト (org 別ストーリー) | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| Red Hat | OpenShift Virtualization の chaos | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |
| VMware | vendor / 連携 | [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md) |

ADOPTERS ファイルには、FIS、Halodoc、Kitopi、AB-InBev、Flipkart、Talend、Delivery Hero、Emirates NBD、Amadeus など、さらに多くの end user が記載されている。2022 年 1 月の CNCF Incubating 昇格時には本番採用 25+ 組織が言及され、その中に Intuit、Lenskart、Orange、Red Hat、VMware が含まれた。

## 採用のシグナル

`litmuschaos/litmus` について GitHub API から 2026-06-24 に取得:

- Stars: 5,466
- Forks: 880
- Open issues: 438
- コントリビュータ: 約 304 (匿名含む)
- 最新リリース: 3.30.0 (2026-06-17)

プロジェクトは OpenSSF Best Practices バッジ (project 3202) と FOSSA ライセンススキャンを持つ。

## エコシステム

Litmus は LitmusChaos org の複数リポジトリに分かれている (stars は 2026-06-24 時点):

- `chaos-operator` (156): 実行プレーンの ChaosEngine reconciler。
- `chaos-charts` (91): ChaosHub の実験 YAML バンドル。
- `litmus-go` (83): Go 製の chaos faults 本体 (go-runner)。
- `litmus-helm` (59): Helm チャート。
- `chaos-exporter` (36): Prometheus メトリクス。
- `litmusctl` (32): agent plane 管理 CLI。
- `chaos-runner` (29)、`litmus-python`、`github-chaos-actions` (CI 連携)、`litmus-mcp-server` (18)。

連携先は Argo Workflows (実験は Argo Workflow として実行)、Prometheus と Grafana (メトリクスと dashboard、`chaoscenter/graphql/server/grafana/` 配下)、Kubernetes RBAC、GitOps、アプリレベル障害注入の Spring Boot ALFI など。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Chaos Mesh | 同じく K8s ネイティブで CNCF Incubating。CRD ベースで網羅的な fault タイプを持つ。Litmus との差は ChaosHub による共有モデルと、クラスタをまたぐ agent ダイヤルバックを伴う ChaosCenter コントロールプレーン。 |
| Chaos Toolkit | 言語非依存の JSON/YAML 実験スペックで、Kubernetes 専用ではない。Litmus は K8s ネイティブで CRD + operator 駆動。 |
| Gremlin | 商用 SaaS。Litmus は OSS でセルフホスト。 |
| AWS FIS | マネージドで AWS リソース限定。Litmus はクラウド非依存で Kubernetes ワークロード中心。 |
