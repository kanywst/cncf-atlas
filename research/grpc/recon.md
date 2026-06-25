# recon: gRPC

調査メモ。出典は URL 付き、コードは clone した repo の `file:line` で残す。clone 先は `research/grpc/src/`、repo 内パスは `src/core/...` 表記で統一する。

## 基本情報

- repo: `grpc/grpc` (C-core ベースのマルチ言語実装。これが deep-dive の対象とする正規リポ)
- pinned commit: `c697b01a0dec7d704cec73ed72c5bdf4711deda0` (2026-06-24 07:16 -0700, master)
- 近いタグ: 直近リリース `v1.81.1` (2026-06-08)、リポ最新タグ `v1.82.0-pre1`。`BUILD` の `version = "1.83.0-dev"` / `core_version = "55.0.0"` なので HEAD は 1.83 開発線上
- 言語 / ビルド: C++ (コア)。多言語ラッパ (C++/Python/Ruby/PHP/C#/Objective-C) を同居。ビルドは Bazel (`MODULE.bazel` / `BUILD`) と CMake (`CMakeLists.txt`) の二系統
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認、GitHub API も `Apache-2.0`)
- CNCF 成熟度: Incubating (2017-02-16 受理、2026-06 時点も Incubating。卒業はしていない)
- カテゴリ (指定): Developer Tools
- main entrypoint: 単一の `main()` を持つライブラリではない。利用側の入口は C++ で `grpc::CreateChannel` + 生成 stub の `NewStub`、サーバ側は `grpc::ServerBuilder`。C-core の公開 API 入口は `src/core/lib/surface/`

## 歴史の素材

- 起源は Google 社内 RPC 基盤 Stubby。grpc.io About に「Google has used a single general-purpose RPC infrastructure called Stubby ... for over a decade」「In March 2015, Google decided to build the next version of Stubby and make it open source. The result was gRPC」とある。出典: <https://grpc.io/about/>
- Stubby は社内インフラに密結合で標準非依存だったため公開不可。SPDY/HTTP2/QUIC の登場で標準ベースで作り直す動機が生まれた、という経緯 (gRPC Blog / About)。出典: <https://grpc.io/about/>
- 2015-03 公開。protobuf + HTTP/2 ベース。「g」の意味はリリースごとに変わる遊びがある (Wikipedia)。出典: <https://en.wikipedia.org/wiki/GRPC>
- CNCF 受理 2017-02-16、Incubating。出典: <https://www.cncf.io/projects/grpc/>
- GitHub リポ作成 2014-12-08 (API `created_at`)。

## アーキテクチャの素材

トップレベル構成 (clone した repo の `src/`):

- `src/core/` … C-core 本体 (C++)。call / channel / transport / resolver / load_balancing / credentials / tsi (security) / xds / channelz など
- `src/cpp/`, `src/python/`, `src/ruby/`, `src/php/`, `src/csharp/`, `src/objective-c/` … 各言語ラッパ (C-core の上)
- `src/compiler/` … `protoc` プラグイン (各言語の stub 生成)
- `include/` … 公開ヘッダ (`grpc/`, `grpcpp/`)
- `third_party/` … abseil / boringssl / c-ares / re2 などの依存 (submodule)
- `examples/` … 各言語の helloworld。`examples/protos/helloworld.proto` が共通 IDL

設計上の中心概念 (`src/core/call/AGENTS.md` に明記):

- 1 本の RPC を表す中核は CallSpine。client 側ビュー `CallInitiator`、server 側ビュー `CallHandler` が同じ spine を共有する
- 公開 API ラッパは client `ClientCall` / server `ServerCall`
- Call V1 と V3 の二系統が共存している (後述の非自明な設計判断)

リクエストの流れ (unary client call, Call V3):

1. ユーザが C++ stub `stub_->SayHello(&context, request, &reply)` を呼ぶ (`examples/cpp/helloworld/greeter_client.cc:63`)。channel は `grpc::CreateChannel(...)` (同 `:88`)
2. surface 層で完了キュー付き batch が積まれ `ClientCall::StartBatch` に入る (`src/core/call/client_call.cc:156`)。ここで `ValidateClientBatch` 後 `CommitBatch` へ (`:164`, `:168`)
3. 初回 `send_initial_metadata` op で `ClientCall::StartCall` (`src/core/call/client_call.cc:256`)。C メタデータを内部 `MetadataMap` に変換し (`CToMetadata` `:262`)、`MakeCallPair` で initiator/handler を生成 (`:274`)
4. 状態機械 `StartCallMaybeUpdateState` が `kUnstarted -> kStarted` に CAS し、`call_destination_->StartCall(std::move(handler))` で下流 (interception chain / filter stack / transport) に handler を渡す (`src/core/call/client_call.cc:282-303`)。未開始中に来た batch は `UnorderedStart` リンクリストに退避し開始時に flush (`:299-310`)
5. 以降のメッセージ送受信は spine 上の promise として `SpawnGuarded` で実行 (`src/core/call/call_spine.h:198`)。filter は `CallFilters` を通る
6. C-core API 生成入口は `MakeClientCall` (`src/core/call/client_call.cc:479`)。arena からアロケートし `->c_ptr()` で `grpc_call*` を返す (`:490-494`)

サーバ側入口: `ServerBuilder::AddListeningPort` / `RegisterService` / `BuildAndStart` (`examples/cpp/helloworld/greeter_server.cc:66,69,71`)。

## 内部実装の素材

中核データ構造 (3-5 個):

1. CallSpine (`src/core/call/call_spine.h:48`) … `class CallSpine final : public Party, public channelz::DataSource`。1 RPC の中心。arena・`CallFilters`・メッセージ/メタデータの pipe を抱え、`Party` を継承して promise をシリアル実行する。`call_filters_` を直接保持 (`:365`)
2. CallFilters / StackData / Layout (`src/core/call/call_filters.h:1082`, `:370`) … `StackData` は「あるフィルタ集合で 1 call を実行するために必要な全コードの完全表現」(コメント `:1077-1081`)。channel 層に置かれ多数の in-flight call で共有される。`Layout` は各 op 種別ごとの promise サイズ/アライメントとオペレータ列を持つ (`:370-380`)。これがフィルタチェーンの実体
3. MetadataMap (`src/core/call/metadata_batch.h:1420`) … 型付きメタデータコンテナ。`Traits...` で既知ヘッダを型として持ち、`StatefulCompressor` をテンプレートで合成して transport が圧縮を委譲できる (`:1426-1432`)。HTTP/2 HPACK 連携を型レベルで扱うのが特徴
4. Arena (`src/core/lib/resource_quota/arena.h:156`) … `class Arena final : public RefCounted<...>`。1 call ぶんのオブジェクトを bump-allocate する。`New<T>()` (`:193`) で call 内オブジェクトをまとめて確保し call 終了でまとめて破棄。malloc 回数削減のコア
5. Party (`src/core/lib/promise/party.h`) … 協調スケジューラ。1 party 上に Spawn された participant は直列実行が保証され (`:118`)、全員 sleep で party も静止 (`:102`)。`party_.reset()` でキャンセル (`:115`)。Call V3 の並行モデルそのもの

非自明な設計判断: call stack の二世代併存 (Call V1 / Call V3)。`src/core/call/AGENTS.md` が両者を明記する。

- V1: `FilterStackCall` (`src/core/lib/surface/filter_stack_call.{h,cc}`)。並行制御は Combiner + WorkSerializer のクロージャ駆動。対応 transport は CHTTP2 / legacy InProc。生成は `grpc_call_create`
- V3: `ClientCall` / `ServerCall` + `CallSpine`。並行制御は promise ライブラリの `Party`。対応 transport は PH2 / Chaotic Good / InProc。生成は `MakeClientCall` / `MakeServerCall`

つまり ABI 互換の公開 API (`call.h`) を保ったまま、内部のコールバック駆動 (combiner/closure) を promise 風のモデルへ段階移行している。transport 選択で V1/V3 が切り替わるため、同一バイナリ内に 2 つのコールスタック実装が同居する。これがコードベースを大きく/複雑にしている主因で、deep-dive で説明する価値がある。

## 採用事例の素材

grpc.io About に明記された組織のみ (捏造禁止、これ以外は書かない)。出典: <https://grpc.io/about/>

- Square
- Netflix
- Cockroach Labs
- Cisco
- Juniper Networks

加えて Google 自身が利用 (About 記載)。CNCF プロジェクト群が gRPC を内部プロトコルに採用しているのは周知だが、個別組織名としては上記の citable なものだけを使う。

## 採用シグナル (数値 + 日付)

GitHub API `repos/grpc/grpc`、取得日 2026-06-24:

- stars: 44,919
- forks: 11,161
- open issues: 1,359
- contributors: 1,168 (`contributors?anon=true` を `--paginate` で集計)
- 主要言語: C++
- リポ作成: 2014-12-08

ガバナンス: maintainer 一覧 (`MAINTAINERS.md`) はほぼ全員 Google LLC 所属。ガバナンス規程は `grpc/grpc-community` に外出し (`GOVERNANCE.md`)。HN などでも「Google の強いコントロール」が Incubating 据え置きの一因と議論されている。出典: <https://news.ycombinator.com/item?id=36698723>

## 代替・エコシステム

エコシステム / 統合:

- Protocol Buffers (既定のシリアライズ + IDL)、`protoc` + gRPC プラグイン (`src/compiler/`)
- 言語別実装: `grpc-go`、`grpc-java`、`grpc-dotnet` (別リポ)、本リポは C-core 系 (C++/Py/Ruby/PHP/C#/ObjC)
- ブラウザ/ゲートウェイ: grpc-web、grpc-gateway (REST 変換)、Envoy (xDS で gRPC の LB 設定を配信)
- xDS 連携が本リポ `src/core/xds/` に実装済み

代替と本質的な差 (出典: <https://grpc.io/about/>, <https://connectrpc.com/>, <https://buf.build/blog/connect-a-better-grpc>, <https://cloud.google.com/blog/products/api-management/understanding-grpc-openapi-and-rest-and-when-to-use-them>):

- Apache Thrift (Facebook 発, ASF) … IDL+RPC は同種。違いは transport/シリアライズの柔軟性 (TCP/HTTP/Kafka 等)。gRPC は HTTP/2 固定の代わりに multiplex/streaming で強い
- ConnectRPC (Buf) … 同じ protobuf IDL。Connect 独自プロトコルは POST-only で HTTP/1.1 でも動きブラウザ/curl で叩ける。gRPC/gRPC-Web 互換も持つ。gRPC の「HTTP/2 trailers 必須でブラウザにプロキシが要る/デバッグしにくい」点を突いた設計
- REST + JSON (+OpenAPI) … 相互運用性とデバッグ容易性で勝るがバイナリ/HTTP2 の効率では劣る。public API はこちらが既定
- 立ち位置: クラウドネイティブの内部 service-to-service 低遅延 RPC では gRPC が事実上の標準。Envoy/Kubernetes との結合が強い

## 最小構成 (install + minimum working setup)

C++ の最小例 (`examples/cpp/helloworld/`、IDL は `examples/protos/helloworld.proto`):

1. `.proto` を定義 (`service Greeter { rpc SayHello (HelloRequest) returns (HelloReply); }` — `examples/protos/helloworld.proto:24-26`)
2. `protoc` + gRPC C++ プラグインで stub 生成
3. サーバ: `ServerBuilder` に `AddListeningPort` + `RegisterService` し `BuildAndStart` (`examples/cpp/helloworld/greeter_server.cc:66-71`)
4. クライアント: `grpc::CreateChannel(target, creds)` で channel、`Greeter::NewStub(channel)` で stub、`stub_->SayHello(...)` 呼び出し (`examples/cpp/helloworld/greeter_client.cc:88,46,63`)

各言語のパッケージマネージャ経由インストールが基本 (README "To start using gRPC")。ビルドからやる場合は Bazel か CMake (`BUILDING.md`)。詳細手順は <https://grpc.io/docs/languages/> のクイックスタート。
