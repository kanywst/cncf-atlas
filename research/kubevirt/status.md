# status: KubeVirt

- [x] recon 完了 @ commit `55a003dcb350dab77deb4659bae81aefb1eb570d`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決済み: kubevirt/kubevirt が一次実装リポジトリで確定。
- pinned commit は main HEAD (2026-06-24)。近いタグは直近リリース `v1.8.4` (2026-06-16) の後。shallow clone のため `git describe` は使えず `gh release view` でタグ確認。
- カテゴリは指示どおり "Orchestration & Scheduling" を verbatim 採用。
- ライセンスは `LICENSE` 実物と `gh repo view` の両方で Apache-2.0 を確認済み。
- CNCF Incubating を CNCF blog (2022-04-19 昇格) で確認。Graduation は申請中。
- 採用組織はすべて repo の ADOPTERS.md 実物で裏取り済み。捏造なし。
- 次の write ステージ向け: 代表トレースは VMI -> virt-launcher Pod -> virt-handler gRPC -> libvirt 変換。非自明設計は「VM 1 台 = virt-launcher Pod 1 つ、libvirt+qemu を Pod 内で動かす」。
