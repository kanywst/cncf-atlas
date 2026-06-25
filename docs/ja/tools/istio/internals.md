# 内部実装

> コミット `58e9892` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `pilot/cmd/pilot-discovery` | istiod のエントリポイント (`main.go:27`) |
| `pilot/pkg/xds` | xDS サーバ: debounce・push・generator |
| `pilot/pkg/model` | 設定モデル・push context・proxy 型 |
| `pkg/xds` | 汎用 xDS サーバの骨格 (`server.go`) |
| `security` | CA、SPIFFE ワークロード証明書の発行 |
| `cni` | トラフィックリダイレクト用 CNI plugin |
| `istioctl` | CLI: install・analyze・proxy-config |
| `operator`, `manifests` | Helm chart と install profile |

## 中核データ構造

`DiscoveryServer` (`pilot/pkg/xds/discovery.go:65`) は xDS サーバ。`Generators` (TypeUrl から resource generator への map)、`pushChannel`、`pushQueue`、mutex 付き `adsClients`、xDS `Cache`、model `Env`、`concurrentPushLimit` セマフォ、`DebounceOptions` を持つ。debounce 入口と push 出口を分離する。

`PushContext` (`pilot/pkg/model/push_context.go:205`) は 1 回の push 用の不変スナップショット。service、virtual service、destination rule、gateway、sidecar、認証・認可ポリシー、telemetry、mesh 設定を索引化する。設定変更ごとに丸ごと作り直す。

`PushRequest` (`pilot/pkg/model/push_context.go:359`) は push の単位。`ConfigsUpdated sets.Set[ConfigKey]` が scope 最適化を駆動する。空なら全 proxy へ push、非空なら依存する proxy だけへ push する (`push_context.go:359-364`)。`Push *PushContext`、`Reason`、`Delta`、`Forced` も持つ。debounce 時に merge される。

`Proxy` (`pilot/pkg/model/context.go:312`) は接続中の Envoy 1 個を表す。`Type`、`IPAddresses`、`ID`、`Locality`、`ConfigNamespace`、`Labels`、`Metadata`、そしてその proxy に見える設定範囲 `SidecarScope` を持つ。

`WatchedResource` (`pkg/xds/server.go:58`) は TypeUrl ごとの購読状態。`ResourceNames`、`Wildcard`、ACK 同期用の `NonceSent`/`NonceAcked`、そして proxy が別の istiod に再接続したときに warming を完了させる `AlwaysRespond` (`pkg/xds/server.go:80-90`)。

## 追う価値のあるパス

`ConfigUpdate` は呼び出し側 goroutine ではほとんど何もしない。Address kind には cache を clear し、あとはチャネルへ渡す (`pilot/pkg/xds/discovery.go:326-343`):

```go
func (s *DiscoveryServer) ConfigUpdate(req *model.PushRequest) {
    if model.HasConfigsOfKind(req.ConfigsUpdated, kind.Address) {
        s.Cache.ClearAll()
    }
    inboundConfigUpdates.Increment()
    s.InboundUpdates.Inc()
    s.pushChannel <- req
}
```

`handleUpdates` はチャネルを `debounce` に通し、`s.Push` をコールバックにする (`pilot/pkg/xds/discovery.go:351-352`):

```go
func (s *DiscoveryServer) handleUpdates(stopCh <-chan struct{}) {
    debounce(s.pushChannel, stopCh, s.DebounceOptions, s.Push, s.CommittedUpdates)
}
```

`Push` は新しいスナップショットを構築して fan-out する (`pilot/pkg/xds/discovery.go:288-307`):

```go
func (s *DiscoveryServer) Push(req *model.PushRequest) {
    oldPushContext := s.globalPushContext()
    versionLocal := s.NextVersion()
    push := s.initPushContext(req, oldPushContext, versionLocal)
    req.Push = push
    s.AdsPushAll(req)
}
```

そこから `StartPush` が全 client を enqueue し (`pilot/pkg/xds/ads.go:580-592`)、`pushConnection` が `ProxyNeedsPush` を確認して変更に触れない proxy を skip し (`pilot/pkg/xds/ads.go:484-489`)、`pushXds` が generator を引いて応答を書き込む (`pilot/pkg/xds/xdsgen.go:112`)。

## 読んで驚いた点

設定モデルは変更ごとにパッチではなく丸ごと再構築する。`initPushContext` が新しい `PushContext` を作り、旧版は捨てられる (`pilot/pkg/xds/discovery.go:294-298`)。高コストに見えるが、だからこそ手前に debounce 窓を置いて (`pilot/pkg/xds/discovery.go:355`) 連続イベントを 1 回の再構築に畳む。

高コストな処理はリクエスト経路から外してある。`ConfigUpdate` はカウンタを増やしてチャネルに書くだけ (`pilot/pkg/xds/discovery.go:335-342`)。`handleUpdates` 上のコメントは、`ConfigUpdate` が既に他のロックを保持しうるため debounce と push を別スレッドで走らせると述べる (`pilot/pkg/xds/discovery.go:345-348`)。

push は意図的に絞られる。`StartPush` は全 client を一度に enqueue するが (`pilot/pkg/xds/ads.go:580-592`)、`concurrentPushLimit` セマフォが同時に書き込む proxy 数を制限する。数万 proxy のメッシュへの設定変更が一度にスパイクしないようにする。

`WatchedResource` の `AlwaysRespond` (`pkg/xds/server.go:80-90`) は静かな正しさ修正。Envoy が別の istiod インスタンスに再接続したとき、通常なら ACK に見える request にも応答しないと cluster と listener の warming が完了しない。コメントは、応答後に false へ戻さないと無限ループすると警告する。
