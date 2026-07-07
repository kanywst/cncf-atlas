# 採用事例・エコシステム

## 誰が使っているか

composefs はリポジトリに `ADOPTERS` ファイルを持たないので、引用できる名前付きエンドユーザ組織の一覧は無い。捏造せずに誠実に描くと、採用は統合レベルにある。composefs は名前付き企業が公開ケーススタディ付きで直接デプロイするより、他プロジェクトのバッキング形式として消費される。統合しているプロジェクトを出典付きで以下に挙げる。

| プロジェクト | ユースケース | 出典 |
| --- | --- | --- |
| bootc | 起動可能なコンテナホストシステムのバッキングストアとして composefs を使う | [source 3](https://www.cncf.io/projects/composefs/) |
| OSTree (libostree) | ハードリンクの checkout ではなく、OSTree オブジェクトストアを指す composefs イメージをマウントする | [source 9](https://blogs.gnome.org/alexl/2022/06/02/using-composefs-in-ostree/), [source 11](https://github.com/ostreedev/ostree/issues/2867) |
| containers/storage | podman などから `mkcomposefs` を呼ぶ overlay ドライバコード | [source 1](https://github.com/containers/composefs) |

## 採用のシグナル

2026-06-26 に `repos/containers/composefs` の GitHub REST API から観測 ([source 2](https://api.github.com/repos/containers/composefs)):

| シグナル | 値 |
| --- | --- |
| Stars | 661 |
| Forks | 55 |
| Watchers (subscribers) | 25 |
| Open issues | 30 |
| リポジトリ作成 | 2021-10-07 |
| 最多コントリビュータ | `alexlarsson` (609 commits) |

CNCF のプロジェクトページは、自前の DevStats 集計から異なる集計値 (stars 166、contributors 213、contributing organisations 96) を報告している。集計の基準が素の GitHub API と違うためだ ([source 3](https://www.cncf.io/projects/composefs/))。composefs は 2025-01-21 に CNCF Sandbox に受理された ([source 4](https://github.com/cncf/sandbox/issues/311))。

## エコシステム

composefs は自身が所有しない 3 つの Linux カーネル機能、すなわち overlayfs、EROFS、fs-verity の上に載る。その上には消費側がいる。起動可能ホスト向けの bootc、コンテンツアドレスの OS ツリー向けの OSTree、コンテナレイヤ向けの containers/storage だ ([source 1](https://github.com/containers/composefs), [source 3](https://www.cncf.io/projects/composefs/))。言語バインディングが到達範囲を広げる。`composefs-rs` は Rust ラッパーと高レベルなリポジトリ機能を提供し、containers/storage は `mkcomposefs` をラップする Go コードを持つ (`src/README.md:174-185`, [source 12](https://github.com/containers/composefs-rs))。

## 代替候補

| 代替 | 違い |
| --- | --- |
| tar + overlayfs (従来の docker/podman レイヤ) | ストレージ共有はレイヤ丸ごとの粒度でしか効かない。composefs はコンテンツアドレスなので、メタデータが異なるイメージ間で共有されるファイルが個別に dedup され、ページキャッシュも共有される (`src/README.md:97-118`)。 |
| ディスクイメージ上の dm-verity | 強い検証を与えるが、ストレージを二重化し、パーティション管理を要し、差分更新が難しい。composefs は同等の検証を狙いつつファイル単位の柔軟性を保つ (`src/README.md:20-33`)。 |
| 素の OSTree ハードリンク checkout | 実行時に checkout ディレクトリが改竄されるのを防げない。composefs イメージ + fs-verity は実行時検証を加える (`src/README.md:120-140`)。 |
| squashfs や素の EROFS イメージ | ファイルデータをイメージに埋め込むので、イメージ間で内容を共有・dedup できない。composefs はメタデータとデータを分離する。これが決定的な差だ。 |
