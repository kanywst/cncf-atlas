# 内部実装

> コミット `298edd6` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `src/libcomposefs/lcfs-writer.c` | インメモリノードツリーの構築、ツリー計算、書き込みのディスパッチ |
| `src/libcomposefs/lcfs-writer-erofs.c` | ツリーを EROFS イメージにシリアライズ (最大のソースファイル) |
| `src/libcomposefs/lcfs-mount.c` | EROFS イメージのマウントと overlayfs の重ね合わせ |
| `src/libcomposefs/lcfs-fsverity.c` | sha256 fs-verity Merkle ダイジェストの計算 |
| `src/libcomposefs/lcfs-internal.h` | インメモリ構造体: node、inode、xattr、書き込みコンテキスト |
| `src/libcomposefs/lcfs-erofs.h` | composefs イメージヘッダと magic |
| `src/tools/mkcomposefs.c` | ディレクトリまたは dump からイメージを作る CLI |
| `src/tools/mountcomposefs.c` | `mount.composefs` ヘルパ |

## 中核データ構造

`struct lcfs_node_s` はインメモリ構築ツリーの 1 ノードで、ファイル・ディレクトリ・シンボリックリンクのいずれかを表す (`src/libcomposefs/lcfs-internal.h:113`)。子を `children` と `children_size` で、ハードリンクを `link_to` で、バッキングファイル名またはシンボリックリンク先を `payload` で、インライン内容を `content` で、fs-verity ダイジェストを `digest` で保持する (`src/libcomposefs/lcfs-internal.h:118`, `:123`, `:127`, `:129`, `:139`)。後半のフィールド (`erofs_nid`, `erofs_isize`, `inode_num`) はシリアライズ中に埋められる (`src/libcomposefs/lcfs-internal.h:146`, `:152`, `:153`)。

`struct lcfs_inode_s` は POSIX の inode メタデータ (`st_mode`, `st_nlink`, `st_uid`, `st_gid`, `st_rdev`, `st_size`, `st_mtim_sec`/`st_mtim_nsec`) で、各ノードに `inode` として埋め込まれる (`src/libcomposefs/lcfs-internal.h:102`, 埋め込みは `src/libcomposefs/lcfs-internal.h:141`)。

`struct lcfs_xattr_s` は単一の拡張属性で、複数 inode 間で共有して重複を減らす場合を除き、`erofs_shared_xattr_offset` は `-1` に設定される (`src/libcomposefs/lcfs-internal.h:93`, `:99`)。

`struct lcfs_ctx_s` は書き込みコンテキスト。root、BFS キュー末尾 `queue_end`、`num_inodes`、再現性フィールド `min_mtim_sec`/`min_mtim_nsec`、`has_acl`、そして出力コールバック `write_cb` と `bytes_written` を持つ (`src/libcomposefs/lcfs-internal.h:158`)。EROFS シリアライザはこれを自身の拡張版 `lcfs_ctx_erofs_s` にキャストする。

`struct lcfs_erofs_header_s` は EROFS スーパーブロックの前に書かれる composefs ヘッダ (`src/libcomposefs/lcfs-erofs.h:18`):

```c
struct lcfs_erofs_header_s {
    uint32_t magic;
    uint32_t version;
    uint32_t flags;
    uint32_t composefs_version;
    uint32_t unused[4];
} __attribute__((__packed__));
```

magic は `LCFS_EROFS_MAGIC` で、`0xd078629aU` と定義される (`src/libcomposefs/lcfs-erofs.h:12`)。mount のパスは何をするより先にこのヘッダを読み、magic を照合する (`src/libcomposefs/lcfs-mount.c:653`)。

## 追う価値のあるパス

`lcfs_write_erofs_to` はノードツリーがイメージになる場所だ (`src/libcomposefs/lcfs-writer-erofs.c:1385`)。オンディスク形式向けに magic と version をリトルエンディアンに変換しつつ、ヘッダをその場で初期化する:

```c
struct lcfs_erofs_header_s header = {
    .magic = lcfs_u32_to_file(((uint32_t)LCFS_EROFS_MAGIC)),
    .version = lcfs_u32_to_file(((uint32_t)LCFS_EROFS_VERSION)),
    .composefs_version = lcfs_u32_to_file(ctx->options->version),
};
```

続いて入力ツリーを clone し、overlayfs 向けに書き換え、ツリーを計算する (`src/libcomposefs/lcfs-writer-erofs.c:1403`, `:1410`, `:1414`)。共有 xattr と inode レイアウトを計算した後 (`src/libcomposefs/lcfs-writer-erofs.c:1418`, `:1422`)、ヘッダを書き、`EROFS_SUPER_OFFSET` までパディングし、スーパーブロックのフィールドを埋め、inode を書く:

```text
lcfs_write(header)                 // :1431
lcfs_write_pad to EROFS_SUPER_OFFSET  // :1435
set superblock meta_blkaddr/root_nid/xattr_blkaddr/blocks  // :1448-1463
lcfs_write(superblock)             // :1470
write_erofs_inodes(ctx)            // :1476
```

`write_erofs_inodes` はツリーを走査し、各 inode の本体を `write_erofs_inode_data` を通じて書く (`src/libcomposefs/lcfs-writer-erofs.c:1045`, inode ごとは `src/libcomposefs/lcfs-writer-erofs.c:822`)。`lcfs_write_to` に戻り、形式固有の書き込みが返ると、呼び出し側が要求していればイメージ全体の fs-verity ダイジェストが取り出される (`src/libcomposefs/lcfs-writer.c:432`)。

## 読んで驚いた点

`lcfs_compute_tree` は 1 回の幅優先パスで、無関係な複数の仕事を同時にこなす (`src/libcomposefs/lcfs-writer.c:176`)。同じループの中で、ディレクトリのリンク数を `2 + サブディレクトリ数` に修正し (`src/libcomposefs/lcfs-writer.c:199`)、ディレクトリのハードリンクを拒否し (`src/libcomposefs/lcfs-writer.c:212`)、各ノードの xattr を `qsort` で正規順にソートし (`src/libcomposefs/lcfs-writer.c:221`)、ツリー全体の最小 mtime を追跡する (`src/libcomposefs/lcfs-writer.c:225`)。キューはツリー自身で、走査が進むにつれ子が `next` ポインタを通じて追加される (`src/libcomposefs/lcfs-writer.c:253`)。

mount のパスは、カーネルが EROFS イメージをどう受け入れるかについて防御的だ。`lcfs_mount_erofs_ovl` はまず `/proc/self/fd/N` 経由のマウントを試み、それが `ENOTBLK` を返したときだけループデバイスを用意して再試行する (`src/libcomposefs/lcfs-mount.c:599`, `:603`)。上に重ねる overlay については、新しい API が `ENOSYS` を返すとレガシーの mount API (`lcfs_mount_ovl_legacy`) にフォールバックする。新 API はエスケープしたディレクトリ名を渡せないためだ (`src/libcomposefs/lcfs-mount.c:625`)。lower ディレクトリの文字列は、イメージのマウントポイントと各オブジェクトディレクトリをエスケープし、data-lower モードが有効かどうかで `::` または `:` で連結して構築される (`src/libcomposefs/lcfs-mount.c:286`)。
