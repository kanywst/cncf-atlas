# 内部実装

> コミット `6872989` のソースから読んだ内容。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `src/core/main.go` | API サーバのエントリポイント、Beego アプリ、認証バックエンド登録。 |
| `src/server/registry/` | OCI v2 ルート、reverse proxy、manifest と blob のハンドラ。 |
| `src/server/middleware/` | 付加価値ゲート群: immutable・quota・cosign・contenttrust・vulnerable・repoproxy。 |
| `src/controller/` | ビジネスロジック: artifact・replication・scan・gc・retention。 |
| `src/pkg/` | ドメイン manager と `dao/` の DB アクセス。 |
| `portal/` | Angular の Web UI。 |

## 中核データ構造

`artifact.Artifact` (`src/pkg/artifact/model.go:32-48`) は Harbor が中心に据えるビジネスオブジェクトです。image・chart・その他 OCI 成果物を統一的に抽象化し、`Type`・`MediaType`・`ManifestMediaType`・`ArtifactType`・`Digest`・`Size`・`References` (index の子参照) を持ちます。`IsImageIndex()` が index か単一 manifest かを判定します (`src/pkg/artifact/model.go:64-68`)。

`dao.Artifact` (`src/pkg/artifact/dao/model.go:31-47`) は DB 行で、Beego ORM タグ付き、テーブル名は `artifact` です (`src/pkg/artifact/dao/model.go:49-52`)。`ExtraAttrs` は JSON 文字列カラム、`Annotations` は `jsonb` です (`src/pkg/artifact/dao/model.go:45-46`)。ビジネスオブジェクトは `From()` でここから変換されます (`src/pkg/artifact/model.go:71`)。

`model.RepoRecord` (`src/pkg/repository/model/model.go:33-42`) は repository 行で、`Name`・`ProjectID` と `PullCount`・`StarCount` などの pull 統計を持ちます。`v2auth.reqChecker` (`src/server/middleware/v2auth/auth.go:42-44`) はリクエストを access リストに分解して RBAC を回す内部型です。`lib.ResponseBuffer` (`src/server/registry/manifest.go:76` で使用) はバックエンド proxy のレスポンスをバッファし、成功時のみ flush します。これが pull と push 両方の中核です。

## 追う価値のあるパス

イメージ pull は GET `/v2/<repo>/manifests/<ref>` です。ルートは middleware を積んでから `getManifest` を呼びます (`src/server/registry/route.go:52-59`)。

認可がまず `/v2` 共通の middleware で走ります (`src/server/registry/route.go:37`)。`reqChecker.check` (`src/server/middleware/v2auth/auth.go:46-81`) が security context を取り、リクエストを access リストに分解し、repo 名から project ID を導出し (`src/server/middleware/v2auth/auth.go:68-73`)、RBAC レイヤにその action が許可されるか問います。

```go
resource := rbac_project.NewNamespace(pid).Resource(rbac.ResourceRepository)
if !securityCtx.Can(req.Context(), a.action, resource) {
    return getChallenge(req, al), fmt.Errorf("unauthorized to access repository: %s, action: %s", a.name, a.action)
}
```

未認証の CLI には token service を指す Bearer challenge を返し (`src/server/middleware/v2auth/auth.go:92-116`)、失敗時は `Www-Authenticate` ヘッダ付きで 401 を返します (`src/server/middleware/v2auth/auth.go:178-183`)。

ハンドラ `getManifest` (`src/server/registry/manifest.go:52-140`) はこうします。

1. バックエンドに触れる前に `artifact.Ctl.GetByReference` で DB から artifact を解決します (`src/server/registry/manifest.go:55`)。
2. reference が tag なら URL パスを保存済み digest に書き換え、バックエンドへは常に digest で問い合わせます (`src/server/registry/manifest.go:62-66`)。
3. `If-None-Match` が保存済み digest に一致すれば proxy せず 304 を返します (`src/server/registry/manifest.go:71-74`)。
4. cache 有効時はヒットすれば `pkg.ManifestMgr.Get` から manifest 本体を返し、miss なら proxy して write-back を予約します (`src/server/registry/manifest.go:82-105`)。
5. cache miss / 無効なら `proxy.ServeHTTP(buffer, req)` でバックエンドに委譲し、レスポンスをバッファします (`src/server/registry/manifest.go:107-109`)。
6. 成功時、HEAD でもレプリケーションサービス由来でもなければ `PullArtifactEventMetadata` を発火し、pull time 更新と webhook をトリガします (`src/server/registry/manifest.go:127-139`)。

`GetByReference` 本体 (`src/controller/artifact/controller.go:306-313`) は reference を digest として parse します。parse に失敗すれば tag とみなし `getByTag` (`src/controller/artifact/controller.go:323-342`) が repo をロードし、tag を list して artifact ID を引き、取得します。正しい digest なら `getByDigest` と `artMgr.GetByDigest` に進みます (`src/controller/artifact/controller.go:315-321`)。

## 読んで驚いたこと

tag はバックエンドストレージに一切届きません。push 時に reference が tag だと、Harbor は body から digest を計算し、転送前に proxy 先 URL を tag から digest に差し替えます (`src/server/registry/manifest.go:192-206`)。バックエンドが見るのは常に digest だけで、tag から digest の対応は Harbor の DB だけが持ちます (`src/server/registry/manifest.go:189-191`)。この一つの判断こそが、バックエンドの支援なしに immutable tag・retention・tag 単位 RBAC を可能にしています。

proxy 全体は `httputil.NewSingleHostReverseProxy` インスタンス 1 個です (`src/server/registry/proxy.go:29-42`)。バックエンドの basic auth は proxy の Director をラップして注入されます (`src/server/registry/proxy.go:44-52`)。manifest cache も read パスを静かに変えます。cache ヒット時は `ManifestMgr` から直接本体を返し、バックエンドには一切接触しません (`src/server/registry/manifest.go:82-105`)。
