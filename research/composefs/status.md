# status: composefs

- [x] recon 完了 @ commit `298edd6de47be362632daac3b2c9c8eb53c9545b`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo は containers/composefs。HEAD はタグなし (v1.0.8 より後の main)。書く際の version 表記は v1.0.8 系で。
- カテゴリは Storage & Database。コンテナ/OS イメージ向けの読み取り専用ファイルシステムで、本質はストレージ層 (メタデータと実体の分離、content-addressed バッキングストア)。
- 代表トレースは write パス (`mkcomposefs <dir> <out>`): `lcfs_build` から `lcfs_write_to` から `lcfs_write_erofs_to`。マウントは対の操作として `lcfs-mount.c` 参照。
- 非自明設計: 「データを持たない」EROFS メタデータ + overlayfs redirect/metacopy + fs-verity の合成。新規カーネル FS を入れず既存機能で実現した歴史的経緯とセットで書く。
- 採用事例: 単体の ADOPTERS なし。bootc / OSTree / containers-storage(podman) が利用側。named adopter を捏造しないこと。
- write 段で確認: GitHub stars は API 661 と CNCF devstats 166 で乖離。本文では「GitHub 661 (2026-06-26)」を主にし devstats は注記。
- C / meson ビルド。fuse は optional (fuse3 >= 3.10)。libcrypto 必須。
