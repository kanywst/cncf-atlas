# status: Operator Framework (operator-sdk)

- [x] recon 完了 @ commit `c7f6cde9810ed74eb7fc3316b50197495c6fe725`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 解決: Operator Framework は傘プロジェクト。一次実装として開発者向け `operator-framework/operator-sdk` を採用 (stars 7,658 で org 最大、Go、CLI 体験の中心)。OLM 本体を扱いたい場合の代替候補は `operator-lifecycle-manager` (v0, maintenance) と `operator-controller` (v1, active)
- pinned: `c7f6cde` (2026-05-26 master)、近いタグ `v1.42.2` (2026-03-19)。shallow clone のため tags は別途 fetch 済み。`git describe` は shallow で失敗する
- 代表パス: `operator-sdk run bundle` を cmd -> Install.setup -> OperatorInstaller.InstallOperator まで追跡済み (path:line は recon.md)
- 非自明設計: スキャフォルドは kubebuilder v4 に委譲、operator-sdk 独自は OLM glue / bundle / scorecard 層
- write 段の宿題: citable な named adopter が未確保 (ADOPTERS.md なし)。OperatorHub / CNCF case study を追えるか確認。category は "App Definition & GitOps" 固定で使用
- ライセンスは同梱 LICENSE を Apache-2.0 と実物確認済み
</content>
