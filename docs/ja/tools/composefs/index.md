# composefs

> メタデータだけを保存し、ファイル内容は外部のコンテンツアドレスストアから共有する、読み取り専用のマウント可能ファイルシステム。fs-verity による封印はオプション。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Sandbox
- **言語**: C (C11)
- **ライセンス**: GPL-2.0-only OR Apache-2.0
- **リポジトリ**: [containers/composefs](https://github.com/containers/composefs)
- **ドキュメント基準コミット**: `298edd6` (2026-06-12, v1.0.8 以降の main)

## 何をするものか

composefs は、メインライン Linux カーネルに既に載っている 3 つの機能から、マウント可能なファイルシステムツリーを組み立てる。overlayfs (lower の上に upper を重ねるスタッキングファイルシステム)、EROFS (Enhanced Read-Only File System、コンパクトな読み取り専用のオンディスク形式)、fs-verity (ファイル内容を Merkle ツリーのダイジェストと照合するカーネル機構) の 3 つだ。中核となる発想は、composefs 自身は永続データを一切持たないこと。メタデータ (名前、パーミッション、タイムスタンプ、ディレクトリ構造) だけを保持する EROFS イメージを書き出す一方、実際の中身のある通常ファイルはコンテンツアドレスのバッキングストアに別途置かれる (`src/README.md:14-49`)。

各メタデータ inode は、実ファイルを指す overlayfs 拡張属性を持つ。`trusted.overlay.redirect` がバッキングストア内の位置を、`trusted.overlay.metacopy` がファイルの fs-verity ダイジェストを表す (`src/README.md:45-49`, `src/README.md:78-87`)。マウント時に EROFS イメージが overlay の lower 層となり、overlayfs がこれらの属性を通じて各ファイルを解決する。

内容がコンテンツアドレスされているため、メタデータが異なる (タイムスタンプや所有者が違う) が内容が同一の 2 つのイメージは、同じバッキングファイルを参照する。そのファイルはディスク上でも、そのイメージを使う全マウントのページキャッシュ上でも共有される (`src/README.md:70-77`)。プロジェクトが狙うのは、バージョン管理された不変の実行可能ツリー、すなわちコンテナイメージと起動可能なホストシステムだ。

## いつ使うか

- 同一のファイル内容を大量に共有する不変のファイルシステムツリー (コンテナイメージ、OS イメージ) を数多く配布し、その内容をディスクとページキャッシュに 1 度だけ保存・キャッシュしたいとき。
- ルートファイルシステムの実行時整合性が必要で、使用時に overlayfs が各ファイルの fs-verity ダイジェストを検証してほしいとき。加えてメタデータイメージ自体を封印するオプションも欲しいとき。
- bootc、OSTree、containers/storage の上に構築するとき。これらは既に composefs をバッキング形式として統合している。
- 向かないのは、書き込み可能な汎用ファイルシステムが必要なとき。composefs イメージは読み取り専用のメタデータであり、書き込みは別の overlay upper 層に属す。
- overlayfs、EROFS、(検証には) fs-verity をサポートしないカーネルでは向かない。composefs は独立したドライバではなく、これらの機能の合成だからだ。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [containers/composefs README](https://github.com/containers/composefs)
2. [GitHub REST API: repos/containers/composefs](https://api.github.com/repos/containers/composefs)
3. [composefs CNCF project page](https://www.cncf.io/projects/composefs/)
4. [Sandbox application issue #311](https://github.com/cncf/sandbox/issues/311)
5. [Composefs: an opportunistically sharing verified image filesystem (LWN)](https://lwn.net/Articles/919931/)
6. [A decision on composefs (LWN)](https://lwn.net/Articles/933616/)
7. [Announcing composefs 1.0](https://blogs.gnome.org/alexl/2023/09/26/announcing-composefs-1-0/)
8. [Composefs state of the union](https://blogs.gnome.org/alexl/2023/07/11/composefs-state-of-the-union/)
9. [Using Composefs in OSTree](https://blogs.gnome.org/alexl/2022/06/02/using-composefs-in-ostree/)
10. [Red Hat Developers Announce Work On New "Composefs" File-System (Phoronix)](https://www.phoronix.com/news/Composefs)
11. [ostree composefs tracking issue #2867](https://github.com/ostreedev/ostree/issues/2867)
12. [composefs-rs (Rust bindings)](https://github.com/containers/composefs-rs)
