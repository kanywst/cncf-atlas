# 内部実装

> コミット `d2c217c` のソースから読む。ここでの各主張はファイルと行を指す。

## コードマップ

| パス | 役割 |
| --- | --- |
| `src/build_image` | エントリ: 種別の解析、ヘルパの source、イメージビルダへの分岐。 |
| `src/build_library/prod_image_util.sh` | `create_prod_image`、プロダクションイメージのフロー。 |
| `src/build_library/build_image_util.sh` | `start_image`・`emerge_to_image`・`finish_image`、verity 注入。 |
| `src/build_library/disk_layout.json` | GPT パーティションテーブル: A/B `/usr`、state、OEM、EFI。 |
| `src/build_library/disk_util` | レイアウトに対し format・mount・verity を行う Python ツール。 |
| `src/sdk_container/src/third_party/` | `coreos-overlay` と `portage-stable` の ebuild。 |
| `src/sdk_container/.repo/manifests/version.txt` | バージョンマニフェスト。 |

## 中核データ構造

**パーティションレイアウト（`src/build_library/disk_layout.json`）。** `base` レイアウトがディスクを定義する。パーティション 3 が `USR-A`、4 が `USR-B` で、A/B ペアだ。`USR-A` は `btrfs` + `zstd` 圧縮で `/usr` にマウントされ、`prioritize` と `verity` 機能を持つ（`src/build_library/disk_layout.json:25-37`）。ここはコードが正で、古い比較記事ではない。現在の `/usr` ファイルシステムは btrfs+zstd だ。

**partitions dict（`src/build_library/disk_util`）。** `LoadPartitionConfig` が JSON を読み、`valid_layout_keys` で検証する（`src/build_library/disk_util:38-46`）。各パーティションについて派生サイズを計算し、`bytes`・`fs_blocks`・`fs_bytes` を dict に注入する（`src/build_library/disk_util:135-138`）。`format`・`mount`・`verity` の各サブコマンドはこの dict を回す。

**バージョンマニフェスト（`src/sdk_container/.repo/manifests/version.txt`）。** `FLATCAR_VERSION`・`FLATCAR_VERSION_ID`・`FLATCAR_BUILD_ID`・`FLATCAR_SDK_VERSION` を `MAJOR.MINOR.PATCH+BUILD_ID` 形式で持つ。`set_version` が binhost から最新 nightly を解決してこのファイルを書き換える（`src/set_version:11`）。コンテキスト間で build ID がずれないよう、`build_image` はビルド全体で単一の `FLATCAR_BUILD_ID` を export する（`src/build_image:19`、flatcar/Flatcar#2041 対策）。

## 追う価値のある経路

非自明なのは、`/usr` の完全性をブート時にどう強制するかだ。`/usr` を umount した後、`finish_image` が `disk_util verity` を実行し（`src/build_library/build_image_util.sh:779-781`）、パーティションに対し `veritysetup format --hash=sha256` を実行して得た 64 桁 hex の root hash をパースする（`src/build_library/disk_util:802-810`）。

その hash は keystore には保存されない。カーネルイメージの固定オフセットへ直接書き込まれる（`src/build_library/build_image_util.sh:788-790`）。

```bash
printf %s "$(cat ${BUILD_DIR}/${image_name%.bin}_verity.txt)" | \
    sudo dd of="${root_fs_dir}/boot/flatcar/vmlinuz-a" conv=notrunc \
    seek=${verity_offset} count=64 bs=1 status=none
```

オフセットはボード依存で、amd64 は 64、arm64 は 512 だ（`src/build_library/build_image_util.sh:559-561`）。改変版 GRUB がその位置から hash を読み出し、カーネルコマンドラインに付与する。インラインコメントがそれを説明する（`src/build_library/build_image_util.sh:783-787`）。

## 驚いた点

- **verity の root hash がカーネルに物理的に縛りつけられる。** 別途署名済みの hash を持つのではなく、Flatcar はカーネルイメージの未使用スロットへ 64 桁 hex の `/usr` root hash を埋め込む。Secure Boot 署名はその hash を含めてカーネルを覆うため（`src/build_library/build_image_util.sh:796`）、`/usr` の改竄はブート時に verity で検出される。
- **イメージへは何もコンパイルしない。** `emerge_to_image` は常に `--usepkgonly` を渡す（`src/build_library/build_image_util.sh:132-141`）。イメージの組み立ては純粋にバイナリパッケージの展開で、ソースビルドは別ステージで先に済む。
- **最初のパッケージは `baselayout` だけ。** `start_image` は他に先立ち、動作するファイルシステムを bootstrap するため `sys-apps/baselayout --nodeps --oneshot` だけを emerge し（`src/build_library/build_image_util.sh:519`）、`emerge_to_image` はそのケースで短絡する（`src/build_library/build_image_util.sh:143-144`）。
