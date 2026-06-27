# status: Antrea

- [x] recon 完了 @ commit `65be43ddeb1e26c3d1450fb085c1db17ee87934e`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `antrea` / category: Service Mesh & Networking / maturity: Sandbox (2021-04-28 受理)
- 近いタグ v2.6.2 (HEAD はそれより後の main)。Internals/Architecture の `file:line` は全てこの commit で確認済み。
- 代表トレース: Pod 起動の CNI ADD (CNI バイナリ → Agent CNIServer.CmdAdd → IPAM → veth → OVS ポート → InstallPodFlows)。
- 非自明設計: Controller がポリシーを AppliedToGroup/AddressGroup/NetworkPolicy に事前計算し `controlplane.antrea.io/v1beta2` アグリゲート API で各エージェントへ配信。各 Node は関係するグループのみ受信しスケールする。write 段でここを主役にすると良い。
- 採用事例は ADOPTERS.md の 3 社 (Glasnostic / Transwarp / TeraSky) + VKS デフォルト CNI のみ出典付き。それ以外は GitHub シグナルで補う。
- 薄い点: contributors 142 は contributors API のユニーク login 数。DevStats での実数は write 前に再確認の余地あり。VKS デフォルト CNI は一次ソース (Broadcom/VMware 公式 docs) を write 段で当て直すと堅い。
