# status: Atlantis

- [x] recon 完了 @ commit `b7cea535d4d83b1ceeb428fca61458c126c107e3`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `atlantis` / category: App Definition & GitOps / maturity: CNCF Sandbox (2024-06-18 受諾)。
- repo: `runatlantis/atlantis`、言語 Go、ライセンス Apache-2.0 (確認済み)。
- pin はタグ直上ではなく `v0.44.0` 直後の main HEAD。shallow clone でタグ未取得。write で版を書くなら「v0.44.0 系の main」と表現する。
- 代表パスは「PR コメント `atlantis plan` の webhook to terraform バイナリ実行」で全 hop に file:line あり。write の Internals/Architecture はこれを軸に。
- 非自明ポイント: 永続ロック + プロセス内 WorkingDirLocker + GitReadLock の三層ロック。サーバサイドで terraform バイナリを直接実行し state は持たない設計。
- 採用事例は ADOPTERS.md の 4 社 (Lambda/Rapid7/CloudScript/Vend) のみ確実。それ以外は GitHub シグナル (stars 9,155 / forks 1,285) で補う。捏造しない。
- 次の確認候補 (write 前にあれば): policy_check (Conftest/OPA) のステップ実装、boltdb と redis の切替フラグ、autoplan のファイル一致ロジック (`AutoplanWhenModified`)。
