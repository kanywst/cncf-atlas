# recon: KubeEdge

調査メモ。出典は URL 付き。コードは pin した commit を実際に読んで file:line を残す。

## 基本情報

- repo: `kubeedge/kubeedge` (<https://github.com/kubeedge/kubeedge>)
- pinned commit: `864f45eb1b23059e3ddb7bb862c2d51cba7d0f34` (2026-06-22, master)
- 近いタグ: `v1.23.0` (HEAD はこのタグの 89 commits ahead。`gh api compare` で確認)
- 言語 / ビルド: Go (go.mod `go 1.23.12`) / `make all WHAT=cloudcore` など。`hack/make-rules/build.sh` 経由
- ライセンス: Apache License 2.0 (`LICENSE` 冒頭で確認。go module は `github.com/kubeedge/kubeedge`)
- CNCF 成熟度: Graduated (2024-10-15 卒業)
- カテゴリ: Orchestration & Scheduling

バイナリは 1 リポジトリに複数。主要 3 つ。

- `cloudcore` (`cloud/cmd/cloudcore`): クラウド側コントロールプレーン
- `edgecore` (`edge/cmd/edgecore`): エッジノード側エージェント。entrypoint は `edge/cmd/edgecore/edgecore.go` で `app.NewEdgeCoreCommand()` を `Execute()`
- `keadm` (`keadm/cmd/keadm`): インストーラ CLI (`keadm init` / `keadm join` / `keadm gettoken`)

## 歴史の素材

- Huawei Cloud が開発し 2018-11 に Apache 2.0 で OSS 化。業界初のクラウドネイティブエッジコンピューティングプロジェクトとされる。出典: [CNCF graduation announcement](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/) / [KubeEdge blog](https://kubeedge.io/blog/cncf-graduation-announcement/)
- repo 作成は 2018-09-28 (`gh repo view createdAt`)
- 2019 に CNCF Sandbox 入り (エッジ領域で最初)、2020-09 に Incubating へ昇格、2024-10-15 に Graduated。出典: [CNCF announcement](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/)
- 直近リリース v1.23.0 は 2026-03-11 公開 (`gh api releases/tags/v1.23.0` の `published_at`)。v1.22.0 (2025-11-04) でエッジリソース更新の hold/release 機構、Beehive のサブモジュール再起動ポリシー、Thing Model ベースの Device Model 更新が入った。出典: [KubeEdge v1.22 blog](https://kubeedge.io/blog/release-v1.22/)

## アーキテクチャの素材

クラウド (cloudcore) とエッジ (edgecore) の 2 プレーン構成。両者は WebSocket/QUIC で繋がり、間でメッセージを往復させる。全モジュールは独自の軽量フレームワーク Beehive 上の「モジュール」として登録され、メッセージバスで疎結合に通信する。

### Beehive モジュールフレームワーク

`staging/src/github.com/kubeedge/beehive` に同梱 (vendored ではなく staging で本体に組み込み)。

- `Module` インターフェース: `Name() / Group() / Enable() / Start() / RestartPolicy()`。`staging/.../beehive/pkg/core/module.go:47-61`
- `Register(m Module, opts...)`: `Enable()` が false なら `disabledModules` 行きで登録しない。`module.go:76-95`
- `StartModules()`: 登録モジュールごとに goroutine を起こす。channel モードと unix socket モードを両対応。`staging/.../beehive/pkg/core/core.go:17-55`
- ローカルモジュールは `localModuleKeeper` が `RestartPolicy` に従い再起動 (指数バックオフ `calculateIntervalTime`)。`core.go:96-145, 157-173`

### Message (バス上を流れる単位)

`staging/.../beehive/pkg/core/model/message.go:47-86`。`Header` (msg_id / parent_msg_id / timestamp / resourceversion / sync / type) + `Router` (Source / Destination / Group / Operation / Resource) + `Content interface{}`。

- `resourceversion` は K8s オブジェクトの RV を載せ、信頼できる伝送 (reliable transmission) の要にする旨コメントあり。`message.go:77-80`
- operation の語彙は insert/delete/query/update/patch/response/error 等。`message.go:14-23`
- resource type の語彙は pod/node/configmap/secret/serviceaccounttoken/lease/csr 等。`message.go:25-43`

### cloudcore 側モジュール (`cloud/pkg/`)

`registerModules` で登録。`cloud/cmd/cloudcore/app/server.go:165-178`。

- `cloudhub`: エッジとの接続を終端する WebSocket/QUIC サーバ。`cloud/pkg/cloudhub`
- `edgecontroller`: K8s API のオブジェクト (pod/configmap/secret 等) をエッジへ下ろす。`cloud/pkg/edgecontroller`
- `devicecontroller`: Device/DeviceModel CRD を扱う。`cloud/pkg/devicecontroller`
- `synccontroller`: クラウド/エッジ間の状態を突き合わせ reliable に保つ。`cloud/pkg/synccontroller`
- `dynamiccontroller`: エッジ側 list/watch (MetaServer) の元。authorization 連動。`cloud/pkg/dynamiccontroller`
- 他に `router` / `cloudstream` (logs/exec 中継) / `csidriver` / `policycontroller` / `taskmanager`

### edgecore 側モジュール (`edge/pkg/`)

`registerModules` で登録。`edge/cmd/edgecore/app/server.go:202-219`。

- `edged`: 軽量化した kubelet。エッジでの Pod ライフサイクル管理。`edge/pkg/edged`
- `edgehub`: cloudhub への WebSocket クライアント。クラウド <-> ローカルバスのブリッジ。`edge/pkg/edgehub`
- `metamanager`: ローカルメタデータストア (SQLite/gorm)。オフライン時の信頼性の核。`edge/pkg/metamanager`
- `devicetwin`: デバイスの desired/reported 状態を保持。`edge/pkg/devicetwin`
- `eventbus`: MQTT broker と接続 (IoT デバイス)。`edge/pkg/eventbus`
- `servicebus` / `edgestream` / `taskmanager`

## 内部実装の素材

### 代表オペレーション: クラウド -> エッジのメッセージ受信と振り分け (end to end)

1. edgehub の受信ループ `routeToEdge()` が WebSocket クライアントから 1 メッセージ受信。失敗時は `reconnectChan` に通知して再接続へ。`edge/pkg/edgehub/process.go:42-61`
2. 受信メッセージは `dispatch()` から `msghandler.ProcessHandler(message, eh.chClient)` へ。`process.go:38-40`
3. `ProcessHandler` は登録済みハンドラを順に試し、最初に `Filter` が真になったものの `Process` を呼ぶ。どれも一致しなければ error。`edge/pkg/edgehub/messagehandler/handler.go:61-74`
4. ハンドラは `RegisterHandlers()` で meta/twin/bus/task の 4 つを登録。`handler.go:51-58`。各々は `SimpleHandler{FilterFunc, ProcessFunc}` で、例えば bus ハンドラは `group == UserGroupName` を拾い source に応じて `beehiveContext.Send(modules.EventBusModuleName, msg)` 等でローカルバスへ転送。`edge/pkg/edgehub/messagehandler/handler_bus.go`
5. meta ハンドラ経由のものは最終的に `metamanager` が `dao` 経由で SQLite に永続化し、`edged` がそれを読んで Pod を起動する。
6. 逆方向 (エッジ -> クラウド) は `routeToCloud()` が `beehiveContext.Receive(EdgeHubModuleName)` でローカルバスから取り、rate limiter (`tryThrottle`) を通して `sendToCloud()`。`process.go:75-104, 158-174`
7. 接続が生きている間 `keepalive()` が `Heartbeat` 秒ごとに ping を送る。`process.go:106-128`

ハンドラ機構が「フィルタ first-match で 1 つだけ処理」なのは設計上重要。登録順 (meta -> twin -> bus -> task) が優先度になる。

### 中核データ構造 (3-5)

- `model.Message` / `MessageHeader` / `MessageRoute`: 全モジュール間通信の基本単位。`staging/.../beehive/pkg/core/model/message.go:47-86`
- `core.Module` インターフェースと `ModuleInfo`: モジュール登録の単位。`staging/.../beehive/pkg/core/module.go:47-61, 97-102`
- `dao/models.Meta` (gorm): `Key`(PK,256) / `Type`(32) / `Value`(text) の 3 カラム。エッジのローカルメタ KV。`edge/pkg/metamanager/dao/models/meta.go:20-29`
- `dao/models.MetaV2` (gorm): K8s API オブジェクトを GVR/namespace/name/resource_version 付きで保持。MetaServer (エッジ list/watch) の裏側。`edge/pkg/metamanager/dao/models/meta.go:32-44`
- `ModuleRestartPolicy`: 再起動方針 (Always/OnFailure, Retries, 間隔の成長率)。Beehive の耐障害性。`staging/.../beehive/pkg/core/module.go:27-44`

### 非自明な設計判断

エッジ側の `metamanager` が SQLite (gorm) でローカルにメタデータを保持する点。クラウド接続が切れてもエッジは保存済みの desired state から Pod を運用し続けられる (edge autonomy)。`Meta` は単純 KV、新しい `MetaV2` は GVR/RV 付きで K8s 風 list/watch (MetaServer) を成立させる。`message.go` の `resourceversion` を信頼伝送に使うコメントと合わせ、「オフライン耐性 + reliable sync」を一貫して設計の中心に置いている。

## 採用事例の素材

`ADOPTERS.md` (リポジトリ内) に記載のあるもののみ。出典: <https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md>。

- Huawei Cloud (IEF)
- China Unicom WoCloud
- Raisecom Technology (工場の作業安全 AI 監視。China Telecom Research Institute が設計、と success story に明記)
- KubeSphere
- DaoCloud
- XingHai IoT (スマートキャンパス。中国 80 都市 741 案件)
- その他 ADOPTERS 記載: Two Win, PITS, XH-iot, jylink, ICTNJ, Jingying Shuzhi

CNCF 卒業発表によれば 15 組織のメンテナ、35+ 国・110+ 組織から 1,600+ contributors。出典: [CNCF announcement](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/)。GitHub の code contributor 数 (commit ベース) は約 309 (`gh api contributors` のページネーション末尾)、star 7,485 / fork 1,951 (`gh repo view`, 2026-06-22)。CNCF の 1,600+ は code 以外も含む広い定義なので混同しない。

## 代替・エコシステム

- K3s (Rancher/SUSE): 軽量 K8s ディストロ。エッジで「縮めた K8s をそのまま動かす」アプローチ。KubeEdge は逆に「クラウドが司令塔、エッジは autonomous な拡張」でオフライン耐性とデバイス管理を持つ点が違う。
- OpenYurt (CNCF, Alibaba 由来): KubeEdge と最も近い競合。ノード自律と edge autonomy が主眼。KubeEdge は MQTT/Device CRD による IoT デバイス管理まで踏み込む。
- Akri (CNCF): エッジのリーフデバイス発見に特化。KubeEdge の devicetwin/mapper と機能が一部重なるが守備範囲が狭い。
- SuperEdge: もう 1 つのエッジ K8s。
- 統合: 上流 Kubernetes (vendored、v1.22 系で k8s v1.31.12)、MQTT broker (eventbus 経由で IoT)、KubeSphere/DaoCloud などのプラットフォームが KubeEdge を取り込み。`staging/.../mapper-framework` でデバイス mapper を生成できる。

### 最小セットアップ

- クラウド: 既存 K8s クラスタ上で `keadm init` (`keadm/cmd/keadm/app/cmd/cloud/init.go:51`) が cloudcore を立てる。
- トークン取得: `keadm gettoken`。
- エッジ: エッジノードで `keadm join --cloudcore-ipport=<ip>:10000 --token=<token>` (`keadm/cmd/keadm/app/cmd/edge/join.go:61`) が edgecore をインストール・起動。
- 公式手順: <https://kubeedge.io/docs/setup/install-with-keadm>
