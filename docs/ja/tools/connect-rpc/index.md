# Connect RPC

> Protocol Buffers から型付きクライアント・サーバを生成し、素の `net/http` 上で動く RPC フレームワーク。1 つのサーバが Connect 独自プロトコル・gRPC・gRPC-Web を同時に喋る。

- **カテゴリ**: Developer Tools
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [connectrpc/connect-go](https://github.com/connectrpc/connect-go)
- **ドキュメント対象コミット**: `765b3c6` (2026-06-24、`v1.20.0` の 1 コミット後)

## 概要

Connect は、リモートサーバのメソッドをローカル関数のように呼び出すためのフレームワークだ。`.proto` ファイルにサービスを宣言し、型付きクライアントとサーバを生成すると、シリアライズ・トランスポート・呼び出しライフサイクルをフレームワークが担う。このリポジトリ `connectrpc/connect-go` は canonical な Go 実装で、Go module path は `connectrpc.com/connect` だ (`src/go.mod:1`)。パッケージドキュメントも同じ目的を述べている (`src/connect.go:15-25`)。

Connect を際立たせるのは、Go 標準ライブラリの `net/http` だけの上に構築されている点だ。独自の HTTP スタック・名前解決・独自のロードバランシング API を一切持たない。`http.Server`・`http.Client`・`http.Handler` で足りる (`src/README.md`。必要な `HTTPClient` インターフェースは `Do` 1 メソッドのみ、`src/connect.go:325-327`)。非テストの依存は、標準ライブラリと `google.golang.org/protobuf`、テスト用の `github.com/google/go-cmp` だけだ (`src/go.mod:10-13`)。

核となる能力は、1 つの Connect サーバが 3 つのワイヤプロトコルを同時に喋ることだ: Connect 独自プロトコル・gRPC・gRPC-Web。HTTP メソッドと `Content-Type` ヘッダからリクエストごとに選ぶ (`src/handler.go:384-410`)。gRPC クライアント、gRPC-Web を使うブラウザ、JSON を POST する素の `curl` が、すべて同じ handler に届く。

## こんなときに使う

- 型付き Protobuf RPC がほしいが、別のネットワークスタックを導入するより `net/http` の標準的な middleware・サーバ・クライアントに留まりたい Go サービス。
- gRPC-Web のために Envoy のようなプロキシを立てずに、gRPC クライアントとブラウザクライアントを同じエンドポイントから捌く必要があるシステム。
- 副作用のない呼び出しを HTTP GET 経由で CDN やブラウザにキャッシュさせたい API ([Internals](./internals) を参照)。

向かないとき:

- このリポジトリを直接使わない非 Go スタック。Connect には他言語の兄弟実装があるが ([Adoption & Ecosystem](./adoption) を参照)、この deep-dive は Go コードを読む。
- gRPC 組み込みのクライアント側ロードバランシングと名前解決に依存する構成。Connect はそれを `net/http` と周辺インフラに委ねる。

## この deep-dive の構成

- [History](./history): 起源・マイルストーン・存在理由。
- [Architecture](./architecture): コンポーネントとリクエストの流れ。
- [Adoption & Ecosystem](./adoption): 誰が運用し、何が周辺にあるか。
- [Internals](./internals): ソースから読んだ、効いてくるコードパス。
- [Getting Started](./getting-started): インストールと最初に動く構成。

## 出典

1. connectrpc/connect-go リポジトリ (README、LICENSE、pin したコミットのソース): <https://github.com/connectrpc/connect-go>
2. Connect: A better gRPC (Buf、2022-06-01): <https://buf.build/blog/connect-a-better-grpc>
3. Connect ドキュメント、Getting Started (Go): <https://connectrpc.com/docs/go/getting-started/>
4. CNCF の Connect RPC プロジェクトページ (Sandbox、受理 2024-04-13): <https://www.cncf.io/projects/connect-rpc/>
5. Introducing Cacheable RPCs in Connect (Buf): <https://buf.build/blog/introducing-connect-cacheable-rpcs>
6. Connect RPC joins CNCF (Buf): <https://buf.build/blog/connect-rpc-joins-cncf>
