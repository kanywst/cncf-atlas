# status: Litmus (LitmusChaos)

- [x] recon 完了 @ commit `97cfc6f1ee73af5f8e6b7f8c01e97b116cccfc0c` (tag 3.30.0)
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `litmus` / name: Litmus (LitmusChaos) / category: Chaos Engineering / maturity: Incubating
- repo は 3.x でコントロールプレーン (ChaosCenter) 中心。fault 実体は `litmus-go`、実験 YAML は `chaos-charts` と別 repo。write 時に「この repo が何をカバーするか」を最初に明示しないと読者が混乱する
- 代表トレースは runChaosExperiment mutation → agent push の経路で確定。agent dial-back + インメモリ channel state が非自明な設計。architecture / internals はこれを軸に書ける
- 採用事例は ADOPTERS.md が厚く出典付き。捏造の必要なし。Intuit / Orange / Mercedes / Adidas / Red Hat / VMware あたりが安全
- 薄い点: 2.x → 3.x の移行理由と Argo Workflows への依存度は docs 側でもう少し裏取りすると getting-started / architecture が締まる。resiliency score の算出ロジックは未読 (必要なら chaos_experiment_run handler を追う)
</content>
