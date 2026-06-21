# 内部実装

> コミット `10087e7` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `internal/eventstore/` | イベントストア中核: `Push`・`Filter`・`FilterToReducer`・`Search`。`events2` テーブルが正本 |
| `internal/command/` | 書き込み側ユースケース。ドメイン操作を write model へ reduce し整合性チェック後に push |
| `internal/query/` | 読み取り側。projection を SQL テーブルへ materialize して提供 |
| `internal/api/` | API 層: `grpc/`・`http/`・`authz/`。単一サービス定義から 3 トランスポート |
| `internal/api/authz/` | トークン検証と permission チェック |
| `cmd/` | cobra コマンド (`start`・`setup`・`initialise`・`mirror`・`key`)。`cmd/zitadel.go` がルート |
| `backend/v3/` | 進行中の次世代バックエンド (storage・api・instrumentation) |

## 中核データ構造

`Command` interface はイベントを書き込む「意図」(internal/eventstore/event.go:28)。`action` を埋め込み (`Aggregate()`・`Creator()`・`Type()`・`Revision()` を要求、event.go:16)、加えて `Payload() any` (nil / struct / JSON の []byte)、`UniqueConstraints()`、検索用 index を宣言する `Fields()` を持つ。

`Event` interface は保存済みアクティビティ (event.go:55)。`Sequence() uint64` (aggregate 内連番)、`CreatedAt()`、`Position() decimal.Decimal` (グローバル順序)、`Unmarshal(ptr any)` を持つ。

`Aggregate` 構造体はテナント識別子をモデルに強制する (internal/eventstore/aggregate.go:79):

    type Aggregate struct {
        ID string `json:"id"`
        Type AggregateType `json:"type"`
        // ResourceOwner is the org this aggregates belongs to
        ResourceOwner string `json:"resourceOwner"`
        // InstanceID is the instance this aggregate belongs to
        InstanceID string `json:"instanceId"`
        Version Version `json:"version"`
    }

`ResourceOwner` と `InstanceID` は `NewAggregate` で context から自動的に埋められる (aggregate.go:20)。どの書き込みもテナントを省略できない。

認可側では `CtxData`・`Membership`・`RoleMapping` が認可コンテキストを運ぶ。membership (org/project の role) を permission 文字列へ変換するのが `internal/api/authz/permissions.go` 全体だ。`SystemUserPermissions` は system user 用の変種で、`slices.Sort` と `slices.Compact` で重複除去する。

## 追う価値のあるパス

permission 解決は membership を、リクエストが照合される permission 文字列へ変換する。入口は `getUserPermissions` (internal/api/authz/permissions.go:25)。呼び出し元が system user なら system membership が直接マップされる (permissions.go:33)。そうでなければ membership を取得し、0 件なら継承込みで一度だけ再取得してから諦める:

    memberships, err := resolver.SearchMyMemberships(ctx, orgID, false)
    if err != nil {
        return nil, nil, err
    }
    if len(memberships) == 0 {
        memberships, err = resolver.SearchMyMemberships(ctx, orgID, true)
        if len(memberships) == 0 {
            return nil, nil, zerrors.ThrowNotFound(nil, "AUTHZ-cdgFk", "membership not found")
        }

各 membership の role は `mapMembershipToPerm` で permission へ展開される (permissions.go:98)。project / project-grant の role には project の `ObjectID` が context として付与され、`project.write:123` の形になる (permissions.go:120):

    func addRoleContextIDToPerm(perm, roleContextID string) string {
        if roleContextID != "" {
            perm = perm + ":" + roleContextID
        }
        return perm
    }

判定は `checkUserPermissions` が行う (internal/api/authz/authorization.go:60)。permission ゼロなら deny (`AUTH-5mWD2`)。auth option に `CheckParam` がなければ任意の permission で許可 (global)。そうでなければ、context ID なしの permission を持つ (`HasGlobalPermission`、authorization.go:111) か、req のフィールド値が permission の context ID と一致する (`hasContextPermission`、authorization.go:88) ときに許可する。req フィールドは reflection で引く (`getFieldFromReq`、authorization.go:103)。

呼び出しチェーン:

    AuthorizationInterceptor (auth_interceptor.go:16)
      -> CheckUserAuthorization (authorization.go:24)
         -> VerifyTokenAndCreateCtxData (authorization.go:28)
         -> getUserPermissions (permissions.go:25)
            -> mapMembershipsToPermissions -> addRoleContextIDToPerm (permissions.go:120)
         -> checkUserPermissions (authorization.go:60)
            -> HasGlobalPermission / hasContextPermission

permission モデルは `"<verb>:<resourceID>"` 文字列のリストにすぎない。RBAC は role から permission へのマッピングテーブルで、resource scoping は `:` の後ろの文字列一致で判定する。専用の policy DSL は持たない。

## 読んで驚いた点

`Push` はアプリ層でロックを取らない。イベントの primary key は実質 `(instance, aggregate, sequence)` なので、並行 writer が同じ sequence を取ると PostgreSQL が `events2_pkey` 違反 (SQLSTATE `23505`) を返し、コードはトランザクション全体を `maxRetries` 回までリトライする (internal/eventstore/eventstore.go:133)。制約名はチェックにハードコードされている:

    if pgErr.ConstraintName == "events2_pkey" && pgErr.SQLState() == "23505" {
        logging.WithError(ctx, err).Info("eventstore push retry")
        continue
    }
    if pgErr.SQLState() == "CR000" || pgErr.SQLState() == "40001" {
        logging.WithError(ctx, err).Info("eventstore push retry")
        continue
    }

CockroachDB の `CR000` と serialization failure `40001` も依然ここで扱われる (eventstore.go:148)。v3 以前の CockroachDB 時代の名残だ。コメントには issue #7202 が紐づく。直列化は完全に DB とリトライループに委ねられ、アプリの協調処理ではない。

非自明な選択がもう 2 つ。イベントは projection を待たずフィールドで lookup できる: `Command.Fields()` (event.go:39) が宣言した値が専用の field index テーブルへ書かれ、`Eventstore.Search` で読める (eventstore.go:184)。そしてグローバル順序は単調 bigint でなく `shopspring/decimal` の `Position` を使う (event.go:63)。トランザクション間の順序を安定させつつ、既存イベントの間に position を挿入する余地を残すためだ。
