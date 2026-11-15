# status: KubeVirt

- [x] recon 完了 @ commit `3a1a19f21e49a01d3c13984b40bf268787c5368b` (2026-11-16 re-pin。旧 pin は `55a003dcb350dab77deb4659bae81aefb1eb570d`)
- [x] sources 整理
- [x] write: en 6 セクション
- [x] write: ja 6 セクション
- [x] tools.ts に登録 (maturity Graduated)
- [x] `npm run docs:build` グリーン
- [x] markdownlint clean

## メモ

- repo 解決済み: kubevirt/kubevirt が一次実装リポジトリで確定。
- pinned commit は main HEAD `3a1a19f` (commit date 2026-11-15T03:05:54Z、PR #19911 の merge)。近いタグはリリース候補 `v1.10.0-rc.1` (2026-11-12) の後、最新安定版は `v1.9.1` (2026-10-12)。出典: <https://github.com/kubevirt/kubevirt/releases>
- 取得方法: sandbox で `git clone` が通らないため codeload tarball を `research/kubevirt/src` に展開し、sha は `git ls-remote https://github.com/kubevirt/kubevirt HEAD` で一致確認。履歴が無いので `git describe` は使えず、タグは GitHub releases API で確認。
- `55a003d...3a1a19f` は 2,174 commits (<https://github.com/kubevirt/kubevirt/compare/55a003d...3a1a19f>)。
- re-pin で変わった主張: `converter.go` は 1,312 行から 248 行に縮み、入口は `:967` から `:43` へ。中身は configurator 30 個 + hypervisor 1 個 (KVM / MSHV) を `DomainBuilder` で回す形 (旧 pin でも builder 自体は使っていた、旧 `converter.go:1058`)。ページの「CPU / memory / disk / network / firmware を map する」は configurator リストの説明に書き換えた。
- `go.mod:1` / `LICENSE:1` は旧 pin の時点でもずれていた (go directive は `:3`、`LICENSE` の 1 行目は空行)。`go.mod:3` / `LICENSE:2` に修正。Go は 1.24.0 から 1.26.0 へ。
- getting-started の `RELEASE` は `v1.9.1` に更新。release asset (`kubevirt-operator.yaml` / `kubevirt-cr.yaml` / virtctl) の存在と `useEmulation` (`staging/src/kubevirt.io/api/core/v1/types.go:3957`)・`KubeVirtPhaseDeployed` (`types.go:2877`) は確認。クラスタでの実行はしていない。出典: <https://github.com/kubevirt/kubevirt/releases/tag/v1.9.1>
- カテゴリは指示どおり "Orchestration & Scheduling" を verbatim 採用。
- ライセンスは `LICENSE` 実物で Apache-2.0 を確認済み。
- CNCF Graduated: cncf/toc#1822 は gitvote/passed、2026-11-04 close (<https://github.com/cncf/toc/issues/1822>)。level change は cncf/toc#2359、同日 close (<https://github.com/cncf/toc/issues/2359>)。
- 採用組織はすべて repo の ADOPTERS.md 実物で裏取り済み。捏造なし。表の行数は 47 (旧 pin 42)。出典: <https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md>
