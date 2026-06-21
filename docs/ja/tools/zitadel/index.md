# ZITADEL

> API ファースト・イベントソーシングの ID / アクセス基盤。設計当初からマルチテナントで、Auth0 の開発者体験と Keycloak のセルフホスト自由度の中間に位置する。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Independent (CNCF ホスト project ではない)
- **言語**: Go (75.8%)、TypeScript (11.7%、console と login の UI)
- **ライセンス**: AGPL-3.0-only。ただし `proto/` と `apps/docs/` は Apache-2.0、login アプリと client SDK は MIT
- **リポジトリ**: [zitadel/zitadel](https://github.com/zitadel/zitadel)
- **ドキュメント基準コミット**: `10087e7` (main、タグ `v4.15.2` 近傍、2026-06-17)

## 何をするものか

ZITADEL はセルフホスト可能な ID プロバイダ。OIDC・OAuth 2.0・SAML 2.0 のトークンを発行・検証し、ユーザーと認証要素を管理し、RBAC モデルで認可の問い合わせに答える。PostgreSQL を背後に持つ単一の Go バイナリとして配布され、ホスト型の ZITADEL Cloud とセルフホスト構成は同一のコードベースで動く。

従来型 IdP と決定的に違うのはストレージモデルだ。すべての状態変更は不変イベントとしてイベントストアへ書かれ、読み取りモデル (projection) はそのイベント列から構築される (README.md:65)。結果として、別建てのログではなくデータモデルの一部として完全な監査証跡が得られ、それを webhook で外部システムへ流せる。

対象は、マルチテナンシーを組み込みの概念として必要とするチーム。Instance・Organization・Project・Application の階層がイベント層に焼き込まれているため、テナント分離は上に重ねた約束事ではなくデータの性質になっている。

## いつ使うか

- セルフホストの IdP で B2B マルチテナンシー (組織分離・委譲管理) が必要だが、その層を自作したくない。
- 一部の操作だけでなく、すべての ID 変更について改ざん検知可能で API からアクセスできる監査証跡が必要。
- セルフホストと SaaS を同等の機能で使い分けられる、単一のコードベースが欲しい。
- API 経由で統合する: ZITADEL は全リソースを単一のサービス定義から gRPC・connectRPC・HTTP/JSON で公開する。

向かない場合:

- ZITADEL を LDAP サーバや RADIUS エンドポイントとして使いたい場合。外部 LDAP を上流 IdP としてフェデレーションはできるが、自身は LDAP / RADIUS を提供しない。その用途は Keycloak や Authentik が適する。
- ベンダー中立なガバナンスを持つ CNCF project が欲しい場合。ZITADEL は商用主導の dual-license モデル。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [zitadel/zitadel (GitHub)](https://github.com/zitadel/zitadel)
2. [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md)
3. [LICENSING.md](https://github.com/zitadel/zitadel/blob/main/LICENSING.md)
4. [GitHub REST repo metadata](https://api.github.com/repos/zitadel/zitadel)
5. [About ZITADEL](https://zitadel.com/about)
6. [ZITADEL raises $9 million Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a)
7. [ZITADEL v3 announcement](https://zitadel.com/blog/zitadel-v3-announcement)
8. [Moving to AGPL 3.0](https://zitadel.com/blog/apache-to-agpl)
9. [Key Changes in Version 3 (discussion #9529)](https://github.com/zitadel/zitadel/discussions/9529)
10. [Open Source in the AI Era](https://zitadel.com/blog/open-source-in-the-ai-era)
11. [CNCF Landscape](https://landscape.cncf.io/)
12. [Open Source Authentication in 2026 (skycloak)](https://skycloak.io/blog/open-source-authentication-comparison-2026/)
13. [State of Open-Source Identity 2025 (houseoffoss)](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel)
14. [ZITADEL API introduction](https://zitadel.com/docs/apis/introduction)
15. [Self-hosting deploy with Compose](https://zitadel.com/docs/self-hosting/deploy/compose)
