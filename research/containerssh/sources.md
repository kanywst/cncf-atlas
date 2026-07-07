# sources: ContainerSSH

各出典に番号を振り、ドキュメント側の引用と対応させる。参照日は 2026-06-26。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | ContainerSSH/ContainerSSH (GitHub) | <https://github.com/ContainerSSH/ContainerSSH> | 2026-06-26 |
| 2 | repo | README.md (ContainerSSH/ContainerSSH) | <https://github.com/ContainerSSH/ContainerSSH/blob/main/README.md> | 2026-06-26 |
| 3 | project page | ContainerSSH (CNCF) | <https://www.cncf.io/projects/containerssh/> | 2026-06-26 |
| 4 | blog / sandbox | CNCF Sandbox projects | <https://www.cncf.io/sandbox-projects/> | 2026-06-26 |
| 5 | article / talk recap | Creating an SSH honeypot (LWN.net, FOSDEM 2021) | <https://lwn.net/Articles/848291/> | 2026-06-26 |
| 6 | docs | About ContainerSSH | <https://containerssh.io/about/> | 2026-06-26 |
| 7 | docs | Getting started / quick start | <https://containerssh.io/v0.5/getting-started/> | 2026-06-26 |
| 8 | docs | Honeypot use case | <https://containerssh.io/v0.5/usecases/honeypots/> | 2026-06-26 |
| 9 | repo | ContainerSSH/examples (quick-start) | <https://github.com/ContainerSSH/examples> | 2026-06-26 |
| 10 | api | GitHub REST API (stars/forks/contributors/created_at) | <https://api.github.com/repos/ContainerSSH/ContainerSSH> | 2026-06-26 |
| 11 | provenance | slsa-verifier | <https://github.com/slsa-framework/slsa-verifier> | 2026-06-26 |

## コード内の主要アンカー (pin: `ce7d2b6dbe3a592355c50ef4d80f7ae10eb3fa26`)

- エントリポイント: `cmd/containerssh/main.go`、`main.go:26` (`Main`)
- handler 組み立て: `factory.go:22` (`New`)、`factory.go:54-78`
- backend ブリッジ: `internal/backend/handler.go:96` / `:130` / `:139` / `:179`
- config webhook: `internal/config/loader_http.go:37`
- 認証 webhook endpoint: `internal/auth/webhook_client_impl.go:47` `/authz`、`:68` `/password`、`:92` `/pubkey`
- Docker backend: `internal/docker/handler_network.go:52` / `:88-95` / `:164`、`internal/docker/handler_channel.go:80` / `:91-95` / `:129` / `:147` / `:187` / `:199`
- SSH インターフェース: `internal/sshserver/handler.go:19` / `:35` / `:97`
- ルート設定: `config/appconfig.go:11` / `:92` / `:103`
