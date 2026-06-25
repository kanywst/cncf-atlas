# 内部実装

> コミット `0c6315b` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `crates/wash/src/main.rs` | CLI エントリ。`WashCliCommand` enum とコマンドディスパッチ |
| `crates/wash/src/cli/dev.rs` | `wash dev` のホットリロードループ |
| `crates/wash-runtime/src/host/mod.rs` | `HostApi` trait、`Host`、workload ライフサイクル |
| `crates/wash-runtime/src/engine/mod.rs` | `Engine`、WASI linker 設定、workload 初期化 |
| `crates/wash-runtime/src/engine/workload.rs` | import 解決、プラグインバインド、service 実行 |
| `crates/wash-runtime/src/types.rs` | gRPC proto に対応する中核データ型 |
| `crates/wash-runtime/src/plugin/` | capability プラグイン (`wasi:*`、`wasmcloud:*`) |
| `proto/wasmcloud/runtime/v2/` | gRPC `WorkloadService` と `HostService` |

## 中核データ構造

デプロイ単位は `Workload` (`crates/wash-runtime/src/types.rs:27`)。namespace と name、annotations、`Option<Service>`、`Vec<Component>`、`host_interfaces: Vec<WitInterface>`、volumes を持つ。`workload.proto` メッセージに対応する。

`Component` (`crates/wash-runtime/src/types.rs:63`) は実行可能な component: `name`、`bytes` (Wasm 本体)、`Option<digest>`、`local_resources`、`pool_size`、`max_invocations`。`Service` (`crates/wash-runtime/src/types.rs:53`) は長命な変種で、`bytes`・`digest`・`local_resources` に加え失敗時の再起動回数 `max_restarts` を持つ。

`LocalResources` (`crates/wash-runtime/src/types.rs:75`) は workload ごとの制限と結線を運ぶ: `memory_limit_mb`、`cpu_limit` (既定 `-1` = 無制限、`Default` は `crates/wash-runtime/src/types.rs:106`)、`wasi:config/store` に出る `config` マップ、`wasi:cli/env` 用の `environment` マップ、`volume_mounts`、egress 用の `allowed_hosts: Arc<[AllowedHost]>`。

`WorkloadState` (`crates/wash-runtime/src/types.rs:40`、`#[repr(i32)]`) はワイヤ向けのライフサイクル enum: `Unspecified=0`・`Starting`・`Running`・`Completed`・`Stopping`・`Error`・`NotFound`。数値は proto enum と一致する。ホスト内部の表現は `HostWorkload` (`crates/wash-runtime/src/host/mod.rs:157`) で、`Starting`・`Running(Box<ResolvedWorkload>)`・`Stopping`・`Error(String)` の variant を持つ。`WorkloadState` への変換は `From` impl (`crates/wash-runtime/src/host/mod.rs:176`)。

`HostHeartbeat` (`crates/wash-runtime/src/types.rs:150`) は host id・hostname・HTTP port・version・labels・OS 情報・CPU/メモリ使用量・component と workload の数・ホストの WIT imports と exports・Kubernetes namespace 等の environment を報告する。`HostService.HostHeartbeat` (`proto/wasmcloud/runtime/v2/host_service.proto:12`) で operator に送られる。

## 追う価値のあるパス

`Host::workload_start` (`crates/wash-runtime/src/host/mod.rs:636`) が workload を生かす場所だ。まず意図を記録し、次に本処理を行い、最後に結果を記録する。write ロックは短いマップ更新の間だけ保持する。

```text
workload_start (host/mod.rs:636)
  workloads.write().insert(id, HostWorkload::Starting)   # :644
  workload_start_inner(request)                          # :647
    engine.initialize_workload(...) -> UnresolvedWorkload  (engine/mod.rs:294)
    unresolved.resolve(plugins, http_handler) -> ResolvedWorkload
    resolved.execute_service()                             (engine/workload.rs:518)
  match result:
    Ok  -> *workload = HostWorkload::Running(Box::new(rw)) # :665
    Err -> *workload = HostWorkload::Error(err.to_string())# :667
  return WorkloadStartResponse { workload_status { state, message } }
```

状態遷移は 2 つ目のロックを取る前に計算される (`crates/wash-runtime/src/host/mod.rs:649-657`)。エラーならエラー文字列付きで `WorkloadState::Error`、そうでなければ成功メッセージ付きで `WorkloadState::Running`。続いて `and_modify` が既存のマップエントリをその場で更新する (`:664-668`)。

`initialize_workload` (`crates/wash-runtime/src/engine/mod.rs:294`) はコンパイルと検証の場所だ。volume を検証し (HostPath は実在ディレクトリ、EmptyDir は temp ディレクトリとして作成)、service と各 component を Wasmtime component にコンパイルしてから `UnresolvedWorkload` を組む。import 解決はプラグインをバインドする: `resolve_component_imports` (`crates/wash-runtime/src/engine/workload.rs:804`) が component の WIT import を読み、対応するプラグイン component を linker に pre-instantiate する。

## 読んで驚いた点

- WASI の両世代が 1 つの linker に同居する。`add_wasi_to_linker` (`crates/wash-runtime/src/engine/mod.rs:65`) が Preview 2 バインディングを登録し、続いて Preview 3 バインディングを登録する (P3 ブロックは `crates/wash-runtime/src/engine/mod.rs:188` 付近で終わる)。どちらを使うかは `targets_wasip3` (`crates/wash-runtime/src/engine/mod.rs:196`) が component の WASI import/export に `@0.3` があるかで実行時に判定し、HTTP 用には別途 `targets_wasip3_http` (`crates/wash-runtime/src/engine/mod.rs:210`) がある。移行期に新旧 WASI 混在の component 群を 1 ホストで同時に動かせる。
- socket は upstream の `wasmtime-wasi` ではなく独自実装。linker 設定は socket インターフェースに `crate::sockets` を挿す (`crates/wash-runtime/src/engine/mod.rs:65` とそれに続く P3 socket 登録)。理由は loopback 対応で、同一ホスト内の component が NATS なしでインプロセスに通信するため。
- egress 拒否は型自体に書かれている。`allowed_hosts` の doc コメントは空リスト = 全拒否と明記し、判定は `crate::host::http::check_allowed_hosts` にある (`crates/wash-runtime/src/types.rs:92-103`)。allowlist 文字列は変換時にパースされ、リクエストのホットパスは生文字列ではなく型付き enum で照合する。
- workspace は lint で panic を禁じている。`Cargo.toml` は `warnings = 'deny'` と `unsafe_code = 'deny'` (20-21 行)、加えて clippy の `unwrap_used`・`expect_used`・`panic`・`indexing_slicing` を deny する (31-34 行)。そもそも panic 経路を作らせない方針だ。
