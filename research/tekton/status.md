# status: Tekton

- [x] recon 完了 @ commit `9dec5e4b1530cb040eb2edbfcdc1f4a0985ce25f`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug `tekton` / category `App Definition & GitOps` / maturity `Incubating`
- Internals の主役は `pkg/pod/entrypoint.go:127` `orderContainers` の step 直列化。ここを厚く書く
- 採用事例は `cncf/toc#1310` と CNCF 発表記事に出た名前だけ。Apple は申請上「要確認」なので使わない
- Getting Started は未検証。`kubectl apply` の release URL とバージョンは write の前に tekton.dev の install ページで現物確認する
