# sources: Cadence Workflow

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | cadence-workflow/cadence (core engine) | <https://github.com/cadence-workflow/cadence> | 2026-06-26 |
| 2 | case-study | CNCF project page: Cadence Workflow (Sandbox, accepted 2025-05-22) | <https://www.cncf.io/projects/cadence-workflow/> | 2026-06-26 |
| 3 | blog | Uber Blog: Cadence Workflow Joins the CNCF | <https://www.uber.com/us/en/blog/cadence-workflow-joins-the-cloud-native-computing-foundation/> | 2026-06-26 |
| 4 | blog | cadenceworkflow.io: Cadence Joins CNCF | <https://cadenceworkflow.io/blog/2025/10/06/cadence-joins-cncf-cloud-native-computing-foundation> | 2026-06-26 |
| 5 | talk | ia40: Temporal Founders Samar Abbas and Maxim Fateev (Cadence origin + Temporal fork) | <https://www.ia40.com/blog-podcast/temporal-founders-samar-abbas-and-maxim-fateev> | 2026-06-26 |
| 6 | blog | Amplify Partners: Our Investment in Temporal (2019 fork timeline) | <https://www.amplifypartners.com/blog-posts/our-investment-in-temporal> | 2026-06-26 |
| 7 | blog | Instaclustr: Uber donates Cadence Workflow to CNCF | <https://www.instaclustr.com/blog/cadence-workflow-uber-cncf-projects/> | 2026-06-26 |
| 8 | spec | Cadence vs Temporal FAQ | <https://cadenceworkflow.io/faq/cadence-vs-temporal> | 2026-06-26 |
| 9 | repo | cncf/sandbox issue #368: [Sandbox] Cadence | <https://github.com/cncf/sandbox/issues/368> | 2026-06-26 |
| 10 | repo | ADOPTERS.md (Uber / NetApp / DoorDash / Cloudera) | <https://github.com/cadence-workflow/cadence/blob/master/ADOPTERS.md> | 2026-06-26 |
| 11 | repo | cadence-go-client (official Go SDK) | <https://github.com/cadence-workflow/cadence-go-client> | 2026-06-26 |
| 12 | repo | cadence-web (UI) | <https://github.com/cadence-workflow/cadence-web> | 2026-06-26 |

## コード参照 (pinned commit 66dcbaf)

- frontend エントリ: `service/frontend/api/handler.go:1650`
- history エンジン: `service/history/engine/engineimpl/start_workflow_execution.go:53`
- MutableState: `service/history/execution/mutable_state.go:60`
- WorkflowExecutionInfo: `common/persistence/data_manager_interfaces.go:392`
- HistoryEvent: `common/types/shared.go:3574`
- shard.Context: `service/history/shard/context.go:55`
- rangeID fencing: `service/history/shard/context.go:1117`
- main entrypoint: `cmd/server/main.go:38`
