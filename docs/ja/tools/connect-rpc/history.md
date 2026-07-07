# History

## 起源

Connect は、Protobuf ツール `buf` を手がける Buf 社から生まれた。2022-06-01、Buf は "Connect: A better gRPC" と題した記事で発表し、Go 実装 `connect-go` を Apache 2 で先行公開、TypeScript 実装を後追いすると予告した (<https://buf.build/blog/connect-a-better-grpc>)。GitHub リポジトリ自体は発表より前、2021-08-02 に作成されており (GitHub API `created_at`)、公開ローンチの数か月前から開発が走っていた。

解こうとした課題は、既存の Go 向け gRPC 実装の重さだった。Buf は、`grpc-go` が maximalist で debug が難しく、後方互換が不安定だと主張した。semver に従わず 1 年で 4 回以上互換を破り、etcd などが追従できなかった、というものだ (<https://buf.build/blog/connect-a-better-grpc>)。Connect の答えは、Go 標準ライブラリの `net/http` の上に構築し、gRPC とワイヤ互換を保つことで、両者を競合させず相互運用できるようにすることだった。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | GitHub リポジトリ `connectrpc/connect-go` 作成 (2021-08-02、GitHub API より)。 |
| 2022 | "Connect: A better gRPC" として発表。`connect-go` を Apache 2 で公開 (<https://buf.build/blog/connect-a-better-grpc>)。 |
| 2023 | Connect protocol を HTTP GET 対応に拡張し、副作用のない RPC をキャッシュ可能に。`connect-go` 1.7.0 以降で利用可 (<https://buf.build/blog/introducing-connect-cacheable-rpcs>)。 |
| 2024 | CNCF に Sandbox プロジェクトとして受理 (2024-04-13、<https://www.cncf.io/projects/connect-rpc/>)。 |
| 2026 | 直近タグは `v1.20.0` (2026-05-20)。対象 HEAD はその 1 コミット後で、コード内 `Version` 定数は `1.21.0-dev` (`src/connect.go:36`)。 |

## どう進化したか

API は v1.0.0 で安定化し、コードには今もその履歴を記す handshake 定数が残る。`IsAtLeastVersion1_13_0` までのバージョンゲートを定義している (`src/connect.go:40-45`)。生成コードが、互換のあるライブラリバージョンに対してビルドされたかを確認できる。

機能面での目立った転換は、2023 年の cacheable RPC だ。Connect はプロトコルを拡張し、副作用がないと宣言された unary 呼び出しを POST ではなく HTTP GET で送れるようにした。これで CDN やブラウザが応答をキャッシュできる (<https://buf.build/blog/introducing-connect-cacheable-rpcs>)。その仕組みは [Internals](./internals) でソースから読む。

## 現状

Connect RPC は CNCF の Sandbox プロジェクトで、2024-04-13 に受理された (<https://www.cncf.io/projects/connect-rpc/>)。Buf がスポンサーだが、プロジェクトは独立した GitHub org・独立したガバナンスで運営され、Buf の商用製品とロゴや名前を共有しないと表明している (<https://buf.build/blog/connect-rpc-joins-cncf>、<https://www.cncf.io/projects/connect-rpc/>)。リリースは `connectrpc/connect-go` リポジトリでタグ付けされ、対象コミット時点の最新は `v1.20.0` だ。依存は意図的に小さく保たれている。標準ライブラリと `google.golang.org/protobuf`、`go-cmp` はテスト専用だ (`src/go.mod:10-13`)。
