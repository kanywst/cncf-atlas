# status: Tekton

- [x] recon 完了 @ commit `9dec5e4b1530cb040eb2edbfcdc1f4a0985ce25f`
- [x] sources 整理
- [x] write: en 6 セクション
- [x] write: ja 6 セクション
- [x] tools.ts に登録
- [x] `npm run docs:build` グリーン
- [x] markdownlint clean

## メモ

- slug `tekton` / category `App Definition & GitOps` / maturity `Incubating`
- Internals の主役は `pkg/pod/entrypoint.go:127` `orderContainers` の step 直列化。ここを厚く書く
- 採用事例は `cncf/toc#1310` と CNCF 発表記事に出た名前だけ。Apple は申請上「要確認」なので使わない
- Getting Started の install URL は repo の `docs/install.md` から取った (`https://infra.tekton.dev/tekton-releases/pipeline/latest/release.yaml`)。実クラスタでの実行は未検証
- 公開先: `docs/tools/tekton/` と `docs/ja/tools/tekton/`。カタログ登録済み (App Definition & GitOps / Incubating)
