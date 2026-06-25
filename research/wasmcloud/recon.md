# recon: wasmCloud

調査メモ。自分用の密度。出典は URL を添える。path:line は clone した `src/` (pinned commit) を指す。

## 基本情報

- repo: [wasmCloud/wasmCloud](https://github.com/wasmCloud/wasmCloud)
- pinned commit: `0c6315bae5723629e958faa1e30223f316bcd9a0` (2026-06-24) / 近いタグ: `v2.4.0` (2026-06-17、HEAD はその数コミット先、`main`)
- 言語 / ビルド: Rust (edition 2024, rust-version 1.94.0) + Go (operator/gateway, go 1.26.0)。ビルドは `cargo install --path crates/wash` / `cargo build`。`Cargo.toml:8` の `default-members = ["crates/wash"]`
- ライセンス: Apache-2.0 (`src/LICENSE` 冒頭が "Apache License Version 2.0"、GitHub API の `license.spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Incubating (2024-11-08 に Sandbox から昇格)
- カテゴリ (tools.ts): Runtime
- main entrypoint: `crates/wash/src/main.rs`(`#[tokio::main] async fn main`、clap で `wash` CLI を構築)

## 重要: リポジトリは v2 で大きく作り直されている

歴史的な wasmCloud は「NATS lattice + actor (後に component) + capability provider + wadm」という多クレート構成だった。だが pinned commit (v2.4.0 系) の `wasmCloud/wasmCloud` リポジトリは中身がほぼ別物で、`wash`(The Wasm Shell)中心に再編されている。README 冒頭も `# wash - The Wasm Shell`(`src/README.md:1`)。Cargo workspace のメンバーは 3 つだけ:

- `crates/wash` — 開発者向け CLI(scaffold / build / dev / inspect / oci / wit / host)
- `crates/wash-runtime` — Wasmtime ベースの組み込みコンポーネントランタイム + `HostApi`
- `crates/bench-tools`

加えて Go の `runtime-operator/`(Kubernetes operator, module `go.wasmcloud.dev/runtime-operator/v2`)、`runtime-gateway/`(Go の HTTP プロキシ/リコンサイラ)、`proto/wasmcloud/runtime/v2/`(gRPC API)、`wit/`、`charts/`、`templates/`、`examples/`。`go.work` が operator と gateway を束ねる。

つまり 2025 Q3 ロードマップ(provider を wRPC server 化、transport / scheduling / events / claims を刷新、Kubernetes 寄せ)が実コードに落ちた状態。古い解説記事(lattice/NATS/actor/wadm)は概念理解には有効だが、現行コードの構造とは一致しない。deep-dive 本文ではこの差分を明示する必要がある。

## 歴史の素材

- 起源: Liam Randall と Kevin Hoffman が米大手銀行在籍時に着手。当初 Rust から一時 Erlang/OTP、component model 移行で再び Rust 一本のランタイムへ。actor model(1973 起源)を初期の抽象に採用。出典: [b-nova](https://b-nova.com/en/home/content/actors-in-the-cloud-with-wasmcloud/)、[InfoWorld First look](https://www.infoworld.com/article/2338269/first-look-wasmcloud-and-cosmonic.html)
- スポンサー企業 Cosmonic(創業者 Liam Randall, Stuart Harris)。現在のプロジェクトリードは Cosmonic CTO 兼 Bytecode Alliance TSC の Bailey Hayes。出典: [CNCF incubator blog](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)
- 2023-09-06: WASI Preview 2 / Component Model 到来に合わせてエコシステムを componentize。WIT を IDL に採用。出典: [Cosmonic componentizes wasmCloud](https://cosmonic.com/blog/industry/cosmonic-componentizes-wasmcloud-ecosystem)
- 2024-03-19 (KubeCon EU Paris): wasmCloud 1.0。WASI 0.2 + Component Model を本番向けに。wRPC(WIT over RPC)導入。出典: [Cosmonic 1.0 blog](https://blog.cosmonic.com/engineering/wasmcloud-1-brings-components-to-enterprise/)
- 2024-04-16 (OSS Summit Seattle): Cosmonic が Kubernetes operator(旧 Cosmonic Connect Kubernetes)を CNCF に寄贈。出典: [Cosmonic operator blog](https://blog.cosmonic.com/engineering/wasmcloud-operator-is-here/)
- CNCF: 2021-07-13 Sandbox 受理、2024-11-08 Incubating 昇格(TOC 投票)。出典: [CNCF project page](https://www.cncf.io/projects/wasmcloud/)、[CNCF incubator blog](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)
- v2.4.0 リリース: 2026-06-17(GitHub Releases / latest)

## アーキテクチャの素材

トップレベル構成(現行 v2):

- `crates/wash`(Rust CLI): scaffold(`new`)、ビルド(`build`)、ホットリロード開発ループ(`dev`)、OCI push/pull、WIT 管理、そして `wash host`(operator から起動されてホストプロセスとして振る舞う)。コマンド列挙は `crates/wash/src/main.rs:66-104`(`WashCliCommand`)。
- `crates/wash-runtime`(Rust lib): Wasmtime を内包する組み込みランタイム。`HostApi` trait(`crates/wash-runtime/src/host/mod.rs:74`)が中核 API で `heartbeat / workload_start / workload_status / workload_stop` を定義。`Engine`(`crates/wash-runtime/src/engine/mod.rs:230`)が wasmtime::Engine をラップ。WASI/host 機能は plugin として供給(`crates/wash-runtime/src/plugin/` 配下に wasi_keyvalue / wasi_blobstore / wasi_config / wasi_logging / wasi_otel / wasi_webgpu / wasmcloud_messaging / wasmcloud_postgres)。
- `proto/wasmcloud/runtime/v2/`(gRPC): `WorkloadService`(`workload_service.proto:8-11`、`WorkloadStart/Status/Stop`)、`HostService`(`host_service.proto:9-12`、`HostHeartbeat`)。`workload.proto` / `host_heartbeat.proto` / `wit_interface.proto` のメッセージが `crates/wash-runtime/src/types.rs` の Rust 型と 1:1 対応。
- `runtime-operator/`(Go, controller-runtime): Kubernetes 上で Wasm workload を pod にマップし、gRPC で `wash host` を駆動。
- `runtime-gateway/`(Go): HTTP 受けのプロキシ/リコンサイラ(`main.go` / `proxy.go` / `reconciler.go`)。

要点: 同じ `wash-runtime` ホストが、ローカルでは `wash dev` に駆動され、本番では K8s operator から gRPC で駆動される。NATS lattice を中核に据えた旧構成から、gRPC + Kubernetes operator を中核に据えた構成へ移った。NATS は依存に残る(`async-nats` を keyvalue/blobstore plugin が利用)が、もはやコントロールプレーンの必須要素ではない。

WASI ランタイムは Wasmtime。`crates/wash-runtime/src/lib.rs:23` で `pub use wasmtime;`。TLS は aws-lc-rs に統一(`init_crypto()`、`lib.rs:46`)。

## 内部実装の素材: `wash dev` を端から端まで追う(代表操作)

代表として「`wash dev` がコンポーネントをホットリロードする」一連を追う。

1. CLI ディスパッチ: `crates/wash/src/main.rs:73` `WashCliCommand::Dev(DevCommand)` から `:130` で `cmd.handle(ctx)` を呼ぶ。
2. dev ハンドラがランタイムを組む: `crates/wash/src/cli/dev.rs:66` `Engine::builder()`、`:141` `DevRouter::default()`(HTTP ルータ)、`:184` `HttpServer::new(...)` を生成し `HostBuilder` に載せて `Host` を構築。
3. ファイル変更検知時の再ロード: `crates/wash/src/cli/dev.rs:597` `reload_component(host, workload, workload_id)`。前回の workload があれば `:603` `host.workload_stop(WorkloadStopRequest{..})`、続いて `:607-612` `host.workload_start(WorkloadStartRequest{ workload_id: uuid::Uuid::new_v4()..., workload })`。状態が `Running` でなければ `:614` で bail。
4. ホスト側 start: `crates/wash-runtime/src/host/mod.rs:636` `Host::workload_start`。まず `:641-644` で `workloads` マップに `HostWorkload::Starting` を挿入(`Arc<RwLock<HashMap<String, HostWorkload>>>`)。`:647` `workload_start_inner` を呼ぶ。
5. 実体化: `crates/wash-runtime/src/host/mod.rs:543` `workload_start_inner`。`:550-552` `engine.initialize_workload(id, workload)` から `UnresolvedWorkload`。`:554-556` `unresolved.resolve(Some(&self.plugins), http_handler)` から `ResolvedWorkload`。service があれば `:559` `resolved_workload.execute_service()`。
6. コンパイル/検証: `crates/wash-runtime/src/engine/mod.rs:294` `initialize_workload`。volume を検証(HostPath は実在ディレクトリか、EmptyDir は temp 作成、`:312-334`)、service と各 component を `initialize_*`(`:339-381`)で wasmtime Component にコンパイルし `UnresolvedWorkload::new`(`:383-390`)。
7. import 解決と plugin バインド: `crates/wash-runtime/src/engine/workload.rs:690` `resolve_workload_imports` / `:804` `resolve_component_imports`。component の WIT import を見て必要な plugin を linker にバインド(`:851` `plugin_component.pre_instantiate()`)。
8. 実行: `crates/wash-runtime/src/engine/workload.rs:518` `execute_service` が `pre_instantiate`(`:530`)してインスタンス生成、`JoinHandle` で常駐タスク化。
9. 状態確定: `crates/wash-runtime/src/host/mod.rs:659-668` で workloads マップを `HostWorkload::Running(Box<ResolvedWorkload>)`(失敗時 `Error(String)`)に更新し、`WorkloadStartResponse`(`:670-676`)を返す。

本番経路ではステップ 3 が `runtime-operator` からの gRPC `WorkloadService.WorkloadStart`(`proto/wasmcloud/runtime/v2/workload_service.proto:9`)になるだけで、4 以降は同一コード。

### 中核データ構造(3-5)

- `Workload`(`crates/wash-runtime/src/types.rs:31`): namespace / name / annotations / `Option<Service>` / `Vec<Component>` / `host_interfaces: Vec<WitInterface>` / `Vec<Volume>`。デプロイ単位。proto の `workload.proto` と対応。
- `Component`(`types.rs:69`): name / `bytes: Bytes`(Wasm 本体) / digest / `local_resources` / `pool_size` / `max_invocations`。プール化と呼び出し上限を持つ実行可能 component。
- `Service`(`types.rs:55`): 長命コンポーネント。`bytes` / digest / `local_resources` / `max_restarts`(失敗時の再起動回数)。
- `LocalResources`(`types.rs:82`): `memory_limit_mb` / `cpu_limit`(既定 -1 = 無制限、`:107`)、`config`(wasi:config/store へ流す KV)、`environment`(wasi:cli/env)、`volume_mounts`、`allowed_hosts: Arc<[AllowedHost]>`。
- `WorkloadState`(`types.rs:46`, `#[repr(i32)]`): Unspecified=0 / Starting / Running / Completed / Stopping / Error / NotFound。proto enum と数値一致。ホスト内部表現は `HostWorkload`(`host/mod.rs:157`、`Starting / Running(Box<ResolvedWorkload>) / Stopping / Error(String)`)。
- `HostHeartbeat`(`types.rs:160`): host id / hostname / http_port / version / labels / OS 情報 / CPU・メモリ使用量 / component_count / workload_count / imports・exports(WIT) / environment(K8s namespace 等)。`HostService.HostHeartbeat`(`host_service.proto:12`)で operator に送る。

### 非自明な設計判断

1. WASI Preview 2 と Preview 3 のバインディングを両方とも常に linker に登録し、component ごとに実行時ディスパッチする。`crates/wash-runtime/src/engine/mod.rs:65` `add_wasi_to_linker` が P2(`:66-175`)と P3(`:178-188`)を同じ linker に積む。どちらを使うかは `targets_wasip3`(`:196`、import/export 名に `@0.3` が含まれるか)/ `targets_wasip3_http`(`:210`)で component ごとに判定。移行期に新旧 WASI 混在の component 群を 1 ホストで同時に動かすための割り切り。
2. socket は upstream の wasmtime-wasi ではなく独自実装を linker に挿す(`engine/mod.rs:146-184`、`crate::sockets::WasiSockets`)。理由は loopback ネットワーク対応で、同一ホスト内の component 間通信を NATS なしでインプロセスに閉じるため(`engine/mod.rs:336` `loopback = Arc::default()`)。
3. egress はデフォルト拒否(zero-trust)。`LocalResources.allowed_hosts` の空 = 全拒否(`types.rs:92-103` のコメント明記、判定は `host/http.rs::check_allowed_hosts`)。明示的に `[AllowedHost::Any]` を渡さない限り外向き通信は通らない。wash の config 層が YAML で `allowedHosts` 省略時に `[Any]` を補うので `wash dev` 経路では意図せぬ空には落ちない。
4. workspace lint が極端に厳しい: `Cargo.toml` で `unsafe_code='deny'`、clippy の `unwrap_used / expect_used / panic / indexing_slicing = 'deny'`、`warnings='deny'`。ランタイムに panic 経路を作らせない方針。

## 採用事例の素材(出典付きの組織名のみ)

CNCF incubator ブログが名指しした採用組織: Adobe / Orange / MachineMetrics / TM Forum 加盟 CSP 群 / Akamai。出典: [CNCF incubator blog](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)

- Adobe: Colin Murphy・Sean Isom が wasmCloud と Kubernetes を組み合わせた PoC。出典: 同 CNCF blog / [wasmCloud adoption blog](https://wasmcloud.com/blog/2024-10-22-webassembly-adoption-telco-manufacturing-tech/)
- MachineMetrics: 工場エッジで高頻度データ workload を component として実行する PoC。Argo CD 管理の K8s クラスタ + エッジ機器に wasmCloud をデプロイ。出典: 同 adoption blog
- TM Forum「WebAssembly Canvas Phase I」Catalyst: wasmCloud が Kubernetes(ODA Canvas)の代替たりうるかを検証する PoC。出典: 同 adoption blog

注意: 多くは PoC / プロトタイプ段階として記述されており、フル本番運用と断定できる公開ストーリーは限定的。本文では PoC と明記する。捏造禁止。

GitHub 指標(2026-06-24 アクセス、GitHub API): stars 2,356 / forks 248 / open issues 37 / contributors 約 71(anon 含む)。言語 Rust。

## 代替・エコシステム

- 直接的な WebAssembly サーバサイド/コンポーネント実行系の代替: Fermyon Spin(Wasm マイクロサービスフレームワーク)、SpinKube、Wasmtime 単体 + 自前運用、WasmEdge(CNCF、ランタイム寄り)、Cosmonic(wasmCloud ベースの商用 PaaS)。
- Kubernetes 上で Wasm を動かす隣接: runwasi / containerd-shim-wasm(コンテナランタイム経由)、SpinKube。wasmCloud v2 は専用 operator で K8s に寄せた点が差。
- 本質的な差別化: (1) WIT/Component Model を一級市民にした polyglot な component 合成、(2) capability を plugin(`wasi:*` / `wasmcloud:*`)として差し替え可能にする host 設計、(3) 単一ランタイムをローカル(`wash dev`)と K8s(operator + gRPC)の双方で共有、(4) egress デフォルト拒否などの zero-trust 寄り設計。
- 依存エコシステム: Wasmtime(Bytecode Alliance)、WASI 0.2/0.3、NATS(plugin の keyvalue/blobstore 実装に使用)、OCI レジストリ(component の配布)、OpenTelemetry(observability)。

## インストール / 最小動作セットアップ

出典: `src/README.md`(Quickstart, `:50-90`)

- 前提: Rust toolchain と `rustup target add wasm32-wasip2`。
- インストール(Linux/macOS): `curl -fsSL https://raw.githubusercontent.com/wasmcloud/wasmCloud/refs/heads/main/install.sh | bash`(リリースバイナリ取得)。あるいは `cargo install --path crates/wash`(ソースから)。
- 最小動作: `wash new https://github.com/wasmCloud/wasmCloud.git --subfolder templates/http-hello-world` → `wash -C ./http-hello-world build` → `wash -C ./http-hello-world dev`。`wash dev` がコンポーネントをビルドしホットリロード付きでローカルホストに載せる。
