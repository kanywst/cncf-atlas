# status: Kyverno

- [x] recon 完了 @ commit `989e001817e9f860dc89a610b2a2ddb1a27d3a74`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo resolution: `kyverno/kyverno` で確定。CRD の Go 型は別モジュール `github.com/kyverno/api` に分離済み (本体は import 側)。deep-dive はこの本体リポを軸にする。
- pinned commit `989e001` は main の HEAD (2026-06-20)。直近リリースは `v1.18.1` (2026-05-18)。depth 1 clone なので `git describe` 不可、タグは GitHub API で確認した。
- カテゴリは Security & Compliance バケットにマップ。
- tagline 候補 (en): "Kubernetes-native Policy-as-Code where policies are just YAML resources, covering validate, mutate, generate, and image verification."
- tagline 候補 (ja): "policy 自体を Kubernetes の YAML リソースとして書く Policy-as-Code エンジン。検証・変更・生成・イメージ検証を 1 つでカバー。"
- write 段階で深掘りすべき: CEL (vpol/mpol/ivpol/gpol) 移行と旧 ClusterPolicy の関係、autogen の v1/v2 差、generate/mutateExisting の background controller 非同期経路。
- adopters は ADOPTERS.md と CNCF announcement で裏取り済みのみ採用。LinkedIn の 230+ クラスタ / 20K req/min は announcement 由来。GitHub stats は 2026-06-22 時点 (stars 7,859 / forks 1,402)。
