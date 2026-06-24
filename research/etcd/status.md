# status: etcd

- [x] recon 完了 @ commit `61d518f55effaf5edcedcb2a696504795b4fa7bd`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `etcd` / category: Storage & Database / maturity: Graduated
- 指定 landscape カテゴリは "Service Mesh & Networking" だったが分散 KVS なので Storage & Database にマップ。write 段でカテゴリ確認
- src は `research/etcd/src/` (clone 済み、`research/*/src` は lint 対象外)
- 強い素材: Put の end-to-end トレース、revision キーの bbolt + in-memory treeIndex 二段構成、raft の別モジュール化
- 採用は ADOPTERS.md と K8s で堅い。数値出典は GitHub API (stars 51,872)
- 薄い点: 具体的な CNCF ケーススタディ個社事例は ADOPTERS の羅列止まり。write で個社の公開ブログ/トークを足すと厚くなる
