# status: wasmCloud

- [x] recon 完了 @ commit `0c6315bae5723629e958faa1e30223f316bcd9a0` (近いタグ v2.4.0)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- カテゴリは Runtime 確定(指示どおり verbatim)。
- 最大の注意点: v2 でリポジトリが作り直されている。現行 `wasmCloud/wasmCloud` は `wash`(The Wasm Shell)+ `wash-runtime`(Wasmtime 組み込みランタイム)+ Go の `runtime-operator` / `runtime-gateway` + gRPC(`proto/wasmcloud/runtime/v2`)。古い NATS lattice / actor / wadm / capability provider の解説は概念史としては使えるが、現行コード構造とは別物。本文では「v1 概念史」と「v2 実装」を混ぜない。
- 代表操作トレースは `wash dev` のホットリロード経路(main.rs → dev.rs → Host::workload_start → engine.initialize_workload → resolve → execute_service)。本番は同経路を operator が gRPC で叩く。
- 採用事例は CNCF blog 記載の Adobe / Orange / MachineMetrics / TM Forum CSP / Akamai のみ。多くは PoC 段階なので本文でも PoC と明記。新たな本番事例の追加は要出典。
- 指標(2026-06-24): stars 2,356 / forks 248 / contributors 約 71。write 時に再取得して鮮度確認推奨。
- tagline: en「A CNCF runtime for running WebAssembly components anywhere, from local dev to Kubernetes」/ ja「ローカル開発から Kubernetes まで、WebAssembly コンポーネントをどこでも動かす CNCF ランタイム」。
