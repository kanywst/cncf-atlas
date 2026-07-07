# recon: container2wasm

調査メモ。出典は URL 付き。`path:line` は `research/container2wasm/src` 配下の実ファイル基準。

## 基本情報

- repo: `container2wasm/container2wasm` (旧 `ktock/container2wasm`。Go module path は今も `github.com/ktock/container2wasm`、`go.mod:1`)
- pinned commit: `74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd` (2026-06-15) / 近いタグ: `v0.8.4` (`git describe` = `v0.8.4-38-g74662a2`)
- 言語 / ビルド: Go (host CLI) + 大規模マルチステージ Dockerfile (エミュレータの C/C++/Rust ビルド)。`make` で `c2w` と `c2w-net` を生成 (`Makefile:16`, `Makefile:19`)
- 主エントリポイント: `cmd/c2w/main.go:23` (`func main`) → `cmd/c2w/main.go:94` (`rootAction`)
- ライセンス: Apache-2.0 (`LICENSE:2-4` 確認済み)。**生成される .wasm には LGPL/GPL/MIT の第三者コードが混入** (Bochs = LGPL-2.1, TinyEMU = MIT, GRUB, BBL, Linux, tini, runc, binfmt)。README に明記
- CNCF 成熟度: Sandbox (2025-01-21 受理)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Runtime (CNCF も TAG Runtime に分類)

中核アイデアを一言で: コンテナを「Wasm にコンパイルし直す」のではなく、**CPU エミュレータ自体を Wasm にコンパイルし、その中で本物の Linux を起動して runc でコンテナを動かす**。アプリの再コンパイルは不要。

## 歴史の素材

- 作者は NTT の Kohei Tokunaga (`ktock`)。containerd / Stargz Snapshotter / nerdctl のメンテナでもある人物。リポジトリ初コミットは 2023-02 (GitHub `createdAt` 2023-02-15、CNCF は first commit 2023-02-28 と記載)。出典: <https://medium.com/nttlabs/container2wasm-2dd90a18cc9a>
- 当初は RISC-V (TinyEMU) のみ対応。TinyEMU は Fabrice Bellard 作の小型システムエミュレータ (<https://bellard.org/tinyemu/>)。container2wasm はパッチ版 `ktock/tinyemu-c2w` を使う
- v0.3.0 (2023-06-26 頃) で Bochs を使った x86_64 対応を追加。Bochs は LGPL の x86 インタプリタ型エミュレータ
- v0.4.0 (2023-08-03 頃) で host ディレクトリの guest へのマッピング (virtio-9p) を x86_64 / riscv 双方で利用可能に
- 直近 (v0.8.x) で `--to-js` 経路に QEMU Wasm を統合。x86_64/aarch64/riscv64 の JS 出力に使用 (`Dockerfile:861` 以降の `qemu-emscripten-dev-*` ステージ)
- 登壇歴: Cloud Native Wasm Day (KubeCon NA 2023)、Open Source Summit NA 2024、WasmCon 2024、FOSDEM 2024/2025。出典: <https://www.cncf.io/projects/container2wasm/>
- CNCF Sandbox 受理は 2025-01 の 13 プロジェクト一括受理の一つ。onboarding issue: <https://github.com/cncf/sandbox/issues/332>、提案 issue: <https://github.com/cncf/sandbox/issues/123>

## アーキテクチャの素材

トップレベル構成 (`find . -maxdepth 2 -type d`):

- `cmd/c2w` — 変換ドライバ CLI。実体は薄い。docker buildx を組み込み Dockerfile で回すだけ
- `cmd/c2w-net` — host 側ユーザモードネットワークスタック。WASI にソケットが無いのを `gvisor-tap-vsock` で橋渡し (`cmd/c2w-net/main.go:15-17`)
- `cmd/create-spec` — **ビルド時**に guest 内で動き、OCI イメージを rootfs に展開し OCI runtime spec / boot config を生成 (`cmd/create-spec/main.go:34`)
- `cmd/init` — **実行時**に emulated Linux 内で PID1 的に動く init。9p マウント・NW 設定・spec パッチ・runc 起動を担う (`cmd/init/main.go:39`)
- `cmd/get-qemu-state` — QEMU snapshot 状態取り出し補助
- `embed.go` — `//go:embed Dockerfile` で 1064 行の Dockerfile をバイナリに埋め込む (`embed.go:5-6`、package 名は `vendor`)
- `config/{qemu,tinyemu,bochs}` — 各エミュレータの kernel config とテンプレ引数
- `extras/c2w-net-proxy` — ブラウザ用に Wasm 内で動くネットワークプロキシ (`c2w-net-proxy.wasm`、`Makefile:22`)
- `extras/imagemounter` — 外部 bundle を実行時に 9p で渡す mounter (`imagemounter.wasm`)

レイヤ構造 (出典: README + nttlabs blog):

1. Builder: BuildKit が Dockerfile の変換手順を実行
2. Emulator: Bochs (x86_64) / TinyEMU (riscv64) を wasi-sdk で WASI wasm に、emscripten でブラウザ wasm にコンパイル。`--to-js` は QEMU
3. Guest OS: emulated CPU 上で Linux が起動、runc がコンテナを起動。非 x86_64/非 riscv64 のイメージは guest 内 binfmt + QEMU でさらにエミュレート (遅い)
4. Directory mapping: WASI filesystem API で host dir を見せ、emulator が virtio-9p で guest Linux にマウント
5. Packaging: wasi-vfs (WASI) / emscripten (browser) で依存を 1 ファイルに梱包。**wizer で kernel をビルド時に事前起動** (WASI のみ)
6. Networking: ブラウザは Fetch/WebSocket、WASI は `sock_*` API

## 内部実装の素材

### 代表 1 操作の end-to-end トレース: `c2w ubuntu:22.04 out.wasm`

1. `cmd/c2w/main.go:94` `rootAction`。出力先・arch を整理し `cmd/c2w/main.go:119` で `--builder` (既定 `docker`) を `exec.LookPath`。`cmd/c2w/main.go:124` で `docker buildx` の有無を試し、無ければ legacy へフォールバック。
2. `cmd/c2w/main.go:172` `prepareSourceImg` を呼ぶ。中身 (`cmd/c2w/main.go:319`) は `docker save` を起動 (`cmd/c2w/main.go:364`)、その tar を `archive.Apply` で tmpdir に展開 (`cmd/c2w/main.go:376`)。BuildKit がキャッシュより優先するよう全ファイルの mtime を更新 (`cmd/c2w/main.go:385`)。
3. `cmd/c2w/main.go:181` `build` へ。組み込み Dockerfile を temp ファイルに書き出し (`cmd/c2w/main.go:200` `f.Write(vendor.Dockerfile)`)、`buildxArgs` を組んで `cmd/c2w/main.go:249` で `docker buildx build ... --output type=local,dest=<dir>` を実行。`--target` 未指定なので Dockerfile 末尾の既定ステージが対象。
4. 既定ステージは `Dockerfile:1064` `FROM wasi-$TARGETARCH`。`TARGETARCH=amd64` (CLI 既定 `target-arch=amd64`) → `Dockerfile:1037` `wasi-amd64` = Bochs 経路。`riscv64` 等 → `Dockerfile:342` `wasi-riscv64` = TinyEMU 経路。
5. ビルド時、`bundle-dev` ステージ (`Dockerfile:93`) が `create-spec` をコンパイル・実行 (`Dockerfile:104`, `Dockerfile:121`)。`create-spec` (`cmd/create-spec/main.go:34`) は OCI イメージを `unpack` (`cmd/create-spec/main.go:85`) して rootfs を作り、`createSpec` (`cmd/create-spec/main.go:278`) で `spec.json` / `image.json` / `initconfig.json` を生成。これらが `/pack` に集約される。
6. エミュレータを wasi-sdk の clang でビルド (TinyEMU は `Dockerfile:302`、Bochs は `Dockerfile:1019`)。
7. **wizer で事前起動 (非自明な肝、後述)**: `Dockerfile:313` (TinyEMU) / `Dockerfile:1029` (Bochs) で `wizer ... -r _start=wizer.resume --mapdir /pack::/pack` を実行。
8. `wasi-vfs pack` で `/pack` (rootfs.bin など) を wasm に埋め込み単一ファイル化 (`Dockerfile:317` / `Dockerfile:1033`)、`OUTPUT_NAME` (既定 `out.wasm`) にリネーム (`Dockerfile:319`)。
9. 実行時 (`wasmtime out.wasm uname -a`): wasm = エミュレータ。emulated CPU 上で Linux が起動し `/sbin/init` = `cmd/init` が動く。`doInit` (`cmd/init/main.go:39`) が `/oci/initconfig.json` を読み (`cmd/init/main.go:44`)、9p で `wasi0`(rootfs)/`wasi1`(pack) を `/mnt` にマウント (`cmd/init/main.go:88`)。host から渡る `info` ファイルを `parseInfo` (`cmd/init/main.go:422`) で解析し runtime flags (引数・env・mount・NW・MAC) を得る。`patchSpec` (`cmd/init/main.go:490`) が OCI spec に反映し、`config.json` を書いて runc を `exec` (`cmd/init/main.go:300-311`)。終了で `poweroff -f` (`cmd/init/main.go:313`)。

### 中核データ構造 (3〜5)

- `BootConfig` (`cmd/init/types/types.go`): init がビルド時生成・実行時消費するブート設定。`Mounts`/`Cmd`/`CmdPreRun`/`Container`/`PostMounts`/`Debug`。
- `ContainerInfo` (`cmd/init/types/types.go`): `BundlePath`/`ImageConfigPath`/`ImageRootfsPath`/`RuntimeConfigPath`/`ExternalBundle`。runc が使う guest 内パス群。
- `MountInfo` (`cmd/init/types/types.go`): 9p/overlay/proc などの宣言的マウント記述。`Async`/`Optional` で並列・任意マウントを表現 (`cmd/init/main.go:371` `mountAll` が処理)。
- `runtimeFlags` (`cmd/init/main.go:411`): 実行時に host から `info` ファイル経由で動的注入される値 (`mounts`/`env`/`entrypoint`/`args`/`withNet`/`mac`/`bundle`)。`info` は `m:`/`c:`/`e:`/`env:`/`n:`/`t:`/`b:` の独自行プロトコル (`cmd/init/main.go:440-485`)。
- 埋め込み `Dockerfile` (`embed.go:6` `var Dockerfile []byte`): 実質これがコンバータ本体。CLI は引数を buildx に翻訳する薄皮。

### 非自明な設計判断: wizer による「事前起動済み」スナップショット

普通にやると wasm を起動するたびに Linux カーネルをコールドブートするので遅い。container2wasm は **ビルド時に** Bytecode Alliance の wizer (WebAssembly pre-initializer) でエミュレータ wasm を一度起動し、guest Linux が起動し終わった時点の **wasm linear memory 全体をスナップショット**して wasm モジュールに焼き込む。実行時は `_start` を `wizer.resume` にリネームしたエクスポート (`Dockerfile:313`: `wizer --allow-wasi --wasm-bulk-memory=true -r _start=wizer.resume --mapdir /pack::/pack -o temu temu-org`) で起動済み状態から再開するため、Linux のブートをスキップできる。既定の `OPTIMIZATION_MODE=wizer` (`Dockerfile:29`)。`native` を選ぶと毎回ブート。`init` 側は wizer スナップショット境界で host とハンドシェイクする仕掛けを持つ (`==========` マーカーを stdout に出して host の合図を待つ、`cmd/init/main.go:124-141`)。

### ネットワーク (補足)

WASI にはソケットが無いので、host で `c2w-net` を立てて `gvisor-tap-vsock` のユーザモード仮想ネットワークを提供 (`cmd/c2w-net/main.go:15-17`、gateway `192.168.127.1` / vm `192.168.127.3`、`cmd/c2w-net/main.go:21-23`)。ブラウザでは Wasm 内 `c2w-net-proxy.wasm` が Fetch/WebSocket を使う。

## 採用事例の素材

- 名指しできる下流: `vscode-container-wasm` (ブラウザの VSCode、例 `github.dev` でコンテナを動かす VSCode 拡張)。container2wasm を基盤に使う。README L362 + <https://medium.com/nttlabs/vscode-container-wasm-57d17dda7caa>
- それ以外に「本番採用組織」として citable な ADOPTERS ファイルや事例は見当たらない。CNCF Sandbox の experimental 段階。よって採用の定量は GitHub シグナルで示す。
- GitHub シグナル (2026-06-26 参照、`gh` 実測): Stars **2713**、Forks **145**、GitHub contributors API は **9** 人 (実質 ktock 中心の単独主導)。最新リリース **v0.8.4** (2026-03-16)、リリース総数 24、最古タグ v0.1.0。
- CNCF metrics ページは「436 contributors / 175 contributing orgs」と集計するが、これは CNCF 独自の広域メトリクス。GitHub 実測 (9) と桁が違うので、ドキュメントでは GitHub 実測値を主に使う。出典: <https://www.cncf.io/projects/container2wasm/>

## 代替・エコシステム

- **runwasi / containerd-shim-wasm** (CNCF): コンテナ「ランタイム」で Wasm モジュールを動かす。前提が逆。container2wasm は Linux コンテナを丸ごと Wasm に変換するので「Wasm 向けに書かれていない既存アプリ」が動く。runwasi は Wasm ネイティブなアプリ向け。
- **Kuasar / Spin (SpinKube)**: WasmEdge/Spin で Wasm アプリを動かす。やはり Wasm ネイティブ前提。
- **WebVM / v86 / copy.sh**: ブラウザ内 x86 エミュレータで Linux を動かす点は近いが、OCI イメージ → wasm の変換パイプラインや WASI ランタイム対応、wizer 事前起動という生成物の形が違う。
- **本質的差**: 「アプリを Wasm に移植する」のではなく「CPU を Wasm に移植し本物の Linux + runc を中で回す」。再コンパイル不要・OCI 互換・ブラウザ/WASI 両対応が差別化。代償は CPU エミュレーション由来の遅さ (x86_64/riscv64 推奨、他 arch はさらに遅い)。
- 統合先: WASI ランタイム (wasmtime, wamr, wasmer, wasmedge, wazero。README L16)、Docker Buildx/BuildKit (ビルド必須、README L169)、emscripten/wasi-sdk/wizer/wasi-vfs (ビルドツールチェーン)。

## getting-started の素材

最小手順 (README より、実行可能な形):

```bash
# 1. バイナリ取得 or ソースビルド
make
sudo make install

# 2. 変換 (Docker buildx が必要)
c2w ubuntu:22.04 out.wasm

# 3. WASI ランタイムで実行
wasmtime out.wasm uname -a
```

- riscv64 を狙うなら `c2w --target-arch=riscv64 riscv64/ubuntu:22.04 out.wasm` (README L34)。
- host dir マッピング: `wasmtime --mapdir /mnt/share::/tmp/share out.wasm cat /mnt/share/from-host` (README L52)。
- ブラウザ向け: `c2w --to-js alpine:3.20 /tmp/out-js/htdocs/` (README L136)。
