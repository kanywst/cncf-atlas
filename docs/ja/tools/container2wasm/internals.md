# 内部実装

> コミット `74662a2` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/c2w` | 変換 CLI。`main` は `cmd/c2w/main.go:23`、`rootAction` は `cmd/c2w/main.go:94`。フラグを buildx 起動へ変換する。 |
| `cmd/create-spec` | ビルド時。OCI イメージを展開し OCI spec とブート設定を書き出す。`main` は `cmd/create-spec/main.go:34`。 |
| `cmd/init` | 実行時にエミュレート Linux 内で動く PID 1。マウント・spec パッチ・runc 起動。`doInit` は `cmd/init/main.go:39`。 |
| `cmd/c2w-net` | gvisor-tap-vsock を使うホスト側ユーザモードネットワークスタック (`cmd/c2w-net/main.go:15-17`)。 |
| `cmd/get-qemu-state` | QEMU スナップショット状態の取り出し補助。 |
| `embed.go` | `//go:embed` で 1064 行の Dockerfile を埋め込む (`embed.go:5-6`)。 |
| `config/{qemu,tinyemu,bochs}` | 各エミュレータの kernel config とテンプレ引数。 |
| `extras/c2w-net-proxy` | ブラウザ用の Wasm 内ネットワークプロキシ (`c2w-net-proxy.wasm`)。 |
| `extras/imagemounter` | 実行時に外部バンドルを 9p で渡す mounter (`imagemounter.wasm`)。 |

## 中核データ構造

ビルド時と実行時のあいだで状態を運ぶ型は `cmd/init/types/types.go` にある。

- **`BootConfig`** は `create-spec` がビルド時に書き、`init` が実行時に消費するブート設定。フィールドは `Mounts`・`Cmd`・`CmdPreRun`・`Container`・`PostMounts`・`Debug` を含む。
- **`ContainerInfo`** は runc が必要とするゲスト内パスを保持する。`BundlePath`・`ImageConfigPath`・`ImageRootfsPath`・`RuntimeConfigPath`・`ExternalBundle`。
- **`MountInfo`** は 9p・overlay・proc などの宣言的マウント記述で、並列・任意マウントを表す `Async`・`Optional` フラグを持つ。`mountAll` (`cmd/init/main.go:371`) が処理する。
- **`runtimeFlags`** (`cmd/init/main.go:411`) は、ホストが `info` ファイル経由で実行時に注入する値を保持する。`mounts`・`env`・`entrypoint`・`args`・`withNet`・`mac`・`bundle`。`info` ファイルは `m:`・`c:`・`e:`・`env:`・`n:`・`t:`・`b:` の接頭辞を持つ小さな行プロトコルを使う (`cmd/init/main.go:440-485`)。

埋め込み `Dockerfile` (`embed.go:6`、`var Dockerfile []byte`) は事実上 5 つ目のデータ構造だ。これが変換器であり、CLI はそれを buildx へ渡す薄皮にすぎない。

## 追う価値のあるパス

実行時の非自明な部分は、事前起動済みスナップショットがどう再開し、そのあとコンテナへ制御を渡すかだ。ビルドは wizer を使い、Linux が起動し終えた時点でエミュレータをスナップショットする。

```text
Dockerfile:313 (TinyEMU):
  wizer --allow-wasi --wasm-bulk-memory=true \
    -r _start=wizer.resume --mapdir /pack::/pack -o temu temu-org
```

`_start` が `wizer.resume` にリネームされるので、WASI ランタイムがモジュールを実行すると、コールドブートせずに起動済みイメージから再開する。既定は `OPTIMIZATION_MODE=wizer` (`Dockerfile:29`)、`native` を選ぶと実行のたびにカーネルをブートする。Bochs も同じ経路をとる (`Dockerfile:1029`)。`wasi-vfs pack` は `/pack` をモジュールに埋め込む (`Dockerfile:317`, `Dockerfile:1033`)。

ゲスト側では `init` がそのスナップショット境界と協調する。`doInit` (`cmd/init/main.go:39`) は `/oci/initconfig.json` を読み (`cmd/init/main.go:44`)、`wasi0` (rootfs) と `wasi1` (pack) を 9p で `/mnt` にマウントし (`cmd/init/main.go:88`)、ホストの `info` ファイルを `parseInfo` で解析し (`cmd/init/main.go:422`)、`patchSpec` で OCI spec に反映し (`cmd/init/main.go:490`)、`config.json` を書いて runc を `exec` する (`cmd/init/main.go:300-311`)。コンテナが終了すると `poweroff -f` を呼ぶ (`cmd/init/main.go:313`)。

## 読んで驚いた点

- **wizer のハンドシェイクが stdout に見える。** スナップショットが実行の途中で取られるため、`init` は wizer 境界で `==========` マーカーを stdout に出し、ホストの合図を待ってから続行する (`cmd/init/main.go:124-141`)。ブート/再開の継ぎ目は隠れたチャネルではなくコンソールストリームで調整される。
- **コンテナはフルカーネルと runc を動かす。** `.wasm` はアプリではない。それは Bochs か TinyEMU であり、本物の Linux を起動し、その Linux が runc を起動し、runc がコンテナを起動する。ワークロードの下には 3 層の「ランタイム」がある。
- **生成 `.wasm` は第三者ライセンスを抱える。** エミュレータとカーネルが出力にコンパイルされるため、container2wasm 自体は Apache-2.0 (`LICENSE:2-4`) でも、生成される `.wasm` には LGPL-2.1 (Bochs)・MIT (TinyEMU)・その他 (GRUB・BBL・Linux・tini・runc・binfmt) のコードが同梱される。README はこれを明記しており、生成 `.wasm` を再配布する者は考慮すべきだ。
- **module path は移らなかった。** リポジトリは `container2wasm/container2wasm` org へ移管されたが、Go module path は今も `github.com/ktock/container2wasm` のままだ (`go.mod:1`)。

## 出典

1. container2wasm ソース (コミット [`74662a2`](https://github.com/container2wasm/container2wasm/commit/74662a2160241e31bbc3b74c7a4f7cf6ea9cfedd)), 参照 2026-06-26。
2. [container2wasm README](https://github.com/container2wasm/container2wasm/blob/main/README.md) (第三者ライセンス), 参照 2026-06-26。
