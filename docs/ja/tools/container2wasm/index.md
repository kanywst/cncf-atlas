# container2wasm

> container2wasm (c2w) は、コンテナイメージを WASI ランタイムやブラウザで動く WebAssembly イメージへ変換する。アプリの再コンパイルは不要。

- **カテゴリ**: Runtime
- **CNCF 成熟度**: Sandbox
- **言語**: Go (ホスト CLI) と、エミュレータ (C/C++/Rust) をビルドするマルチステージ Dockerfile
- **ライセンス**: Apache-2.0 (生成される `.wasm` には LGPL-2.1・MIT ほかの第三者コードが混入する)
- **リポジトリ**: [container2wasm/container2wasm](https://github.com/container2wasm/container2wasm)
- **ドキュメント基準コミット**: `74662a2` (タグ v0.8.4 付近, 2026-06-15)

## 何をするものか

container2wasm は通常のコンテナイメージ (たとえば `ubuntu:22.04`) を受け取り、そのワークロードを wasmtime のような WebAssembly ランタイムやブラウザ上で動かす単一の `.wasm` ファイルを生成する。アプリを WebAssembly に再コンパイルするわけではない。代わりに CPU エミュレータを WebAssembly にコンパイルし、その中で本物の Linux カーネルを起動し、runc でコンテナを立ち上げる。アプリから見れば普通の Linux 上で動いているので、ソース変更は要らない。

この逆転が核心だ。多くの Wasm ツールはプログラムを Wasm ターゲット向けに書き直すことを求める。container2wasm はコンテナをそのままにして、CPU 自体を Wasm に移す。代償はエミュレーションのオーバーヘッドで、エミュレートされた CPU はネイティブより遅い。したがって推奨ターゲットは x86_64 と riscv64 であり、それ以外のアーキテクチャのイメージはゲスト内でさらにもう 1 段エミュレーションを重ねるため、いっそう遅くなる。

本プロジェクトは実験的で、CNCF Sandbox 段階にある。主な作者は NTT の Kohei Tokunaga (`ktock`) で、containerd・Stargz Snapshotter・nerdctl のメンテナでもある。ホスト側は薄い Go CLI にすぎず、実体の変換器はバイナリに埋め込まれた 1064 行の Dockerfile を BuildKit が実行するものだ (`embed.go:5-6`)。

## いつ使うか

- 実行時に Docker や Linux ホストへアクセスできない環境で、既存の Linux コンテナをブラウザや WASI ランタイム上で動かしたいとき (デモ・教育・サンドボックス実行)。
- Wasm ターゲット向けにビルドされていないソフトウェアを含め、コンテナを無改変で動かす必要があるとき。
- ワークロード・Linux カーネル・エミュレータをまとめて運ぶ、単一で可搬な `.wasm` 成果物がほしいとき。
- ネイティブ性能が必要なときには向かない。CPU エミュレーションは遅い。ワークロードを直接 Wasm にコンパイルできるなら、Wasm ネイティブなランタイム経路 (runwasi・WasmEdge・Spin) の方がはるかに速い。
- 配布前にライセンスの含意を確認すること。生成される `.wasm` には LGPL-2.1 ほかのライセンスのエミュレータコードが同梱される。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと変換の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [container2wasm README](https://github.com/container2wasm/container2wasm/blob/main/README.md), 参照 2026-06-26。
2. [Dockerfile (変換パイプライン)](https://github.com/container2wasm/container2wasm/blob/main/Dockerfile), 参照 2026-06-26。
3. [CNCF プロジェクトページ: container2wasm](https://www.cncf.io/projects/container2wasm/), 参照 2026-06-26。
4. [Kohei Tokunaga, "container2wasm Converter" (nttlabs/Medium)](https://medium.com/nttlabs/container2wasm-2dd90a18cc9a), 参照 2026-06-26。
5. [Pin コミット `74662a2`](https://github.com/container2wasm/container2wasm/commit/74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd), 参照 2026-06-26。
