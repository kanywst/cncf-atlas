# status: DevSpace

- [x] recon 完了 @ commit `8ff6260787edacfa2c0d30d1ff62358d36d482bc` (tag `v6.4.0-rc.1`)
- [x] sources 整理 (S1–S13)
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `devspace` / category: **Developer Tools** / maturity: **Sandbox** (accept 2022-12-13)。
- repo は `devspace-sh/devspace` (go.mod の module path は `github.com/loft-sh/devspace` のまま、history/internals で一度触れておくと親切)。
- アーキ/内部は `devspace dev` パイプライン → devpod → sync (upstream tar/gzip, downstream gRPC over exec) → podreplace で 1 本トレース済み。file:line は全て pin commit で確認済み。書く時はこの 1 経路を軸にすると通しで読める。
- **THIN: 採用事例**。ADOPTERS ファイルなし、CNCF ページも named adopter なし。組織名の citable な事例が現状薄い。write 前に (a) KubeCon/CNCF 登壇、(b) CNCF case study、(c) 公開 engineering blog を second pass で探すこと。見つからなければ adoption セクションは「GitHub/DevStats シグナル + 個人実務ブログ (S12)」で正直に構成し、組織名は載せない。
- 数字の注記: `gh` の contributor 数 (≈124) と CNCF DevStats の contributor 数 (647) は定義が違う。write では両方を出典付きで併記し、混同しない。
- 代替 (Skaffold/Tilt/Garden/Okteto) は全て非 CNCF。比較軸は「クラスタ内開発 (Pod 置換 + 双方向同期) にどこまで踏み込むか」。
