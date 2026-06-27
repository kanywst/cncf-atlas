# status: Confidential Containers

- [x] recon 完了 @ commit `af53e983f15500db6600430c089da796a6c1c6bc`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 対象 repo の選定: プロジェクト全体は org に分散。メタ repo は docs のみなので、実装の中核 `trustee` (KBS + AS + RVPS, Rust) を deep-dive 対象に固定した。write 段では「プロジェクト = Confidential Containers、コードは trustee を主に読む」という前提を明示すること。
- category: Security & Compliance (確信度高、CoCo は confidential computing = データ使用中保護)。Runtime も成立するが、価値の核は attestation/鍵配布のセキュリティ。
- maturity: CNCF Sandbox (2022-03-08)。
- 代表トレースは RCAR ハンドシェイク (auth → attest → token) と plugin resource ゲート。図にしやすい。
- 薄い点 / 二次パスで補強したい所:
  - guest-components 側 (AA, CDH, image-rs) は別 repo。深掘りするなら clone を追加するか、guest-server 連携を README ベースで補う。
  - getting-started は `docker compose up` 経路を実機検証していない (clone の docker-compose.yml は kbs-grpc-as + coco-as-grpc + rvps の 3 サービス構成を確認済み)。write 前に quickstart.md を一度なぞること。
  - contributors 数は GitHub API のページング (per_page=1 の last) からの概算。write で数値を出すなら「約 60 / 約 78」と概算明記。
