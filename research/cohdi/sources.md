# sources: CoHDI

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は全て 2026-06-27。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | CoHDI/composable-resource-operator (commit 761a00b, tag v0.2.0) | <https://github.com/CoHDI/composable-resource-operator> | 2026-06-27 |
| 2 | repo | CoHDI GitHub organization (リポジトリ一覧) | <https://github.com/CoHDI> | 2026-06-27 |
| 3 | repo | CoHDI/.github profile README (How it works / アーキ図) | <https://github.com/CoHDI/.github/blob/main/profile/README.md> | 2026-06-27 |
| 4 | repo | CoHDI ADOPTERS.md (NTT / NEC / Fujitsu / IBM Research) | <https://github.com/CoHDI/.github/blob/main/ADOPTERS.md> | 2026-06-27 |
| 5 | repo | CoHDI GOVERNANCE.md (Values / Maintainers / Voting) | <https://github.com/CoHDI/.github/blob/main/GOVERNANCE.md> | 2026-06-27 |
| 6 | spec | cncf/sandbox Issue #361 (CoHDI Sandbox 提案、提案者・日付) | <https://github.com/cncf/sandbox/issues/361> | 2026-06-27 |
| 7 | spec | cncf/sandbox Issue #454 (CoHDI PROJECT ONBOARDING) | <https://github.com/cncf/sandbox/issues/454> | 2026-06-27 |
| 8 | case-study | CNCF project page CoHDI (受理日 2025-12-19 / Sandbox) | <https://www.cncf.io/projects/cohdi/> | 2026-06-27 |
| 9 | spec | KEP-5007 device-attach-before-pod-scheduled (上流スケジューラ拡張) | <https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/5007-device-attach-before-pod-scheduled> | 2026-06-27 |
| 10 | repo | project-cdim/cdim (連携先 CDIM、NEC) | <https://github.com/project-cdim/cdim> | 2026-06-27 |
| 11 | blog | CNCF blog: Exploring cloud native projects in sandbox (背景記事) | <https://www.cncf.io/blog/2025/08/11/exploring-cloud-native-projects-in-sandbox-13-arrivals-from-2024-h2/> | 2026-06-27 |

## コードアンカー (本文で引用した file:line)

| ファイル | 行 | 内容 |
| --- | --- | --- |
| `cmd/main.go` | 61 | `func main()` エントリポイント |
| `cmd/main.go` | 167 / 176 / 186 / 196 | 3 reconciler + webhook 登録 |
| `api/v1alpha1/composabilityrequest_types.go` | 36 / 40 / 67 / 74 | `ComposabilityRequestSpec` / `ScalarResourceDetails` / Status |
| `api/v1alpha1/composableresource_types.go` | 27 / 36 | `ComposableResourceSpec` / `ComposableResourceStatus` |
| `internal/cdi/client.go` | 25 / 34 | `DeviceInfo` / `CdiProvider` interface |
| `internal/controller/composableresource_adapter.go` | 40 / 63 | プロバイダ選択 / FTI CM・FM 分岐 |
| `internal/controller/composabilityrequest_controller.go` | 72 / 197 / 213 / 487 / 551 / 658 / 684 | 二段 reconcile の状態機械と Watch |
| `internal/controller/composableresource_controller.go` | 82 / 185 / 209 / 333 | デバイス着脱の状態機械 |
| `internal/cdi/fti/fm/client.go` | 50 / 100 / 147 / 195 / 416 | `FTIClient` / AddResource / FM PATCH / OptionStatus 判定 / machine UUID 解決 |
| `internal/cdi/fti/token.go` | 58 / 74 / 103 | `CachedToken` / GetToken / Token (password grant) |
| `internal/controller/upstreamsyncer_controller.go` | 38 / 49 / 79 / 140 | 猶予期間 / 同期 goroutine / ドリフト照合 / detach CR 生成 |
| `internal/webhook/v1alpha1/composabilityrequest_webhook.go` | 60 / 100 | validating webhook |
| `README.md` | 181-187 | 未解決マージコンフリクトマーカー |
