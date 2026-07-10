# はじめに

> コミット `0c6315b` (v2.4.0 付近) の README クイックスタートに基づく。コマンドは Linux か macOS の Unix シェルを想定。

## 前提

- [Rust toolchain](https://www.rust-lang.org/tools/install)。
- WASI Preview 2 ターゲット: `rustup target add wasm32-wasip2` (`README.md`)。

## インストール

最新リリースバイナリを取得する (Linux/macOS):

```bash
curl -fsSL https://raw.githubusercontent.com/wasmcloud/wasmCloud/refs/heads/main/install.sh | bash
```

その後 `wash` を `PATH` 上のどこかに移動する。ソースからビルドする場合:

```bash
git clone https://github.com/wasmcloud/wasmCloud.git
cargo install --path wasmCloud/crates/wash
```

## 最初の動く構成

動く component への最短経路は、スキャフォールド → ビルド → ホットリロードの dev ループだ。

1. HTTP hello-world テンプレートから新しい component を作る。

   ```bash
   wash new https://github.com/wasmCloud/wasmCloud.git --subfolder templates/http-hello-world
   ```

1. component をビルドする。

   ```bash
   wash -C ./http-hello-world build
   ```

1. dev ループを起動する。`wash dev` は component をビルドし、ローカルホストに載せ、ファイル変更で再ロードする。

   ```bash
   wash -C ./http-hello-world dev
   ```

## 動作確認

`wash dev` は component 用にローカル HTTP サーバを起動する (dev の HTTP ルータは `DevRouter` (`crates/wash/src/cli/dev.rs:141`)、提供するのは `HttpServer` (`crates/wash/src/cli/dev.rs:184`))。表示されたローカルアドレスにリクエストを送れば hello-world レスポンスが返る。component のソースを編集すると `wash dev` が再ビルドしてホットリロードする様子が見える。再ロードは `reload_component` (`crates/wash/src/cli/dev.rs:597`) を通り、旧 workload を止めて新しいものを起動する。

`wash` を最新に保つには:

```bash
wash update
```

## 次に読むもの

Kubernetes 本番デプロイには `runtime-operator/` の operator と `runtime-gateway/` の gateway を使う。これらは同じランタイムを gRPC の `WorkloadService` (`proto/wasmcloud/runtime/v2/workload_service.proto`) で駆動する。capability 設定・egress allowlist・リソース制限は `LocalResources` (`crates/wash-runtime/src/types.rs:75`) と公式ドキュメント [wasmcloud.com/docs](https://wasmcloud.com/docs/) を参照。
