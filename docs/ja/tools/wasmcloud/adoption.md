# 採用事例・エコシステム

## 誰が使っているか

CNCF incubator 発表は、wasmCloud に取り組む組織として Adobe・Orange・MachineMetrics・TM Forum 加盟 CSP 群・Akamai を名指しした ([CNCF](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/))。これらの多くはフル本番運用ではなく PoC やプロトタイプとして記述されており、その区別は下表で保つ。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Adobe | wasmCloud と Kubernetes を組み合わせた PoC (Colin Murphy、Sean Isom) | [CNCF](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)、[adoption blog](https://wasmcloud.com/blog/2024-10-22-webassembly-adoption-telco-manufacturing-tech/) |
| MachineMetrics | 工場エッジの高頻度データ workload を component として実行する PoC。Argo CD 管理の K8s とエッジ機器にデプロイ | [adoption blog](https://wasmcloud.com/blog/2024-10-22-webassembly-adoption-telco-manufacturing-tech/) |
| TM Forum 加盟 CSP 群 | 「WebAssembly Canvas Phase I」Catalyst PoC。wasmCloud が Kubernetes (ODA Canvas) の代替たりうるかを検証 | [adoption blog](https://wasmcloud.com/blog/2024-10-22-webassembly-adoption-telco-manufacturing-tech/) |

公開ストーリーの多くは PoC・プロトタイプ段階。フル本番のケーススタディは限定的だ。

## 採用のシグナル

2026-06-24 に `wasmCloud/wasmCloud` の GitHub REST API で観測: stars 2,356、forks 248、open issues 37、コントリビュータ約 71 (anon 含む)。主要言語は Rust。同日時点の最新リリースは v2.4.0 (2026-06-17) ([GitHub](https://github.com/wasmCloud/wasmCloud))。プロジェクトは CNCF Incubating で、2024-11-08 に Sandbox から昇格した ([CNCF project page](https://www.cncf.io/projects/wasmcloud/))。

## エコシステム

wasmCloud は Bytecode Alliance の Wasmtime と WASI 0.2 / 0.3 コンポーネントモデルの上に構築され、インターフェース言語に WIT を使う。component の配布には OCI レジストリを用い、observability は `wasi_otel` プラグイン (`crates/wash-runtime/src/plugin/`) 経由で OpenTelemetry に結線される。NATS は key-value と blob-store プラグインの内部に依存として残る。Cosmonic は wasmCloud をベースにした商用 PaaS を提供する。

## 代替候補

wasmCloud の差別化点は次のとおり: WIT とコンポーネントモデルを一級市民とした polyglot な component 合成、capability を差し替え可能な `wasi:*` / `wasmcloud:*` プラグインとして供給、ローカル (`wash dev`) と Kubernetes (operator + gRPC) で共有する単一ランタイム、egress 既定拒否などのゼロトラスト既定。

| 代替 | 違い |
| --- | --- |
| Fermyon Spin | Wasm マイクロサービス向けアプリフレームワーク。プログラミングモデルがより固定的で、ホスト供給の差し替え可能 capability への注力は薄い |
| SpinKube | Spin アプリを containerd shim 経由で Kubernetes 上に動かす。専用のコンポーネントランタイム operator ではない |
| runwasi / containerd-shim-wasm | Wasm をコンテナランタイム経由で OCI 形の workload として動かす。capability プラグインを持つコンポーネントモデルホストではない |
| WasmEdge | WebAssembly ランタイム (同じく CNCF)。より低レベルで、wasmCloud の capability プラグインや operator 層を持たない |
| Wasmtime 単体 | wasmCloud が内包するのと同じエンジン。ただし配置・capability・運用は自前で構築する |
| Cosmonic | wasmCloud をベースにした商用 PaaS。自前ホストではなくマネージド提供 |
