# sources: container2wasm

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は 2026-06-26。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | container2wasm (GitHub, 旧 ktock/container2wasm) | <https://github.com/container2wasm/container2wasm> | 2026-06-26 |
| 2 | repo | README (使い方・対応ランタイム・第三者ライセンス) | <https://github.com/container2wasm/container2wasm/blob/main/README.md> | 2026-06-26 |
| 3 | repo | Dockerfile (変換パイプライン本体) | <https://github.com/container2wasm/container2wasm/blob/main/Dockerfile> | 2026-06-26 |
| 4 | case-study | CNCF project page (Sandbox 受理日・登壇歴・metrics) | <https://www.cncf.io/projects/container2wasm/> | 2026-06-26 |
| 5 | proposal | cncf/sandbox onboarding issue #332 | <https://github.com/cncf/sandbox/issues/332> | 2026-06-26 |
| 6 | proposal | cncf/sandbox proposal issue #123 | <https://github.com/cncf/sandbox/issues/123> | 2026-06-26 |
| 7 | blog | Kohei Tokunaga, "container2wasm Converter" (nttlabs/Medium) | <https://medium.com/nttlabs/container2wasm-2dd90a18cc9a> | 2026-06-26 |
| 8 | blog | "vscode-container-wasm" (nttlabs/Medium、下流採用) | <https://medium.com/nttlabs/vscode-container-wasm-57d17dda7caa> | 2026-06-26 |
| 9 | talk | FOSDEM 2025 "Running QEMU Inside Browser" slides (NTT) | <https://archive.fosdem.org/2025/events/attachments/fosdem-2025-6290-running-qemu-inside-browser/slides/238760/slides_1dDtpcS.pdf> | 2026-06-26 |
| 10 | blog | Simon Willison notes on container2wasm | <https://simonwillison.net/2024/Jan/3/container2wasm/> | 2026-06-26 |
| 11 | ref | TinyEMU (Fabrice Bellard) | <https://bellard.org/tinyemu/> | 2026-06-26 |
| 12 | metrics | gh CLI 実測 (stars 2713 / forks 145 / contributors 9 / latest v0.8.4) | <https://github.com/container2wasm/container2wasm> | 2026-06-26 |

## ローカル一次情報 (コード anchor)

| 主題 | path:line |
| --- | --- |
| CLI エントリ | `cmd/c2w/main.go:23`, `cmd/c2w/main.go:94` |
| ソースイメージ docker save + 展開 | `cmd/c2w/main.go:319`, `cmd/c2w/main.go:364`, `cmd/c2w/main.go:376` |
| buildx 起動 | `cmd/c2w/main.go:200`, `cmd/c2w/main.go:249` |
| Dockerfile 埋め込み | `embed.go:5-6` |
| 既定出力ステージ | `Dockerfile:1064`, `Dockerfile:1037` (Bochs), `Dockerfile:342` (TinyEMU) |
| wizer 事前起動 | `Dockerfile:313`, `Dockerfile:1029`, `Dockerfile:29` |
| wasi-vfs pack | `Dockerfile:317`, `Dockerfile:1033`, `Dockerfile:319` |
| ビルド時 spec 生成 | `cmd/create-spec/main.go:34`, `cmd/create-spec/main.go:85`, `cmd/create-spec/main.go:278` |
| 実行時 init | `cmd/init/main.go:39`, `cmd/init/main.go:88`, `cmd/init/main.go:422`, `cmd/init/main.go:490`, `cmd/init/main.go:313` |
| データ構造 | `cmd/init/types/types.go`, `cmd/init/main.go:411` |
| ネットワーク | `cmd/c2w-net/main.go:15-17`, `cmd/c2w-net/main.go:21-23` |
| ライセンス | `LICENSE:2-4`, `go.mod:1` |
