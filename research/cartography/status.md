# status: cartography

- [x] recon 完了 @ commit `cdf66e2882d5d54ad1a9ade225e8f1560da182e8`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- canonical repo: `cartography-cncf/cartography` (旧 `lyft/cartography`、移管済み)。pin は master、タグ `0.138.1` より 6 コミット先行。
- category 確定: Security & Compliance。クラウド資産関係グラフ + attack path 分析が主目的。
- tagline (en): Pulls your cloud and SaaS assets and their relationships into a Neo4j graph so you can query for attack paths and exposures.
- tagline (ja): クラウドと SaaS の資産と関係性を Neo4j グラフに取り込み、攻撃経路や露出を Cypher で探せるセキュリティツール。
- 強調すべき設計: (1) `update_tag` / `lastupdated` による GC スナップショット方式、(2) frozen dataclass スキーマから Cypher 自動生成 (querybuilder)、(3) `_LazyStage` による SDK 遅延 import。
- write 段で end-to-end を語るなら AWS EMR 経路 (intel/aws/emr.py → client/core/tx.py → graph/querybuilder.py → graph/cleanupbuilder.py) を使うと anchor が揃う。
- 注意: ADOPTERS ファイル無し。名指し採用は Lyft (起源) と SubImage のみ、それ以外は GitHub シグナルで代替。
