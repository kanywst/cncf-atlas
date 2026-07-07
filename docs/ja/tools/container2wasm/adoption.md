# 採用事例・エコシステム

## 誰が使っているか

container2wasm は実験的で、CNCF Sandbox 段階にある。ADOPTERS ファイルは無く、出典を示せる本番採用組織も無い。名指しできる唯一の下流は vscode-container-wasm で、ブラウザ上の VSCode (たとえば `github.dev`) の中でコンテナを動かす拡張だ。これを記録しているのは container2wasm を作る NTT 自身なので、独立した本番採用というよりは第一者の下流である。

| プロジェクト | ユースケース | 出典 |
| --- | --- | --- |
| vscode-container-wasm | ブラウザ VSCode 内で container2wasm をエンジンにコンテナを動かす | [nttlabs/Medium](https://medium.com/nttlabs/vscode-container-wasm-57d17dda7caa) |

出典が支える以上のことは採用について読み取らないこと。上記を除けば、採用は名指しの本番ユーザではなく GitHub のシグナルで示すのが妥当だ。

## 採用のシグナル

GitHub CLI による 2026-06-26 の実測。

- Stars: 2,713
- Forks: 145
- コントリビュータ (GitHub contributors API): およそ 9 人。実質はひとりのメンテナが主導
- 最新リリース: v0.8.4 (2026-03-16)。v0.1.0 以来 24 番目のリリース

CNCF プロジェクトページははるかに大きい「436 contributors / 175 contributing organizations」という値を集計しているが、これは CNCF 独自の広域メトリクスで、GitHub の実測コントリビュータ数より桁違いに大きい。よってここでは GitHub 実測値を用いる。2025 年 1 月の CNCF Sandbox 受理自体は成熟度のシグナルだが、Sandbox は CNCF の最も初期の段階である。

## エコシステム

container2wasm はコンテナ世界と Wasm 世界のあいだに位置し、両方のツールに依存する。出力は WASI ランタイム (wasmtime・WasmEdge・wamr・wasmer・wazero) で動く。ビルドには Docker Buildx と BuildKit が必要で、複数言語のツールチェインを引き込む。エミュレータをコンパイルする wasi-sdk と Emscripten、事前起動する wizer、ファイルシステムを梱包する wasi-vfs だ。エミュレータ自体は第三者製で、x86_64 は Bochs、riscv64 は TinyEMU、`--to-js` のブラウザ経路は Emscripten でコンパイルした QEMU を使う。

## 代替候補

本質的な差は「何を Wasm に移すか」だ。container2wasm は CPU を移し、その中で無改変の Linux コンテナを動かす。下記の Wasm ネイティブなランタイムはアプリを移す。すでに Wasm にコンパイル済みのプログラムを動かすので、はるかに速いが、ワークロードが最初から Wasm を対象にしている必要がある。

| 代替 | 違い |
| --- | --- |
| runwasi / containerd-shim-wasm (CNCF) | コンテナランタイムを通して Wasm モジュールを動かす。Wasm ネイティブなアプリを前提とする。container2wasm は Wasm 向けに作られていない既存の Linux コンテナを動かす。 |
| Kuasar / Spin (SpinKube) | WasmEdge や Spin で Wasm アプリを動かす。やはり Wasm ネイティブ。CPU エミュレーションが無いので高速だが、アプリは Wasm モジュールでなければならない。 |
| WebVM / v86 | ブラウザの x86 エミュレータで Linux を動かす。エミュレーションの発想は近いが、container2wasm の出力を形づくる OCI イメージ → wasm のパイプライン・WASI ランタイム対応・wizer 事前起動が無い。 |

## 出典

1. ["vscode-container-wasm" (nttlabs/Medium)](https://medium.com/nttlabs/vscode-container-wasm-57d17dda7caa), 参照 2026-06-26。
2. [container2wasm README](https://github.com/container2wasm/container2wasm/blob/main/README.md), 参照 2026-06-26。
3. [CNCF プロジェクトページ: container2wasm](https://www.cncf.io/projects/container2wasm/), 参照 2026-06-26。
4. [container2wasm/container2wasm](https://github.com/container2wasm/container2wasm) に対する GitHub CLI 実測, 参照 2026-06-26。
