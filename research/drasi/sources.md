# sources: Drasi

各出典に番号を振り、recon.md / ドキュメント側の引用と対応させる。参照日は 2026-07-08。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| S1 | repo | drasi-project/drasi-platform (GitHub, gh API: stars/forks/createdAt/languages) | <https://github.com/drasi-project/drasi-platform> | 2026-07-08 |
| S2 | case-study / project | Drasi \| CNCF プロジェクトページ (Sandbox, 2025-01-21 受理) | <https://www.cncf.io/projects/drasi/> | 2026-07-08 |
| S3 | blog | Introducing Drasi: Microsoft's new change data processing system (Azure Blog, Mark Russinovich, 2024-10-09) | <https://azure.microsoft.com/en-us/blog/drasi-microsofts-newest-open-source-project-simplifies-change-detection-and-reaction-in-complex-systems/> | 2026-07-08 |
| S4 | blog | Drasi accepted into CNCF sandbox for change-driven solutions (Microsoft Open Source Blog, 2025-06-10) | <https://opensource.microsoft.com/blog/2025/06/10/drasi-accepted-into-cncf-sandbox-for-change-driven-solutions/> | 2026-07-08 |
| S5 | docs | Drasi 公式ドキュメント (drasi.io) | <https://drasi.io/> | 2026-07-08 |
| S6 | repo / issue | [Sandbox] Drasi · Issue #296 · cncf/sandbox | <https://github.com/cncf/sandbox/issues/296> | 2026-07-08 |
| S7 | blog | Exploring Cloud Native projects in CNCF Sandbox. Part 5: 13 arrivals of January 2025 (Palark) | <https://palark.com/blog/cncf-sandbox-2025-jan/> | 2026-07-08 |
| S8 | docs | Continuous Queries \| Drasi Docs | <https://drasi.io/concepts/continuous-queries/> | 2026-07-08 |
| S9 | docs | Reactions \| Drasi Docs | <https://drasi.io/concepts/reactions/> | 2026-07-08 |
| S10 | case-study | Netstar \| CNCF Case Study | <https://www.cncf.io/case-studies/netstar/> | 2026-07-08 |
| S11 | blog | How Netstar Streamlined Fleet Monitoring and Reduced Custom Integrations with Drasi (Microsoft Community Hub) | <https://techcommunity.microsoft.com/blog/linuxandopensourceblog/how-netstar-streamlined-fleet-monitoring-and-reduced-custom-integrations-with-dr/4499592> | 2026-07-08 |

## src 内 file:line アンカー (pin: drasi-platform 62b10c72, drasi-core a0273f22)

| 箇所 | パス | 内容 |
| --- | --- | --- |
| publish-api ルート | query-container/publish-api/src/main.rs:45,59 | `/change` エンドポイント + `{id}-publish` トピック名 |
| publish-api XADD | query-container/publish-api/src/publisher.rs:78 | Redis Stream へ xadd |
| change stream consumer group | query-container/query-host/src/change_stream/redis_change_stream.rs:51,73,183 | xgroup_create_mkstream / group "qh" / xack |
| worker 受信ループ | query-container/query-host/src/query_worker.rs:363,383 | `recv::<ChangeEvent>` / 他クエリ宛スキップ |
| worker process_change | query-container/query-host/src/query_worker.rs:502,524,576 | process_source_change 呼び出し + publish |
| bootstrap | query-container/query-host/src/query_worker.rs:590,652 | 初期データを Insert として投入 |
| source subscribe | query-container/query-host/src/source_client.rs:48 | source の /subscription に POST |
| result 発行 | query-container/query-host/src/result_publisher.rs:47,61 | Dapr pub/sub `{query_id}-results` + traceparent |
| QueryActor | query-container/query-host/src/query_actor.rs:42,43,48 | Dapr 仮想アクター + ActorContextClient |
| 継続クエリ本体 | drasi-core/core/src/query/continuous_query.rs:47,89,165,196 | ContinuousQuery / process_source_change / build_solution_changes / Update 分岐 |
| reactive-graph 痕跡 | drasi-core/shared-tests/src/use_cases/rolling_average_decrease_by_ten/queries.rs:18 | `apiVersion: query.reactive-graph.io/v1` |
