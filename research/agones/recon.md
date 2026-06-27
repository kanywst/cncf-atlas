# recon: Agones

調査メモ。専用ゲームサーバ (dedicated game server) を Kubernetes 上でホスト・実行・スケールするためのプラットフォーム。出典は URL とコード `path:line` を併記する。

## 基本情報

- repo: `agones-dev/agones` (旧 `googleforgames/agones` から移管。README のバッジは一部まだ `googleforgames` を指す)
- pinned commit: `19f82f4f5a01cf1104e271d6d795acffbd53c35a` (2026-06-25 commit, `feat: promote PortRanges feature gate from Beta to Stable (#4609)`)
- 近いタグ: `v1.58.0` (HEAD は次期 `1.59.0-dev` 開発線上。`install/helm/agones/Chart.yaml` の `appVersion "1.59.0-dev"`, `build/Makefile` の `base_version = 1.59.0`)
- 言語 / ビルド: Go (`go.mod` の `go 1.26`, module は `agones.dev/agones`) / Make ベース (`build/Makefile`), マルチバイナリ。SDK は Go / C++ / C# / Rust / Node.js
- ライセンス: Apache License 2.0 (`LICENSE` 冒頭 `Apache License Version 2.0, January 2004` を確認)
- CNCF 成熟度: Sandbox (2025-12-21 受理)
- カテゴリ: Orchestration & Scheduling
- 主要エントリポイント: `cmd/controller/main.go:119` の `func main()`。他に `cmd/` 配下に `allocator` / `extensions` / `ping` / `processor` / `sdk-server` の各バイナリ

用語: CRD (Custom Resource Definition) = Kubernetes の API を独自リソース型で拡張する仕組み。SDK (Software Development Kit) = ゲームバイナリが自身のライフサイクルを Agones に伝えるためのクライアントライブラリ。gRPC = Google の RPC フレームワーク。UDP (User Datagram Protocol) = ゲームトラフィックで一般的な低遅延・コネクションレスのトランスポート。

## 歴史の素材

- 起源: Google と Ubisoft の共同開発として 2017 年に発足 (CNCF blog, 出典 2)。各スタジオが自前・専有のクラスタ管理とゲームサーバスケーリングを書いていた課題を、Kubernetes の Controller と CRD で置き換えるのが狙い (`README.md` の "Why does this project exist?")。
- 公開: 2018-03-14 に Google Cloud が v0.1 alpha として OSS 公開 (出典 4, 日付は本文冒頭で明記)。
- CNCF 移管の動き: issue `#4421` "Moving Agones to CNCF" が 2026-01-13 に起票 (出典 7)。
- CNCF 受理: 2025-12-21 に Sandbox レベルで受理 (出典 3 の CNCF project ページ)。コミュニティ主導のガバナンスへ移行する旨を 2026-03-23 の CNCF blog が告知 (出典 2)。
- リポジトリは `googleforgames/agones` から `agones-dev/agones` org へ移管済み (出典 1 / 6)。

## アーキテクチャの素材

中核は「Kubernetes の標準ツール / API で扱える CRD 群」と「それらを調停する Controller」。

トップレベルのコンポーネント (`pkg/` 配下):

- `apis/` CRD の型定義。`agones/v1` (GameServer, Fleet, GameServerSet), `allocation/v1` (GameServerAllocation), `autoscaling/v1` (FleetAutoscaler), `multicluster`。
- `gameservers/` 単一 GameServer のライフサイクル Controller。
- `gameserversets/` GameServerSet (同一テンプレの GameServer 群) の Controller。
- `fleets/` Fleet (Deployment 相当、GameServerSet のロールアウトを管理)。
- `fleetautoscalers/` Fleet のオートスケーラ。
- `gameserverallocations/` マッチメイカが空き GameServer を確保するアロケーション処理。
- `portallocator/` 動的 HostPort 割当。
- `sdkserver/` 各ゲームサーバ Pod にサイドカーとして同居する gRPC サーバ (SDK のサーバ側実装)。
- `sdk/` 自動生成された SDK gRPC スタブ。

代表的なコア操作: GameServer が「作成 -> Pod 起動 -> SDK.Ready() -> Ready」へ進む状態遷移をエンドツーエンドで追える (下記)。

状態 (`pkg/apis/agones/v1/gameserver.go:39` の `type GameServerState string`、定数群 47-74 行):

- `PortAllocation` (49) -> `Creating` (51) -> `Starting` -> `Scheduled` (57) -> `RequestReady` (59) -> `Ready` (62) -> `Allocated` (74)。

### 代表操作のトレース: GameServer が Ready になるまで

1. Controller の per-GameServer 調停ループ `syncGameServer` (`pkg/gameservers/controller.go:471`) は、状態別の sync 関数を 1 パスで順に呼ぶ (`controller.go:491-514`)。各関数は自分の担当状態でなければ即 return する「ガード付き no-op」になっている。
2. `syncGameServerPortAllocationState` (`controller.go:565`) が `PortAllocation` 状態の GameServer に動的ポートを割当て、状態を `Creating` に進める (`controller.go:570-572`)。割当ては `c.portAllocator.Allocate(...)`。更新に失敗したらポートをプールに戻す (`controller.go:580` の `DeAllocate`)。
3. `syncGameServerCreatingState` (`controller.go:589`) が backing Pod を作る。実体は `createGameServerPod` (`controller.go:683`)。`gs.Pod(...)` で Pod 仕様を生成し (`controller.go:685`)、SDK サイドカーを注入、ヘルスチェックと SDK サーバ用 env を付与 (`controller.go:704-708`)、`podGetter.Pods(...).Create(...)` で作成 (`controller.go:711`)。完了後 GameServer を `Starting` に更新 (`controller.go:631`)。
4. `syncGameServerStartingState` (`controller.go:916`) が Pod の `NodeName` から Node を引き (`controller.go:942`)、`applyGameServerAddressAndPort` で外部アドレス / ポートを Status に書き (`controller.go:947`)、状態を `Scheduled` にする (`controller.go:954`)。
5. ゲームバイナリ側: 起動完了後、SDK の `Ready()` を gRPC で呼ぶ。サーバ側は `SDKServer.Ready` (`pkg/sdkserver/sdkserver.go:540`) で、`enqueueState(agonesv1.GameServerStateRequestReady)` によって `RequestReady` への遷移をワークキューに積む (`sdkserver.go:543`)。実際の CR 書き込みは `SDKServer.updateState` (`sdkserver.go:360`) が `gsCopy.Status.State = s.gsState` (`sdkserver.go:396`) を patch して行う (`sdkserver.go:419` の `patchGameServer`)。
6. Controller 側の `syncGameServerRequestReadyState` (`controller.go:967`) が `RequestReady` を検出し、必要ならアドレス未設定分を補完したうえで状態を `Ready` に確定 (`controller.go:1014` の `gsCopy.Status.State = agonesv1.GameServerStateReady`)。最後に `SDK.Ready() complete` イベントを記録 (`controller.go:1023`)。

ポイント: ゲームバイナリは Kubernetes API を直接触らない。ローカルの SDK サイドカー (gRPC) にだけ話し、サイドカーが CR を更新する。これでゲームコードと Kubernetes が疎結合になる。

## 内部実装の素材

中核データ構造:

- `GameServer` (`pkg/apis/agones/v1/gameserver.go:197`)。`Spec GameServerSpec` (222) と `Status GameServerStatus` (318)。Spec は `Ports []GameServerPort` (227)、`Health Health` (229)、`SdkServer SdkServer` (233)、`Template corev1.PodTemplateSpec` (235) を持ち、Pod テンプレを丸ごと内包する。Status は `State GameServerState` (320)、`Address` (322)、`Ports` (321) を持つ。
- `Fleet` (`pkg/apis/agones/v1/fleet.go:41`)。`FleetSpec` (60) は `Replicas int32` (62)、`Strategy appsv1.DeploymentStrategy` (68)、`Scheduling apis.SchedulingStrategy` (70)、`Template GameServerTemplateSpec` を持つ。Kubernetes の Deployment に相当し、GameServerSet のローリング更新を司る。
- `GameServerSet` (`pkg/apis/agones/v1/gameserverset.go:40`)、`GameServerSetSpec` (59)。ReplicaSet 相当で、同一テンプレの GameServer 群を所定数維持する。
- `GameServerAllocation` (`pkg/apis/allocation/v1/gameserverallocation.go:52`)、`GameServerAllocationSpec` (70)。マッチメイカが Ready な GameServer を 1 つ `Allocated` に確保する一回限りのリクエストリソース。`Selectors []GameServerSelector` (106) で対象を絞り、`Priorities` (100) や `MultiClusterSetting` (73) を持つ。
- `portRangeAllocator` (`pkg/portallocator/portallocator.go:115`)。`portAllocations []portAllocation` (119)、`portAllocation` は `map[int32]bool` (`portallocator.go:112`)。ノード 1 台につき 1 つのポート使用マップを持つスライスで、HostPort の空き状況をノード単位で追跡する。

非自明な設計判断: HostPort をコントローラが自前で割り当てる。

Agones は Kubernetes の Service / NodePort を使わず、ゲームサーバごとに Node 上の HostPort を直接割当てる。これはゲームトラフィックが UDP 主体で、クライアントが Pod のホストポートに直結して遅延を最小化したいため。実装は `portRangeAllocator` がノード単位のポート使用ビットマップ (`portAllocations []portAllocation`, `portallocator.go:119`) を保持し、informer から既存 Pod / Node の状態を読んで起動時に `syncAll` で完全再構築する (`portallocator.go:163` の `Run` 内)。割当ては `portAllocator.Allocate` (`portallocator.go:97`) が各レンジアロケータに委譲する。GameServer 削除時は informer の `DeleteFunc` (`portallocator.go:154` の `syncDeleteGameServer`) で回収する。割当て後に CR 更新が失敗したらポートを即プールへ返す (`controller.go:580`) ので、リークしにくい。

調停ループの構造: `syncGameServer` (`controller.go:471`) が状態別 sync 関数を 1 パスで連鎖呼び出しする設計 (`controller.go:491-514`)。1 つの状態遷移が次の関数の入口条件になり、同じワークキュー項目内で複数段進むこともある。各 sync は担当外の状態なら先頭でガードして抜ける。

## 採用事例の素材

- Ubisoft: 本番のマルチプレイヤゲームで Agones を使用 (CNCF blog, 出典 2)。共同開発元でもある。
- リポジトリに `ADOPTERS` ファイルは存在しない (`ls` で未検出)。これ以外の組織名は確実な一次出典が取れなかったため挙げない。
- GitHub シグナル (出典 1 / 6, 2026-06-26 参照): スター約 6.9k (約 6,879)、フォーク約 925。CNCF blog は contributor 250 名超と記載 (出典 2)。

## 代替・エコシステム

- 統合先 / 周辺: Kubernetes (前提)、各クラウドのマネージド K8s (GKE / EKS / AKS)、オンプレ。マッチメイカは `GameServerAllocation` CR か Allocator gRPC API 経由で空きサーバを確保する。Open Match (マッチメイキング) と組み合わせる構成が定番。Cluster Autoscaler と連携して Fleet をスケールする。
- 代替: クラウド専有のマネージドゲームサーバ (Amazon GameLift, Microsoft PlayFab Multiplayer Servers, Edgegap, Google の旧 Game Servers 等)。Agones の本質的な差は、Kubernetes ネイティブ・クラウド非依存・OSS で、CRD と標準ツールでゲームサーバを宣言的に扱える点。ベンダロックインを避けたいスタジオ向け。
- SDK は Go / C++ / C# / Rust / Node.js を提供 (`sdks/` 配下)。ゲームエンジン (Unity, Unreal) からはこれらを通じて Ready / Allocate / Health / Shutdown を呼ぶ。

## getting-started (最小構成)

Helm で agones-system 名前空間にインストールする (Agones 公式 quickstart の手順, 出典 5)。前提: 動作中の Kubernetes クラスタと `kubectl` / `helm` が設定済みであること。

1. Agones の Helm リポジトリを登録して更新する。

   ```bash
   helm repo add agones https://agones.dev/chart/stable
   helm repo update
   ```

2. agones-system 名前空間を作って Agones をインストールする。

   ```bash
   helm install my-release --namespace agones-system --create-namespace agones/agones
   ```

3. コントローラの Pod が立ち上がったか確認する。

   ```bash
   kubectl get pods --namespace agones-system
   ```

4. サンプルの GameServer を作成して Ready になるか見る (リポジトリ同梱の例)。

   ```bash
   kubectl apply -f https://raw.githubusercontent.com/agones-dev/agones/main/examples/simple-game-server/gameserver.yaml
   kubectl get gameservers
   ```
