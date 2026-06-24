# recon: Dapr

調査メモ。サイドカー型のアプリケーションランタイム。出典は URL と `file:line` で残す。

## 基本情報

- repo: `dapr/dapr` (主実装。CLI は `dapr/cli`、コンポーネント実装は `dapr/components-contrib`、SDK は `dapr/<lang>-sdk` に分かれる)
- pinned commit: `9f2dcfd95ad44178d9553a08c181b0e6ea46232a` (2026-06-19) / 近いタグ: `v1.18.1` (2026-06-16 リリースの直後、master 上)
- 言語 / ビルド: Go (`go 1.26.4`、`go.mod:3`) / `make build` (`Makefile:184`, `Makefile:196` で `CGO_ENABLED=0 go build -ldflags ...`)
- ライセンス: Apache-2.0 (`LICENSE` に "Apache License Version 2.0" を確認。`gh repo view` も `apache-2.0`)
- CNCF 成熟度: Graduated (2024-10-30 にレベル変更、公開アナウンスは 2024-11-12 KubeCon NA)
- カテゴリ (tools.ts のバケット): App Definition & GitOps

## 構成 (リポジトリのトップレベル)

このリポジトリはコントロールプレーンとデータプレーンの全バイナリを含む。`cmd/` 配下に 6 つの実行ファイル。

- `cmd/daprd` : データプレーンのサイドカー本体。`main.go` は `app.Run()` を呼ぶだけ (`cmd/daprd/main.go:25`)。`app.Run()` がフラグ解析しランタイムを起動 (`cmd/daprd/app/app.go:56`)。
- `cmd/operator` : Kubernetes オペレータ。CRD (Component / Subscription / Resiliency 等) を監視しサイドカーへ配信。
- `cmd/injector` : サイドカーインジェクタ。Pod に `daprd` コンテナを mutating webhook で注入。
- `cmd/sentry` : CA。mTLS 用のワークロード証明書を発行。
- `cmd/placement` : actor のパーティション配置 (consistent hashing) を管理。
- `cmd/scheduler` : ジョブ / actor reminder / workflow のスケジューリングバックエンド。

`pkg/` の主要パッケージ。

- `pkg/runtime` : サイドカーの中枢。`DaprRuntime` 構造体が全サブシステムを保持 (`pkg/runtime/runtime.go:102`)。
- `pkg/api/http`, `pkg/api/grpc`, `pkg/api/universal` : アプリ向けの公開 API (HTTP と gRPC の二面、共通ロジックは universal)。
- `pkg/messaging` : サービス呼び出し (direct messaging) と gRPC プロキシ。
- `pkg/runtime/compstore` : ロード済みコンポーネントのレジストリ。
- `pkg/components` : コンポーネント種別ごとの loader / registry (`bindings` `state` `pubsub` `secretstores` `configuration` `lock` `crypto` `conversation` `nameresolution` `middleware` `pluggable`)。
- `pkg/resiliency` : リトライ / サーキットブレーカ / タイムアウトのポリシエンジン。
- `pkg/actors`, `pkg/runtime/wfengine` : actor ランタイムと workflow エンジン。
- `pkg/security`, `pkg/sentry` : mTLS / SPIFFE ベースの ID。

ビルディングブロック (アプリが叩く API カテゴリ) は `ComponentStore` のフィールドにそのまま対応する。state / pub-sub / bindings / secrets / configuration / locks / crypto / workflow / actors / conversation (LLM) / service invocation。

## 代表的な操作を一本通す: サービス呼び出し (service invocation)

アプリ A がサイドカー A 経由でアプリ B のメソッドを呼ぶ流れ。HTTP 入口から相手サイドカーのアプリチャネルまで。

1. HTTP 入口。`v1.0/invoke/<app-id>/method/<method>` を受ける。`onDirectMessage` がパスから targetID と method を抽出し、resiliency ポリシを選び、`InvokeMethodRequest` を組み立てる (`pkg/api/http/directmessaging.go:97`)。デコード済みの `r.URL.Path` を使う点が明示的にコメントされている (`:98`)。リクエストは resiliency runner でラップして `a.directMessaging.Invoke` を呼ぶ (`pkg/api/http/directmessaging.go:163`)。

2. ルーティング判定。`directMessaging.Invoke` がまずメソッド名を正規化 (`pkg/messaging/direct_messaging.go:163`、後述の設計判断)、次に宛先を解決して 3 経路に分岐する (`:175-189`)。
   - HTTPEndpoint CRD / 外部 URL なら外部呼び出し
   - 宛先が自分自身ならローカル (`invokeLocal`)
   - それ以外はリモートサイドカーへ (`invokeWithRetry(... d.invokeRemote ...)`、`:189`)

3. 名前解決。`getRemoteApp` が `requestAppIDAndNamespace` で `app.namespace` 形式を分解し (`pkg/messaging/direct_messaging.go:193`)、name resolver (mDNS / Kubernetes / consul 等) で宛先サイドカーの gRPC アドレスを引く。`ResolverMulti` を実装するリゾルバではアドレスをキャッシュしランダムに 1 件選ぶ (`pkg/messaging/direct_messaging.go:607` 以降)。

4. リモート送信。`invokeRemote` がコネクションを張り、forwarded / 宛先 appID / caller-callee ヘッダをメタデータに付与し、`internalv1pb.ServiceInvocationClient` で相手サイドカーの内部 gRPC を呼ぶ (`pkg/messaging/direct_messaging.go:311`)。既定はストリーム送信 `invokeRemoteStream` (`:338`)。メトリクス `ServiceInvocationRequestSent/ResponseReceived` を計上 (`:335`, `:342`)。

5. 受信側サイドカー。内部 gRPC サーバの `CallLocal` がリクエストを受ける (`pkg/api/grpc/daprinternal.go:44`)。`FromInternalInvokeRequest` で復元し (`:50`)、`callLocalValidateACL` で ACL を評価し (`:57`)、アプリチャネル `appChannel.InvokeMethod` で実アプリ (アプリ B 本体) を叩く (`:71`)。レスポンスを protobuf 化して返す (`:80`)。大きいボディ向けに `CallLocalStream` がチャンク送信版を持つ (`:85`、`io.Pipe` で逐次転送)。

要点: アプリは常にローカルサイドカーに HTTP/gRPC で話し、サイドカー間は内部 gRPC + mTLS。アプリは相手の IP/DNS を知らず appID だけで呼ぶ。

## 中核データ構造

- `DaprRuntime` (`pkg/runtime/runtime.go:102`) : サイドカーの全状態を抱える神オブジェクト。`channels` (アプリチャネル)、`directMessaging`、`actors`、`wfengine`、`compStore`、`resiliency`、`sec` (security.Handler)、`grpcAPIServer`/`grpcInternalServer` (公開 API と内部 API の二系統サーバ) などを保持。
- `ComponentStore` (`pkg/runtime/compstore/compstore.go:42`) : `sync.RWMutex` 下で種別ごとの `map[string]...` を持つレジストリ。`states` `pubSubs` `secrets` `inputBindings`/`outputBindings` `locks` `cryptoProviders` `workflowComponents` `conversations` 等。ホットリロード時はこのストアを差し替える。ビルディングブロックの一覧がそのままフィールドとして現れる。
- `InvokeMethodRequest` (`pkg/messaging/v1/invoke_method_request.go:37`) : サービス呼び出しの内部表現。`replayableRequest` を埋め込みリトライ時のボディ再生を扱う。`streamingRequest` フラグでストリーム時はバッファリングを無効化する (後述)。
- `remoteApp` (`pkg/messaging/direct_messaging.go` の name resolution 周辺) : `id` / `namespace` / `address` / `cacheKey` を持つ宛先解決結果。
- resiliency の `PolicyDefinition` / runner (`pkg/resiliency`) : リトライ・サーキットブレーカ・タイムアウトを合成し `policyRunner(func ...)` 形式で任意の操作を包む。HTTP 入口 (`directmessaging.go:155`) と direct messaging の組み込みリトライ (`direct_messaging.go:239`) の両方で使われる。

## 非自明な設計判断

リトライ用ボディバッファリングをストリーミング有無で動的に切り替える。`InvokeMethodRequest` は `replayableRequest` を埋め込み、`WithReplay(true)` でボディをバッファして再送可能にする。だがチャンク転送 / Content-Length 不明 (`r.ContentLength < 0`) のリクエストでは `SetStreamingRequest()` を立て (`pkg/api/http/directmessaging.go:147`)、この場合 `WithReplay` は no-op になる (`pkg/messaging/v1/invoke_method_request.go:37` の `streamingRequest` コメント)。理由は大きなストリームをリトライのためにメモリへ丸ごと貯めるのを避けるため。さらに HTTP ハンドラ側ではストリーミング要求での転送エラーを `backoff.Permanent` でラップし (`directmessaging.go:181`)、消費済み (空) ボディでの再試行を防ぐ。再送可能性とメモリ安全性のトレードオフをリクエスト単位で判断している。

もう一つ。サービス呼び出しの入口でメソッド名を `NormalizeMethod` で正規化する (`pkg/messaging/method/normalize.go:46`)。`#?\x00` と制御文字 (0x01-0x1f, 0x7f) を拒否し、`path.Clean` でパストラバーサル (`../`) を解決・除去する。正規化後の形を ACL 評価とディスパッチの両方に使うため、`../` でメソッドを偽装する ACL バイパスを入口で潰している。セキュリティ境界をエッジ 1 箇所に集約する判断。

## 採用事例の素材 (出典付き、捏造禁止)

公式 ADOPTERS は `dapr/community` の `ADOPTERS.md`。production / テスト段階の組織が列挙される。名前が取れたもの:

- Residential IoT Services GmbH (Bosch Group), Zeiss, Alibaba Cloud, Tencent, DingTalk, AutoNavi, Man Group, Microsoft Azure, FUJITSU CLOUD TECHNOLOGIES LIMITED, Schwarz IT KG, IBM Research, UWM (United Wholesale Mortgage), RED (XiaoHongShu), Hoshino Resorts, 3-shake Inc., NTT DATA (Dedalow), Proximus, Nexi Group。
- ZEISS: actor フレームワークでグローバル受注処理のライフサイクルを管理 (CNCF / Dapr ケーススタディ)。
- Grafana (security チーム): AWS EKS + Dapr のイベント駆動アーキで脆弱性スキャンを構築。resiliency でスキャン取りこぼし防止、state store で冪等性チェック (CNCF ケーススタディ)。

## 採用シグナル (数値、参照日 2026-06-22)

- GitHub stars: 25,852 / forks: 2,089 / watchers: 399 / open issues: 410 (`gh api repos/dapr/dapr`, 2026-06-22)。
- コントリビュータ: GitHub API のページネーション (anon 込み) で約 335 人 (`gh api repos/dapr/dapr/contributors`, 2026-06-22)。
- 最新リリース: Dapr Runtime v1.18.1 (2026-06-16)。

## 代替・エコシステム

- サービスメッシュ (Istio / Linkerd / Cilium): インフラ層・透過的・ネットワーク中心。Dapr はアプリ層・開発者中心でビルディングブロック (state / pub-sub / actors / workflow) を提供する点が本質差。両者は補完的で併用可 (Dapr docs FAQ "Dapr and service meshes")。トラフィックルーティング / スプリットは Dapr の守備範囲外。
- Spring Cloud / Apache Dubbo: アプリ内フレームワーク。言語 (主に Java) に縛られる。Dapr は HTTP/gRPC でどの言語からも叩け、Spring Boot 統合も提供。
- 統合: コンポーネントは `dapr/components-contrib` に多数 (Redis / Kafka / AWS / Azure / GCP の state・pub-sub・binding 等)。CLI は `dapr/cli`、SDK は Go/Java/.NET/Python/JS/Rust/C++/PHP。Diagrid が商用マネージド (Catalyst / Conductor) を提供。Dapr Agents / Workflow が AI エージェント方向の拡張。

## 歴史の素材

- 2019-10-16: Microsoft が Dapr を OSS インキュベーションプロジェクトとして公開。Azure CTO Mark Russinovich の主導。クラウドネイティブ開発の定型作業を肩代わりする狙い。
- 2020-04: 半年で 120+ コントリビュータ (Microsoft Open Source Blog)。
- 2020-09: オープンガバナンスへ移行を発表 (ベンダ中立化)。
- 2021-02-17: v1.0 を production-ready として発表 (Kubernetes 本番デプロイ対応)。
- 2021-11-09: CNCF Incubating として受理。
- 2024-10-30: Graduated にレベル変更。2024-11-12 KubeCon NA で公開アナウンス。

## インストール / 最小構成

セルフホスト最小手順 (Dapr CLI 経由)。

- CLI を入れて `dapr init` で Docker 上に control plane 周辺 (placement, scheduler, redis 等) を展開。
- アプリは `dapr run --app-id myapp --app-port 8080 -- <your app cmd>` で起動し、サイドカー `daprd` が併走する。
- サービス呼び出しは `curl localhost:3500/v1.0/invoke/<app-id>/method/<method>`。
- Kubernetes では `dapr init -k` で injector / operator / sentry / placement / scheduler を入れ、Pod に `dapr.io/enabled: "true"` アノテーションを付けるとサイドカーが注入される。

`daprd` 単体はバージョン確認に `daprd --version` (`cmd/daprd/app/app.go:65` の `RuntimeVersion` 分岐)。
