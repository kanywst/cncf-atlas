# Adoption & Ecosystem

## 採用組織

以下は citable な出典 (プロジェクトの About ページ) で名指しされた組織だ。gRPC はこのリポジトリに ADOPTERS ファイルを置いていないため、このリストは公開済みのものに意図的に限っている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Google | gRPC の出自である同じ RPC 系譜 (Stubby) の上に構築し、gRPC を利用。 | <https://grpc.io/about/> |
| Square | gRPC About ページで名指しの採用組織。 | <https://grpc.io/about/> |
| Netflix | gRPC About ページで名指しの採用組織。 | <https://grpc.io/about/> |
| Cockroach Labs | gRPC About ページで名指しの採用組織。 | <https://grpc.io/about/> |
| Cisco | gRPC About ページで名指しの採用組織。 | <https://grpc.io/about/> |
| Juniper Networks | gRPC About ページで名指しの採用組織。 | <https://grpc.io/about/> |

## 採用シグナル

`grpc/grpc` の GitHub REST API、取得日 2026-06-24 (<https://api.github.com/repos/grpc/grpc>):

- Stars: 44,919
- Forks: 11,161
- Open issues: 1,359
- Contributors: 1,168 (`contributors?anon=true` を `--paginate` で集計)
- 主要言語: C++
- リポジトリ作成: 2014-12-08

ガバナンスについて、`MAINTAINERS.md` の一覧はほぼ全員が Google 社員で、ガバナンス規程は別リポジトリ `grpc/grpc-community` に置かれる。この強い単一ベンダー支配が継続的な Incubating 状態と結び付けて議論されてきた (<https://news.ycombinator.com/item?id=36698723>)。

## エコシステム

- 既定のシリアライズと IDL としての Protocol Buffers。`src/compiler/` 配下の gRPC `protoc` プラグインを伴う。
- 別リポジトリの兄弟実装: `grpc-go`、`grpc-java`、`grpc-dotnet`。本リポジトリは C-core 系 (C++、Python、Ruby、PHP、C#、Objective-C)。
- ブラウザ/ゲートウェイのツール: ブラウザ向けの gRPC-Web、REST 変換の grpc-gateway、xDS で gRPC クライアントにロードバランシング設定を push する Envoy。
- xDS 対応は本リポジトリの `src/core/xds/` に実装済み。

## 代替

| 代替 | 本質的な違い |
| --- | --- |
| Apache Thrift | IDL+RPC の発想は同種だが、トランスポートとシリアライズが柔軟 (TCP、HTTP、Kafka など)。gRPC はトランスポートを HTTP/2 に固定する代わり多重化とストリーミングを得る (<https://grpc.io/about/>)。 |
| ConnectRPC (Buf) | 同じ Protocol Buffers IDL を使う。独自プロトコルは POST のみで HTTP/1.1 でも動き、ブラウザや `curl` から叩け、gRPC / gRPC-Web 互換も保つ。gRPC の HTTP/2 trailers 依存とブラウザに要るプロキシを突いた設計 (<https://buf.build/blog/connect-a-better-grpc>, <https://connectrpc.com/>)。 |
| REST + JSON (OpenAPI 併用) | 相互運用性とデバッグ容易性で勝り公開 API の既定だが、バイナリと HTTP/2 の効率では劣る (<https://cloud.google.com/blog/products/api-management/understanding-grpc-openapi-and-rest-and-when-to-use-them>)。 |

クラウドネイティブの内部 service-to-service 低遅延 RPC では、gRPC が事実上の標準であり、Envoy と Kubernetes との密な結合がそれを後押しする (<https://grpc.io/about/>)。
