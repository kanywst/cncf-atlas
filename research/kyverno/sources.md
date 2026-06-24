# sources: Kyverno

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は 2026-06-22。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | kyverno/kyverno (source, pinned `989e001`) | <https://github.com/kyverno/kyverno> | 2026-06-22 |
| 2 | announcement | CNCF Announces Kyverno's Graduation | <https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/> | 2026-06-22 |
| 3 | project page | Kyverno - CNCF project | <https://www.cncf.io/projects/kyverno/> | 2026-06-22 |
| 4 | blog | Announcing Kyverno release 1.18 | <https://www.cncf.io/blog/2026/05/05/announcing-kyverno-release-1-18/> | 2026-06-22 |
| 5 | comparison | Kubernetes Policy Comparison: Kyverno vs OPA/Gatekeeper (Nirmata) | <https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/> | 2026-06-22 |
| 6 | comparison | OPA/Gatekeeper vs Kyverno (policyascode.dev) | <https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/> | 2026-06-22 |
| 7 | docs | Kyverno Introduction / Quick Start | <https://kyverno.io/docs/introduction/> | 2026-06-22 |
| 8 | repo file | ADOPTERS.md (publicly shared adopters) | <https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md> | 2026-06-22 |
| 9 | repo file | GOVERNANCE.md / MAINTAINERS.md (point to kyverno/community) | <https://github.com/kyverno/community/blob/main/GOVERNANCE.md> | 2026-06-22 |
| 10 | api | GitHub REST API repos/kyverno/kyverno (stars/forks/license) | <https://api.github.com/repos/kyverno/kyverno> | 2026-06-22 |

## コード内アンカー (commit `989e001817e9f860dc89a610b2a2ddb1a27d3a74`)

- `cmd/kyverno/main.go` — admission controller の main entrypoint。CEL エンジン import は `:24-31`。
- `pkg/webhooks/server.go:76-213` — webhook HTTP ルーティング (CEL policy 経路 + 旧 ClusterPolicy 経路)。
- `pkg/webhooks/resource/handlers.go:112` — `Validate` admission handler。
- `pkg/webhooks/resource/validation/validation.go:74,107,148` — `HandleValidationEnforce` / `engine.Validate` 呼び出し / `BlockRequest`。
- `pkg/engine/engine.go:17,68` — `Engine` interface / `Validate` 実装。
- `pkg/engine/validation.go:16,30,72` — `validate` / `autogen.Default.ComputeRules` / `invokeRuleHandler`。
- `pkg/autogen/v1/autogen.go:207` — Pod controller への rule 自動生成 `ComputeRules`。
- `api/kyverno/v1/rule_types.go:45` — `Rule` 構造体。
- `pkg/engine/api/engineresponse.go:15`, `pkg/engine/api/ruleresponse.go:25` — `EngineResponse` / `RuleResponse`。
- `LICENSE:1` — Apache-2.0。`go.mod:3` — `go 1.26.2`。
