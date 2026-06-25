# 採用事例・エコシステム

## 誰が使っているか

以下の組織は Contour の公式 adopters ページおよびリポジトリの `site/content/resources/adopters.md` に記載されている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| SnappCloud | OpenShift Router から Contour へ移行 (success story) | <https://projectcontour.io/resources/adopters/> |
| Knative | `net-contour` で KIngress を `HTTPProxy` にブリッジ | <https://projectcontour.io/resources/adopters/> |
| VMware | Tanzu の ingress | <https://projectcontour.io/resources/adopters/> |
| Gojek | 全 Kubernetes クラスタの ingress | <https://projectcontour.io/resources/adopters/> |
| Flyte | sandbox のデフォルト ingress | <https://projectcontour.io/resources/adopters/> |
| DaoCloud | Contour ベースの次世代マイクロサービスゲートウェイ | <https://projectcontour.io/resources/adopters/> |
| Bugfender | 記載されている採用組織 | <https://projectcontour.io/resources/adopters/> |

Contour が CNCF Incubating として受理された (2020-07-07) 際の発表では、本番採用組織として Adobe (マルチテナント基盤 "Project Ethos")・Kinvolk・Kintone・PhishLabs・Replicated が挙げられた。

## 採用のシグナル

2026-06-24 に `gh api repos/projectcontour/contour` で観測:

- スター: 3,934
- フォーク: 716
- オープン issue: 120
- コントリビュータ: 約 240 (`contributors` エンドポイントが最終ページ 240 までページネートする、匿名を含む)

ガバナンスは `projectcontour/community` リポジトリ (`GOVERNANCE.md`、`CONTRIBUTING.md:212` から参照) に文書化されている。メンテナは同リポジトリの `MAINTAINERS.md` に、CNCF 側は `cncf/foundation` の `project-maintainers.csv` に Incubating として記載される。triage は週次のコミュニティミーティングで行われる (`CONTRIBUTING.md:238`)。

## エコシステム

- Envoy はデータプレーンであり必須依存。
- Gateway API (SIG-Network) を第一級の設定面としてサポート。
- Knative は `net-contour` で連携。
- 一般的な組合せに ExternalDNS と cert-manager。
- Contour 独自の Gateway provisioner を同梱。
- Envoy `ext_authz` による外部認可、およびグローバル/ローカルのレートリミット。

## 代替候補

| 代替 | 違い |
| --- | --- |
| ingress-nginx | NGINX ベースで非常に広く普及。Contour は Envoy ベースで動的設定 (reload/再起動なし) と `HTTPProxy` 委譲によるマルチチーム分離が強み。 |
| Emissary-ingress (旧 Ambassador) | 同じく Envoy ベースの CNCF プロジェクト。Contour は `HTTPProxy` CRD と Gateway API にフォーカスし制御プレーンが軽量。 |
| Istio ingress / Gateway | サービスメッシュ前提で機能は広いが重い。Contour は ingress に特化。 |
| Envoy Gateway | Envoy 公式の Gateway API 実装。Contour は歴史的な `HTTPProxy` CRD と既存運用基盤で差別化。 |
