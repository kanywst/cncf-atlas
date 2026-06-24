# 内部実装

> コミット `864f45eb1` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `staging/src/github.com/kubeedge/beehive` | メッセージフレームワーク。モジュール登録、バス、再起動ポリシー。 |
| `cloud/pkg` | cloudcore モジュール: cloudhub, edgecontroller, devicecontroller, synccontroller, dynamiccontroller。 |
| `edge/pkg` | edgecore モジュール: edged, edgehub, metamanager, devicetwin, eventbus。 |
| `edge/pkg/metamanager/dao` | gorm 経由でアクセスするエッジローカルの SQLite ストア。 |
| `keadm/cmd/keadm` | インストーラ CLI: `init`, `join`, `gettoken`。 |

## 中核データ構造

`model.Message` はバス上の単位だ。`MessageHeader`・`MessageRoute`・不透明な `Content interface{}` から成る (`staging/src/github.com/kubeedge/beehive/pkg/core/model/message.go:47-86`)。ヘッダの `ResourceVersion` フィールドは Kubernetes オブジェクトの resource version を運び、コメントによれば KubeEdge が信頼できる伝送のために活用する値だ (`message.go:77-80`)。route の `Operation` 語彙は insert/delete/query/update/patch/response/error など (`message.go:14-23`)、resource type 語彙は pod・node・configmap・secret・serviceaccounttoken・lease・certificatesigningrequest をカバーする (`message.go:25-43`)。

`core.Module` は全モジュールが満たすインターフェースで、`RestartPolicy` が `*ModuleRestartPolicy` を返す (`staging/src/github.com/kubeedge/beehive/pkg/core/module.go:47-61`)。`ModuleRestartPolicy` は再起動タイプ (Always か OnFailure)、リトライ回数、間隔、そしてバックオフ用の `IntervalTimeGrowthRate` を持つ (`module.go:27-44`)。

エッジのストアには 2 つの gorm モデルがある。`Meta` はフラットな key/value 行で、`Key` (主キー, size 256)・`Type` (size 32)・`Value` (text) だ (`edge/pkg/metamanager/dao/models/meta.go:20-29`)。`MetaV2` は Kubernetes API オブジェクトを group/version/resource・namespace・name・`ResourceVersion` 付きで記録する。これがエッジで MetaServer による list/watch を提供できる根拠だ (`edge/pkg/metamanager/dao/models/meta.go:32-44`)。

## 追う価値のあるパス

クラウドから来てエッジに届くメッセージを追う。`routeToEdge` は `chClient.Receive()` でブロックし、エラー時は `reconnectChan` に push して return し、接続が再構築される (`edge/pkg/edgehub/process.go:42-61`)。

```go
message, err := eh.chClient.Receive()
if err != nil {
    klog.Errorf("websocket read error: %v", err)
    eh.reconnectChan <- struct{}{}
    return
}
```

`dispatch` は `ProcessHandler` へ転送し (`edge/pkg/edgehub/process.go:38-40`)、`ProcessHandler` は登録済みハンドラを反復して最初に true になったものを実行する。

```go
for _, handle := range handlers {
    if handle.Filter(&message) {
        if err := handle.Process(&message, client); err != nil {
            return fmt.Errorf("failed to handle message, ...: %+v", err)
        }
        return nil
    }
}
return fmt.Errorf("... no handler found ...")
```

このループは `edge/pkg/edgehub/messagehandler/handler.go:61-74` にある。ハンドラのスライスは `RegisterHandlers` が meta・twin・bus・task の順で構築するので (`handler.go:51-58`)、登録順が優先度を決める。各ハンドラは `FilterFunc` と `ProcessFunc` を持つ `SimpleHandler` だ (`handler.go:34-46`)。

## 読んで驚いた点

クラウドリンクは request/response API ではなく、heartbeat 付きの単一双方向ストリームだ。`keepalive` は keepalive メッセージを組み立て `Config.Heartbeat` 秒ごとに ping を送る。送信失敗はどれも `reconnectChan` 経由で接続を切り倒す (`edge/pkg/edgehub/process.go:106-128`)。

Beehive の再起動ロジックはモジュール単位で、幾何級数的バックオフを使う。`localModuleKeeper` はモジュールのポリシーを読み、ポリシーが nil なら即座に return し、そうでなければモジュールを再起動するループに入り、`restartCount` が `policy.Retries` を超えたら止まる (`staging/src/github.com/kubeedge/beehive/pkg/core/core.go:96-145`)。間隔は `calculateIntervalTime` で伸びる。これは成長率を掛けるが、率が 1 以下なら無視し、デフォルト 30 秒の上限で頭打ちにする (`core.go:157-173`)。

無効なモジュールは黙って捨てられるのではなく記録される。`Register` は `Enable()` が false のモジュールを `disabledModules` に入れて警告ログを出し、何を要求されたかと何が動くかについてレジストリを正直に保つ (`staging/src/github.com/kubeedge/beehive/pkg/core/module.go:76-95`)。
