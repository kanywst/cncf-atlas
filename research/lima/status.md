# status: Lima

- [x] recon 完了 @ commit `9a3f1c443389c673eb619f7b1922b1a4d8e4fd16`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 確定: `lima-vm/lima`。category は指定どおり Runtime、maturity は CNCF Incubating (CNCF project page で確認済)。
- 近いタグは `v2.1.3`。HEAD はその後の main コミットなのでタグ完全一致ではない点を write 時も明記。
- end-to-end は `limactl start` を採用済 (CLI → hostagent 子プロセス → driver.Start → guest agent イベント監視)。anchors は recon.md に記載。
- 非自明設計: 外部ドライバの gRPC プラグイン化 (`pkg/driver/external/driver.proto`)、cloud-init ISO 注入、vsock 上の GuestService。write の Internals はこの 3 点を軸にできる。
- 採用事例は README 記載の 4 件 (Rancher Desktop / Colima / Finch / Podman Desktop) のみ citable。それ以外は出典なしなので書かない。
- 確認したいなら: contributors 約 215 はページネーション推定。正確な数値が要るなら DevStats を当たる。
- taglines: EN/JA は recon の方針に沿って write 時に確定済の文を流用可。
