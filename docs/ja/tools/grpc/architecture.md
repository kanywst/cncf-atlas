# Architecture

## 全体像

gRPC は C++ で書かれた単一の C-core (`src/core/`) を中心に、各言語の薄いラッパを積み上げて構成される。コアは call / channel / transport / resolver / load-balancing / credentials / security (TSI) / xDS の機構を持つ。各言語ラッパ (`src/cpp/`, `src/python/`, `src/ruby/`, `src/php/`, `src/csharp/`, `src/objective-c/`) がそのコアを各言語へ公開し、`src/compiler/` は `.proto` を各言語のスタブに変換する `protoc` プラグインだ。

```mermaid
flowchart TD
  proto[.proto サービス定義] -->|protoc + プラグイン| stubs[生成されたクライアント/サーバスタブ]
  stubs --> wrapper[言語ラッパ: src/cpp, src/python, ...]
  wrapper --> core[C-core: src/core]
  core --> call[Call 層: CallSpine, CallFilters]
  call --> transport[Transport: CHTTP2 / PH2 / InProc]
  transport --> net[ネットワーク上の HTTP/2]
```

## コンポーネント

### C-core (`src/core/`)

RPC エンジン。呼び出しライフサイクル (`src/core/call/`)、surface 公開 API 入口 (`src/core/lib/surface/`)、トランスポート、名前解決、ロードバランシング、credentials と TSI セキュリティ、xDS 連携 (`src/core/xds/`)、channelz による内部観測を持つ。すべての言語バインディングが最終的にこのコードを駆動する。

### 言語ラッパ (`src/cpp/`, `src/python/` ほか)

各ラッパはその言語の慣用的な型を提示し、処理をコアへ転送する。C++ でユーザが触れる入口は、クライアント側が `grpc::CreateChannel` と生成スタブの `NewStub`、サーバ側が `grpc::ServerBuilder` だ。

### コンパイラプラグイン (`src/compiler/`)

サービス定義を読み、型付きスタブとスケルトンを生成する `protoc` プラグイン。例えば `examples/protos/helloworld.proto:24` の `service Greeter { rpc SayHello (HelloRequest) returns (HelloReply); }` が `Greeter::Stub` と `Greeter::Service` になる。

## リクエストの流れ

Call V3 パスで C++ の unary クライアント呼び出しを追う。

1. ユーザが生成スタブを呼ぶ: `stub_->SayHello(&context, request, &reply)` (`examples/cpp/helloworld/greeter_client.cc:63`)。channel は `grpc::CreateChannel(target_str, grpc::InsecureChannelCredentials())` (`examples/cpp/helloworld/greeter_client.cc:88`) から、stub は `Greeter::NewStub(channel)` (`examples/cpp/helloworld/greeter_client.cc:46`) から得る。
2. surface 層で一連の op の batch が積まれ `ClientCall::StartBatch` に入り (`src/core/call/client_call.cc:156`)、`ValidateClientBatch` (`src/core/call/client_call.cc:164`) を経て `CommitBatch` (`src/core/call/client_call.cc:168`) へ進む。
3. 初回 `send_initial_metadata` op が `ClientCall::StartCall` を駆動する (`src/core/call/client_call.cc:256`)。`CToMetadata` で C メタデータを内部マップに変換し (`src/core/call/client_call.cc:262`)、`MakeCallPair` で initiator/handler ペアを生成する (`src/core/call/client_call.cc:274`)。
4. 状態機械 `StartCallMaybeUpdateState` (`src/core/call/client_call.cc:282`) が CAS で開始状態へ遷移し、`call_destination_->StartCall(std::move(handler))` で handler を下流 (interception chain、filter stack、transport) に渡す。開始前に来た batch は `UnorderedStart` リストに退避し、開始時に flush する (`src/core/call/client_call.cc:299`)。
5. 以降のメッセージ送受信は spine 上の promise として `SpawnGuarded` で実行され (`src/core/call/call_spine.h:198`)、`CallFilters` を通る。

サーバ側も対称だ: `ServerBuilder::AddListeningPort` (`examples/cpp/helloworld/greeter_server.cc:66`)、`RegisterService` (`examples/cpp/helloworld/greeter_server.cc:69`)、`BuildAndStart` (`examples/cpp/helloworld/greeter_server.cc:71`)。

## 主要な設計判断

このコードベースを定義する判断は、2 世代のコールスタックを同時に生かしていることだ。ABI 安定の同じ公開 C API (`call.h`) が、古いコールバック駆動スタック (Call V1) と新しい promise ベーススタック (Call V3) のどちらかの上に乗り、使用するトランスポートがどちらを動かすかを選ぶ (`src/core/call/AGENTS.md:31`)。HTTP/2 への標準化という早期の判断 (<https://grpc.io/about/>) がもう一つの定義的トレードオフで、多重化とストリーミングを得る代わりにブラウザへ届けるにはプロキシが要る。

## 拡張ポイント

- 新規/独自言語のスタブ生成のための `src/compiler/` の `protoc` プラグインインターフェース。
- 独自トランスポートセキュリティのための、コア内の credentials / TSI セキュリティプラグイン。
- 外部コントロールプレーン (例: Envoy) がロードバランシングとルーティング設定を push できる xDS 連携 (`src/core/xds/`)。
- 各呼び出しへの横断的な振る舞いのための interceptor と `CallFilters` チェーン。
