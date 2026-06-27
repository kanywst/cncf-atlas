# 内部実装

> コミット `3a7ae05` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `servers/zms/src/main/java/com/yahoo/athenz/zms/ZMSImpl.java` | ZMS の REST ロジックと中央アクセスチェックエンジン。 |
| `servers/zms/src/main/java/com/yahoo/athenz/zms/DBService.java` | MySQL 上の ZMS 永続化。 |
| `servers/zts/src/main/java/com/yahoo/athenz/zts/ZTSImpl.java` | ZTS の REST ロジックとクレデンシャル発行。 |
| `servers/zts/src/main/java/com/yahoo/athenz/zts/store/DataStore.java` | 分散強制向けの ZMS データのローカルキャッシュ。 |
| `servers/zts/src/main/java/com/yahoo/athenz/zts/cert/InstanceCertManager.java` | 証明書署名と起動委譲認可。 |
| `libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/` | Principal / Authority の抽象と認証ユーティリティ。 |
| `core/zms`, `core/zts`, `core/msd` | RDL 生成データモデル。 |
| `libs/go/sia/`, `provider/*/.../cmd/siad/main.go` | Go の Service Identity Agent とプラットフォーム別プロバイダ。 |

## 中核データ構造

ポリシー評価は少数の型を軸に回り、その多くは RDL から生成される。

- `Assertion` (`core/zms/src/main/java/com/yahoo/athenz/zms/Assertion.java`) はポリシーの最小単位。フィールドは `resource`、`action`、`effect` (ALLOW/DENY の `AssertionEffect`) に加え `role`、`id`、`caseSensitive`、`conditions`。
- `Policy` (`core/zms/src/main/java/com/yahoo/athenz/zms/Policy.java`) は version と active フラグを持つ assertion のリスト。複数バージョンが存在しうるが、評価されるのは active のものだけ。
- `Role` (`core/zms/src/main/java/com/yahoo/athenz/zms/Role.java`) はメンバ集合で、assertion の `role` フィールドと突合される。
- `AthenzDomain` (`libs/java/server_common/src/main/java/com/yahoo/athenz/common/server/store/AthenzDomain.java:24`) は 1 ドメインの roles・groups・policies・services・entities を束ねるサーバ内集約。評価はこのメモリ上の単位で行われる。
- `Principal` (`libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/Principal.java:24`) は認証済み主体で、`getFullName()` (`:88`)、`getCredentials()` (`:91`)、`getX509Certificate()` (`:95`)、`getRoles()` (`:111`)、`getAuthority()` (`:114`)、`getMtlsRestricted()` (`:148`) を公開する。
- `Authority` (`libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/Authority.java:30`) はプラガブル認証の SPI で、`CredSource` enum (`:35`) と、生クレデンシャル (`:141`)・X.509 証明書 (`:152`)・`HttpServletRequest` (`:162`) 向けの `authenticate(...)` オーバーロードを持つ。

## 追う価値のあるパス

ZTS のサービス ID ブートストラップを辿る。ワークロードがプラットフォームの attestation を X.509 証明書に交換する箇所だ。エントリポイントは `servers/zts/src/main/java/com/yahoo/athenz/zts/ZTSImpl.java:4893` の `ZTSImpl.postInstanceRegisterInformation(ctx, info)`。

1. read-only モードを拒否し (`:4898`)、RDL 型に対して検証し (`:4904`)、オブジェクトを小文字化する (`:4910`)。
2. `instanceCertManager.verifyInstanceCertIPAddress` で送信元 IP がプロバイダの許可範囲か検証する (`:4923`)。
3. `dataStore.getDomainData` でローカルキャッシュからドメインを取得し (`:4930`)、`validateInstanceServiceIdentity` でサービスが登録済みか確認する (`:4936`)。
4. 二重認可を実行する。プロバイダがインスタンス起動を許可されていること、かつサービスがそのプロバイダに起動委譲していることを `instanceCertManager.authorizeLaunch` で確認する (`:4945`)。
5. CSR があれば `postInstanceX509CertificateRegister` に渡し (`:4953`/`:4958`)、なければ `postInstanceJWTRegister` で JWT を発行する (`:4950`)。X.509 経路は attestation data が必須で (`:4965`)、これをプラットフォームの `InstanceProvider` が検証してから CA が署名する。

```text
postInstanceRegisterInformation        ZTSImpl.java:4893
  verifyInstanceCertIPAddress           :4923
  getDomainData / validateInstanceServiceIdentity  :4930 / :4936
  authorizeLaunch (プロバイダ + サービス委譲)        :4945
  postInstanceX509CertificateRegister   :4958  (attestation 必須 :4965)
```

中央チェック側の短絡の仕方は異なる。`evaluateAccess` の assertion ループが deny 後勝ちを保証する。

```text
for each active policy:
  for each assertion:
    if already ALLOWED and effect == ALLOW: continue   # ZMSImpl.java:3587
    if not assertionMatch(...): continue
    if effect == DENY: return DENIED                    # ZMSImpl.java:3603
    accessStatus = ALLOWED                              # ZMSImpl.java:3607
```

## 読んで驚いた点

- ポリシー評価は ALLOW で短絡しない。`evaluateAccess` は走査を続けて後続の DENY を勝たせる (`servers/zms/src/main/java/com/yahoo/athenz/zms/ZMSImpl.java:3583`-`3607`)。コード中のコメントにも明記されている。
- 認可は本質的に、メモリ上の `AthenzDomain` に対する線形走査。ZTS は ZMS データをまるごと `DataStore.java` にキャッシュ (pull モデル) して分散強制のレイテンシを下げ、リクエストごとに ZMS を呼ばない。
- ZTS の証明書発行は、二段認可 (プロバイダ起動 + サービスからプロバイダへの委譲) に続くプロバイダ固有の attestation 検証で成り立つ (`servers/zts/src/main/java/com/yahoo/athenz/zts/ZTSImpl.java:4945`, `:4965`)。実質的にクラウド metadata や Kubernetes サービスアカウントトークンを Athenz ID 証明書に変換する callback だ。
- glob マッチがポリシーエンジン全体で共有される原始要素になっている。action・resource・role のパターンはすべて `StringUtils.patternFromGlob` (`libs/java/auth_core/src/main/java/com/yahoo/athenz/auth/util/StringUtils.java:47`) を経て `String.matches` に流れる。ワイルドカード設計とドメイン単位線形走査のコストが一箇所に集約される。
