# recon: bootc

調査メモ。OCI/Docker コンテナイメージをそのまま「起動可能なホスト OS」として配送し、トランザクショナルに in-place 更新する CLI/ライブラリ。ostree の後継として設計されている。出典は末尾とインラインに URL。

## 基本情報

- repo: `bootc-dev/bootc`（旧 `containers/bootc`。CNCF 受諾時に専用 org へ移管）
- pinned commit: `a7f95e743aa54a2f966edc1a0417ef6d509df9af`（2026-06-24）/ 近いタグ: `v1.16.2`（最新リリース、HEAD はその数コミット先）
- 言語 / ビルド: Rust（edition 2024、`rust-version = "1.85.0"`、cargo workspace）/ `cargo build` か `make`、本番は `just build`（ブート可能なコンテナをビルド）。`crates/lib/Cargo.toml:3,11`、`CONTRIBUTING.md:59,62`
- ライセンス: **MIT OR Apache-2.0** のデュアル（`Cargo.toml` の `license = "MIT OR Apache-2.0"`、`crates/cli/Cargo.toml` に同記載、ルートに `LICENSE-APACHE` と `LICENSE-MIT` の両方が存在）。GitHub の検出は apache-2.0 のみ表示されるが実体はデュアル
- CNCF 成熟度: **Sandbox**（2025-01-21 受諾。Red Hat が KubeCon NA 2024 で発表した 4 プロジェクトのバッチの一つ）
- カテゴリ (本タスク指定リストから): **Runtime**（起動・実行する OS ホストそのものを OCI イメージとして扱う層。Service Mesh/Observability 等のどれでもなく、ホストランタイムが最も近い）

## 歴史の素材

系譜は約 15 年。すべて Colin Walters（Red Hat）が起点。

- **OSTree (2011)**: バージョン管理された起動可能なファイルツリーを Git ライクに atomic 更新。libostree + CLI。初公開リリース 2013.6（2013-08）。<https://lwn.net/Articles/979182/>、<https://grokipedia.com/page/OSTree>
- **rpm-ostree**: libostree の上にハイブリッドの image+package モデル。「base commit」に RPM をレイヤする。Fedora CoreOS/Silverblue/IoT を駆動。<https://coreos.github.io/rpm-ostree/container/>
- **ostree native containers**: OCI/Docker イメージを ostree commit の transport として扱う機能（ostree-rs-ext 由来）。rebase 後も `rpm-ostree upgrade` が新しいコンテナ版を探す。<https://fedoraproject.org/wiki/Changes/OstreeNativeContainerStable>
- **bootc**: その上に立つ専用のクリーンなインターフェース。「OS イメージ作成をアプリコンテナ作成と同じくらい簡単に、同じツールで」。Fedora Change（Walters / Joseph Marrero / Brent Baude）でコンテナ機能を stable 宣言し bootc を新インターフェースとして導入、Fedora の各エディションを OCI 配送へ移行する計画。<https://lwn.net/Articles/979182/>
- マイルストーン: DevConf.cz 2024-06-14 で Dan Walsh / Stef Walter / Colin Walters が bootable containers のキーノート。RHEL 10 (2025) で新規イメージは rpm-ostree から bootc へ置換。CNCF Sandbox 受諾 2025-01-21。<https://www.cncf.io/projects/bootc/>
- repo の `createdAt` は 2022-11-30（`gh repo view`）。

## アーキテクチャの素材

トップレベルは cargo workspace（`Cargo.toml` の `members = ["crates/*"]`）。主要クレート（`crates/`）:

- `cli`: 薄い実行バイナリ。`crates/cli/src/main.rs` は global init → tokio current-thread runtime 生成 → `bootc_lib::cli::run_from_iter(std::env::args())` を呼ぶだけのシム
- `lib`: 本体（`bootc-lib`）。CLI 定義、status、deploy、install、boundimage、kargs など全ロジック
- `ostree-ext`: libostree の上の Rust ラッパ（OCI ⇄ ostree commit の import/export、ManifestDiff など）。`crates/lib` が依存
- `composefs` 関連 (`crates/lib/src/bootc_composefs/`): 新しいバッキングストア。`/` 全体の不変性を提供
- 補助: `blockdev` / `mount` / `kernel_cmdline` / `initramfs` / `sysusers` / `tmpfiles` / `etc-merge` / `system-reinstall-bootc` / `utils` / `xtask` / `tests-integration`

設計上の核:

- 実行時、ベースのユーザ空間は「コンテナの中」では動かない。systemd が通常通り pid1。コンテナは transport/配送フォーマットにすぎない。`README.md` の Motivation 節
- ホスト状態は Kubernetes 風の宣言的オブジェクトとしてモデル化。`crates/lib/src/spec.rs:18` で `API_VERSION = "org.containers.bootc/v1"`、`:19` で `KIND = "BootcHost"`、`Host` 構造体は `#[serde(flatten)] resource: k8sapitypes::Resource`（`spec.rs:29`）で apiVersion/kind/metadata を持ち、`spec` と `status` を分ける（`spec.rs:32,35`）。`bootc edit` は `kubectl apply` 同様に spec を編集する（`cli.rs:891-900` のヘルプ）
- A/B 更新。更新は `staged` として queue され、デフォルトは shutdown 時に `ostree-finalize-staged.service` で適用。`bootc upgrade --apply` で即時 reboot。`cli.rs:842-855` の doc コメント

## 内部実装の素材

### 代表オペレーションを端から端まで: `bootc upgrade`

1. エントリ: `crates/cli/src/main.rs` の `async_main` → `bootc_lib::cli::run_from_iter`。
2. `crates/lib/src/cli.rs:1713` `run_from_iter` が `Opt::parse_including_static`（`cli.rs:1736`、argv0 が `ostree-container` 等なら internals へ振り替える特殊処理）でパースし `run_from_opt` へ。
3. `crates/lib/src/cli.rs:1768` `run_from_opt`。`cli.rs:1771` `Opt::Upgrade(opts)` で storage を取得し、`storage.kind()` が ostree か composefs かで分岐（`cli.rs:1773-1779`）。ostree 系は `upgrade(opts, storage, &booted_ostree)`。
4. `crates/lib/src/cli.rs:1154` `upgrade`。`cli.rs:1161` で `status::get_status` から現在の `Host` を取り、`cli.rs:1162` で `host.spec.image`（目標イメージ）を得る。`--tag` 指定時は `image.with_tag(tag)` で派生（`cli.rs:1165-1172`）。
5. ローカル rpm-ostree 改変があれば upgrade 不可でエラー（`cli.rs:1183-1188`）。`--check` は `new_importer` → `imp.prepare()` で fetch せず差分のみ表示し `ManifestDiff::print()`（`cli.rs:1231-1254`）。
6. 実 fetch は unified storage 有無で分岐し `crate::deploy::pull_unified`（`cli.rs:1257`）か `crate::deploy::pull`（`cli.rs:1268`）。
7. `crates/lib/src/deploy.rs:773` `pull` は `prepare_for_pull` の結果が `AlreadyPresent` ならそれを返し、`Ready` なら `check_disk_space_ostree`（`deploy.rs:797`）→ `pull_from_prepared`（`deploy.rs:808`）。
8. staged/booted の digest と fetch 済 digest を比較（`cli.rs:1278-1289`）。変化なしなら "No update available." 等。変化あれば `crates/lib/src/cli.rs:1329` `crate::deploy::stage(...)` を呼ぶ。
9. `crates/lib/src/deploy.rs:1012` `stage` は journal に `STAGE_JOURNAL_ID` で記録（`deploy.rs:1021-1031`）し、3 ステップ（merging / deploying / bound_images …）の進捗 Event を送りつつ `origin_from_imageref`（`deploy.rs:1075`）で origin KeyFile を作り `crate::deploy::deploy(...)`（`deploy.rs:1077`）→ `boundimage::pull_bound_images`（`deploy.rs:1099`）。
10. `crates/lib/src/deploy.rs:899` `deploy`。merge deployment から kargs を計算（`deploy.rs:910-916`、`bootc_kargs::get_kargs`）、worker thread で `ostree.stage_tree_with_options(...)`（`deploy.rs:948`）を呼んで新 deployment を stage、staged deployment を返す（`deploy.rs:962`）。

### 非自明な設計判断

`crates/lib/src/deploy.rs:919` のコメントと実装: `ostree::Deployment` が（誤って）`!Send` なので、spawn_blocking のワーカースレッドへ渡すために deployment そのものではなく `d.index() as usize`（`deploy.rs:921`）整数インデックスに変換して move し、スレッド内で `&deployments[m]`（`deploy.rs:945`）で引き直す。同様に `glib::KeyFile` も `!Send` なので `origin.to_data()`（`deploy.rs:924`）で文字列にシリアライズして渡し、スレッド内で `load_from_data`（`deploy.rs:947`）で復元する。FFI 由来の Send 制約を「インデックス/文字列に落として再構築」で回避している。

### 中核データ構造（`crates/lib/src/spec.rs`）

- `Host`（`spec.rs:26`）: トップレベル宣言オブジェクト。`resource`(flatten した k8s Resource) + `spec` + `status`。`OBJECT_NAME = "host"`（`spec.rs:21`、唯一のオブジェクト）
- `HostSpec`（`spec.rs:65`）: ユーザ意図。`image: Option<ImageReference>` と `boot_order: BootOrder`（`spec.rs:67,70`）。`BootOrder`（`spec.rs:42`）は `Default | Rollback`
- `ImageReference`（`spec.rs:88`）: `image: String` / `transport: String` / `signature: Option<ImageSignature>`（`spec.rs:90-95`）。`ImageSignature`（`spec.rs:76`）は `OstreeRemote(String) | ContainerPolicy | Insecure`
- `BootEntry`（`spec.rs:317`）: 1 デプロイメントの観測状態。`image` / `cached_update` / `incompatible` / `pinned` / `soft_reboot_capable` / `download_only` / `store` と、`ostree: Option<BootEntryOstree>` / `composefs: Option<BootEntryComposefs>`（`spec.rs:319-339`）
- `HostStatus`（`spec.rs:432`）: `staged` / `booted` / `rollback` / `other_deployments` / `rollback_queued`（`spec.rs:434-445`）。A/B + rollback の slot を表現
- 補助: `FilesystemOverlay`（`spec.rs:355`）と `deployment_unlocked_state_to_usr_overlay`（`spec.rs:400`）が `bootc usroverlay`（`/usr` の transient overlay）の状態を ostree の `DeploymentUnlockedState` から導出

### コマンド面（`crates/lib/src/cli.rs:841` `enum Opt`）

`Upgrade`(alias `update`) / `Switch` / `Rollback` / `Edit` / `Status` / `UsrOverlay`(alias `usroverlay`) / `Install`(to-disk, to-filesystem, to-existing-root) / `Container` / `Image` / `LoaderEntries` ほか hidden 多数。`Install` の実体は `crates/lib/src/install.rs:2121` `install_to_disk` / `:2445` `install_to_filesystem` / `:2730` `install_to_existing_root`。

## 採用事例の素材

`ADOPTERS.md`（repo 内、出典として明示）。直接採用 (Vendor):

- Red Hat（2024、Image Based Linux。RHEL 10 で bootc が新規イメージのデフォルト）
- Universal Blue（Aurora / Bazzite / Bluefin）（2024）
- HeliumOS（2024、atomic desktop OS）
- AlmaLinux Atomic SIG（2025、atomic-desktop / atomic-workstation）
- Caligra Workbench（2025）
- CIQ（2026、Rocky Linux from CIQ）

間接採用（via ostree、bootc 直利用とは限らない）: Endless, Fedora Project（atomic desktops）, Apertis, Playtron GameOS, Fyra Labs(Ultramarine) 等。bootc の目標は ostree ユーザを継承すること。

GitHub シグナル（`gh repo view`、2026-06-26 取得）: stars **2,134** / forks **204** / contributors **約 94**（`contributors` API のページネーションより）。最新リリース `v1.16.2`。

## 代替・エコシステム

- **直接の前身/隣接**: ostree（libostree、13 年以上）、rpm-ostree（ハイブリッド image+package）。bootc は両者の後継を志向。<https://github.com/coreos/rpm-ostree/>
- **依存 CNCF Sandbox**: composefs（同じ Red Hat バッチで Sandbox 申請。bootc のバッキングストアに使用）。<https://github.com/cncf/sandbox/issues/311>
- **ビルド/ツール連携**: 標準の Containerfile/Dockerfile + podman/buildah/docker でイメージを作る。`bootc install to-disk` でディスクへ。bcvk（VM 上テスト）、osbuild との連携あり（`crates/lib/src/install/osbuild.rs`）
- **本質的な差**: 汎用 OS パッケージ管理（apt/dnf/transactional-update/snapper）や mutable image 系（Flatcar の Omaha 更新）と異なり、bootc は「OS 全体を 1 つの OCI イメージとして」レジストリ配送し、ランタイムはコンテナでなく素の systemd。GitOps 的に image tag を切り替える運用（`bootc switch` の doc、`cli.rs:856-866`）。NixOS/Chromium OS とは思想は近いが OCI エコシステム互換を最優先する点が差別化
- **隣接 CNCF**: KubeVirt（VM）、container-native CI/CD と「コンテナ技術をホスト OS まで適用する」という上位ゴールで整合（CNCF 申請文）。<https://github.com/bootc-dev/bootc/discussions/897>
