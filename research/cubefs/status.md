# status: CubeFS

- [x] recon 完了 @ commit `6b2e7926bec66d12fc037f03cd4b2ac680475448`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決済み: `cubefs/cubefs` が主実装リポ。`cubefs-csi` / `cubefs-helm` は別リポのサブプロジェクト。
- pin commit はタグ無しの master HEAD。直近タグは v3.5.3 (2025-12-23)。write 段で「v3.5.3 系 + master」と書くこと。
- 代表トレースは append write (client SDK → primary DataNode → follower chain → extent file)。図にしやすい。
- 非自明設計 2 点: (1) メタ全 in-memory 2 B-Tree + raft、(2) 小ファイル集約の TinyExtent。write でどちらか深掘り。
- 採用は ADOPTERS.md (一次情報) と CNCF 発表値 (200+ org / 350 PB) のみ使う。CNCF と GitHub のコントリビュータ数は集計方法が違うので両方併記。
- 未確認: RDMA サポート (タグ v3.4.0-beta_rdma あり)、distributed cache (flashnode) の詳細は write 段で必要なら追う。
