# 歴史

## 起源

composefs は Red Hat から生まれ、Alexander Larsson (Flatpak の作者) と Giuseppe Scrivano が牽引した。目標は、既存の 2 つのシステム、すなわち podman が使うコンテナレイヤと、起動可能ホスト向けに libostree (OSTree) が使うオブジェクトストアに、ファイル単位の共有と実行時検証をもたらすことだった。GitHub 上のリポジトリは 2021-10-07 に作成された ([source 2](https://api.github.com/repos/containers/composefs))。最初の公開提案は 2022-11-28 のカーネルメーリングリストへの RFC で、LWN が「機会的に共有する検証済みイメージファイルシステム」として、Phoronix も取り上げた ([source 5](https://lwn.net/Articles/919931/), [source 10](https://www.phoronix.com/news/Composefs))。

当初の RFC は composefs を独立した読み取り専用のカーネルファイルシステムモジュールとして提案していた。カーネルコミュニティはこれに反対した。新しいファイルシステムではなく、すでに存在する overlayfs・EROFS・fs-verity の機能を組み合わせれば同じ結果が得られる、と。composefs はその合成設計へ方針転換した ([source 6](https://lwn.net/Articles/933616/), [source 8](https://blogs.gnome.org/alexl/2023/07/11/composefs-state-of-the-union/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | GitHub にリポジトリ作成 (2021-10-07) ([source 2](https://api.github.com/repos/containers/composefs))。 |
| 2022 | 独立した composefs ファイルシステムを求める最初の公開カーネル RFC (2022-11-28) ([source 5](https://lwn.net/Articles/919931/))。 |
| 2023 | overlayfs + EROFS + fs-verity の合成へ転換。必要な overlayfs の fs-verity サポートが Linux 6.6-rc1 に入り、composefs 1.0 が 2023-09-26 に出荷 ([source 6](https://lwn.net/Articles/933616/), [source 7](https://blogs.gnome.org/alexl/2023/09/26/announcing-composefs-1-0/))。 |
| 2025 | 2025-01-21 に CNCF Sandbox プロジェクトとして受理 ([source 3](https://www.cncf.io/projects/composefs/), [source 4](https://github.com/cncf/sandbox/issues/311))。 |

## どう進化したか

決定的な転換は、独立ファイルシステム方式を捨てたことだった。メンテナがカーネルコミュニティの判断を受け入れると、作業は 2 か所に移った。欠けていたピース (overlayfs の fs-verity サポート) を上流にマージすることと、composefs 側でオンディスクのイメージ形式を安定させることだ。overlayfs の fs-verity サポートが Linux 6.6-rc1 に入ったことで、composefs が必要とするカーネル変更はすべて上流に揃い、プロジェクトはイメージ形式を凍結して 1.0 を切った ([source 7](https://blogs.gnome.org/alexl/2023/09/26/announcing-composefs-1-0/))。

初期の探索は OSTree 統合の記事に見える。ファイルを通常のディレクトリに checkout する代わりに、OSTree オブジェクトストアを指す composefs イメージをマウントする、と説明していた ([source 9](https://blogs.gnome.org/alexl/2022/06/02/using-composefs-in-ostree/)、追跡は [source 11](https://github.com/ostreedev/ostree/issues/2867))。

## 現在地

composefs は 2025-01-21 時点で CNCF Sandbox プロジェクトだ ([source 3](https://www.cncf.io/projects/composefs/))。ここでドキュメント化したコミット (`298edd6`, 2026-06-12) では `meson.build` のバージョンが `1.0.8` (`src/meson.build:4`) であり、対象コミットはそのタグの後の `main` にある。コードベースは焦点を絞った C ライブラリ (`liblcfs`) と一握りのコマンドラインツールで、Alexander Larsson が依然として最多コントリビュータだ (GitHub contributors API によれば 609 commits、[source 2](https://api.github.com/repos/containers/composefs))。掲げる方向性は、汎用ファイルシステムへ育つことではなく、コンテナと起動可能ホストシステムのバッキング形式として機能することだ。
