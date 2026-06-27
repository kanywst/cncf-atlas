# Athenz

> 動的・ハイブリッドクラウド向けの X.509 サービス認証ときめ細かい RBAC 認可基盤。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Sandbox
- **言語**: Java (サーバ)、Go (エージェント・クライアント)、JavaScript/React (UI)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [AthenZ/athenz](https://github.com/AthenZ/athenz)
- **ドキュメント基準コミット**: `3a7ae05` (v1.12.43 近辺、2026-06-19)

## 何をするものか

Athenz はサービスに ID を発行し、そのサービスが何を許可されるかを決める。役割を 2 つのサーバに分ける。ZMS (Athenz Management System) は認可データの source of truth であり、ドメイン・ロール・ポリシー・サービス ID を管理する。ZTS (Athenz Token System) はエッジで短命なクレデンシャル (X.509 ID 証明書、ロール証明書、OAuth2 アクセストークン、ロールトークン) を発行する。

名前は "AuthNZ" 由来で、N が authentication、Z が authorization。ワークロードは各プラットフォーム (AWS、GCP、Azure、Kubernetes、GitHub Actions ほか) の attestation で自分が何者かを証明し、ZTS から X.509 ID 証明書を受け取る。以降、呼び出し先のサービスは中央管理されたポリシーに対してアクセスを検証できる。

長期の静的クレデンシャルが合わない動的インフラ (オートスケール VM、コンテナ、短命な CI ジョブ) のために作られている。ポリシーは ZMS で中央管理されるが、クライアント側ポリシーエンジン (ZPE) を通じてローカルかつオフラインで強制できるため、リクエストごとに往復通信を必要としない。

## いつ使うか

- サービス間通信を運用しており、単なる証明書ではなく中央 RBAC モデルに紐づいた mTLS ID が欲しいとき。
- ワークロードが短命で、静的シークレットを配るのではなく、プラットフォームの attestation (クラウド metadata、Kubernetes サービスアカウントトークン、CI の OIDC) を短命証明書に交換したいとき。
- 多数のドメインにまたがる、explicit-deny セマンティクスのきめ細かい中央管理ポリシーが必要なとき。
- 人間向け SSO と OIDC/SAML IdP だけが欲しいなら不向き。それは Keycloak の領域。
- RBAC レイヤなしのワークロード ID 発行だけが欲しいなら不向き。SPIFFE/SPIRE がより狭く標準化された選択肢。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. Athenz CNCF プロジェクトページ (Sandbox 受理 2021-01-26): <https://www.cncf.io/projects/athenz/>
2. cncf/toc の Athenz onboarding issue: <https://github.com/cncf/toc/issues/595>
3. AthenZ/athenz README とリポジトリ: <https://github.com/AthenZ/athenz>
4. athenz.io 公式サイト: <https://www.athenz.io/>
5. Dash Open 21: Athenz (OSS 化の経緯): <https://yahoodevelopers.tumblr.com/post/615496922672824320/dash-open-21-athenz-open-source-platform-for>
6. AthenZ/athenz の GitHub API (stars・forks・releases): <https://github.com/AthenZ/athenz>
7. AthenZ/athenz CHANGELOG (open governance、v1.10.4): <https://github.com/AthenZ/athenz/blob/master/CHANGELOG>
