# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS.md` はなく、本番採用組織を名指しする一次ソースも調査では見つからなかった。最も近いシグナルは CNCF Sandbox 申請で、メンテナが Microsoft, OpenAI, Adobe, Morgan Stanley のエンジニアがプロジェクトに貢献していると述べている (出典 3)。これは contributor の所属を指すもので、本番採用の確証ではない。ここではその通りに報告する。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| (確認された named な本番採用組織なし) | メンテナが Microsoft, OpenAI, Adobe, Morgan Stanley 所属の contributor に言及 | [cncf/sandbox #397](https://github.com/cncf/sandbox/issues/397) |

実務上、OAuth2 Proxy はハードニングガイドで、認証付きリバースプロキシの背後にダッシュボードや社内ツールを置く定番として広く推奨され、しばしば Pomerium と並べて挙げられる (出典 8)。

## 採用のシグナル

GitHub API から 2026-06-22 に計測 (出典 10):

- スター: 14,557
- fork: 2,139
- open issue: 218
- コントリビュータ: 400 人超 (contributors API のページネーションが 400 ページ超で末尾に達する)
- 最新リリース: v7.15.3、2026-06-09 公開
- CNCF 成熟度: Sandbox、2025-10-02 受理 (出典 1)

## エコシステム

OAuth2 Proxy は単体より統合ポイントとして配置されることが多い:

- **nginx**: `auth_request` ディレクティブのバックエンドとして。
- **Traefik**: `forwardAuth` ミドルウェアの対象として。
- **Kubernetes**: 公式 Helm chart 経由で、しばしば nginx ingress の `auth-url` アノテーションと共に。
- **Redis**: 大きい・多いセッション向けのサーバ側セッションストアとして。
- **IdP**: Google, GitHub, GitLab, Azure, Keycloak, ADFS, Microsoft Entra ID, 汎用 OIDC。`providers/` に実装。

## 代替候補

OAuth2 Proxy は薄いシムだ: 認証を外部 IdP に委譲し、多数のプロバイダに対応し、`auth_request` 系ゲートと素直に統合する。自前の MFA や細粒度ポリシーエンジンは持たない。主要な代替はまさにその軸で異なる。

| 代替 | 違い |
| --- | --- |
| [Pomerium](https://github.com/pomerium/pomerium) | identity / context 認識のゼロトラストプロキシ。OAuth2 ログインゲートだけでなく、ID 属性とコンテキストに基づくポリシー認可、非ブラウザ (API/CLI) トラフィックも対象 (出典 9)。 |
| [Authelia](https://github.com/authelia/authelia) | 組み込み MFA、セッション記憶、ポリシー認可を持つ自己完結型の認証ポータル。すべてを外部 IdP に委譲しない (出典 8)。 |
| [Vouch Proxy](https://github.com/vouch/vouch-proxy) | nginx `auth_request` に特化した軽量 SSO。スコープが狭く設定 UI もない (出典 8)。 |
