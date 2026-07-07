# sources: copa (Copacetic)

各出典に番号を振り、recon の引用と対応させる。アクセス日は 2026-06-28。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | project-copacetic/copacetic (GitHub) | <https://github.com/project-copacetic/copacetic> | 2026-06-28 |
| 2 | repo | Copacetic README (Why/How と設計原則) | <https://github.com/project-copacetic/copacetic/blob/main/README.md> | 2026-06-28 |
| 3 | repo | Copacetic Governance | <https://github.com/project-copacetic/copacetic/blob/main/GOVERNANCE.md> | 2026-06-28 |
| 4 | repo | Releases (v0.14.1 ほか) | <https://github.com/project-copacetic/copacetic/releases> | 2026-06-28 |
| 5 | cncf | Copa プロジェクトページ (Sandbox, 2023-09-19 受理) | <https://www.cncf.io/projects/copa/> | 2026-06-28 |
| 6 | cncf | Sandbox onboarding issue #152 (Copa rename) | <https://github.com/cncf/sandbox/issues/152> | 2026-06-28 |
| 7 | cncf | Sandbox application issue #41 (Copacetic) | <https://github.com/cncf/sandbox/issues/41> | 2026-06-28 |
| 8 | blog | Microsoft Open Source: Project Copacetic | <https://opensource.microsoft.com/blog/2024/09/18/project-copacetic-quick-and-efficient-container-image-patching/> | 2026-06-28 |
| 9 | docs | Adopters ページ | <https://project-copacetic.github.io/copacetic/website/adopters> | 2026-06-28 |
| 10 | docs | Installation | <https://project-copacetic.github.io/copacetic/website/installation> | 2026-06-28 |
| 11 | docs | Quick start | <https://project-copacetic.github.io/copacetic/website/quick-start> | 2026-06-28 |
| 12 | repo | copa-action (GitHub Action) | <https://github.com/project-copacetic/copa-action> | 2026-06-28 |

## コード上の主要アンカー (pin `0f6f0ab`)

- CLI 入口 / バージョン / ErrNoUpdatesFound: `src/main.go:53`, `src/main.go:58-61`
- patch コマンド配線とフラグ: `src/pkg/cmd/cmd.go:56`, `86-113`, `120-133`
- パッチ オーケストレーション (timeout/select): `src/pkg/patch/patch.go:28`, `41-79`, `194-204`
- 単一アーキ パッチ本体: `src/pkg/patch/single.go:52`, `121`, `520-541`
- コア パッチ ロジック: `src/pkg/patch/core.go:91`, `99-127`, `209-231`, `304-311`
- レポート解析 / スキャナ プラグイン: `src/pkg/report/report.go:33-37`, `52-55`
- 中核データ構造: `src/pkg/types/unversioned/types.go:10-16`, `59-67`
- PackageManager interface と OS 分岐: `src/pkg/pkgmgr/pkgmgr.go:32-35`, `37-74`, `80-100`
- distroless 分岐 (非自明設計): `src/pkg/pkgmgr/dpkg.go:129`, `146-152`, `175-188`, `199`
- ライセンス: `src/LICENSE`、`src/go.mod:3` (Go 1.25.11)
