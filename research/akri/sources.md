# sources: Akri

recon.md の `(S#)` と対応。アクセス日は全て 2026-06-26。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| S1 | repo | project-akri/akri README + `gh api` メタデータ | <https://github.com/project-akri/akri> | 2026-06-26 |
| S2 | case-study | Akri (CNCF project page、Sandbox 受理日・ライセンス) | <https://www.cncf.io/projects/akri/> | 2026-06-26 |
| S3 | spec | [SANDBOX PROJECT ONBOARDING] Akri (cncf/toc issue #719) | <https://github.com/cncf/toc/issues/719> | 2026-06-26 |
| S4 | blog | Akri a Year Later (DeisLabs、出自と CNCF 移行) | <https://deislabs.io/posts/akri-a-year-later/> | 2026-06-26 |
| S5 | talk | Kubernetes Podcast ep.132 - Akri, with Kate Goldenring | <https://kubernetespodcast.com/episode/132-akri/> | 2026-06-26 |
| S6 | repo | Akri docs - Getting Started (Helm install / 前提) | <https://docs.akri.sh/user-guide/getting-started> | 2026-06-26 |
| S7 | blog | Kubernetes at the edge with Akri (Akri vs KubeEdge ほか比較) | <https://www.infoworld.com/article/2260916/kubernetes-at-the-edge-with-akri.html> | 2026-06-26 |
| S8 | repo | akri/GOVERNANCE.md (Contributor/Maintainer/Admin ロール) | <https://github.com/project-akri/akri/blob/main/GOVERNANCE.md> | 2026-06-26 |

## コード参照 (pinned commit `604bdcb`)

- `shared/src/akri/configuration.rs:90,114` — `BrokerSpec` / `ConfigurationSpec`
- `shared/src/akri/instance.rs:54,59,76,81,90` — `InstanceSpec` と主要フィールド
- `agent/src/main.rs:23,42,49,61,69,75,89` — Agent 起動とタスク
- `agent/src/util/discovery_configuration_controller.rs:38,80,127,149,164,176` — Configuration reconcile
- `agent/src/discovery_handler_manager/discovery_handler_registry.rs:52,63,94,139,186,213,239,288,309,322` — DH registry / device_hash / Instance 変換
- `agent/src/device_manager/cdi.rs:1,11,21` — CDI スキーマ
- `controller/src/main.rs:21,42,48` — Controller 起動
- `controller/src/util/instance_action.rs:46` — `InstanceAction`
- `discovery-utils/proto/discovery.proto` — gRPC Registration / DiscoveryHandler
