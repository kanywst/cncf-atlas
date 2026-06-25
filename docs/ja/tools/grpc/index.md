# gRPC

> Protocol Buffers のサービス定義から、HTTP/2 上で動く型付きクライアント・サーバを生成する高性能 RPC フレームワーク。

- **カテゴリ**: Developer Tools
- **CNCF 成熟度**: Incubating
- **言語**: C++ (C-core 本体。Python / Ruby / PHP / C# / Objective-C のラッパを同梱)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [grpc/grpc](https://github.com/grpc/grpc)
- **ドキュメント対象コミット**: `c697b01` (2026-06-24、1.83 開発線)

## 概要

gRPC は、リモートサーバのメソッドをローカル関数のように呼び出すためのフレームワークだ。`.proto` ファイルにサービスを宣言し、`protoc` コンパイラでクライアントスタブとサーバスケルトンを生成すると、シリアライズ・トランスポート・呼び出しライフサイクルをフレームワークが担う。既定のシリアライズは Protocol Buffers、トランスポートは HTTP/2 で、1 本の接続上で多重化ストリーム・ヘッダ圧縮・双方向ストリーミングが得られる。

このリポジトリ `grpc/grpc` は C-core 実装だ。`src/core/` 配下の C++ で書かれた単一のコアが RPC 機構を担い、薄い各言語ラッパ (`src/cpp/`, `src/python/`, `src/ruby/`, `src/php/`, `src/csharp/`, `src/objective-c/`) が各言語へ公開する。Go と Java の実装は別リポジトリ (`grpc-go`, `grpc-java`) にあり、このコアは共有しない。

gRPC はシステムの service-to-service 層に位置する。マイクロサービス間、コントロールプレーンとエージェント間、データベースとクライアント間の配線だ。それ自体はブラウザ向け API 層ではない。HTTP/2 trailers とバイナリフレーミングのため、ブラウザに届けるにはプロキシや gRPC-Web のような変種が要る。

## こんなときに使う

- 低遅延と型付き契約が、人間可読なペイロードより重要な内部 service-to-service 通信。
- ストリーミング処理: サーバストリーミング、クライアントストリーミング、または 1 接続上の双方向ストリーム。
- 1 つの IDL と生成スタブを多言語で共有したいポリグロットなシステム。
- すでに Protocol Buffers と HTTP/2 に投資した環境 (例: Kubernetes や Envoy 構成)。

向かないとき:

- ブラウザ向けの公開 API。REST + JSON のほうが消費もデバッグも容易で、gRPC はブラウザへ直接届けるのにプロキシか gRPC-Web を要する。
- `protoc` の実行と生成コードの管理コストが、型付けの利点を上回る軽い連携。

## この deep-dive の構成

- [History](./history): 起源・マイルストーン・存在理由。
- [Architecture](./architecture): コンポーネントとリクエストの流れ。
- [Adoption & Ecosystem](./adoption): 誰が運用し、何が周辺にあるか。
- [Internals](./internals): ソースから読んだ、効いてくるコードパス。
- [Getting Started](./getting-started): インストールと最初に動く構成。

## 出典

1. grpc/grpc リポジトリ (source, README, LICENSE, BUILD, MAINTAINERS): <https://github.com/grpc/grpc>
2. About gRPC (Stubby 起源、2015 公開、採用組織): <https://grpc.io/about/>
3. CNCF の gRPC プロジェクトページ (Incubating、受理 2017-02-16): <https://www.cncf.io/projects/grpc/>
4. grpc/grpc の GitHub REST API (stars / forks / 作成日): <https://api.github.com/repos/grpc/grpc>
5. Wikipedia: gRPC: <https://en.wikipedia.org/wiki/GRPC>
