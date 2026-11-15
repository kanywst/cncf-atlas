# status: CloudNativePG

- [x] recon 完了 @ commit `7ef33bb2083ced9f9d5a2fc0df2185de21075532` (2026-06-26)
- [x] sources 整理
- [x] write: en 6 セクション
- [x] write: ja 6 セクション
- [x] tools.ts に登録
- [x] `npm run docs:build` グリーン
- [x] markdownlint clean
- [x] re-pin @ commit `719385f7fd67f8494daccf4b1d0aebfb43528850` (2026-11-13、確認 2026-11-16)

## メモ

- repo: `cloudnative-pg/cloudnative-pg`、go 1.26.6 (`go.mod:3`)、Apache-2.0、CNCF Incubating (TOC 投票 2026-11-02 締切、<https://github.com/cncf/toc/issues/1961>)。カテゴリは Storage & Database。
- pinned commit は `main` HEAD (2026-11-13)。`git ls-remote https://github.com/cloudnative-pg/cloudnative-pg HEAD` で一致確認。最新安定版 `v1.30.1` / `v1.29.3` (2026-09-23、<https://github.com/cloudnative-pg/cloudnative-pg/releases>)。getting-started は `release-1.30/releases/cnpg-1.30.1.yaml` (`docs/src/installation_upgrade.md:22`)。
- 推し: 外部 DCS (etcd/Patroni) 非依存で Kubernetes API を HA の合意源に使う点 + operator/instance-manager の二重 reconcile (`internal/cmd/manager/instance/run/cmd.go:287`)。primary Lease (`run/lease/doc.go:20`-`22`) と CNPG-i プラグイン機構も差別化要素。
- 採用事例は ADOPTERS.md に多数。捏造不要。pin 間で CoreWeave (2026-11-11) ほか 4 行追加 (<https://github.com/cloudnative-pg/cloudnative-pg/blob/main/ADOPTERS.md>)。
- シグナル (2026-11-16): スター 9,596、フォーク 818、コントリビュータ約 242 (`gh api` の Link ヘッダ末尾 page)。
- re-pin で変わった主張 (2026-11-16):
  - サブコマンド登録は `newRootCmd` 内 `cmd/manager/main.go:66`-`75`。`debug` を一覧に追加 (旧 pin にもあったが漏れていた)。
  - status ポートは `https` 固定 (#11370、<https://github.com/cloudnative-pg/cloudnative-pg/pull/11370>)。internals のコード片を `url.Build("https", ...)` に差し替え。
  - failover 進行中ブロックは target が `pending` のとき requeue しない (#11336、<https://github.com/cloudnative-pg/cloudnative-pg/pull/11336>)。「毎回 1 秒で requeue」という旧記述を書き換え。
  - CRD 一覧に `DatabaseRole` (v1.30.0) を追加。barman-cloud の in-tree 版は 1.31.0 で削除予定と明記。
  - 行番号のずれ: `cluster_controller.go` は reconcile 本体で -1 / ステータス取得以降 +1、`run/cmd.go` は +10、`remote/instance.go:320` は `:318`、`cluster_types.go` は `ClusterStatus` 以降 +13 から +121。
- アンカーは全件 pinned commit で再検証済み (2026-11-16)。en と ja でアンカー集合が一致することをスクリプトで確認。
