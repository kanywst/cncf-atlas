# status: container2wasm

- [x] recon 完了 @ commit `74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd` (tag v0.8.4)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- カテゴリは **Runtime** で確定 (CNCF も TAG Runtime 分類)。
- canonical repo は `container2wasm/container2wasm` (旧 `ktock/container2wasm` から org 移管)。Go module path は `github.com/ktock/container2wasm` のまま。homepage デモは `ktock.github.io/container2wasm-demo`。
- write 時の肝: (1) 再コンパイルではなく CPU エミュレータを Wasm 化する逆転の発想、(2) wizer 事前起動スナップショット、(3) Bochs(x86_64)/TinyEMU(riscv64)/QEMU(--to-js) のエミュレータ使い分け、(4) WASI にソケットが無いので c2w-net が橋渡し。
- 採用組織は citable なものが `vscode-container-wasm` (NTT 自身の下流) のみ。本番採用は誇張しない。定量は GitHub 実測 (stars 2713 / forks 145 / contributors 9、2026-06-26) を主に。
- experimental 段階である旨を必ず添える (README / CNCF 双方が明記)。
- 第三者ライセンス注意: 生成 .wasm には LGPL-2.1 (Bochs) 等が混入。利用者向けに明記すべき非自明点。
- 保留確認: CNCF metrics の「436 contributors」は広域集計で GitHub 実測と桁違い。ドキュメントでは GitHub 実測を採用済み。
