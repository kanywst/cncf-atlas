# status: HolmesGPT

- [x] recon 完了 @ commit `84cb39c9a3267d676dc82550c2a3e4732f7ca68a`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- slug: `holmesgpt` / category: Observability / maturity: Sandbox（2025-10-08 受理）
- canonical repo は `HolmesGPT/holmesgpt`（旧 `robusta-dev/holmesgpt` から移管）。write 時に旧 URL を使わないこと。
- 近いタグは `0.35.0`。pinned commit はその後ろ（0.36.0-alpha と同日 2026-07-01 の直後 2026-07-06）。Internals の file:line はこの commit 基準。
- 決定的 vs LLM 駆動の切り分けが本プロジェクトの読みどころ。Architecture / Internals で必ず活かす。
- Adopter は ADOPTERS.md の 2 組織のみ（Microsoft AKS Team / Innovaccer）。増やさない。
- 代替は K8sGPT・kagent（どちらも CNCF Sandbox）。strawman にしない。
- 第 2 パス候補（薄い所）: (1) LLM 層 `llm.py` の model registry / トークン計算の詳細、(2) context 圧縮 `truncation/` の具体アルゴリズム、(3) Operator Mode（スケジュール実行）の実装パス。deep-dive で Internals を厚くするなら足す。
