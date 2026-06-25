# 採用事例・エコシステム

## 誰が使っているか

最も明確な採用は、CNCF が運用する公開インスタンス `artifacthub.io` で、多数の CNCF プロジェクトのアーティファクトを索引している。リポジトリの `ADOPTERS.md` はそのインスタンスのみを挙げ、自前の社内インスタンスを動かす組織に追加を呼びかけている。第三者の adopter は名指しされていないため、このディープダイブでも挙げない。README は Consul (HashiCorp) と Google に触れるが、これは「official」ステータスフラグの例であり、adopter ではない。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| CNCF | 公開インスタンス `artifacthub.io` の索引を運用 | [ADOPTERS.md](https://github.com/artifacthub/hub/blob/master/ADOPTERS.md)、[CNCF プロジェクトページ](https://www.cncf.io/projects/artifact-hub/) |

## 採用シグナル

名指しの adopter が少ないため、GitHub と CNCF のシグナルが測定可能な代理指標になる (2026-06-24 参照):

- スター数: 2,048、フォーク数: 302。
- 名前付き contributor: 48 名。
- リポジトリ作成 2020-01-14、直近の活動は 2026-06-23 まで。
- CNCF のアナウンスは Incubating 時点で 41 名のボランティアコミュニティと記す。

## エコシステム

Artifact Hub は 20 種類超のアーティファクトと直接統合する。種別は `RepositoryKind` の値として定義され (`internal/hub/repo.go:50`)、`internal/tracker/source/` 配下に実装される。Helm、OLM、Tekton、Krew、Kyverno、OPA、Gatekeeper、KEDA、Falco、Backstage、Meshery、Keptn、Radius、KCL などを含む。脆弱性スキャンに Trivy (`internal/scanner/alerts.go:10`)、署名検証に cosign / OCI signature、認可に OPA (`cmd/hub/main.go:56`) を使う。自己ホストは `charts/artifact-hub` の公式 Helm チャートで行う。

## 代替

Artifact Hub はアーティファクトを索引するが、ホストはしない。これがレジストリとの分かれ目だ。

| 代替 | 違い |
| --- | --- |
| Helm Hub (非推奨) | 前身。Helm 専用で、Artifact Hub は多 kind に対応 |
| OperatorHub.io | OLM オペレータ専用。Artifact Hub は OLM を多数の kind の 1 つとして含む |
| Harbor / OCI レジストリ / Docker Hub | アーティファクトの実バイトをホスト・配信する。Artifact Hub は索引してリンクを返すだけ |
