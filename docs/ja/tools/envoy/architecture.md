# アーキテクチャ

## 全体像

トップレベルの `source/` ツリーは `common`・`server`・`exe`・`extensions` に分かれる。中核のネットワークと HTTP スタックは `common` にあり、差し替え可能な振る舞い (filter・codec・transport socket) は `extensions/` 配下に並ぶ。設定モデルは `api/` の protobuf API (xDS, API v3) だ。動作中の Envoy はメインスレッド 1 つと固定数の worker スレッドで構成され、各 worker は自前のイベントループを持つ。

```mermaid
flowchart LR
    DC[ダウンストリームクライアント] --> L[Listener]
    L --> NF[ネットワーク filter chain]
    NF --> HCM[HTTP Connection Manager]
    HCM --> CODEC[HTTP codec]
    CODEC --> DFC[decoder filter chain]
    DFC --> R[Router filter]
    R --> CL[Cluster + ロードバランサ]
    CL --> US[アップストリームホスト]
```

## コンポーネント

### サーバと worker スレッド

メインスレッドが設定とライフサイクルを所有し、固定数の worker スレッドが各自の libevent dispatcher でコネクションを non-blocking に処理する。worker 間でロックは共有しない。設定更新は immutable なスナップショットとして thread-local スロットへ post される。仕組みは `source/common/thread_local/thread_local_impl.h:20` の `ThreadLocal::InstanceImpl` と、`source/common/thread_local/thread_local_impl.h:47` の `SlotImpl::runOnAllThreads`。

### ネットワークと HTTP の filter chain

リクエスト処理は filter のチェーンだ。L4 の振る舞いは network read/write filter として実装される。L7 HTTP はそれ自体が 1 つの network filter、すなわち HTTP Connection Manager (HCM) で、HTTP codec を駆動し、その内側で HTTP decoder/encoder filter のチェーンを回す。HCM の実装は `source/common/http/conn_manager_impl.h` の `ConnectionManagerImpl`。

### 設定 API (xDS)

`api/` ディレクトリは API バージョン `3.0.0` (`API_VERSION.txt`) の xDS API の protobuf 定義を持つ。コントロールプレーンは listener・route・cluster・endpoint・secret を xDS で Envoy にストリームする。サービスメッシュは HCM と xDS をデータプレーンとして使う。Istio では istiod が各 Envoy を xDS で設定する ([Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/))。

## リクエストの流れ

ダウンストリームの HTTP リクエストが listener からルート確定まで進む様子を追う。すべて `source/common/http/conn_manager_impl.cc` 内。

1. データは network read filter の入口 `ConnectionManagerImpl::onData` (`source/common/http/conn_manager_impl.cc:515`) に届く。codec が未生成なら `createCodec(data)` (`:525`) で作る。
2. codec が `codec_->dispatch(data)` (`:546`) でバイト列をパースし、新ストリームごとに `newStream` を呼ぶ。
3. `ConnectionManagerImpl::newStream` (`:410`) が `ActiveStream` を生成し (`:430`)、`LinkedList::moveIntoList` (`:469`) で `streams_` に繋ぐ。
4. ヘッダ完了で codec が `ActiveStream::decodeHeaders` (`:1354`) を呼ぶ。`request_headers_` の所有権を受け取り (`:1366`)、検証する。
5. ルートは `refreshCachedRoute()` (`:1553`) で確定する。その本体 (`:1811`) が `snapped_route_config_->route(...)` (`:1827`) を呼び、結果をキャッシュする。
6. ダウンストリーム filter chain は `filter_manager_.createDownstreamFilterChain()` (`:1564`) で構築され、`filter_manager_.decodeHeaders(*request_headers_, end_stream)` (`:1600`) で decode が始まる。終端の Router filter が cluster を選びアップストリームへ転送する。

## 主要な設計判断

核心はスレッディングモデルだ。共有状態をロックで守るのではなく、各 worker に単一スレッド所有を与え、設定は thread-local スロット経由で immutable スナップショットとして差し替える (`source/common/thread_local/thread_local_impl.h:20`)。これでホットパスは共通ケースでロックフリーに保たれる。

第二はユニバーサルデータプレーン API だ。設定はデータ (`api/` の xDS protobuf) であり、プロキシはコントロールプレーンが駆動する汎用部品になる。だからメッシュやゲートウェイが同じプロキシコアを再利用できる ([Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/))。

## 拡張ポイント

振る舞いは `extensions/` 配下の拡張で追加する。network filter・HTTP filter・transport socket・access logger・codec などだ。コンパイル済み C++ 拡張に加え、Envoy はリクエスト時のロジックを WebAssembly (proxy-wasm) と Lua で書け、`api/` の xDS API でランタイムに再構成できる。
