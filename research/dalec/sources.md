# sources: Dalec

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | project-dalec/dalec README | <https://github.com/project-dalec/dalec/blob/main/README.md> | 2026-06-26 |
| 2 | repo | project-dalec/dalec（pinned `0d888c2`） | <https://github.com/project-dalec/dalec> | 2026-06-26 |
| 3 | blog | Dalec: Declarative Package and Container Builds（Microsoft Community Hub） | <https://techcommunity.microsoft.com/blog/linuxandopensourceblog/dalec-declarative-package-and-container-builds/4465290> | 2026-06-26 |
| 4 | proposal | [Sandbox] Dalec, cncf/sandbox Issue #396 | <https://github.com/cncf/sandbox/issues/396> | 2026-06-26 |
| 5 | cncf | Dalec project page（CNCF） | <https://www.cncf.io/projects/dalec/> | 2026-06-26 |
| 6 | docs | Dalec documentation site | <https://project-dalec.github.io/dalec/> | 2026-06-26 |
| 7 | blog | What's new with Microsoft at KubeCon NA 2025 | <https://opensource.microsoft.com/blog/2025/11/10/whats-new-with-microsoft-in-open-source-and-kubernetes-at-kubecon-north-america-2025/> | 2026-06-26 |
| 8 | blog | What's new with Microsoft at KubeCon EU 2026 | <https://opensource.microsoft.com/blog/2026/03/24/whats-new-with-microsoft-in-open-source-and-kubernetes-at-kubecon-cloudnativecon-europe-2026/> | 2026-06-26 |
| 9 | ref | moby/buildkit（LLB / フロントエンド機構） | <https://github.com/moby/buildkit> | 2026-06-26 |
| 10 | docs | Docker BuildKit custom frontend syntax | <https://docs.docker.com/build/buildkit/frontend/> | 2026-06-26 |
| 11 | api | GitHub REST: repos/project-dalec/dalec（stars/forks/license/dates） | <https://api.github.com/repos/project-dalec/dalec> | 2026-06-26 |

## コード内アンカー（pinned `0d888c2`、`research/dalec/src/` 配下）

- エントリポイント: `cmd/frontend/main.go:34`（`main`）, `:90`（`dalecMain`）, `:92`（`NewRouter`）, `:96`（`Handler`）, `:99`（`RunFromEnvironment`）
- ルーター: `frontend/router.go:49`（`Route`）, `:73`（`Router`）, `:79`（`Add`）, `:119`（`Handle`）, `:148`（`lookupTarget`）, `:158`（dispatch）, `:399`（`WithTargetForwardingHandler`）
- spec モデル: `spec.go:20`（`Spec`）, `:56`（`Sources`）, `:85`（`Targets`）, `:103`（`Tests`）
- source union: `source.go:31`（`Source`）, `:36-42`（variants）, `:70`（`UnmarshalYAML`）
- RPM ターゲット: `targets/linux/rpm/distro/distro.go:14`（`Config`）, `:93`（`Routes`）; `targets/linux/rpm/distro/pkg.go:47`（`BuildPkg`）; `targets/linux/rpm/distro/container.go:17`（`BuildContainer`）
- RPM テンプレート: `packaging/linux/rpm/template.go:23`（`specTmpl`）; `packaging/linux/rpm/rpmbuild.go:24`（`Build`）, `:58`（`ValidateSpec`）; `packaging/linux/rpm/buildroot.go:40`（`BuildRoot`）
- 例: `docs/examples/hello.inline.yml:1`（syntax ディレクティブ）
- メタ: `go.mod:3`（`go 1.25.9`）, `LICENSE`（Apache-2.0）, `MAINTAINERS.md`, `GOVERNANCE.md`
