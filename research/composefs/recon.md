# recon: composefs

調査メモ。出典は URL 付き。path:line は `research/composefs/src` の pinned commit 基準。

## 基本情報

- repo: containers/composefs
- pinned commit: `298edd6de47be362632daac3b2c9c8eb53c9545b` (2026-06-12) / 近いタグ: v1.0.8 (HEAD はこのタグより後の main 開発版。`git tag --contains` で HEAD を含むタグなし、`meson.build` の version は 1.0.8)
- 言語 / ビルド: C (c11)。ビルドは meson + ninja (`meson setup build && ninja -C build`)。`meson.build:1` で `project('composefs','c', version:'1.0.8')`
- ライセンス: `GPL-2.0-or-later OR Apache-2.0` が大半。EROFS 由来コードは `GPL-2.0-only OR Apache-2.0`、ごく一部 `LGPL-2.1-or-later`。実効的には全体を `GPL-2.0-only OR Apache-2.0` 扱い (`src/COPYING`)。GitHub API は `NOASSERTION` を返す (複数ライセンス混在のため)
- CNCF 成熟度: Sandbox (2025-01-21 受理)
- カテゴリ (この案件の分類): Storage & Database
- コード規模: `libcomposefs/` + `tools/` の C ソースで約 10,052 行 (`wc -l`)

用語 (1 行定義):

- EROFS (Enhanced Read-Only File System): Linux カーネル本体にある読み取り専用ファイルシステム。composefs はメタデータツリーをこの形式で直列化する。
- overlayfs: 下位 (lower) FS の上に重ねてマウントする Linux のスタック型 FS。composefs は EROFS イメージを lower として overlayfs を組む。
- fs-verity: ファイル内容の Merkle ツリーダイジェストをカーネルが検証する仕組み。改ざん検出に使う。

## 歴史の素材

- 発端: Red Hat の Alexander Larsson (Flatpak 作者) と Giuseppe Scrivano が podman のコンテナレイヤと OSTree (libostree) ルートの「ファイル単位共有 + 実行時検証」を狙って開発。初の公開はカーネル ML への RFC で 2022-11-28 (`<https://lwn.net/Articles/919931/>`, `<https://www.phoronix.com/news/Composefs>`)。リポジトリの初コミットは 2021-10 (GitHub API created_at 2021-10-07)。
- 当初は独立したカーネル FS モジュールとして提案。カーネルコミュニティが「新規 FS は不要、overlayfs + EROFS で実現可能」と判断し、既存カーネル機能 (overlayfs / EROFS / fs-verity) を組み合わせる設計へ転換 (`<https://lwn.net/Articles/933616/>`, Larsson "state of the union" `<https://blogs.gnome.org/alexl/2023/07/11/composefs-state-of-the-union/>`)。
- マイルストーン: Linux 6.6-rc1 で overlayfs の fs-verity サポートが入り、必要なカーネル変更が全て upstream 化。イメージフォーマットを確定し composefs 1.0 を 2023-09-26 リリース (`<https://blogs.gnome.org/alexl/2023/09/26/announcing-composefs-1-0/>`)。
- CNCF: 2025-01-21 に Sandbox 受理 (`<https://www.cncf.io/projects/composefs/>`, 申請 issue `<https://github.com/cncf/sandbox/issues/311>`)。bootc が composefs をバッキングストアに使うため両者は近い。

## アーキテクチャの素材

設計の核 (README `src/README.md:14-49`): composefs 自身は永続データを持たない。EROFS イメージは「メタデータツリー」だけを格納し、実体の非空レギュラーファイルは別の「バッキングストア」ディレクトリに content-addressed (内容ハッシュ名) で置く。EROFS inode には overlayfs 用の拡張属性 `trusted.overlay.redirect` (実ファイルの位置) と `trusted.overlay.metacopy` (fs-verity ダイジェスト) を埋め込み、マウント時に overlayfs がそれを辿る。

トップレベル構成:

- `libcomposefs/`: コアライブラリ (`liblcfs`)。
- `libcomposefs/lcfs-writer.c`: ノードツリー構築 (`lcfs_build`)、ツリー計算 (`lcfs_compute_tree`)、書き出しエントリ (`lcfs_write_to`)。
- `libcomposefs/lcfs-writer-erofs.c`: EROFS 直列化本体 (`lcfs_write_erofs_to`、inode レイアウト計算、書き出し)。約 57KB と最大。
- `libcomposefs/lcfs-mount.c`: マウントヘルパ (`lcfs_mount_fd`/`lcfs_mount_image`)。EROFS を loopback もしくは新 mount API で張り、その上に overlayfs を重ねる。
- `libcomposefs/lcfs-fsverity.c`: fs-verity ダイジェスト計算 (sha256 Merkle)。
- `libcomposefs/erofs_fs.h` / `erofs_fs_wrapper.h`: カーネル EROFS の on-disk 構造体 (super_block, inode_compact/extended など)。
- `libcomposefs/lcfs-erofs.h`: composefs 独自ヘッダ `lcfs_erofs_header_s` (magic `0xd078629a`)。
- `tools/mkcomposefs.c`: ディレクトリまたは dump からイメージ生成 (`main` は `tools/mkcomposefs.c:1476`)。
- `tools/mountcomposefs.c`: `mount.composefs` ヘルパ (`main` は `tools/mountcomposefs.c:100`、`lcfs_mount_fd` を呼ぶ `:255`)。
- `tools/composefs-info.c` / `composefs-dump.c`: イメージ検査・ダンプ。
- `tools/cfs-fuse.c`: FUSE 経由のマウント (fuse3 依存、optional)。
- `man/`, `tests/`, `hacking/`, `ci/`: ドキュメント・テスト・補助。

主エントリポイント: ライブラリは `lcfs_build` から `lcfs_write_to`、CLI は `mkcomposefs` と `mount.composefs`。

## 内部実装の素材

### 中核データ構造 (3-5)

1. `struct lcfs_node_s` — `libcomposefs/lcfs-internal.h:113`。ビルド時のメモリ上ツリーの 1 ノード (ファイル/ディレクトリ/シンボリックリンク)。`children`/`children_size` で子を持ち、`link_to` でハードリンク、`payload` がバッキングファイル名 or symlink ターゲット、`content` がインライン内容、`digest[LCFS_DIGEST_SIZE]` が fs-verity ダイジェスト。後半フィールド (`erofs_nid`, `erofs_isize`, `inode_num` 等) は直列化中に計算される。
2. `struct lcfs_inode_s` — `libcomposefs/lcfs-internal.h:102`。POSIX inode メタデータ (`st_mode`, `st_nlink`, `st_uid`, `st_gid`, `st_rdev`, `st_size`, `st_mtim_sec/nsec`)。`lcfs_node_s.inode` として埋め込まれる (`:141`)。
3. `struct lcfs_xattr_s` — `libcomposefs/lcfs-internal.h:93`。拡張属性 1 件 (`key`/`value`/`value_len`)。`erofs_shared_xattr_offset` で複数 inode 間の共有 xattr を表現 (重複削減)。
4. `struct lcfs_ctx_s` — `libcomposefs/lcfs-internal.h:158`。書き出しコンテキスト。`root`、BFS 用 `queue_end`、`num_inodes`、再現性のための `min_mtim_sec/nsec`、`has_acl`、出力コールバック `write_cb`/`bytes_written`、`fsverity_ctx`。EROFS 専用拡張は `lcfs_ctx_erofs_s` がこれを継承 (`lcfs-writer-erofs.c`)。
5. `struct lcfs_erofs_header_s` — `libcomposefs/lcfs-erofs.h:18`。イメージ先頭 (EROFS super の前) に置く composefs 独自ヘッダ。`magic`=`LCFS_EROFS_MAGIC` (`0xd078629a`, `:11`)、`version`、`flags`、`composefs_version`。マウント時の判定に使う (`lcfs-mount.c:653`)。

補助: 書き出しオプション `struct lcfs_write_options_s` — `libcomposefs/lcfs-writer.h:73` (`format`/`version`/`flags`/`digest_out` と write コールバック)。

### 代表操作の end-to-end トレース: `mkcomposefs <dir> <out.cfs>`

ディレクトリツリーを走査して EROFS メタデータイメージを生成する書き込みパス。

1. CLI パース後、ディレクトリモードでツリー構築。`tools/mkcomposefs.c:1692`。

   ```c
   root = lcfs_build(AT_FDCWD, src_path, buildflag_copy, &failed_path);
   ```

   このとき `LCFS_BUILD_COMPUTE_DIGEST`/`LCFS_BUILD_BY_DIGEST` を落とし `LCFS_BUILD_NO_INLINE` を付ける (`:1688-1690`)。ダイジェストとインライン化は後段でスレッド並列化するため。

2. `lcfs_build` がディレクトリを再帰走査。`libcomposefs/lcfs-writer.c:1507`。各エントリを `lcfs_load_node_from_file` で `lcfs_node_s` 化し (`:1588`)、ディレクトリなら自分を再帰呼び出し (`:1575`)、`lcfs_node_add_child` で親に接続 (`:1596`)。`readdir` ループは `:1542`。

3. ダイジェスト計算とバッキングストア充填 (任意)。`compute_digest` (`:1699`) と `--digest-store` 指定時の `fill_store` (`:1702-1703`)。ここで内容ファイルが content-addressed にコピーされる。

4. 書き出し起動。`tools/mkcomposefs.c:1714-1718` で `options.format = LCFS_FORMAT_EROFS` をセットし `lcfs_write_to(root, &options)`。

5. `lcfs_write_to` がフォーマット分岐。`libcomposefs/lcfs-writer.c:389`。バージョン検証後 `lcfs_new_ctx` で `lcfs_ctx_s` を作り、EROFS なら `lcfs_write_erofs_to(ctx)` を呼ぶ (`:419-420`)。終了後 `digest_out` 指定時は fs-verity ダイジェストを取り出す (`:432-435`)。

6. `lcfs_write_erofs_to` が直列化本体。`libcomposefs/lcfs-writer-erofs.c:1385`。順に次を行う。

   - `lcfs_clone_root(ctx)` で入力ツリーを複製 (`:1403`)。入力 `lcfs_node_s` を破壊せず EROFS 用の改変を別ツリーに行うため。
   - `rewrite_tree_for_erofs` で overlayfs 用 xattr (redirect/metacopy 等) 付与など (`:1410`)。
   - `lcfs_compute_tree(ctx, root)` で BFS により inode 番号採番・nlink 補正・xattr 正準ソート・最小 mtime 算出 (`:1414`、実体は `lcfs-writer.c:176`、キュー伸長は `:253-254`)。
   - `compute_erofs_shared_xattrs` / `compute_erofs_inodes` で共有 xattr と各 inode の on-disk サイズ/NID を確定 (`:1418`, `:1422`、`compute_erofs_inodes` は `:635`)。
   - composefs ヘッダ書き込み (`:1431`) のあと `EROFS_SUPER_OFFSET` までパディング (`:1435`)、EROFS superblock 構築 (`meta_blkaddr`/`root_nid`/`xattr_blkaddr`/`blocks` を設定、`:1442-1463`)、superblock 書き込み (`:1470`)。
   - `write_erofs_inodes(ctx)` で inode 本体を出力 (`:1476`、実体 `:1045`、各 inode は `write_erofs_inode_data` `:822`)。続いて共有 xattr、ブロック整列、データブロックを書く。

7. 出力ファイルを閉じて完了 (`tools/mkcomposefs.c:1727-1730`)。

### マウント側 (対の操作)

`mount.composefs <image> -o basedir=<store> <mnt>` は `lcfs_mount_fd` 経由で `lcfs_mount` (`lcfs-mount.c:635`) に入り、ヘッダ magic を確認 (`:653`) して `lcfs_mount_erofs_ovl` (`:573`) へ。EROFS を `/proc/self/fd/N` 経由で新 mount API でマウントし、`ENOTBLK` なら `setup_loopback` (`:228`) で loop デバイス経由にフォールバック (`:603-609`)。その上に overlayfs を `lcfs_mount_ovl` (新 API)、失敗時は `lcfs_mount_ovl_legacy` で重ねる (`:623-625`)。basedir/objdirs が overlay の lowerdir として連結される (`:286-293`)。

### 非自明な設計判断

「データを一切持たない」点が最大の特徴。EROFS は純メタデータで、実ファイルは外部の content-addressed バッキングストアに 1 回だけ置かれ、overlayfs の `trusted.overlay.redirect` (`lcfs-internal.h:50`) で参照される。これにより、メタデータ (権限・タイムスタンプ・パス) が異なっても内容が同一なら複数イメージ間でディスクと page cache の双方を共有できる (`src/README.md:70-77`)。さらに `trusted.overlay.metacopy` (`lcfs-internal.h:48`) に fs-verity ダイジェストを格納し、内容ファイルの改ざんを overlayfs が利用時検証する。イメージ自体にも fs-verity をかけ、期待ダイジェストをマウントオプションやカーネルコマンドラインで渡すことで、メタデータまで含めた完全なシールが可能 (`src/README.md:78-95`)。これは「新規カーネル FS を足さず、既存 overlayfs + EROFS + fs-verity の合成で実現する」という歴史的転換の帰結でもある。

補足の非自明点: 直列化は `lcfs_clone_root` で必ず入力ツリーを複製してから EROFS 改変を行う (`lcfs-writer-erofs.c:1403`)。再現性のため `min_mtim` を集約し EROFS superblock の `build_time` に使う (`lcfs-writer.c:225-230` のあと `lcfs-writer-erofs.c:1444`)。

## 採用事例の素材

- 出典付きの named adopter は composefs 単体の ADOPTERS ファイルとしては見当たらない (リポジトリ直下に ADOPTERS なし)。誇張せず GitHub シグナルで示す。
- 統合・依存関係としては bootc が composefs をバッキングストアに使う (CNCF/Larsson の記述、`<https://www.cncf.io/projects/composefs/>`)。OSTree (libostree) が composefs バックエンドを実装 (`<https://blogs.gnome.org/alexl/2022/06/02/using-composefs-in-ostree/>`、追跡 issue `<https://github.com/ostreedev/ostree/issues/2867>`)。containers/storage (podman 等) が overlay ドライバで mkcomposefs を呼ぶコードを持つ (`src/README.md:182-185`)。
- GitHub シグナル (参照日 2026-06-26、GitHub REST API `repos/containers/composefs`): stars 661、forks 55、watchers(subscribers) 25、open issues 30。最多コントリビュータは `alexlarsson` (609 commits、API `contributors`)。CNCF プロジェクトページの devstats 表示は stars 166・contributors 213・contributing orgs 96 (集計基準が異なるため GitHub API 値と乖離、`<https://www.cncf.io/projects/composefs/>`)。

## 代替・エコシステム

- エコシステム: overlayfs / EROFS / fs-verity (Linux カーネル機能) の上に成立。Rust バインディングは `composefs-rs` (`<https://github.com/containers/composefs-rs>`)、Go は containers/storage 内のラッパ (`src/README.md:174-185`)。bootc・OSTree・podman/containers-storage が利用側。
- 代替と本質的差:
  - tar + overlayfs (docker/podman の従来レイヤ展開): 同一レイヤ単位でしか共有できない。composefs は content-addressed なのでメタデータが違ってもファイル内容単位で共有でき、page cache も共有 (`src/README.md:97-118`)。
  - dm-verity + ディスクイメージ: 強固な検証は得られるがストレージ二重化・パーティション管理・更新困難という欠点。composefs は「ファイルの柔軟性」を保ちつつ同等の検証を狙う (`src/README.md:20-33`)。
  - 素の OSTree ハードリンクチェックアウト: 実行時にチェックアウトディレクトリの改ざんを防げない。composefs イメージ + fs-verity で実行時検証を付与 (`src/README.md:120-140`)。
  - squashfs / 通常の EROFS イメージ単体: データを内包するため共有・重複排除が効かない。composefs はメタデータと実体を分離する点が決定的に違う。
