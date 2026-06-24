# status: CloudEvents

- [x] recon 完了 @ commit `1e993966fbdfb21b99d161a7be69198a4402afc4`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- 対象リポは仕様本体 `cloudevents/spec` ではなく主力実装の Go SDK `cloudevents/sdk-go`。write 段では「CloudEvents = 仕様、sdk-go = リファレンス実装」の関係を冒頭で明示すること。
- pinned HEAD は main 上で最新リリースタグ `v2.16.2` (2025-09-22) より後。タグ直当てではない点に注意。
- trace は HTTP binary mode 送信 (`client.Send` -> `binding.Write` -> `EventMessage.ReadBinary` -> `httpRequestWriter`)。structured mode と受信側 (`StartReceiver` + reflection invoker) は write で触れる余地あり。
- 非自明設計: `binding.Write` の direct transcoding (decode せず structured/binary をコピー転送)。`write.go:32-52`。
- 採用先は CNCF Graduation 発表 (3) 記載のもののみ使用。KubeVela は確証なしのため不採用。
- カテゴリは App Definition & GitOps (CNCF landscape の付与カテゴリと一致)。tools.ts の CATEGORY_ORDER に同名があるか write 前に要確認。
- マルチモジュール repo。protocol binding と samples は別 go.mod。ビルド確認は `cd v2 && go build ./...`。
