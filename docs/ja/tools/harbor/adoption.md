# 採用事例・エコシステム

## 誰が使っているか

プロジェクトの `ADOPTERS.md` には、production で Harbor を運用し詳細を公開許諾済みの組織のみが載ります。使い方が記述されているもの:

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| JD.com | JDOS プラットフォームのレジストリ。2 年以上の production 運用、数万ノード、数百万イメージ。 | `ADOPTERS.md:46-48` |
| China Mobile | 1 年以上の production 運用、1,000+ ノード、約 20,000 イメージ。 | `ADOPTERS.md:50-51` |
| 360 Total Security | リージョンをまたぐイメージ配布とアクセス制御、レプリケーションを多用、約 800 ノード、約 20,000 イメージ。 | `ADOPTERS.md:53-57` |
| Union Pay | 200+ ノードのイメージ管理。RBAC と脆弱性スキャンを強制。 | `ADOPTERS.md:69-71` |
| DE-CIX | 旧来のホスト型 Docker registry を置換。OIDC グループマッピング、robot account、脆弱性スキャナを活用。 | `ADOPTERS.md:92` |

さらに名前のある採用組織がロゴとして `ADOPTERS.md:12-42` に載っており、Trend Micro・DataYes・Rancher・Pivotal・Netease Cloud・Anchore・Dynatrace・CERN・Nederlandse Spoorwegen などが含まれます。

## 採用シグナル

執筆時点で報告されているリポジトリのメトリクス (参照日 2026-06-22、`gh api repos/goharbor/harbor` 経由): star 約 28,755、fork 約 5,264。Harbor は 2020-06-15 に CNCF Graduated に到達し、OSS レジストリとして初めてこれを達成しました。リリースは minor / patch の定期的なリズムで、最新 GA は v2.14.4 (2026-05-11)、ドキュメント化したコミットでは v2.16.0 が開発中です。

## エコシステム

Harbor は blob / manifest ストアとして [distribution/distribution](https://github.com/distribution/distribution) を同梱し、その前段で動きます。デフォルトの脆弱性スキャナは Trivy で起動時に登録され (`src/core/main.go:331-346`)、他のスキャナはスキャナアダプタ API で接続できます (旧来の Clair アダプタは廃止)。署名は Cosign (sigstore) で行い、manifest push 時に検証されます (`src/server/registry/route.go:81`)。旧来の Notary v1 のパスはドキュメントに残るものの非推奨方向です (`README.md:39`)。

goharbor org の周辺リポジトリには `harbor-helm` (Kubernetes デプロイ)、`harbor-operator`、`harbor-cli`、`terraform-provider-harbor`、`website` があります。

## 代替

| 代替 | 違い |
| --- | --- |
| distribution/distribution | Harbor が包む素のバックエンド。RBAC・project・スキャン・UI なし。 |
| Quay (Red Hat) | 同等の機能セット。Red Hat / OpenShift エコシステムにより密に結びつく。 |
| JFrog Artifactory | 商用、OCI に限らないマルチフォーマット成果物リポジトリ。 |
| GitLab Container Registry | スタンドアロンではなく GitLab CI/CD に同梱。 |
| クラウドレジストリ (ECR・ACR・GCR・Artifact Registry) | クラウド事業者がマネージド。セルフホストもクラウド横断の可搬性もなし。 |
| CNCF Dragonfly | P2P 成果物配布。Harbor を置換せず補完する。 |

セルフホストで RBAC・マルチテナント project・レプリケーション・スキャン・署名検証・クォータ・immutable/retention を 1 システムにまとめたいとき、かつ tag をバックエンドレジストリと独立に Harbor の DB で管理したいときに Harbor を選びます。レジストリを自分で運用したくないなら、マネージドなクラウドレジストリを選びます。
