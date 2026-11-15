# status: Open Cluster Management

- [x] recon 完了 @ commit `b4e4b232350d6967008372423e5aa7a967d80a9f`
- [x] sources 整理
- [x] write: en 6 セクション
- [x] write: ja 6 セクション
- [x] tools.ts の card エントリを deep に昇格 (category: Orchestration & Scheduling, maturity: Incubating、tier/repo を削除)
- [x] `npm run docs:build` グリーン
- [x] markdownlint clean

## メモ

- src は tarball 展開 (sandbox が clone の hooks コピーを拒否)。`.git` なし。sha は `git ls-remote` で確認
- 中核ストーリー: 登録 (bootstrap kubeconfig → ManagedCluster + CSR → hubAcceptsClient + CSR 承認 → cluster namespace と RBAC → lease) と ManifestWork (cluster namespace → work agent が pull → AppliedManifestWork → kind 順 apply → status feedback)。Placement と add-on はその上に乗る
- 薄いところ: 起源 (IBM 由来のコードがどの部分か) は CNCF ブログの一文だけ。Red Hat の open-sourcing ブログは 404。2020-2021 の分割 repo 時代のリリース史は追っていない
- adopters は ADOPTERS.md 一本。独立した事例記事 (CNCF case study など) は見つからなかった。Alibaba は KubeCon China 2021 の登壇で補強
- README は pin 時点で "sandbox" のまま。ページでは TOC issue を根拠にする
- getting-started のコマンドは未実行 (kind 環境なし)。ページ冒頭にその旨を明記
- `clusteradm accept` の挙動は clusteradm repo の `pkg/cmd/accept/exec.go` @ `f02a884` で確認 (S22)
