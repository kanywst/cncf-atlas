# status: Carina

- [x] recon 完了 @ commit `aec3a9f09d97d71af9dc2aa366494d1f0088708d` (tag v0.14.0)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- カテゴリ: Storage & Database。ローカル LVM ベースの CSI ドライバで DB ワークロード特化。
- 押さえどころ: CSI controller はディスクに触らず `LogicVolume` CRD 経由で対象ノードの carina-node に処理を委譲する (TopoLVM 由来の CRD 仲介パターン)。代表トレースは recon.md のエンドツーエンド節。
- 差別化: RAID 自動構築、bcache 自動階層化、容量+IO 意識のスケジューラ拡張、LVM/raw/hostPath の 3 ボリュームタイプ。
- 注意 (write 時に正直に書く): 最終 push / 最新リリースともに 2025-04-16 で、それ以降ほぼ活動なし。star 724 / fork 86 / contributors 約 20 (2026-06-26 時点)。
- 採用組織: ADOPTERS なし。引用可能な実名採用は未確認。捏造しないこと。
- go.mod は Go 1.19。CSI_VERSION 1.5.0 (README)。
