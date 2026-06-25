# 内部実装

> コミット `f01cbf5` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/yurthub/` | YurtHub のエントリポイントと起動配線 (`yurthub.go:27`, `app/start.go:94`) |
| `pkg/yurthub/proxy/` | リクエスト横取り、backend 選択、ローカルフォールバック (`proxy.go:149`) |
| `pkg/yurthub/proxy/remote/` | クラウド転送、レスポンスキャッシュ、エラーフォールバック (`loadbalancer.go`) |
| `pkg/yurthub/cachemanager/` | レスポンスの decode と保存、キャッシュ照会 (`cache_manager.go:112`) |
| `pkg/yurthub/storage/` | キャッシュキーモデルとディスクストア (`key.go`, `disk/key.go`, `store.go`) |
| `pkg/yurthub/util/` | ノンブロッキングキャッシュに使う tee read-closer (`util.go:284`) |
| `pkg/yurtmanager/controller/` | エッジコントローラ: nodepool, yurtappset, hubleader, raven など |
| `pkg/apis/` | CRD 型: `apps`, `iot`, `network`, `raven` |

## 中核データ構造

`KeyBuildInfo` (`pkg/yurthub/storage/key.go:25-32`) はすべてのキャッシュキーの素だ。`Component`、`Namespace`、`Name`、`Resources`、`Group`、`Version` を持つ。ディスクストアはこれを `diskStorage.KeyFunc` (`pkg/yurthub/storage/disk/key.go:47`) でパスに変換する。レイアウトは `disk/key.go:42-44` のコメントに記され、`<Component>/<Resource.Version.Group>/<Namespace>/<Name>` で、namespace や name が無い場合は短い形になる。各キャッシュオブジェクトはコンポーネント別ディレクトリ下の per-object ファイルだ。これを支える `Store` インタフェースは `pkg/yurthub/storage/store.go:31` で、`Create`、`Delete`、`Get`、`List`、`Update`、`KeyFunc`、`ReplaceComponentList` を持つ。

`dualReadCloser` (`pkg/yurthub/util/util.go:295-336`) は `io.ReadCloser` と `io.PipeWriter` をラップする。`Read` (`util.go:306`) は読んだバイトをそのまま pipe writer にも流す tee だ。この tee により、キャッシュ書き込みがクライアント応答をブロックしない。

`NodePoolSpec` (`pkg/apis/apps/v1beta2/nodepool_types.go:42`) は物理リージョンをモデル化する。`Type` は `Edge` か `Cloud` (`nodepool_types.go:24-31`)、`HostNetwork` (`nodepool_types.go:47-51`) は flannel などの CNI コンポーネントを入れず pod がホストのネットワーク namespace を使うことを示す。

`GatewaySpec` (`pkg/apis/raven/v1beta1/gateway_types.go:64`) は Raven の L3 トンネルを設定する。`Endpoint` のリストを持ち、各 Endpoint には `NodeName` (`gateway_types.go:80-81`) と pod IP range の `Subnets` (`gateway_types.go:104-105`) がある。

## 追う価値のあるパス

クラウドに対して成功した get を追う。応答はクライアントへ戻る途中でキャッシュされる。

転送された応答は `modifyResponse` (`pkg/yurthub/proxy/remote/loadbalancer.go:352`) に届く。キャッシュ対象の 2xx なら `cacheResponse` (`loadbalancer.go:431`) を呼ぶ。この関数はボディを tee し、片端をキャッシュマネージャに渡す。

```go
rc, prc := hubutil.NewDualReadCloser(req, resp.Body, true)
// ...
if err := lb.localCacheMgr.CacheResponse(req, wrapPrc, stopCh); err != nil && !errors.Is(err, io.EOF) &&
```

クライアントは `rc` を読み、キャッシュマネージャは goroutine で `prc` を読み、`CacheManager.CacheResponse` (`pkg/yurthub/cachemanager/cache_manager.go:112`) がストリームを decode して各オブジェクトをディスクに書く。オフライン経路でも同じデータが返る。`errorHandler` (`loadbalancer.go:333`) が `localCacheMgr.QueryCache(req)` (`loadbalancer.go:343`) を呼び、キャッシュ済みオブジェクトをそのままクライアントへ書く。

## 読んで驚いた点

キャッシュ書き込みはクライアントを決してブロックしない。ボディは `dualReadCloser` で tee されるため、クライアントストリームとディスク書き込みは独立し、キャッシュ書き込みは goroutine で起きる (`loadbalancer.go:433-438`)。遅いディスクが応答を遅らせない。

クラウドからの 404 list は prune の合図として扱われる。クラウドが list に 404 を返すと、エラー経路がその kind のローカルキャッシュを `DeleteKindFor` (`loadbalancer.go:413-423`) で削除する。CRD が消えたオブジェクトをキャッシュが返し続けないためだ。

pool-scope リソースは整合性の話を変える。`services` と `endpointslices` は各ノード自身の watch ではなく pool ごとの leader hub を通して読まれるため (`cmd/yurthub/app/options/options.go:126-129`, `proxy.go:171-189`)、follower はこのメタデータをクラウド apiserver から直接ではなく leader 経由で見る。
