# recon: Connect RPC (connect-go)

調査メモ。自分用の密度。出典は `sources.md` の番号に対応。path:line は pin した commit で確認済み。

## 基本情報

- repo: `connectrpc/connect-go` (Go 実装が canonical。CNCF プロジェクト "Connect RPC" の primary 実装)
- Go module path: `connectrpc.com/connect` (`src/go.mod:1`)
- pinned commit: `765b3c634490a946231611220e2f993b4214ab9d` (2026-06-24, "Bump actions/checkout from 6 to 7" #939)
- 近いタグ: `v1.20.0` (2026-05-20)。HEAD はその 1 commit 後の main。コード内 `Version` 定数は `1.21.0-dev` (`src/connect.go:36`)
- 言語: Go (go 1.25.0, `src/go.mod:3`)。非テスト `.go` 23 ファイル / コア約 6,470 行
- ビルド/テスト: `go build ./...` / `go test ./...`。コード生成は `buf generate` (`src/buf.gen.yaml`)、lint は `golangci-lint` (`src/.golangci.yml`)
- ライセンス: Apache-2.0。`src/LICENSE` 冒頭が Apache License Version 2.0、ファイル先頭 header も同じ (`src/connect.go:1-13`)。GitHub API の `license.spdx_id` も `Apache-2.0` [S3]
- 依存: 標準ライブラリ + `google.golang.org/protobuf` + `github.com/google/go-cmp` (テスト用) のみ (`src/go.mod:10-13`)。重い依存なし
- CNCF 成熟度: Sandbox (受理 2024-04-13) [S6]
- カテゴリ: Developer Tools (兄弟プロジェクト gRPC と同じ分類に合わせた)
- main entrypoint: ライブラリなので `func main` はない。利用側 entrypoint は生成コードが返す `http.Handler` (server) と生成クライアント (`src/README.md` の小例)。パッケージ doc は `src/connect.go:15-25`

## Connect とは何か (一行定義)

Connect は Protocol Buffers のスキーマから型付きクライアント/サーバを生成し、`net/http` 上で動く RPC (Remote Procedure Call、遠隔手続き呼び出し) フレームワーク。1 つのサーバが Connect 独自プロトコル・gRPC・gRPC-Web の 3 つを content-type ネゴシエーションで同時に喋れるのが核 (`src/README.md` 冒頭、handler 実装 `src/handler.go:384-410`)。

## 歴史の素材

- 2022-06-01: Buf が "Connect: A better gRPC" で発表。Go 実装 connect-go を Apache 2 で先行公開、TypeScript を後追いと予告 [S1]
- 発端の課題: grpc-go の maximalist な設計と複雑さ、debug 困難、後方互換の不安定さ (grpc-go は semver に従わず、1 年で 4 回以上互換を破り etcd などが追従できなかった、と Buf が主張) [S1]
- repo 自体は 2021-08-02 作成 (GitHub API `created_at`) [S3]。発表より前から開発
- 2023: Connect protocol を HTTP GET 対応に拡張し RPC をキャッシュ可能に。connect-go 1.7.0 以降で利用可 ("Introducing Cacheable RPCs in Connect") [S7]
- 2024-04-13: CNCF Sandbox 受理。Buf スポンサーだが独立 GitHub org・独立 governance・Buf 製品とロゴ/名前を共有しない、と表明 [S6], [S8]
- v1.0.0 で API 安定化。コード内 handshake 定数に `IsAtLeastVersion1_13_0` まで存在 (`src/connect.go:40-45`)

## アーキテクチャの素材

### トップレベルのコンポーネント

- `Client[Req, Res]` (`src/client.go:34`): 1 procedure 用の再利用可能・並行安全なクライアント。`CallUnary` / `CallClientStream` / `CallServerStream` / `CallBidiStream` の 4 メソッド
- `Handler` (`src/handler.go:28`): 1 RPC のサーバ実装。`ServeHTTP` を実装し plain `http.Handler` として mux に挿せる (`src/handler.go:259`)
- `protocol` interface (`src/protocol.go:66`): 3 実装 `protocolConnect` (`src/protocol_connect.go`)、`protocolGRPC{web:false}`、`protocolGRPC{web:true}` (`src/protocol_grpc.go`)。`NewHandler` / `NewClient` を返す
- `Codec` interface (`src/codec.go:35`): `protoBinaryCodec` (`src/codec.go:94`) と `protoJSONCodec` (`src/codec.go:146`)。proto バイナリ / JSON の marshal
- `envelope` (`src/envelope.go:45`): streaming / gRPC のワイヤ単位。5 byte prefix (1 byte flags + 4 byte length) + body
- `Interceptor` (`src/interceptor.go`): unary / streaming を包む middleware チェーン
- `Error` (`src/error.go:124`) と `Code` (`src/code.go:32`): gRPC 互換ステータスコード体系

### 代表操作の end-to-end トレース: unary クライアント呼び出し

1. `NewClient` がオプションから `clientConfig` を構築 (`src/client.go:42`)。デフォルトは Connect protocol + proto binary codec + gzip 要求 (`src/client.go:333-339`)。protocol client を生成 (`src/client.go:50`)。

2. hot path を避けるため interceptor は client 生成時に 1 度だけ適用 (`src/client.go:75-110`)。`unaryFunc` が本体: `protocolClient.NewConn` で接続を作り (`src/client.go:79`)、`conn.Send(request.Any())` で送信 (`src/client.go:91`)、`conn.CloseRequest()` (`src/client.go:96`)、`receiveUnaryResponse[Res]` で応答を受信 (`src/client.go:100`)。

3. `CallUnary` は `c.callUnary` に委譲するだけ (`src/client.go:149-154`)。`callUnary` は spec / peer / header を埋めて (`src/client.go:115-117`) interceptor チェーン込みの `unaryFunc` を呼ぶ (`src/client.go:135`)。

4. `receiveUnaryResponse` は `receiveUnaryMessage` を呼び 1 メッセージだけ unmarshal、さらに 2 通目を読んで EOF でなければ "unary response has multiple messages" の `CodeUnimplemented` を返す (cardinality 違反検出、`src/connect.go:433-499`)。

5. サーバ側: `Handler.ServeHTTP` が HTTP method で protocol handler 群を引き (`src/handler.go:274`)、content-type で `CanHandlePayload` する handler を選ぶ (`src/handler.go:285-290`)。GET の場合は body が無いことを確認 (`src/handler.go:297-312`)。`protocolHandler.NewConn` で stream を確立し (`src/handler.go:324`)、`h.implementation(ctx, connCloser)` を実行して `connCloser.Close(...)` する (`src/handler.go:337`)。

6. `NewUnaryHandler` の `implementation` クロージャが `receiveUnaryRequest` で 1 メッセージ受信 (`src/handler.go:69`)、`handlerCallInfo` を context に積み (`src/handler.go:75-81`)、interceptor 込みの `untyped` を呼び (`src/handler.go:82`)、最後に `conn.Send(response.Any())` で返す (`src/handler.go:101`)。

### 設計判断

- net/http だけで完結。独自 HTTP 実装・独自 name resolution / load balancing API なし。`http.Server` / `http.Client` / `http.Handler` がそのまま使える (`src/README.md`、`HTTPClient` interface は `Do` 1 メソッドのみ `src/connect.go:325-327`)
- 1 サーバ 3 プロトコル: handler 構築時に `protocolConnect` と gRPC / gRPC-Web の handler を必ず 3 つ生成しておき (`src/handler.go:385-389`)、request ごとに method + content-type で選ぶ (`src/handler.go:274-290`)。クライアントは `WithGRPC` / `WithGRPCWeb` の 1 オプションでプロトコル切替
- interceptor を生成時に 1 度だけ巻く最適化 (`src/client.go:75-76` のコメント "Rather than applying unary interceptors along the hot path, we can do it once at client creation")

## 内部実装の素材

### 中核データ構造 (3-5)

- `Spec` (`src/connect.go:333`): 1 つの RPC の記述。`StreamType` / `Schema` (protobuf では `protoreflect.MethodDescriptor`) / `Procedure` (例 `/acme.foo.v1.FooService/Bar`) / `IsClient` / `IdempotencyLevel`
- `Request[T any]` (`src/connect.go:165`) と `Response[T any]` (`src/connect.go:255`): 生成メッセージのジェネリックなラッパ。`Msg *T` を公開しつつ header / trailer / spec / peer を保持。header は遅延初期化で無駄な allocation を避ける (`src/connect.go:178-180`)
- `envelope` (`src/envelope.go:45`): `Data *bytes.Buffer` + `Flags uint8` + `offset int64`。5 byte prefix のコメントは `src/envelope.go:41-44`。flags の解釈は gRPC と Connect で異なり caller に委ねる設計
- `Error` (`src/error.go:124`): `code Code` + `err error` + `details []*ErrorDetail` + `meta http.Header` + `wireErr bool`。`wireErr` でサーバ送出エラーか client 合成エラーかを区別 (`NewWireError` / `IsWireError`、`src/error.go` の doc)
- `Code` (`src/code.go:32`): `uint32`。`CodeCanceled=1` (`src/code.go:43`) から `CodeUnauthenticated=16` まで gRPC のステータスコードと 1:1

### 非自明な設計選択: side-effect-free unary を HTTP GET にできる (cacheable RPC)

`IdempotencyNoSideEffects` (`src/idempotency_level.go:43`) を宣言した unary procedure は、`WithHTTPGet` で `EnableGet` を立てると POST ではなく GET で送れる。`connectUnaryRequestMarshaler.Marshal` (`src/protocol_connect.go:985`) が `enableGet` 時に `marshalWithGet` (`src/protocol_connect.go:997`) へ分岐し、メッセージを stable codec で marshal して query param に埋め込んだ URL を作る (`buildGetURL`、`src/protocol_connect.go:1017`)。URL が `getURLMaxBytes` を超えると compression で縮める、それでも無理なら POST に fallback (`getUseFallback`) かエラー (`src/protocol_connect.go:1016-1044`)。これにより CDN / ブラウザが RPC 応答をキャッシュできる。gRPC には無い、HTTP の意味論に素直に乗せた設計。stable marshal が必須なのは GET URL が決定的でないとキャッシュキーがブレるため (`src/protocol_connect.go:987-992`)。

もう一点: Connect 独自プロトコルの unary は 5 byte envelope を使わず body を直接書く (`connectUnaryMarshaler.Marshal`、`src/protocol_connect.go:927`)。envelope は streaming と gRPC のみ。だから unary Connect は `curl` で素の JSON を POST するだけで叩ける (`src/README.md` の curl 例)。エラーも HTTP ステータス + JSON body で表現し、gRPC のような trailer ベースのステータス伝搬を unary では使わない。

### 追う価値のあるパス

- `receiveUnaryMessage` の "2 通目を読んで EOF 確認" による cardinality violation 検出 (`src/connect.go:483-497`)。gRPC spec 準拠で client/server とも `CodeUnimplemented` を返す。TODO コメントで 2 回目 receive の allocation 最適化が未了 (`src/connect.go:485-487`)
- `envelope.Read` / `WriteTo` の prefix を offset で部分書き出しする実装 (`src/envelope.go:58-98`)。`io.Reader` / `io.WriterTo` として net/http に直接流せる

## 採用事例の素材

- 公式の ADOPTERS ファイルは connect-go repo に存在しない (`ls ADOPTERS*` で no match)。CNCF プロジェクトページにも adopter リストなし [S6]
- 名指しできる citable な採用組織は今回の調査では確認できず。誇張せず GitHub シグナルで代替する (下記)
- 起源の文脈で etcd が "grpc-go の互換崩れに数か月追従できなかった" 例として Buf の発表記事に登場するが、これは Connect の adopter ではなく gRPC の課題事例 [S1]

### 採用シグナル (数値 + 日付、すべて 2026-06-29 時点 GitHub API [S3])

- connect-go: star 3,962 / fork 147 / open issues 28 / contributors 約 46 名 (`contributors?anon=true` のページネーション last=46)
- connect-es (TypeScript): star 1,760 [S3]
- vanguard-go: star 405 [S3]
- connect-swift: star 151 / connect-kotlin: star 137 [S3]
- OpenSSF Best Practices バッジ取得 (project 8972、`src/README.md` のバッジ)

## 代替・エコシステム

### 同 org のエコシステム (connectrpc)

- 多言語実装: connect-es (TS/JS)、connect-swift、connect-kotlin。サーバ/クライアントとも 3 プロトコル互換 [S5]
- `connectrpc/vanguard-go`: 1 つの Connect/gRPC サーバに REST も含む全プロトコルから ingress させる transcoder [S5]
- 周辺パッケージ: `grpchealth` (gRPC 互換 health check)、`grpcreflect` (server reflection)、`validate` (Protovalidate interceptor、README 例で使用)、`authn-go` (認証 middleware)、`otelconnect` (OpenTelemetry trace/metric)
- `awesome-connect`: エコシステムのキュレーションリスト [S5]
- codegen は `protoc-gen-connect-go` プラグイン + `buf` で生成 (`src/buf.gen.yaml`)

### 主な代替と本質的な差

- gRPC (grpc-go): 同じく Protobuf RPC だが独自の HTTP/2 ベース net stack・name resolution・load balancing を内蔵。Connect は net/http に全振りし軽量・debug 容易を取る。Connect は gRPC とワイヤ互換なので排他ではなく相互運用可 [S1]
- Twirp (Twitch): POST-only の Protobuf-over-HTTP で思想は近いが streaming 非対応・gRPC ワイヤ互換なし。Connect は streaming と gRPC 互換を持つ
- gRPC-Web: ブラウザ向け gRPC だが proxy (Envoy 等) が前提。Connect はブラウザから直接叩け proxy 不要
- drpc (Storj): 軽量 RPC だが独自エコシステムで gRPC 互換性が限定的

## install / 最小構成 (Go server + client)

`sources.md` の Getting Started [S2] と `src/README.md` の小例に基づく。生成コードの import path は自分の Go module path に合わせる。

1. ライブラリと codegen ツールを入れる。

    ```bash
    go get connectrpc.com/connect
    go install github.com/bufbuild/buf/cmd/buf@latest
    go install connectrpc.com/connect/cmd/protoc-gen-connect-go@latest
    go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
    ```

2. `.proto` から `buf generate` で `*.connect.go` を生成 (`buf.gen.yaml` に protoc-gen-go と protoc-gen-connect-go を並べる)。

3. server: 生成された `NewXxxServiceHandler` を `http.ServeMux` に `mux.Handle(...)` して `http.Server` で listen (`src/README.md` の例、`localhost:8080`)。gRPC クライアント相手なら h2c のため `http.Protocols` で `SetUnencryptedHTTP2(true)`。

4. client: 生成された `NewXxxServiceClient(http.DefaultClient, "http://localhost:8080/")` を作り、メソッドを直接呼ぶ。

5. 動作確認は curl だけで可能 (live demo)。

    ```bash
    curl \
        --header "Content-Type: application/json" \
        --data '{"sentence": "I feel happy."}' \
        https://demo.connectrpc.com/connectrpc.eliza.v1.ElizaService/Say
    ```
