# 内部実装

> コミット `8e5a9d2` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `bpfman/src/lib.rs` | 中核操作: load、attach、detach、remove、DB 初期化 |
| `bpfman/src/types.rs` | `Program`、`Link`、`ProgramData`、`AttachInfo` 型 |
| `bpfman/src/multiprog/` | 複数プログラムが 1 つの XDP/TC フックを共有するためのディスパッチャ |
| `bpfman/src/bin/cli/` | `bpfman` CLI バイナリ |
| `bpfman-api/` | ライブラリをラップする `bpfman-rpc` gRPC サーバ |

## 中核データ構造

システムが回転するのは `bpfman/src/types.rs` の数個の型だ。プログラムの状態は構造体のフィールドではなく DB tree に置かれる。`ProgramData` は `sled::Tree` の薄いラッパだ (`bpfman/src/types.rs:1459`):

```text
pub struct ProgramData(pub sled::Tree);
```

name、location、global data、kernel info、map pin path といったメタ情報は、メモリ上のフィールドではなくキー文字列で tree に読み書きされる。DB tree が真実の源だ。

`Program` は対応するプログラム型の enum だ (`bpfman/src/types.rs:1268`)。`Xdp(XdpProgram)` や `Tc(TcProgram)` などのバリアントを持つ。各バリアントは具体型を保持し、例えば `XdpProgram` (`bpfman/src/types.rs:2367`) だ。アタッチ状態は別に保持される。`Link` がその enum で (`bpfman/src/types.rs:811`)、`LinkData` が自分の tree をラップする (`bpfman/src/types.rs:166`):

```text
pub struct LinkData(pub(crate) sled::Tree);
```

`ProgramData` (ロード済み) と `LinkData` (アタッチ済み) の分離は、v0.6.0 で load と attach が別操作に分かれたことを反映する。`AttachInfo` (`bpfman/src/types.rs:1334`) は型ごとのアタッチパラメータを運ぶ。XDP は priority、iface、proceed-on、ネットワーク名前空間を取り、kprobe は関数名、offset、container pid を取る。

## 追う価値のあるパス

非自明な中核はディスパッチャだ。カーネルは XDP/TC を 1 インターフェース 1 プログラムに制限するので、bpfman はそのスロットに自前のディスパッチャを置き、ユーザプログラムを拡張として差し込む。`Dispatcher` が種別を選ぶ (`bpfman/src/multiprog/mod.rs:23`):

```text
pub(crate) enum Dispatcher {
    Xdp(XdpDispatcher),
    Tc(TcDispatcher),
}
```

`XdpDispatcher` (`bpfman/src/multiprog/xdp.rs:50`) は bytecode を registry から引かない。バイナリに埋め込んだ bytecode を使う (`bpfman/src/multiprog/xdp.rs:63`):

```text
        let program_bytes = XDP_DISPATCHER_BYTES;
```

スロット表は固定長だ。config は 10 要素の配列で組まれ、1 エントリが 1 スロットに対応する (`bpfman/src/multiprog/xdp.rs:65`):

```text
        let xdp_config = XdpDispatcherConfig::new(11, 0, [0; 10], [DEFAULT_PRIORITY; 10], [0; 10]);
```

ユーザの XDP/TC プログラムをロードするとき、`load_program` (`bpfman/src/lib.rs:1232`) はディスパッチャのファイルディスクリプタを複製し、ユーザプログラムをそれに対する拡張としてロードする。XDP バリアントでは拡張を `ext.load(fd, "compat_test")` でロードし (`bpfman/src/lib.rs:1263`)、BPF ファイルシステムへ `prog_{id}` として pin する (`bpfman/src/lib.rs:1268`)。ディスパッチャ自身の sled (組込みデータベース) のキーは `REVISION` (`bpfman/src/multiprog/xdp.rs:41`) や `NUM_EXTENSIONS` (`bpfman/src/multiprog/xdp.rs:45`) などの文字列定数で定義される。

## 読んで驚いた点

状態復元は常駐プロセスではなく DB に基づく。`init_database` (`bpfman/src/lib.rs:869`) が sled ストアを開き、ライブラリはプレフィックス付きの tree を走査して再起動後に状態を再構築する。`ProgramData` と `LinkData` は `/run/bpfman/db` 内の tree にすぎないので、復元はデーモンのメモリ再構築ではなく DB スキャンだ。

カーネルとのインターフェースは libbpf ではなく `aya` Rust crate を全面的に通す (`Cargo.toml` の `aya = 0.13.1`)。C ツールチェーンではなく純 Rust の eBPF ライブラリを選んだことは、実装上の細部というよりプロジェクトの定義的な特徴だ。

削除は attach の鏡像だ。`remove_program` (`bpfman/src/lib.rs:366`) が `remove_program_internal` (`bpfman/src/lib.rs:397`) へ委譲し、プログラムと map を削除する前にすべての link を detach する。単一 detach は `detach` (`bpfman/src/lib.rs:417`) を通り、link を自分の tree から復元して取り外す。
