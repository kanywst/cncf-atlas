# Adoption & Ecosystem

## 誰が使っているか

この deep-dive では、citable な出典を伴う名指しの adopter は見つからなかった。`connect-go` リポジトリに `ADOPTERS` ファイルはなく (`ls ADOPTERS*` は何にもマッチしない)、CNCF プロジェクトページにも adopter リストはない (<https://www.cncf.io/projects/connect-rpc/>)。出典なしで組織名を挙げるより、下記の測定可能な GitHub シグナルを報告する。

Connect の起源の物語に繰り返し登場する名前が etcd だが、それは Connect の adopter としてではなく、gRPC の反面教師としてだ。Buf のローンチ記事は、etcd を `grpc-go` の互換崩れに数か月追従できなかった例として挙げている (<https://buf.build/blog/connect-a-better-grpc>)。

## 採用シグナル

GitHub REST API より、2026-06-29 時点の観測 (<https://github.com/connectrpc/connect-go>):

- `connect-go`: star 3,962、fork 147、open issues 28、contributors 約 46 名 (`contributors?anon=true` の最終ページ)。
- `connect-es` (TypeScript): star 1,760。
- `vanguard-go`: star 405。
- `connect-swift`: star 151、`connect-kotlin`: star 137。

リポジトリは OpenSSF Best Practices バッジを取得している (project 8972、README より)。

## エコシステム

Connect は、`connectrpc` org 配下の多言語プロトコルファミリの 1 実装だ (<https://github.com/connectrpc>):

- 兄弟実装: `connect-es` (TypeScript/JavaScript)、`connect-swift`、`connect-kotlin`。言語をまたいでサーバ/クライアントが同じ 3 プロトコルで相互運用できる。
- `vanguard-go`: 1 つの Connect / gRPC サーバに REST も受けさせる transcoder。全プロトコルを 1 handler に ingress する。
- 周辺パッケージ: `grpchealth` (gRPC 互換 health check)、`grpcreflect` (server reflection)、`validate` (Protovalidate interceptor)、`authn-go` (認証 middleware)、`otelconnect` (OpenTelemetry の trace / metric)。
- `awesome-connect`: 周辺エコシステムのキュレーションリスト。
- コード生成は `buf` が駆動する `protoc-gen-connect-go` プラグインで行う (`src/buf.gen.yaml`)。

## 代替

| 代替 | 本質的な差 |
| --- | --- |
| gRPC (`grpc-go`) | 同じ Protobuf RPC の発想だが、独自の HTTP/2 ベース net stack・名前解決・ロードバランシングを内蔵する。Connect は `net/http` に全振りして軽量で debug しやすいフットプリントを取り、gRPC とワイヤ互換を保って相互運用する (<https://buf.build/blog/connect-a-better-grpc>)。 |
| Twirp (Twitch) | Protobuf-over-HTTP という思想は近いが、POST-only で streaming なし・gRPC ワイヤ互換なし。Connect は streaming と gRPC 互換を持つ。 |
| gRPC-Web | 前段に Envoy のようなプロキシを前提とするブラウザ向け gRPC。Connect はプロキシなしでブラウザから直接叩ける。 |
| drpc (Storj) | 独自エコシステムを持つ軽量 RPC で、gRPC 互換は限定的。Connect は gRPC ワイヤ互換を優先する。 |

`net/http` を離れずに型付き Protobuf RPC がほしく、かつブラウザと gRPC クライアントを 1 エンドポイントから捌く必要のある Go サービスには、Connect が直球で合う。gRPC 組み込みのロードバランシングと resolver スタックに寄りかかる構成なら、`grpc-go` のほうが近い。
