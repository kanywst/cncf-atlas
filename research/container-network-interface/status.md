# status: Container Network Interface (CNI)

- [x] recon 完了 @ commit `7c270076995b6a35f4774ce94dafcf266d1c6925`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: `containernetworking/cni`。これは「仕様 + Go ライブラリ (libcni / skel) + 参照 CLI (cnitool)」。Cilium/Calico/Flannel はこのリポジトリの実装ではなくサードパーティのデータプレーン。write 段で「CNI = ネットワークプラグイン本体」と誤読しないこと。
- pinned HEAD (2025-12-15) は最新タグ v1.3.0 (2025-04-07) より後の main。recon の path:line は HEAD ベース。
- カテゴリは指示通り "Service Mesh & Networking" 固定。
- 代表操作は ADD のプラグインチェーン実行 (libcni → invoke → skel)。write の「仕組み」節はこれを軸にする。
- 採用組織は実消費者 (Kubernetes/containerd/CRI-O) と仕様実装 (Cilium 等) を区別して書く。CNI コアに ADOPTERS.md は無い、捏造禁止。
- contributors 約 148 はページネーション推定値。write で断定的な精密値にしない。
