# status: CloudNativePG

- [x] recon 完了 @ commit `7ef33bb2083ced9f9d5a2fc0df2185de21075532`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo: `cloudnative-pg/cloudnative-pg`、Go 1.26.4、Apache-2.0、CNCF Sandbox (2025-01 承認)。カテゴリは Storage & Database。
- pinned commit は `main` HEAD (2026-06-26)。shallow clone なのでタグ未解決。最新安定版 `v1.29.1`、`main` は `v1.30.0-rc1` manifest を同梱。write 段階では安定版 manifest URL に差し替えること。
- 推し: 外部 DCS (etcd/Patroni) 非依存で Kubernetes API を HA の合意源に使う点 + operator/instance-manager の二重 reconcile (`internal/cmd/manager/instance/run/cmd.go:277`)。CNPG-i プラグイン機構も差別化要素。
- 採用事例は ADOPTERS.md に多数。捏造不要。EDB / IBM / Google Cloud / Azure / Akamai / Tesla / Ericsson / Mirakl (300+ クラスタ・8TB) など出典確実。
- 確認保留: コントリビュータ数は `gh` ページネーション概算 (約 226)。スター 8,873 (2026-06-27)。write 時に最新値を取り直すと安全。
- 代表操作トレースは「Cluster reconcile 1 周」で確定。end-to-end アンカー検証済み。
