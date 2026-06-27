# recon: Athenz

調査メモ。自分用の密度。出典は URL 付き、コードは `path:line` で固定。pinned commit に対して検証済み。

## 基本情報

- repo: AthenZ/athenz
- pinned commit: `3a7ae0530aa597774d5ae665e6584dfb57e39206` (2026-06-23) / 近いタグ: v1.12.43 (`add5ddff`, 2026-06-19 リリース)。HEAD は v1.12.43 の数コミット先の master。
- 言語 / ビルド: Java 中心 (`mvn clean install`)、Go (SIA / CLI / クライアント、`make`)、UI は Node.js/React (`npm run dev` / `npm run build`)。Java 877 ファイル、Go 292 ファイル、JS/JSX 約 604 ファイル (test 含む)。
- ライセンス: Apache-2.0。`LICENSE` 冒頭が Apache License Version 2.0、GitHub API も `spdx_id: Apache-2.0` を返す。検証済み。
- CNCF 成熟度: Sandbox (2021-01-26 受理)。出典 S1, S2。
- カテゴリ: Identity & Policy
- タグライン (en): X.509 service identity and fine-grained RBAC for dynamic, hybrid-cloud infrastructure.
- タグライン (ja): 動的・ハイブリッドクラウド向けの X.509 サービス認証ときめ細かい RBAC 認可基盤。

名前は "AuthNZ" 由来 (N=authentication, Z=authorization)。出典 S3, S4。

## 歴史の素材

- 起源: Yahoo (のち Verizon Media / Oath) 社内の認証認可基盤として開発。大規模本番で実運用。OSS 化の経緯は Dash Open ポッドキャスト #21 (2020) で Mujib Wahab / Henry Avetisyan が説明。出典 S5。
- GitHub リポジトリ作成 2016-11-16 (API `created_at`)。当初は `yahoo/athenz` org、現在は `AthenZ/athenz` に移管 (Go module も `github.com/yahoo/athenz` から `github.com/AthenZ/athenz`)。出典 S6, S3。
- 解いた課題: 動的インフラ (オートスケール VM / コンテナ / FaaS) で、静的な長期クレデンシャルなしにワークロード ID を発行し、きめ細かい RBAC を中央管理しつつ実行時はローカルで強制したい。中央管理 (ZMS) と分散強制 (ZTS + クライアント側 ZPE) を分離する設計はここに由来。
- open governance への移行は v1.10.4 (2021-02-14) リリースの変更 (#1299 "adopting open governance model")。`CHANGELOG` に記載。CNCF Sandbox 受理 (2021-01-26) と同時期。出典 S2, S7。
- 現行: 最新リリース v1.12.43 (2026-06-19)。`1.12.x` 系で活発にメンテ。出典 S6。

## アーキテクチャの素材

トップレベル構成 (`servers/`, `libs/`, `clients/`, `core/`, `provider/`, `ui/`)。

- ZMS (Athenz Management System) = 認可データの source of truth。ドメイン / ロール / ポリシー / サービスの CRUD と中央集権的アクセスチェックを担う。`servers/zms/src/main/java/com/yahoo/athenz/zms/ZMSImpl.java` (13,512 行)、永続化は `DBService.java` (10,349 行、MySQL スキーマ `servers/zms/schema/zms_server.sql`)。
- ZTS (Athenz Token System) = 分散認可向けのトークン / 証明書発行サービス。ZMS のデータをローカルにキャッシュ (`servers/zts/src/main/java/com/yahoo/athenz/zts/store/DataStore.java`, 2,191 行) し、ワークロードに X.509 ID 証明書・ロール証明書・OAuth2 アクセストークン・ロールトークンを発行。本体 `ZTSImpl.java` (7,262 行)、証明書管理 `cert/InstanceCertManager.java` (1,565 行)。
- 認可コア (auth_core) = Principal / Authority の抽象と各種認証実装、トークン / 証明書ユーティリティ。`libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/`。
- SIA (Service Identity Agent) = 各プラットフォームでワークロードの ID 証明書を取得・日次更新する Go エージェント。`libs/go/sia/` と `provider/{aws,gcp,azure,github,buildkite,harness,spacelift}/.../cmd/siad/main.go`。
- ZPE = クライアント側ポリシーエンジン (分散強制)。クライアント実装 `clients/go/zpe`, `clients/nodejs/zpe`。
- サーバ起動 (エントリポイント): `containers/jetty/src/main/java/com/yahoo/athenz/container/AthenzJettyContainer.java` の `main`。ZMS/ZTS とも embedded Jetty 上で REST を提供。
- API は RDL (REST Description Language) 定義からスタブを自動生成。`servers/zms/src/main/rdl/ZMS.rdl`、`servers/zts/src/main/rdl/ZTS.rdl`、ジェネレータは `rdl/`。`core/zms`, `core/zts`, `core/msd` が生成データモデル。

### 代表パス 1: 中央集権アクセスチェック (ポリシー評価) end-to-end

ZMS の `access` API。1 リクエストの流れ:

1. `ZMSImpl.access(action, resource, principal, trustDomain)` — `servers/zms/src/main/java/com/yahoo/athenz/zms/ZMSImpl.java:3648`。入力を小文字化し (`:3654`)、`user.` ドメインの home 変換 (`:3663`)、Authority が認可チェックに使えるか確認 (`AuthzHelper.authorityAuthorizationAllowed`, `:3674`)。
2. resource からドメイン解決。見つからなければ 404 (`:3688`-`3695`)、無効ドメインは 403 (`:3700`)。`retrieveAccessDomain` で `AthenzDomain` を取得。
3. `hasAccess(domain, action, resource, principal, trustDomain)` — `:3708`。RoleToken ベースなら `validateRoleBasedAccessCheck` でロールトークンの正当性を先に検証 (`:3717`)。
4. `evaluateAccess(domain, identity, action, resource, authenticatedRoles, trustDomain, principal)` — `:3530`。中核。
   - mTLS restricted 証明書は即 DENY (`:3535`)。
   - ドメインの全 Policy を走査 (`:3547`)。inactive/multi-version policy はスキップ (`:3556`)。
   - 各 Assertion を評価 (`:3573`)。effect 既定は ALLOW (`:3578`)。既に ALLOW 確定済みなら ALLOW assertion はスキップするが走査は止めない (`:3587`)。
   - `assertionMatch(...)` が真で effect=DENY なら即座に DENIED を返す (`:3603`)。ALLOW マッチは記録だけして走査継続 (`:3607`)。
5. `assertionMatch(assertion, identity, action, resource, domain, roles, authenticatedRoles, trustDomain)` — `:6809`。
   - action / resource は `StringUtils.patternFromGlob` (`libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/util/StringUtils.java:47`) で glob から正規表現に変換し `String.matches` (`:6812`-`6826`)。
   - role パターンも glob 変換し、ロールトークン経由なら `matchRole` (`:6831`、定義 `:6713`)、X.509/principal 経由なら `matchPrincipal` (`:6833`、定義 `:6763`)。

非自明な設計判断: explicit-deny-wins。最初に見つかった ALLOW で打ち切らず全ポリシー / 全 assertion を走査し続け、後続の DENY assertion があれば最終的に拒否する (`:3583`-`3607`)。コメントにも明記。これは「あるロールに広く ALLOW しつつ特定リソース / アクションだけ DENY で穴を塞ぐ」運用を安全側に倒すための選択。glob ベースのワイルドカードマッチと組み合わさるため、DENY を後勝ちにしないと広い ALLOW を局所的に上書きできない。

### 代表パス 2: サービス ID 証明書のブートストラップ (ZTS)

ワークロードが SIA 経由で初回 ID 証明書を得る流れ (provider callout モデル):

1. `ZTSImpl.postInstanceRegisterInformation(ctx, info)` — `servers/zts/src/main/java/com/yahoo/athenz/zts/ZTSImpl.java:4893`。read-only モード拒否 (`:4898`)、RDL バリデーション (`:4904`)、小文字化 (`:4910`)。
2. 送信元 IP がプロバイダ許可 IP か検証 (`instanceCertManager.verifyInstanceCertIPAddress`, `:4923`)。
3. ローカルキャッシュからドメイン取得 (`dataStore.getDomainData`, `:4930`)、サービスが登録済みか検証 (`validateInstanceServiceIdentity`, `:4936`)。
4. 二重認可: プロバイダがインスタンス起動を Athenz 上で許可されているか、かつサービスがそのプロバイダに起動委譲しているか (`instanceCertManager.authorizeLaunch`, `:4945`)。
5. CSR があれば `postInstanceX509CertificateRegister` (`:4953`/`:4958`)、なければ JWT 発行 `postInstanceJWTRegister` (`:4950`)。X.509 経路は attestation data 必須 (`:4965`) で、プロバイダ (AWS/GCP/Azure/K8s/GitHub Actions 等) の `InstanceProvider` 実装が attestation を検証してから CA が署名。

発行された証明書は 30 日有効で SIA が日次更新 (README 記載、出典 S3)。

## 内部実装の素材

中核データ構造 (RDL 生成 + サーバ内集約):

- `Assertion` — `core/zms/src/main/java/com/yahoo/athenz/zms/Assertion.java`。フィールド: `role`, `resource`, `action`, `effect` (`AssertionEffect` ALLOW/DENY), `id`, `caseSensitive`, `conditions` (`AssertionConditions`)。ポリシー評価の最小単位。
- `Policy` — `core/zms/src/main/java/com/yahoo/athenz/zms/Policy.java`。Assertion のリスト + version/active。複数バージョン対応 (active 以外は評価スキップ)。
- `Role` — `core/zms/src/main/java/com/yahoo/athenz/zms/Role.java`。メンバ集合。assertion の `role` フィールドと突合される評価対象。
- `AthenzDomain` — `libs/java/server_common/src/main/java/com/yahoo/athenz/common/server/store/AthenzDomain.java:24`。1 ドメインの `roles` / `groups` / `policies` / `services` / `entities` / `domain` を束ねるサーバ内集約。評価は基本この単位でメモリ上に展開して走査。
- `Principal` — `libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/Principal.java:24`。`getFullName()` (`:88`), `getCredentials()` (`:91`), `getX509Certificate()` (`:95`), `getRoles()` (`:111`), `getAuthority()` (`:114`), `getMtlsRestricted()` (`:148`)。認証済み主体の抽象。
- `Authority` — `libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/Authority.java:30`。プラガブル認証の SPI。`CredSource` enum (`:35`: HEADER/CERTIFICATE/REQUEST)、`authenticate(creds, remoteAddr, httpMethod, errMsg)` (`:141`) と X.509 / `HttpServletRequest` オーバーロード (`:152`/`:162`)。証明書・各種トークン・ヘッダ認証を差し替え可能にする拡張点。

追う価値のあるパス: 上記「代表パス 1」の `evaluateAccess` から `assertionMatch` から `matchPrincipal/matchRole`。glob から regex への変換 (`StringUtils.patternFromGlob:47`) が action/resource/role すべてに効くので、ワイルドカード設計とパフォーマンス (ドメイン内全 policy 線形走査) の両方がここに集約される。

驚いた点 / 非自明:

- ポリシー評価は短絡しない。ALLOW を見つけても全走査を続け DENY 後勝ちを保証 (`ZMSImpl.java:3583`-`3607`)。
- 認可は基本「ドメイン全体をメモリ展開して線形走査」。ZTS 側は ZMS データをまるごとローカルキャッシュ (`DataStore.java`) して分散強制のレイテンシを下げる pull モデル。
- ZTS の証明書発行は「プロバイダ起動委譲」と「サービスからプロバイダへの委譲」の二段認可 + プロバイダ固有 attestation 検証で成り立つ (`ZTSImpl.java:4945`, `:4965`)。クラウド metadata / K8s SA トークンを Athenz ID 証明書に交換する callback 機構。
- API/データモデルは手書きでなく RDL から生成 (`servers/zms/src/main/rdl/ZMS.rdl` 等)。互換性管理を IDL に寄せている。

## 採用事例の素材

`ADOPTERS.md` (pinned commit) に記載、出典付きのみ:

- Yahoo — <https://www.yahoo.com>。K8s ワークロードセキュリティで RBAC + サービス認証に使用 (athenz.io testimonial、出典 S3)。
- LY Corporation — <https://www.lycorp.co.jp/en/>。Yahoo! JAPAN サービスのセキュリティ基盤として使用 (testimonial、出典 S4)。
- Vespa.ai — <https://vespa.ai/>。`ADOPTERS.md` 記載。

採用シグナル (2026-06-24 時点、GitHub API): stars 994、forks 306、contributors 約 109 (`anon=true` ページング上)、open issues 44。最新リリース v1.12.43 (2026-06-19)。CII Best Practices バッジあり (project 4681)。出典 S6。

## 代替・エコシステム

- SPIFFE/SPIRE (CNCF Graduated): ワークロード ID の標準 (SVID, X.509/JWT) と発行。SPIFFE は ID の発行と検証に集中し、認可ポリシー (RBAC) は持たない。Athenz は ID 発行 (ZTS) と RBAC 認可 (ZMS) を一体で提供し、ロール証明書 / アクセストークン発行まで含む点が差。出典 S1。
- Open Policy Agent (CNCF Graduated): 汎用ポリシーエンジン (Rego)。認可ロジックは強力だが ID 発行や証明書ライフサイクルは範囲外。Athenz はドメイン/ロール/ポリシーの中央管理 + ID 発行込みのドメイン特化。
- Keycloak: ユーザ向け IAM / OIDC・SAML IdP。人間ユーザの SSO が主眼。Athenz はサービス間 (mTLS / X.509) とワークロード ID が主眼で用途が異なる。
- cert-manager: K8s での証明書発行自動化。CA 連携は近いが RBAC 認可レイヤは持たない。

統合・エコシステム: 各クラウドの SIA プロバイダ (AWS EC2/ECS/Fargate/EKS, GCP GCE/GKE/Run, Azure VM)、CI 系 (GitHub Actions, Buildkite, Harness, Spacelift) の ID プロバイダ。Envoy / SDS 連携 (`libs/go/sia/sds`)、K8s 向け (`kubernetes/`, `provider/aws/sia-eks`, `provider/gcp/sia-gke`)、AWS 一時クレデンシャル交換、DynamoDB / Pulsar / Slack 通知などの server_common 実装。UI は React。
