# status: Athenz

- [x] recon 完了 @ commit `3a7ae0530aa597774d5ae665e6584dfb57e39206`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `athenz` / category: Identity & Policy / maturity: Sandbox (CNCF, 2021-01-26 受理)。
- コードは Java 中心 (ZMS/ZTS) + Go (SIA/CLI/clients) + Node.js/React (UI)。recon の代表パスは ZMS ポリシー評価 (`ZMSImpl.evaluateAccess`) を end-to-end で固定済み。第 2 パスとして ZTS の ID 証明書ブートストラップも anchor 済み。
- write 時の核: explicit-deny-wins (短絡しない全走査)、中央 ZMS と分散 ZTS/ZPE の pull キャッシュ分離、RDL からのコード生成、プラガブル Authority。
- 薄め / 二次パス候補:
  - CNCF Sandbox 受理日 (2021-01-26) は web 検索結果ベース。write 前に CNCF プロジェクトページ (S1) か cncf/toc issue (S2) で日付を最終確認したい。
  - 初回 OSS 公開の正確な日付は未確定 (repo 作成 2016-11-16 を下限として記載)。必要なら最古リリースタグで補強。
  - contributors 数は `anon=true` ページングからの概算 (約 109)。write では「100+」程度の丸めが安全。
- 図 (mermaid) は ZMS=source of truth、ZTS=cached issuer、SIA=workload agent、ZPE=client-side enforcement の 4 点を描くと収まりが良い。
