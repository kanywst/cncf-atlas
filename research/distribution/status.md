# status: distribution

- [x] recon 完了 @ commit `472c9d38c9fc523599f37ca3207279e5ab10f74f`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `distribution` / category: **Container Registry** / maturity: **Sandbox** (2021-01-26 受理、Graduated ではない)
- pinned tag は `v3.1.1` の 1 コミット後 (`git describe` はこの clone では届かないので `rev-list --count v3.1.1..HEAD` = 1 で確定)。
- アーキ代表操作は blob GET を端から端まで trace 済み (handler → blobStatter.Stat → blobServer.ServeBlob → RedirectURL or filereader)。内部深掘りは blob PUT の Commit パス (validateBlob → moveBlob → linkBlob)。file:line は recon.md に記載。
- 二次パスで補強したい点: GitHub Container Registry / GitLab Container Registry の「現行実装が今も Distribution 由来か」の一次ソース (README とドナー発表が根拠、企業側の技術記事までは未確認)。write では README/ドナー発表の範囲を超えて断定しないこと。
- manifest PUT/GET パス (`registry/handlers/manifests.go`, `registry/storage/manifeststore.go`) は未 trace。write で Internals をもう一段厚くするなら trace する余地あり。
