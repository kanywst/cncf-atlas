# status: Backstage

- [x] recon 完了 @ commit `bccd96d2d8caa7bdd51686d0ca526cb6b9915bc4`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## 確定事項

- slug: `backstage` / repo: `backstage/backstage`
- カテゴリ: Developer Tools (verbatim 指定)
- maturity: Incubating (Sandbox 2020-09-08 → Incubating 2022-03-15、graduation 未)
- ライセンス: Apache-2.0 (LICENSE/NOTICE で確認済み)
- tagline EN: An open framework for building internal developer portals, built around a Kubernetes-style software catalog.
- tagline JA: Kubernetes 風のソフトウェアカタログを核に、社内開発者ポータルを組み立てるオープンフレームワーク。

## メモ (write 前に詰めるとよい点)

- pin は `master` HEAD で、安定タグ `v1.52.0` と `v1.53.0-next.0` の中間。Internals 記述は HEAD 基準。Overview ページにはコミット sha を明記すること
- 「framework であって product ではない」を Overview の核に据える。Catalog / Templates / TechDocs / Search / Permissions の 5 本柱で説明できる
- 新旧 3 世代 (`core-*` 旧フロント / `frontend-*` 新フロント / `backend-*` 新バックエンド) が同居している点は読者が混乱しやすい。getting-started 側で「新システム前提」と断るか整理が要る
- contributors 実数は GitHub API 上限で取り切れない。採用数値は stars/forks と CNCF velocity 順位で語る。Gartner 予測 (S10) は二次引用なので扱い注意
- 採用組織は ADOPTERS.md 由来 (自己申告)。著名名は列挙済みだが「自己申告リスト」と明記する
- 代替比較 (S10) はベンダーブログ由来でバイアスあり。差別化は「拡張性 vs time-to-value」「OSS framework vs SaaS product」の軸で中立に書く
