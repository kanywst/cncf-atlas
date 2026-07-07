# 歴史

## 起源

container2wasm は 2023 年初頭に NTT のエンジニア Kohei Tokunaga (`ktock`) が始めた。彼は containerd・Stargz Snapshotter・nerdctl のメンテナでもある。リポジトリの作成は 2023-02-15。nttlabs のブログ記事で述べられた発端の発想は、アプリを移植するのではなく CPU をエミュレートすることで、無改変のコンテナを WebAssembly 上で動かすことだった。初版は RISC-V のみを対象とし、Fabrice Bellard が書いた小型システムエミュレータ TinyEMU を使った。container2wasm はそのパッチ版フォーク `ktock/tinyemu-c2w` を使う。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2023 | リポジトリ作成 2023-02-15。v0.3.0 (2023 年半ば) で Bochs による x86_64 対応を追加。v0.4.0 で virtio-9p 経由のホストディレクトリマッピングを x86_64・riscv64 双方で利用可能に。 |
| 2024 | Cloud Native Wasm Day (KubeCon NA 2023)・Open Source Summit NA 2024・WasmCon 2024・FOSDEM 2024 で登壇。 |
| 2025 | 13 プロジェクト一括受理の一つとして 2025 年 1 月に CNCF Sandbox 受理。FOSDEM 2025 でブラウザ内 QEMU 実行を発表。 |
| 2026 | v0.8.x で `--to-js` 経路に QEMU Wasm を統合し、x86_64・aarch64・riscv64 のブラウザ出力に使用。最新リリースは v0.8.4 (2026-03-16)。 |

## どう進化したか

本プロジェクトは単一アーキテクチャの実験から、複数エミュレータを扱う変換器へと成長した。TinyEMU (MIT) が riscv64 を、Bochs (LGPL-2.1) が後から追加された x86_64 を担当し、`--to-js` のブラウザ経路はのちに Emscripten でコンパイルした QEMU を x86_64・aarch64・riscv64 に採用した。この作業は Dockerfile の `qemu-emscripten-dev-*` ステージとして現れる (`Dockerfile:861` 以降)。

ディレクトリマッピングは v0.4.0 で登場した。WASI ファイルシステム API がホストディレクトリを見せ、エミュレータがそれを virtio-9p でゲスト Linux にマウントする。本プロジェクトは 2025 年 1 月の受理枠で CNCF Sandbox に入った (onboarding issue cncf/sandbox#332、提案 cncf/sandbox#123)。canonical リポジトリはのちに `ktock/container2wasm` から `container2wasm/container2wasm` org へ移管されたが、Go module path は今も `github.com/ktock/container2wasm` のままだ (`go.mod:1`)。

## 現在地

container2wasm は CNCF Sandbox プロジェクトで、明示的に実験的である旨を README も CNCF プロジェクトページも記している。最新リリースは v0.8.4 (2026-03-16) で、v0.1.0 以来 24 番目のリリースだ。開発は事実上ひとりのメンテナが主導している。GitHub の contributors API はおよそ 9 人のコントリビュータを報告し、その中心は `ktock` である。掲げる方向性は QEMU Wasm によるブラウザ対応の拡大と、変換パイプラインの継続的な改良だ。

## 出典

1. [Kohei Tokunaga, "container2wasm Converter" (nttlabs/Medium)](https://medium.com/nttlabs/container2wasm-2dd90a18cc9a), 参照 2026-06-26。
2. [CNCF プロジェクトページ: container2wasm](https://www.cncf.io/projects/container2wasm/), 参照 2026-06-26。
3. [cncf/sandbox onboarding issue #332](https://github.com/cncf/sandbox/issues/332), 参照 2026-06-26。
4. [cncf/sandbox proposal issue #123](https://github.com/cncf/sandbox/issues/123), 参照 2026-06-26。
5. [TinyEMU (Fabrice Bellard)](https://bellard.org/tinyemu/), 参照 2026-06-26。
6. container2wasm ソース (コミット [`74662a2`](https://github.com/container2wasm/container2wasm/commit/74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd)), 参照 2026-06-26。
