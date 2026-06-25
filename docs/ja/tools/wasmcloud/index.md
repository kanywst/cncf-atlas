# wasmCloud

> 同じホストをローカルでも Kubernetes でも動かし、コンポーネントを差し替え可能な capability プラグインに結線する WebAssembly コンポーネントランタイム。

- **カテゴリ**: Runtime
- **CNCF 成熟度**: Incubating
- **言語**: Rust (Go 製の Kubernetes operator と gateway を併設)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [wasmCloud/wasmCloud](https://github.com/wasmCloud/wasmCloud)
- **ドキュメント基準コミット**: `0c6315b` (2026-06-24、タグ v2.4.0 付近)

## 何をするものか

wasmCloud は WASI 0.2 / 0.3 コンポーネントモデルでビルドされた WebAssembly コンポーネントを動かす。コンポーネントは必要な capability を WIT インターフェース (標準 capability は `wasi:*`、プロジェクト固有は `wasmcloud:*`) で宣言し、ホストがそれをインスタンス化時にプラグインとして供給する。コンポーネント本体はベンダー SDK やトランスポートの詳細を持たない。

基準コミットでは、リポジトリは `wash` (The Wasm Shell) を中心に構成される。`wash` はスキャフォールド・ビルド・inspect・実行を担う単一の CLI だ。README の冒頭も `# wash - The Wasm Shell` (`README.md:1`) で始まる。Cargo workspace のメンバーは 3 つ: `wash` CLI、`wash-runtime` 組み込みランタイム、ベンチマーク用クレート。Go 製の Kubernetes operator と HTTP gateway が `runtime-operator/` と `runtime-gateway/` に併設されている。

v2 設計の要点は、1 つのランタイムが 2 つのフロントエンドを支えること。ローカルでは `wash dev` がホットリロード付きでランタイムを駆動する。本番では Kubernetes operator が同じランタイムを gRPC で駆動する。エントリポイントより下のコードは同一だ。

## いつ使うか

- ビジネスロジックを polyglot な WebAssembly コンポーネントとして書き、capability (HTTP・key-value・blob・messaging・config) は SDK リンクではなくプラットフォームに注入させたいとき。
- 同じコンポーネントを開発時はラップトップ、本番は Kubernetes で、ホスト結線を書き直さずに動かしたいとき。
- 外向き通信のゼロトラストな既定が欲しいとき。egress は allowlist を設定しない限り拒否される (`crates/wash-runtime/src/types.rs:92`)。
- 成熟した実績のあるコントロールプレーンが今すぐ必要なら不向き。v2 ランタイムは最近のリライトであり ([歴史](./history) 参照)、公開された採用事例の多くは PoC 段階だ。
- 汎用のコンテナランタイムではない。動かすのは Wasm コンポーネントであって OCI コンテナイメージではない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [wasmCloud/wasmCloud (GitHub)](https://github.com/wasmCloud/wasmCloud)
2. [wash - The Wasm Shell (README)](https://github.com/wasmCloud/wasmCloud/blob/main/README.md)
3. [CNCF welcomes wasmCloud to the CNCF Incubator](https://www.cncf.io/blog/2024/11/12/cncf-welcomes-wasmcloud-to-the-cncf-incubator/)
4. [wasmCloud (CNCF projects)](https://www.cncf.io/projects/wasmcloud/)
5. [wasmCloud 1.0 Brings the WebAssembly Component Model to Enterprise (Cosmonic)](https://blog.cosmonic.com/engineering/wasmcloud-1-brings-components-to-enterprise/)
6. [Cosmonic Componentizes wasmCloud Ecosystem](https://cosmonic.com/blog/industry/cosmonic-componentizes-wasmcloud-ecosystem)
7. [wasmCloud Operator: Open Source Wasm on K8s (Cosmonic)](https://blog.cosmonic.com/engineering/wasmcloud-operator-is-here/)
8. [WebAssembly Adoption Grows across Telco, Manufacturing, Tech](https://wasmcloud.com/blog/2024-10-22-webassembly-adoption-telco-manufacturing-tech/)
9. [First look: wasmCloud and Cosmonic (InfoWorld)](https://www.infoworld.com/article/2338269/first-look-wasmcloud-and-cosmonic.html)
10. [Actors in the Cloud with wasmCloud (b-nova)](https://b-nova.com/en/home/content/actors-in-the-cloud-with-wasmcloud/)
