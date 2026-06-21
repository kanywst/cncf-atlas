# 内部実装

> コミット `06af72a`（v4.39.20）のソースを読んだもの。パスはリポジトリルートからの相対。

## コードマップ

| パス | 何があるか |
| --- | --- |
| `internal/authorization/` | `Authorizer`、アクセス制御ルール、レベル定数。 |
| `internal/handlers/handler_authz*.go` | forward-auth フレームワーク: ビルダー、ハンドラ、プロキシ別実装。 |
| `internal/session/` | ドメインごとのセッション `Provider` と `UserSession` 型。 |
| `internal/middlewares/authelia_context.go` | authz フレームワークが乗るリクエストコンテキスト。 |

## 中核データ構造

システムが回転する数少ない型:

- `authorization.Authorizer`（`internal/authorization/authorizer.go:11`）はコンパイル済みルールと既定ポリシーを持つ。起動時に一度構築され、リクエストごとには読み取り専用。
- `authorization.AccessControlRule`（`internal/authorization/access_control_rule.go:40`）は 1 ルールのドメイン・リソース・メソッド・ネットワーク・サブジェクトと付与ポリシーを持つ。事前計算された `HasSubjects` フラグが効いてくる（後述）。
- `authorization.Subject` と `Object`（`internal/authorization/types.go:49` と `:67`）はリクエストの主体（ユーザ名・グループ・クライアント ID・IP）と対象（URL・ドメイン・正規化済みパス・メソッド）を運ぶ。
- `session.UserSession`（`internal/session/types.go:20`）は cookie ドメイン、アイデンティティ、そしてセッションを一要素か二要素かに決める認証方式参照（AMR）を運ぶ。

## レベル

アクセス制御レベルは順序付き定数（`internal/authorization/const.go:6`）: `Bypass`、`OneFactor`、`TwoFactor`、`Denied`。ルールはマッチしたリクエストにこのいずれかを付与する。どのルールにもマッチしないときは既定ポリシーが適用される。

## 追う価値のあるパス: アクセス判定

`Authorizer` は一度だけ構築される。`NewAuthorizer` は構築時に設定の ACL を `[]*AccessControlRule` にコンパイルし（`internal/authorization/authorizer.go:19`）、ドメインとリソースの正規表現を事前コンパイルする。これによりリクエストごとの照合はパースではなくただのルックアップになる。

リクエスト時にハンドラは `GetRequiredLevel`（`internal/authorization/authorizer.go:51`）を呼ぶ。ルール順での先勝ち:

```go
for _, rule := range p.rules {
    if rule.IsMatch(subject, object) {
        return rule.HasSubjects, rule.Policy
    }
}
return false, p.defaultPolicy
```

`AccessControlRule.IsMatch`（`internal/authorization/access_control_rule.go:54`）は全条件（ドメイン・リソース・クエリ・メソッド・ネットワーク・サブジェクト）を AND する。空の条件は何にでもマッチするので、`methods` を書かないルールは全メソッドに適用される。

結果は `isAuthzResult`（`internal/handlers/handler_authz_util.go:28`）で結末に写像される:

```go
case required == authorization.Denied && (level != authentication.NotAuthenticated || !ruleHasSubject):
    return AuthzResultForbidden
```

この行が非自明な部分。リクエストが匿名だったからマッチしただけの `deny` ルールは、即座に 403 を返さない。ルールにサブジェクトがあり、かつユーザが匿名なら、ハンドラは代わりに unauthorized を返す。こうしてユーザはログインの機会を得て、次のリクエストで別のより具体的なルールにマッチできる。ハードな 403 になるのは、認証済みユーザの場合か、サブジェクトを持たない deny ルールの場合だけ。だから `GetRequiredLevel` はレベルと一緒に `rule.HasSubjects` を返す。判定はマッチしたルールがサブジェクト特定かどうかを知る必要があるため。

## 読んで驚いた点

- **セッションは再配置を防ぐ。** 各セッションは発行された cookie ドメインを埋め込む。cookie ストラテジはそれをリクエストから解決したドメインと比較し、不一致なら破棄する（`internal/handlers/handler_authz_authn.go:108`）。ある保護ドメインから別のドメインへコピーされた cookie は、受け入れられず拒否される。
- **ベアラトークンは ACL エンジンを再利用する。** OIDC アクセストークンは introspection され（`internal/handlers/handler_authz_authn.go:618`）、特定のベアラ authz スコープを持つことを要求され、付与された audience が対象 URL を覆うか検査される。クライアントクレデンシャルのトークンはユーザ無しでクライアント ID を立て、ルール内の `oauth2:client:` サブジェクトにマッチする。マシンアクセスも人間アクセスも同じ認可コードを通る。
- **ルールと正規表現は一度だけコンパイルされる。** ホットパスは確保を避ける: `Subject` と `Object` は値でマッチャに渡され、正規表現ルールは名前付きグループを整数インデックスに事前解決するので、照合はマップではなくスライスのルックアップになる。

## 出典

- コミット `06af72a`（v4.39.20）のソースを読んだもの。
- [Authelia リポジトリ](https://github.com/authelia/authelia)
