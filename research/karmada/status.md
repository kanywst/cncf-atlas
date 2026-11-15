# status: Karmada

- [x] recon 完了 @ commit `aad59e116bec4196dfbd366932324e98ee11dd76` (2026-11-13, re-pin。旧 `658499d7080640f78c3d9f5cbf9db58428a902a3`)
- [x] sources 整理 (re-pin で再取得、<https://github.com/karmada-io/karmada>)
- [x] write: en 6 セクション
- [x] write: ja 6 セクション
- [x] tools.ts に登録 (category: Orchestration & Scheduling, maturity: Graduated)
- [x] `npm run docs:build` グリーン
- [x] markdownlint clean

## re-pin メモ (2026-11-16)

- 旧 pin から 270 コミット。`git describe` = `v1.20.0-beta.0-28-gaad59e116` (<https://github.com/karmada-io/karmada/releases/tag/v1.20.0-beta.0>)。
- 全 path:line アンカーを新 sha で再検証。ずれたのは execution_controller.go (+15 から +38)、binding_types.go の Components/Clusters、work_types.go の Manifests field、propagation_types.go の field/type 行。旧版で type 行とコメント行が混ざっていたものは field 行 + type 行に揃えた (<https://github.com/karmada-io/karmada/tree/aad59e116bec4196dfbd366932324e98ee11dd76>)。
- 中身が変わった主張: ドリフト修正が work status controller から execution controller へ移動 (PR #7552, <https://github.com/karmada-io/karmada/pull/7552>)。architecture / internals の step 5 を書き直し。
- 追加: TargetCluster.Components (PR #7833, <https://github.com/karmada-io/karmada/pull/7833>)、feature gate の既定値、v1.19.0 / v1.19.1 / v1.20.0-beta.0、Graduation の日付と要件 (<https://www.cncf.io/announcements/2026/09/07/cloud-native-computing-foundation-announces-karmada-graduation/>)。
- 削除なし。ADOPTERS.md は旧 pin と同一。adopters ページは 40+ から 48 組織に。
- getting-started は README の Prerequisites / `hack/local-up-karmada.sh` / `samples/nginx/*` を新 sha で再確認、変更なし。

## メモ

- 中核ストーリー: テンプレート → detector → ResourceBinding → scheduler (filter/score/select/assign) → binding controller が Work 生成 → execution controller がメンバークラスタへ適用 + ドリフト時に再キュー。
- 推し設計: Lua Resource Interpreter (任意 CRD 対応)、Push/Pull モード、execution space namespace。
- adopters 実名は `karmada.io/adopters` と CNCF アナウンスが一次情報。ADOPTERS.md には実名なし。捏造しないこと。
