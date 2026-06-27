# 歴史

## 起源

bootc は、Red Hat の Colin Walters が主導してきたおよそ 15 年に及ぶ作業の最上層に位置する。系譜は OSTree (2011) から始まる。OSTree は、バージョン管理されたブート可能なファイルツリーをアトミックに更新するシステムで、Git ライクに管理するライブラリ (libostree) と CLI からなる。その libostree の上に rpm-ostree が乗り、ハイブリッドな image+package モデルを足す。ベースコミットに RPM をレイヤするモデルで、Fedora CoreOS / Silverblue / IoT を駆動している (LWN, [Article 979182](https://lwn.net/Articles/979182/))。

bootc を可能にした一歩は、ostree に OCI/Docker イメージを ostree commit の transport として扱わせたことだ。Fedora はこの「ostree native containers」機能を stable と宣言し、新しい専用インターフェースとして bootc を導入した。Fedora の各エディションを OCI 配送へ移行する計画も合わせて示されている (Fedora Project Wiki, [Changes/OstreeNativeContainerStable](https://fedoraproject.org/wiki/Changes/OstreeNativeContainerStable))。bootc の売りは、OS イメージ作成をアプリコンテナ作成と同じくらい簡単に、同じツールでできるようにすることである。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2011 | OSTree プロジェクト開始。bootc が今も使う基盤技術。 |
| 2022 | bootc リポジトリ作成 (GitHub の createdAt は 2022-11-30)。 |
| 2024 | DevConf.cz で bootable containers のキーノート。当時は `containers/bootc` 配下。 |
| 2025 | 2025-01-21 に CNCF Sandbox 受諾。RHEL 10 で新規イメージは bootc 経由に。 |
| 2026 | リリースは継続。基準コミット時点の最新タグは v1.16.2。 |

## どう進化したか

プロジェクトは rpm-ostree 内の研究的機能から、独立した CLI とライブラリへと移った。README が現状を示している。CLI と API は stable とみなされ、既存システムはすべて将来の変更を越えて in-place で upgrade できると約束されている (`README.md:22-23`)。バージョニングはセマンティックバージョニングに従い、1.2.0 リリースからこの運用を始めたとしている (`README.md:33-37`)。

第二の進化はストレージバックエンドだ。元来のバックエンドは ostree-container ストアである。コードベースは今や `crates/lib/src/bootc_composefs/` に composefs バックエンドを並行して持ち、ランタイムは各オペレーションの先頭で両者を切り替える。composefs は Red Hat の別プロジェクトで、bootc と同じバッチで CNCF Sandbox に申請された。

プロジェクトが CNCF に参加した際、GitHub の `containers` org から専用の `bootc-dev` org へ移管された。クレートの manifest は今も `repository` を `https://github.com/bootc-dev/bootc` に向けている (`crates/lib/Cargo.toml:6`)。

## 現在地

bootc は CNCF Sandbox プロジェクト (2025-01-21 受諾) で、主に Red Hat のエンジニアがメンテナンスしている。ガバナンスとメンテナの情報はリポジトリにある (`GOVERNANCE.md`、`MAINTAINERS.md`)。クレートは edition 2024 と最低 Rust 1.85.0 を pin し、最新の RHEL 9 に同梱されるものに近く保っている (`crates/lib/Cargo.toml:3,10-11`)。掲げる方向性は ostree の後継となり、その既存ユーザをシームレスに引き継ぐことである (`ADOPTERS.md:23-24`)。

## 出典

1. [Making containers bootable for fun and profit (LWN)](https://lwn.net/Articles/979182/)
2. [Changes/OstreeNativeContainerStable (Fedora Project Wiki)](https://fedoraproject.org/wiki/Changes/OstreeNativeContainerStable)
3. [bootc CNCF プロジェクトページ](https://www.cncf.io/projects/bootc/)
4. [bootc ソース (コミット a7f95e7)](https://github.com/bootc-dev/bootc/tree/a7f95e743aa54a2f966edc1a0417ef6d509df9af)
