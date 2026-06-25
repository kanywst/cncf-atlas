# recon: Flatcar Container Linux

調査メモ。実装は `flatcar/scripts`(SDK ビルド/イメージ合成スクリプト)を読む。アンブレラの `flatcar/Flatcar` はドキュメント/issue tracker なので、コードの deep-dive はこちらが正。

## 基本情報

- repo: `flatcar/scripts`(プロジェクトの主実装。`flatcar/Flatcar` は docs/governance/issue 集約のアンブレラ)
- pinned commit: `d2c217cb741debc9becda0bda86347319f17a65c`(branch `main`, 2026-06-23 commit)
- 近いタグ: shallow clone のため `git describe` 不可。直近の公開リリースは `stable-4593.2.3`(2026-06-16)。tree 内 `sdk_container/.repo/manifests/version.txt` は `FLATCAR_VERSION=4734.0.0+nightly-20260617-2100`
- 言語: Shell(`build_image`, `build_library/*.sh`)中心 + Python(`build_library/disk_util` 1135 行, `gen_tmpfiles.py` ほか)
- ビルド: Gentoo/Portage ベース。SDK コンテナ内で `emerge` してバイナリ pkg を rootfs に展開 → GPT イメージに焼く。エントリは `./run_sdk_container ./build_packages` → `./build_image`
- ライセンス: `scripts` repo は BSD-3-Clause(LICENSE 冒頭 "Copyright (c) 2006-2013 The Chromium OS Authors" + CoreOS。ChromeOS ビルドシステム由来)。アンブレラ `flatcar/Flatcar` は Apache-2.0。2 リポでライセンスが違う点に注意
- CNCF 成熟度: Incubating(2024-08-02 受理 / 2024-10-29 公表。CNCF 初の OS ディストリ)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Runtime(指定どおり verbatim)
- main entrypoint: `build_image`(`src/build_image:12` で `common.sh` を読み chroot 内前提。`src/build_image:189` で `create_prod_image` 呼び出し)

## 歴史の素材

- 2013: CoreOS がコンテナ専用ディストリ Container Linux を提唱(read-only root, 自動更新, A/B)。出典: HomeLab / DEV 比較記事(sources 7,8)
- 2018-01: Red Hat が CoreOS を買収。Container Linux の将来不透明化
- 2018: Kinvolk(ベルリン, 2015 設立)が CoreOS Container Linux の drop-in fork として Flatcar を立ち上げ。出典: kinvolk/flatcar blog(sources 9)
- 2020-05-26: CoreOS Container Linux EOL。Flatcar が事実上の継続先に。出典: flatcar.org blog(sources 10)
- 2021-04-29: Microsoft が Kinvolk を買収。Flatcar は Microsoft 配下のコミュニティプロジェクトに。出典: Microsoft Azure blog / GeekWire(sources 11)
- 2024-08-02 受理 / 2024-10-29 公表: CNCF Incubating 入り。提案は `cncf/toc` PR #991。出典: CNCF blog(sources 2,3)

## アーキテクチャの素材

トップレベル構成(`src/` 直下):

- `build_image`(エントリ): prod イメージ / dev container / sysext を生成。`src/build_image:108-116` で `build_library/*.sh` を順序依存で source
- `build_library/`: 実体。`build_image_util.sh`(`start_image` / `emerge_to_image` / `finish_image`)、`prod_image_util.sh`(`create_prod_image`)、`disk_util`(Python, GPT/verity/mount)、`disk_layout.json`(パーティション定義)、`vm_image_util.sh`(各クラウド向け VM 変換)
- `sdk_container/src/third_party/`: ebuild の置き場。`coreos-overlay`(Flatcar 独自/大幅改変 ebuild)と `portage-stable`(上流 Gentoo の subset、改変原則禁止)。README:31-44
- `run_sdk_container` / `build_sdk_container_image` / `bootstrap_sdk_container`: SDK コンテナの起動・生成・bootstrap ラッパー
- `ci-automation/`: CI 用ステージ stub

代表オペレーションの end-to-end トレース(prod イメージ生成):

1. `build_image:189` → `create_prod_image`(`build_library/prod_image_util.sh:58`)
2. `prod_image_util.sh:92` → `start_image`(`build_image_util.sh:494`)。`disk_util format` で GPT 作成(`build_image_util.sh:509`)→ `disk_util mount --writable_verity` で /usr を rw マウント(`build_image_util.sh:514-515`)→ 最初に `sys-apps/baselayout` だけ emerge して土台を作る(`build_image_util.sh:519`)
3. `prod_image_util.sh:95-97`: `set_image_profile prod` でプロファイル切替 → `emerge_to_image` で base pkg(`coreos-base/coreos`)を rootfs へ。`emerge_to_image`(`build_image_util.sh:126-141`)は `sudo -E ROOT=<rootfs> FEATURES="-ebuild-locks -merge-wait" emerge --usepkgonly --binpkg-respect-use=y`。ソースからでなく事前ビルド済バイナリ pkg のみ使う(`--usepkgonly`)
4. `prod_image_util.sh:106-113`: `sysext_prod_builder` で containerd / docker を systemd-sysext(squashfs)として合成。base_sysexts の仕様文字列は `build_image:42`(`name|pkg&pkg,...`)
5. `prod_image_util.sh:116-123`: SBOM(`write_sbom`)/ ライセンス / パッケージリストを出力
6. `prod_image_util.sh:183` → `finish_image`(`build_image_util.sh:532`)。kernel を /boot へコピー(`build_image_util.sh:568-571`)、systemd-sysusers で user を /usr へ vendoring(`build_image_util.sh:583-590`)、最後に verity 化(後述)
7. `build_image:212-221`: `version.txt` 書き出し → `image_to_vm.sh` で各ターゲット VM へ

## 内部実装の素材

中核データ構造:

1. `build_library/disk_layout.json`: パーティションレイアウト定義。`layouts.base` に USR-A(part3)/ USR-B(part4)の A/B 二重化、ROOT-C(state)、OEM、EFI-SYSTEM を定義。USR-A は `"fs_type":"btrfs","fs_compression":"zstd","mount":"/usr","features":["prioritize","verity"]`(`disk_layout.json:25-37`)。比較記事は ext4 と書くが現コードは btrfs+zstd。コードが正
2. `disk_util` の `partitions` dict(`LoadPartitionConfig`, `disk_util:28-`): JSON をロードし `valid_layout_keys`(`disk_util:39-46`)で検証、`part['bytes']=blocks*block_size`、`fs_blocks`、`fs_bytes`(`disk_util:135-138`)を計算注入。verity/format/mount の全 subcommand がこの dict を回す
3. `version.txt` マニフェスト(`sdk_container/.repo/manifests/version.txt`): `FLATCAR_VERSION` / `FLATCAR_VERSION_ID` / `FLATCAR_BUILD_ID` / `FLATCAR_SDK_VERSION`。`MAJOR.MINOR.PATCH+BUILD_ID` 形式。`set_version`(`src/set_version:18` の `FILE=~/trunk/.repo/manifests/version.txt`)が binhost から最新 nightly を解決して更新。ビルド全コンテキストで `FLATCAR_BUILD_ID` を export 統一(`build_image:19`、Flatcar issue #2041 対策)
4. ebuild overlay 二層(`coreos-overlay` vs `portage-stable`): パッケージの source of truth。`portage-stable` は上流 Gentoo の subset で改変原則禁止、`coreos-overlay` が Flatcar 改変分。README:31-44
5. base_sysexts 仕様文字列(`build_image:42`): `containerd-flatcar|app-containers/containerd,docker-flatcar|...&...`。コンテナランタイムを OS 本体でなく systemd-sysext として分離合成する宣言

非自明な設計判断(1 つ): dm-verity root hash の「カーネル画像への埋め込み」。`finish_image` で /usr を umount 後 `disk_util verity`(`build_image_util.sh:779-781`)が `veritysetup format --hash=sha256`(`disk_util:802-807`)で root hash を算出。その 64 hex を **カーネル画像の固定オフセット**(amd64=64, arm64=512; `build_image_util.sh:560-561`)に `dd ... seek=${verity_offset} count=64`(`build_image_util.sh:788-790`)で直接書き込む。改変版 GRUB がこの位置から hash を読み出して cmdline に付与する(コメント `build_image_util.sh:783-787`)。別途 keystore を持たず、署名済みカーネルに /usr の完全性ハッシュを物理的に縛りつける方式。Secure Boot 署名(`do_sbsign`, `build_image_util.sh:796`)が hash ごとカーネルを覆うので、/usr 改竄はブート時 verity で検出される。

更新機構(コード外, 出典付き): A/B の inactive USR partition に新イメージを書き、reboot で切替、失敗時は自動ロールバック。配信は Omaha プロトコル互換の update server(Nebraska)。CNCF blog(sources 2)が "validated images / atomic / automatically reverts" と明記。

ビルド前提: `assert_inside_chroot`(`build_image:22`)。loop device で GPT を切るため SDK コンテナは `--privileged -v /dev:/dev` が必須(README:87-93)。

## 採用事例の素材

`flatcar/Flatcar` の `ADOPTERS.md` より(自己申告 + 公開言及。出典 sources 6):

- Adobe: "over 18,000 nodes" の K8s fleet を複数クラウド + 自社 DC 22 リージョンで
- 1&1 Mail & Media (GMX, WEB.DE, mail.com): >40M ユーザ向けの on-prem bare-metal K8s の基盤 OS
- DeepL: on-prem K8s(CI/CD ～ GPU ワークロード)
- Equinix Metal: bare metal cloud control plane の OS(ケーススタディ link あり)
- Finleap Connect: 12 production cluster / 300+ node(規制業界の cloud-native スタック)
- AT&T(medium 記事)、Atsign、Digital Science(Dimensions.ai)、Genesis Cloud(GPU public cloud)も記載

捏造なし。すべて ADOPTERS.md の実記載で、連絡先まで載るため信頼度は高い。

## 代替・エコシステム

隣接(コンテナ最適化イミュータブル OS):

- Fedora CoreOS: 同じ CoreOS 系譜。Fedora 追従で更新が速い。RHCOS(OpenShift)上流。Flatcar は保守的更新で稼働中コンテナを壊さない方針(sources 7,8)
- Bottlerocket(AWS): EKS 特化。SSH 既定無効、署名 kernel module のみ。AWS 全振りなら強い
- Talos(Sidero Labs, 2019): スクラッチ設計。shell/SSH 無し、squashFS で format レベル read-only、talosctl API 管理。最も immutable が強いが運用流儀が変わる
- Flatcar の差別化(出典 sources 7,8 + コード): マルチクラウド + bare-metal を一貫サポート、Ignition による宣言的プロビジョニング、SSH/Docker 互換を残す debug 容易性、LTS チャネル、Cluster API 統合。CNCF Incubating で「ポータブルでクラウド中立な default」へ収束との評

統合先: Ignition(初回ブート構成)、containerd(同梱ランタイム、Docker から移行中)、etcd、Cluster API(K8s ノード自動プロビジョニング)、systemd-sysext(機能拡張)、Nebraska(更新サーバ)。

ecosystem 規模: `flatcar/scripts` stars 84 / forks 94 / contributors 228(2026-06-24, GitHub API pagination last page)。アンブレラ `flatcar/Flatcar` stars 1197 / contributors 27(同日)。実装が多リポ分散のため star はアンブレラに集中。

## install / 最小動作セットアップ

利用者向け(出典: README + CNCF blog):

- 既存イメージ取得: 各クラウドの公式 image(AWS/Azure/GCP)か QEMU/bare-metal 用 raw image を `flatcar.org` から。Ignition の `config.json`(YAML を transpile)で初回ブート構成を宣言
- 自前ビルド(scripts repo): `git clone https://github.com/flatcar/scripts.git` → `./run_sdk_container -t`(SDK コンテナ起動、release tag に対応するイメージを pull)→ コンテナ内 `./build_packages --board=amd64-usr` → `./build_image --board=amd64-usr prod` → `./image_to_vm.sh --from=... --board=amd64-usr`。イメージビルドは loop device 用に `--privileged -v /dev:/dev` 必須(README:87-93)
