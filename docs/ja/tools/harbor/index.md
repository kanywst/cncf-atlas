# Harbor

> 素の Docker Distribution バックエンドの前段に、プロジェクト単位の RBAC・脆弱性スキャン・レプリケーション・署名検証を足した OCI レジストリ。

- **カテゴリ**: Supply Chain
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [goharbor/harbor](https://github.com/goharbor/harbor)
- **ドキュメント化したコミット**: `6872989` (main, 2026-06-22)

## 何をするものか

Harbor はコンテナイメージやその他の OCI 成果物のためのセルフホスト型レジストリです。blob や manifest を自分では保存しません。[distribution/distribution](https://github.com/distribution/distribution) (Docker Registry) の前段に reverse proxy を立て、そのバックエンドの手前で独自のゲートを差し込みます。認可、クォータ、immutable、署名チェック、脆弱性ポリシーです。

付加価値は、素のレジストリの周りに企業が必要とするものすべてです。RBAC 付きのマルチテナント project、LDAP/AD と OIDC ログイン、ポリシー駆動のレジストリ間レプリケーション、定期的な脆弱性スキャン、イメージの retention と GC、そして Web ポータル。コードは 3 つの Go バイナリ (API core、非同期ジョブワーカ、レジストリコントローラ) と Angular の UI です。

Harbor は CI/CD システムとコンテナランタイムの間に位置します。CI が Harbor の project にイメージを push し、デプロイ先がそこから pull し、Harbor が誰に何ができるか、どのイメージを出荷してよいかを強制します。

## いつ使うか

- マネージドなクラウドレジストリではなく、オンプレや private cloud で自分で運用するレジストリが必要なとき。
- マルチテナント分離が必要なとき。多数のチームが 1 つのレジストリを project 単位の RBAC とクォータで共有する。
- スキャン・署名・レプリケーションをレジストリの周りに後付けするのではなく、レジストリ内蔵で持ちたいとき。
- データセンタ間やエアギャップ環境で成果物をレプリケーションするとき。

マネージドなクラウドレジストリ (ECR、ACR、Artifact Registry) で要件が満たせる場合や、アクセス制御の要らない単一の private レジストリだけで十分 (素の Distribution で足りる) な場合は、魅力は薄れます。

## この deep-dive の構成

- [History](./history): VMware 発祥から CNCF Graduated までの経緯。
- [Architecture](./architecture): 3 つのバイナリと proxy + middleware 設計。
- [Adoption & Ecosystem](./adoption): 出典のある production 採用事例と代替。
- [Internals](./internals): ソースから読んだイメージ pull のパス。
- [Getting Started](./getting-started): offline installer でのインストール。

## 出典

1. [goharbor/harbor](https://github.com/goharbor/harbor) (README, ADOPTERS, LICENSE, VERSION)、参照日 2026-06-22。
2. [goharbor/harbor at commit 687298935](https://github.com/goharbor/harbor/commit/687298935db944c5df68e0c3b14b410ba005cbe2)、参照日 2026-06-22。
3. [Harbor on CNCF](https://www.cncf.io/projects/harbor/) (成熟度の日付とメトリクス)、参照日 2026-06-22。
4. [CNCF announces Harbor Graduation](https://www.cncf.io/announcements/2020/06/23/cloud-native-computing-foundation-announces-harbor-graduation/)、参照日 2026-06-22。
5. [Harbor: Enterprise-grade container registry for modern private cloud](https://www.cncf.io/blog/2025/12/08/harbor-enterprise-grade-container-registry-for-modern-private-cloud/)、参照日 2026-06-22。
6. [InfoQ: Open Source Registry Harbor's Graduation](https://www.infoq.com/news/2020/06/harbor-graduation-michael/)、参照日 2026-06-22。
7. [Harbor install & configuration guide](https://goharbor.io/docs/latest/install-config/)、参照日 2026-06-22。
8. [gh api repos/goharbor/harbor](https://api.github.com/repos/goharbor/harbor)、参照日 2026-06-22。
