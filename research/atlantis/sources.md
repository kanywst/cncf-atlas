# sources: Atlantis

各出典に番号を振り、ドキュメント側の引用と対応させる。参照日は 2026-06-26。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | runatlantis/atlantis (source, pin `b7cea53`) | <https://github.com/runatlantis/atlantis> | 2026-06-26 |
| 2 | blog | Introducing Atlantis (Luke Kysow, Medium) | <https://medium.com/runatlantis/introducing-atlantis-6570d6de7281> | 2026-06-26 |
| 3 | blog | Moving Atlantis to runatlantis/atlantis (Medium) | <https://medium.com/runatlantis/moving-atlantis-to-runatlantis-atlantis-on-github-4efc025bb05f> | 2026-06-26 |
| 4 | repo/issue | [Sandbox] Atlantis (cncf/sandbox#60) | <https://github.com/cncf/sandbox/issues/60> | 2026-06-26 |
| 5 | repo/issue | Atlantis sandbox submission review (cncf/tag-app-delivery#474) | <https://github.com/cncf/tag-app-delivery/issues/474> | 2026-06-26 |
| 6 | landscape | Atlantis (CNCF project page) | <https://www.cncf.io/projects/atlantis/> | 2026-06-26 |
| 7 | docs | Atlantis docs site (runatlantis.io) | <https://www.runatlantis.io> | 2026-06-26 |
| 8 | alternatives | Spacelift: Atlantis alternatives | <https://spacelift.io/blog/atlantis-alternatives> | 2026-06-26 |
| 9 | alternatives | env0: best Atlantis alternative | <https://www.env0.com/alternatives/atlantis-alternative> | 2026-06-26 |
| 10 | alternatives | Digger: why OpenTaco | <https://digger.dev/whyopentaco> | 2026-06-26 |
| 11 | guide | Scalr: Terraform & Terragrunt with Atlantis | <https://scalr.com/learning-center/the-ultimate-guide-to-terraform-atlantis-with-terragrunt> | 2026-06-26 |
| 12 | guide | Scalr: Atlantis and OpenTofu | <https://scalr.com/learning-center/atlantis-and-opentofu-building-the-future-of-open-source-infrastructure-automation/> | 2026-06-26 |
| 13 | repo | ADOPTERS.md (pin `b7cea53`) | <https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md> | 2026-06-26 |
| 14 | repo | MAINTAINERS.md (pin `b7cea53`) | <https://github.com/runatlantis/atlantis/blob/main/MAINTAINERS.md> | 2026-06-26 |
| 15 | release | runatlantis/atlantis releases (v0.44.0, 2026-06-10) | <https://github.com/runatlantis/atlantis/releases> | 2026-06-26 |

## コード上の確認 (pin `b7cea535d4d83b1ceeb428fca61458c126c107e3`)

- エントリポイント / サブコマンド登録: `main.go:48-54`、著作権/ライセンス: `main.go:1-2`。
- webhook 受信と分岐: `server/controllers/events/events_controller.go:101,110-117,169`、コメントイベント集約と非同期実行: `:673,742`。
- コメント解釈: `server/events/comment_parser.go:156,172-181`。
- コマンドオーケストレーション: `server/events/command_runner.go:292,313-329,351,372-381,416-418,420`。
- plan のプロジェクト構築と実行: `server/events/plan_command_runner.go:194,214,270-277,279`。
- プロジェクト単位 plan と二重ロック: `server/events/project_command_runner.go:242,666,668,678,685,710,719-725`、ステップディスパッチャ: `:902,906,913-940,917`。
- terraform バイナリ実行: `server/core/runtime/plan_step_runner.go:50,51-58,60,62,63-66`。
- ロックキー / TryLock: `server/core/locking/locking.go:18-25,34-40,49-50,53-66`。
- データ構造: `server/events/command/project_context.go:24,57-61`、`server/events/models/models.go:271,290,298-301`、`server/core/config/valid/repo_cfg.go:231,252`。
- ビルド/テスト: `Makefile:25-26,51-52`。
- GitHub 統計 (gh repo view, 2026-06-26): stars 9,155 / forks 1,285 / license apache-2.0 / createdAt 2018-02-06。
