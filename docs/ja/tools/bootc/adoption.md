# 採用事例・エコシステム

## 誰が使っているか

リポジトリは `ADOPTERS.md` を維持しており、直接採用と ostree 経由の間接採用に分かれている。下表はそのうち直接採用として記録されているものだけを挙げ、各々はそのファイルが指す Web サイトを出典とする。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Red Hat | Image Based Linux。RHEL 新規イメージは bootc 経由 | [ADOPTERS.md:10](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| HeliumOS | atomic なデスクトップ OS | [ADOPTERS.md:11](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| AlmaLinux (Atomic SIG) | atomic なデスクトップ/ワークステーション respin | [ADOPTERS.md:12](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| Caligra (Workbench) | 知的作業を加速する OS | [ADOPTERS.md:13](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| CIQ | Rocky Linux from CIQ、Image Based Linux の各バリアント | [ADOPTERS.md:14](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |
| Universal Blue (Aurora/Bazzite/Bluefin) | 信頼性と柔軟性を両立した Linux デスクトップイメージ | [ADOPTERS.md:15](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md) |

`ADOPTERS.md` は ostree 経由の間接採用 (Endless、Fedora Project の atomic desktops、Apertis、Playtron GameOS、Fyra Labs) も挙げ、これらすべてが今日 bootc を直接使っているわけではないと注記している。これらのユーザを引き継ぐことはプロジェクトの掲げるゴールだ (`ADOPTERS.md:23-24`)。

## 採用のシグナル

2026-06-26 にリポジトリで観測した値: スター約 2,134、fork 204、コントリビュータ約 94。基準コミット時点の最新リリースは v1.16.2 で、workspace バージョンは 1.16.2 に pin されている (`crates/lib/Cargo.toml:9`)。プロジェクトは 2025-01-21 に CNCF Sandbox 受諾 (CNCF プロジェクトページ)。リリースは頻繁で、README は CLI と API を stable とみなし in-place upgrade を保証すると記す (`README.md:22-23`)。

## エコシステム

- composefs: 兄弟の Red Hat プロジェクトで、同じバッチで CNCF Sandbox に申請され、bootc のバッキングストアとして使われる (`crates/lib/src/bootc_composefs/`)。
- bootupd: `bootc install` が呼び出してブートローダをセットアップする外部のブートローダ管理ツール (`docs/src/bootc-install.md`)。
- イメージビルダ: `podman`・`buildah`・`docker` による標準の `Containerfile`/`Dockerfile` ビルド、加えて Anaconda や bootc-image-builder などの外部インストーラ (`docs/src/bootc-install.md`)。
- ostree と rpm-ostree: bootc が後継を目指す前身。

## 代替候補

| 代替 | 違い |
| --- | --- |
| rpm-ostree | ベースコミットに RPM をレイヤするハイブリッドな image+package モデル。bootc は OS 全体を 1 つの OCI イメージとして扱い、その後継と位置づけられる。 |
| ostree (libostree) | bootc が今も上に構築する低レベルのバージョン管理ファイルシステムエンジン。bootc はその上に OCI ネイティブで宣言的なインターフェースを足す。 |
| パッケージマネージャ (apt/dnf、transactional-update/snapper) | 可変ルート上でのパッケージ単位の更新。bootc はレジストリイメージから `/usr` 全体をアトミックに置換し、ロールバックスロットを持つ。 |
| NixOS | 同じくイメージ的でアトミックだが、独自のストアと言語を使う。bootc は既存の OCI/Docker エコシステムとの互換性を優先する。 |

すでにコンテナを配送していて、ホスト OS も同じパイプラインに乗せ、レジストリのタグ駆動で更新したいなら bootc を選ぶ。稼働システムをパッケージ単位で書き換える必要があるなら従来のパッケージマネージャを、OCI 互換より宣言的ストアモデルを取りたいなら NixOS を選ぶ。

## 出典

1. [bootc ADOPTERS.md (コミット a7f95e7)](https://github.com/bootc-dev/bootc/blob/a7f95e743aa54a2f966edc1a0417ef6d509df9af/ADOPTERS.md)
2. [bootc CNCF プロジェクトページ](https://www.cncf.io/projects/bootc/)
3. [coreos/rpm-ostree](https://github.com/coreos/rpm-ostree/)
4. [bootc-dev/bootc リポジトリ](https://github.com/bootc-dev/bootc)
