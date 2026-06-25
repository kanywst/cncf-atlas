# recon: Contour

調査メモ。Contour は Envoy を制御プレーンとして駆動する Kubernetes Ingress コントローラ。出典は URL と `file:line` で残す。

## 基本情報

- repo: `projectcontour/contour`
- pinned commit: `8f970f082e645bf0be5119c376ac4f4d40a19acd` (2026-06-24, `main`) / 近いタグ: `v1.33.5` (最新リリース, 2026-05-28)。`main` は v1.33.5 より先行しており `git describe` は当たらない。
- 言語 / ビルド: Go 1.26.0 (`go.mod:3`) / `go build -mod=readonly -ldflags=... ./cmd/contour` (`Makefile:111-112`)
- ライセンス: Apache-2.0 (`LICENSE` ヘッダ + `gh api ... .license.spdx_id` = `Apache-2.0`)
- CNCF 成熟度: Incubating (2020-07-07 受理)
- カテゴリ (tools.ts): API Gateway
- 主要エントリ: `cmd/contour/contour.go:30` `func main()`。kingpin サブコマンド (`serve` / `bootstrap` / `certgen` / `cli` / `gateway-provisioner` 等)。コントローラ本体は `serve` -> `cmd/contour/serve.go:384` `doServe()`。
- 依存バージョン (`versions.yaml`): `main` は Envoy 1.38.3 / k8s 1.34-1.36 / Gateway API 1.3.0。`v1.33.5` は Envoy 1.35.10。

## 歴史の素材

- 2017 年 Heptio で誕生。標準 Kubernetes Ingress 仕様の制約 (TLS 委譲、マルチチーム運用、リッチなルーティング不足) を埋める目的。GitHub repo 作成日は 2017-10-26 (`gh api repos/projectcontour/contour .created_at`)。
- Heptio は 2018 年に VMware に買収され、Contour は VMware 配下で開発継続。
- v1.0 を 2019 年 11 月にリリース。
- CNCF への寄贈は 2020 年初頭、`cncf/toc` PR #330 (michmike = Michael Michael) で開始。デューデリで「ガバナンス文書が提出時 (1/7) に見当たらず 3/18 に新規作成された」と指摘され、maintainer は「運用はしていたが明文化していなかった」と回答。
- 2020-07-07 に CNCF TOC が Incubating として受理。
- 2020 年 12 月に Cure53 による第三者セキュリティ監査を実施 (`Contour_Security_Audit_Dec2020.pdf` がリポジトリ同梱)。

## アーキテクチャの素材

Contour は Envoy の xDS 制御プレーン。Kubernetes API を監視し、Ingress / HTTPProxy(独自 CRD) / Gateway API を内部 DAG に変換、Envoy へ gRPC ADS で配信する。

トップレベル構成 (`internal/` 配下):

- `internal/contour` — k8s イベントを受けて DAG 再構築をドライブする `EventHandler` (`handler.go`)。
- `internal/dag` — k8s オブジェクトを有向非循環グラフ (Listener -> VirtualHost -> Route -> Cluster) に変換する翻訳ロジックの中核。Processor 群 (`httpproxy_processor.go` / `ingress_processor.go` / `gatewayapi_processor.go` / `listener_processor.go`)。
- `internal/xdscache` (+ `v3/`) — DAG を Envoy の xDS リソース (CDS/EDS/LDS/RDS/SDS/RTDS) に変換しキャッシュ。`SnapshotHandler` が go-control-plane の Snapshot を生成。
- `internal/xds` (+ `v3/`) — Envoy へ配信する gRPC サーバ。`ConstantHash` ノード ID hasher。
- `internal/k8s` — informer / status updater / クライアント。
- `internal/provisioner` — Gateway API 用の Contour プロビジョナ (Gateway から Deployment/Service を生成)。
- `apis/projectcontour` — HTTPProxy 等の CRD 型定義。

### 代表オペレーションを端から端まで追う: HTTPProxy 変更 から Envoy RDS 更新

1. k8s informer がイベント発火。`EventHandler.OnAdd/OnUpdate/OnDelete` (`internal/contour/handler.go:103-116`) が op を `e.update` チャネルへ送る。informer 登録は `cmd/contour/serve.go:1183` `inf.AddEventHandler(handler)`、`EventHandler` は `cmd/contour/serve.go:599` で生成。
2. `EventHandler.Start` のメインループ (`internal/contour/handler.go:134-244`)。`onUpdate` (`handler.go:249-286`) が `builder.Source.Insert/Remove` で `KubernetesCache` を更新。変更があれば holdoff タイマを張る (`handler.go:192-199`)。`holdoffDelay` で連続イベントをバッチし、`holdoffMaxDelay` 超過時は即時 (delay=0)。
3. タイマ発火かつキャッシュ同期済みで `latestDAG := e.builder.Build()` (`handler.go:225`)、続いて `e.observer.OnChange(latestDAG)` (`handler.go:226`)。さらに status 更新を送出 (`handler.go:229-231`)。
4. `Builder.Build` (`internal/dag/builder.go:59-127`) が登録済み Processor を順に `Run` し (`builder.go:79-81`)、無効な VirtualHost / Listener を剪定 (`builder.go:87-124`)。Processor 列は `cmd/contour/serve.go:1087-1167` `getDAGBuilder` で構築 (`ListenerProcessor` -> `IngressProcessor` -> `HTTPProxyProcessor`、Gateway 有効時のみ `GatewayAPIProcessor` を追加)。`HTTPProxyProcessor.Run` は `internal/dag/httpproxy_processor.go:127`。
5. `observer.OnChange` は `ComposeObservers` (`internal/dag/dag.go:52-58`) で各 `ResourceCache` と `SnapshotHandler` へファンアウト。例として `RouteCache.OnChange` (`internal/xdscache/v3/route.go:62-142`) が DAG の Listener/VirtualHost を辿り Envoy `RouteConfiguration` proto を構築。ルートは Envoy 型へ変換する前に Contour 型でソート (`route.go:90`, 理由コメント `route.go:144-154`)。
6. `SnapshotHandler.OnChange` (`internal/xdscache/v3/snapshot.go:137-163`) が各キャッシュの `Contents()` を集約し、新しい UUID バージョンで go-control-plane の Snapshot を生成 (`snapshot.go:153`)、`ConstantHash` のノード ID キーで `SetSnapshot` (`snapshot.go:159`)。
7. xDS gRPC サーバ (`cmd/contour/serve.go:905-906`) が `envoy_server_v3.NewServer(..., snapshotHandler.GetCache(), ...)` を `RegisterServer` (`internal/xds/v3/server.go:38-40`) で公開。Envoy が ADS 経由で新しい RDS を取得。xdsServer は `cmd/contour/serve.go:694-702` で manager に Add。

### 非自明な設計判断

- 全 Envoy を単一ノード ID に集約する `ConstantHash` (`internal/xds/v3/hash.go:23-36`、`ID()` は常に同じ文字列を返す)。接続してくる全 Envoy が同一スナップショットを共有する fanout モデルになり、Contour は「クラスタ全体で 1 個のスナップショット」だけを管理すればよい。
- ただし EDS だけは別扱い。`SnapshotHandler` は EDS 用に独立した `LinearCache` を持ち (`internal/xdscache/v3/snapshot.go:50-52`)、`MuxCache` が `TypeUrl` で振り分ける (`snapshot.go:54-71`)。理由はコメント (`snapshot.go:47-49`): SnapshotCache だと全 EDS ストリームが無関係なエンドポイント変更でも通知されてしまうため、LinearCache で要求されたリソースのみ更新する。
- DAG 再構築は holdoff タイマでデバウンスし、informer の同期が完了するまで再構築をスキップ/再試行する (`handler.go:212-220`)。`syncTracker` (`synctrack.SingleFileTracker`) が「初期オブジェクト配信完了」と「全件処理済み」の両条件で初回 DAG 完成を判定 (`handler.go:63-72`, `235-238`)。

## 内部実装の素材

中核データ構造:

- `dag.DAG` (`internal/dag/dag.go:60`) — `StatusCache` / `Listeners map[string]*Listener` / `ExtensionClusters` / `HasDynamicListeners`。1 回の Build で作られる不変スナップショット。
- `dag.Builder` + `KubernetesCache` (`internal/dag/builder.go:44-55`) — `Source` がオブジェクト供給源、`Processors` が順序付き変換器。
- ルーティングモデル: `dag.VirtualHost` / `dag.SecureVirtualHost` (`internal/dag/dag.go:755` 以降) と `dag.Route` (`internal/dag/dag.go:307`)、`MatchCondition` 実装群 (Prefix/Exact/Regex/Header/QueryParam, `dag.go:73-237`)。
- `contour.EventHandler` (`internal/contour/handler.go:45-73`) — holdoff バッチ付きシングルスレッドのイベントループ。`update`/`sequence` チャネルと `syncTracker`。
- `xdscache_v3.SnapshotHandler` (`internal/xdscache/v3/snapshot.go:35-41`) — `defaultCache` (SnapshotCache) + `edsCache` (LinearCache) + `mux` (MuxCache)。

追う価値のあるパス:

- DAG から Envoy 変換の各 `OnChange`: `route.go` / `cluster.go` / `listener.go` / `secret.go` / `endpointslicetranslator.go` (`internal/xdscache/v3/`)。
- HTTPProxy の inclusion/委譲ロジック: `internal/dag/httpproxy_processor.go`。
- Gateway API 変換: `internal/dag/gatewayapi_processor.go`。

## 採用事例の素材

公式 adopters ページ (<https://projectcontour.io/resources/adopters/>) およびリポジトリ `site/content/resources/adopters.md` / `site/themes/contour/static/img/adopters/` でロゴ・事例が確認できる組織:

- SnappCloud (OpenShift Router から Contour へ移行する success story 記載)
- Bugfender
- Knative (`net-contour` で KIngress を HTTPProxy にブリッジ)
- VMware (Tanzu の ingress)
- Flyte (sandbox のデフォルト Ingress)
- Gojek (全 k8s クラスタの ingress)
- DaoCloud (Contour ベースの次世代マイクロサービスゲートウェイ)

CNCF Incubating 受理ブログ (2020-07-07) 時点で名前が挙がった本番採用組織: Adobe (multi-tenant 基盤 "Project Ethos")、Kinvolk、Kintone、PhishLabs、Replicated。出典: <https://www.cncf.io/blog/2020/07/07/toc-accepts-contour-as-incubating-project/>。

GitHub シグナル (2026-06-24, `gh api repos/projectcontour/contour`): stars 3,934 / forks 716 / open issues 120 / contributors 約 240 (anon 含む、`contributors?per_page=1` の Link ヘッダ last=page 240)。

ガバナンス: ガバナンス文書は `projectcontour/community` の `GOVERNANCE.md` (proposal process など、`CONTRIBUTING.md:212` から参照)。maintainer 一覧は `projectcontour/community` の `MAINTAINERS.md`、CNCF 側は `cncf/foundation` の `project-maintainers.csv` で Incubating として管理 (例: Steve Kriss / Broadcom)。週次コミュニティミーティングで triage (`CONTRIBUTING.md:238`)。

## 代替・エコシステム

- エコシステム/統合: Envoy (データプレーン、必須依存)、Gateway API (SIG-Network)、Knative (`net-contour`)、ExternalDNS / cert-manager との組合せ、Contour 独自の Gateway provisioner、ext_authz による外部認可、グローバル/ローカルのレートリミット。
- 代替と本質的な差:
  - ingress-nginx: NGINX ベースで広く普及。Contour は Envoy ベースで動的設定 (再起動/reload なし) と HTTPProxy による委譲・マルチチーム分離が強み。
  - Emissary-ingress (旧 Ambassador): 同じく Envoy ベースの CNCF プロジェクト。Contour は HTTPProxy CRD と Gateway API 実装にフォーカスし制御プレーンが軽量。
  - Istio ingress / Gateway: サービスメッシュ前提で機能は広いが重い。Contour は ingress に特化。
  - Envoy Gateway: Envoy 公式の Gateway API 実装。Contour は HTTPProxy という独自 CRD の歴史的資産と既存運用基盤を持つ点が差別化。
- 設定 API は 3 系統: 標準 Ingress、独自 `HTTPProxy` CRD、Gateway API。

## インストールと最小構成

- クイックスタート (公式): `kubectl apply -f https://projectcontour.io/quickstart/contour.yaml`。`projectcontour` namespace に Contour Deployment + Envoy DaemonSet + LoadBalancer Service + CRD を一括展開。出典: <https://projectcontour.io/getting-started/>。
- Helm でも導入可 (`bitnami/contour` 等)。Gateway API 利用時は Contour の gateway-provisioner / GatewayClass を併用。
- 最小動作確認: 任意の Deployment + Service を作り、`HTTPProxy` (または Ingress) を 1 つ定義 -> Envoy Service の外部 IP に対象 FQDN で HTTP リクエストして 200 を確認。
