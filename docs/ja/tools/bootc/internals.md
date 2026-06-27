# 内部実装

> コミット `a7f95e7` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `crates/cli/src/main.rs` | プロセスのグローバル初期化、Tokio ランタイム生成、ライブラリ呼び出し。 |
| `crates/lib/src/cli.rs` | `Opt` enum (CLI 面)、引数パース、`upgrade`/`switch`/`rollback` ハンドラ。 |
| `crates/lib/src/spec.rs` | 宣言的ホストモデル: `Host`、`HostSpec`、`HostStatus`、`BootEntry`。 |
| `crates/lib/src/deploy.rs` | `pull`、`stage`、`deploy`: イメージを fetch し新デプロイメントを queue。 |
| `crates/lib/src/install.rs` | `install_to_disk`、`install_to_filesystem`、`install_to_existing_root`。 |
| `crates/lib/src/bootc_composefs/` | composefs ストレージバックエンド (boot, update, switch, rollback)。 |
| `crates/ostree-ext/` | OCI と ostree commit の import/export、`ManifestDiff`。 |

## 中核データ構造

システム全体が回転するのは `crates/lib/src/spec.rs` のホストモデルだ。意図的に Kubernetes 風になっている。

`Host` (`crates/lib/src/spec.rs:26`) は唯一のトップレベルオブジェクト。k8s の `Resource` を flatten して apiVersion/kind/metadata を持ち、ユーザ意図と観測状態を分ける。

```rust
pub struct Host {
    /// Metadata
    #[serde(flatten)]
    pub resource: k8sapitypes::Resource,
    /// The spec
    #[serde(default)]
    pub spec: HostSpec,
    /// The status
    #[serde(default)]
    pub status: HostStatus,
}
```

構造体の上の定数が API 同一性を固定する。`API_VERSION = "org.containers.bootc/v1"` と `KIND = "BootcHost"` (`crates/lib/src/spec.rs:18-19`)、そしてオブジェクトは `host` という名前のただ 1 つだけだ (`crates/lib/src/spec.rs:21`)。

`HostSpec` (`crates/lib/src/spec.rs:65`) は意図で、オプションの目標 `image` と `boot_order` を持つ (`crates/lib/src/spec.rs:67,70`)。`BootOrder` (`crates/lib/src/spec.rs:42`) は `Default` か `Rollback` だけで、ロールバックはこれで宣言的に要求される。目標イメージは `ImageReference` (`crates/lib/src/spec.rs:88`) で、`image`・`transport`・オプションの `signature` を持つ (`crates/lib/src/spec.rs:90-95`)。`ImageSignature` (`crates/lib/src/spec.rs:76`) は ostree-remote / container-policy / insecure の検証方式を選ぶ。

`HostStatus` (`crates/lib/src/spec.rs:432`) は観測された A/B + rollback 状態で、`staged`・`booted`・`rollback`・`other_deployments`・`rollback_queued` を持つ (`crates/lib/src/spec.rs:434-445`)。各スロットは `BootEntry` (`crates/lib/src/spec.rs:317`) で、デプロイメントごとの観測状態 (`image`・`cached_update`・`incompatible`・`pinned`・`soft_reboot_capable`・`download_only`・`store`) を記録する (`crates/lib/src/spec.rs:319-335`)。

## 追う価値のあるパス

CLI ディスパッチからデプロイメントが stage されるところまで、upgrade を追う。

`run_from_opt` がサブコマンドにマッチし、バックエンドを選ぶ。

```rust
        Opt::Upgrade(opts) => {
            let storage = &get_storage().await?;
            match storage.kind()? {
                BootedStorageKind::Ostree(booted_ostree) => {
                    upgrade(opts, storage, &booted_ostree).await
                }
                BootedStorageKind::Composefs(booted_cfs) => {
                    upgrade_composefs(opts, storage, &booted_cfs).await
                }
            }
        }
```

このブロックは `crates/lib/src/cli.rs:1771-1780` にある。ostree パスは `upgrade` (`crates/lib/src/cli.rs:1154`) に入り、現在の `Host` を読み、fetch し、digest を比較し、実際に変化があれば `crate::deploy::stage` を呼ぶ (`crates/lib/src/cli.rs:1329`)。

実 fetch は `pull` (`crates/lib/src/deploy.rs:773`)。`prepare_for_pull` を呼び、イメージが既存ならショートカットし、そうでなければディスク容量を確認して pull する。

```rust
    match prepare_for_pull(repo, imgref, target_imgref, booted_deployment).await? {
        PreparedPullResult::AlreadyPresent(existing) => {
```

この match は `crates/lib/src/deploy.rs:781-782` にある。`Ready` の腕は `check_disk_space_ostree` のあと `pull_from_prepared` を呼ぶ (`crates/lib/src/deploy.rs:797,808`)。

`stage` (`crates/lib/src/deploy.rs:1012`) は作業を 3 ステップの進捗レポートで包み (`steps_total: 3` は `crates/lib/src/deploy.rs:1046`)、`origin_from_imageref` で origin KeyFile を作り、`deploy` を呼び、最後に bound images を pull する。

```rust
    let origin = origin_from_imageref(spec.image)?;
    let deployment =
        crate::deploy::deploy(sysroot, from, image, &origin, lock_finalization).await?;
```

これは `crates/lib/src/deploy.rs:1075-1077` で、`pull_bound_images` が `crates/lib/src/deploy.rs:1099` で続く。`deploy` (`crates/lib/src/deploy.rs:899`) は merge deployment からカーネル引数を `bootc_kargs::get_kargs` で計算し (`crates/lib/src/deploy.rs:912`)、ワーカースレッド上で `ostree.stage_tree_with_options(...)` により新しいツリーを stage し (`crates/lib/src/deploy.rs:948`)、stage された deployment を返す (`crates/lib/src/deploy.rs:962`)。

## 読んで驚いた点

`deploy` で最も面白いコードは、外部関数インターフェース (FFI) の癖に対する回避策だ。libostree の型 `ostree::Deployment` と `glib::KeyFile` は `!Send` とマークされているため、`spawn_blocking` のワーカースレッドへ move できない。型と戦う代わりに、`deploy` は move の前にそれらをただのデータへ落とす。

```rust
    // Clone all the things to move to worker thread
    let ostree = sysroot.get_ostree_cloned()?;
    // ostree::Deployment is incorrectly !Send 😢 so convert it to an integer
    let merge_deployment = from.as_merge_deployment();
    let merge_deployment = merge_deployment.map(|d| d.index() as usize);
    let ostree_commit = image.ostree_commit.to_string();
    // GKeyFile also isn't Send! So we serialize that as a string...
    let origin_data = origin.to_data();
```

これは `crates/lib/src/deploy.rs:917-924` だ。deployment は `usize` のインデックスに、KeyFile は文字列になる。ワーカースレッド内ではこれらを復元する。`merge_deployment.map(|m| &deployments[m])` でデプロイメント一覧を引き直し (`crates/lib/src/deploy.rs:945`)、`origin.load_from_data(&origin_data, glib::KeyFileFlags::NONE)?` で origin を再ロードする (`crates/lib/src/deploy.rs:947`)。FFI バインディングが取り違えている実際の安全性制約への、小さく実用的な答えだ。

もう 1 つの非自明な点は argv0 ディスパッチだ。`Opt::parse_including_static` はプログラム名を確認し、`ostree-container`・`ostree-ima-sign`・`ostree-provisional-repair` として起動された場合は引数を書き換えて `internals ostree-ext` へ振り替える (`crates/lib/src/cli.rs:1750-1751`)。1 つのバイナリが複数の歴史的エントリポイントを兼ねている。

## 出典

1. [bootc ソース (コミット a7f95e7)](https://github.com/bootc-dev/bootc/tree/a7f95e743aa54a2f966edc1a0417ef6d509df9af)
