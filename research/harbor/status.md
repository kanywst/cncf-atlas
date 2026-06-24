# status: Harbor

- [x] recon 完了 @ commit `687298935db944c5df68e0c3b14b410ba005cbe2`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 確定: `goharbor/harbor` が主実装。周辺は harbor-helm / harbor-operator / harbor-cli / website に分散するが deep-dive 対象は本リポジトリ。
- バージョン注意: main の `VERSION` は `v2.16.0` (開発中)。GitHub の latest release フラグは `v2.14.4` (2026-05-11)、tag には `v2.15.1` まで存在。write 時は「pin したのは main の開発版、安定版は v2.14.x/v2.15.x」と明記すること。
- カテゴリは本エンジンのバケットで Supply Chain にマップ。CNCF landscape 上は Runtime (Container Registry) 分類なので write 側で誤解されないよう一言補足。
- 採用事例は ADOPTERS.md 由来のみ使用。捏造なし。数値 (ノード数・イメージ数) はすべて ADOPTERS.md の Success Stories から。
- 代表操作トレースは image pull (GET manifest)。push 側 (putManifest の tag 非保存設計) を非自明設計として併記済み。write で図にすると映える。
- 統計 (2026-06-22 時点, gh api): stars 28,755 / forks 5,264 / 言語 Go / Apache-2.0。contributors はリポジトリレベルで約 661 (web、2026-06-21)。CNCF ecosystem 集計の 5,564 とは別物なので混同しない。
