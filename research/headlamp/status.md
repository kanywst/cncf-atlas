# status: headlamp

- [x] recon 完了 @ commit `dab1a6c5c0039c73ba4e3ab6df8775824a46e3b9`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `headlamp` / category: `Developer Tools` / maturity: `Sandbox`
- 成熟度の注意: CNCF ランドスケープ上は Sandbox (受理 2023-05-17) だが、2025 年に Kubernetes SIG UI のサブプロジェクト化しリポも `kubernetes-sigs/headlamp` へ移動。write 時に「Sandbox かつ Kubernetes SIG UI サブプロジェクト」の二重ステータスを Overview/History で正確に書くこと。断定しすぎない
- リポ名は `kubernetes-sigs/headlamp` (旧 `headlamp-k8s/headlamp`)。コンテナイメージは当面 `ghcr.io/headlamp-k8s`
- pinned tag は `v0.43.0` (HEAD はその 1 コミット後の PR #6343 マージ)。Internals の file:line はこの commit 前提
- 代表トレース (UI → backend proxy → kube-apiserver) は file:line 検証済み。Architecture 章はこれを軸に書ける
- 追加で読む価値: `backend/cmd/stateless.go` (ステートレスモード)、`backend/pkg/auth` (OIDC/Cookie トークンの詳細)、`backend/pkg/k8cache` (キャッシュ+認可)。現状 write には十分だが Internals を厚くするならここ
- THIN 判定: なし。history/architecture/internals/adoption すべて出典付きで埋まっている
