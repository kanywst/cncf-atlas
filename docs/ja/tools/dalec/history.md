# 歴史

## 起源

Dalec は Microsoft の Azure Upstream チームが始めたプロジェクトで、GitHub リポジトリの作成は 2023-06-08 である (GitHub API の `created_at`)。発端となった課題は社内的なものだった。Azure は、コンプライアンス要件を満たす形でソフトウェアパッケージをビルドする必要があった。すなわち、署名済みパッケージ・SBOM・provenance を伴う再現可能なビルドである。ネイティブな RPM/DEB パッケージをそのように作るには、通常は distro 固有のツール、ビルドホスト、手書きのスクリプトが要る。Dalec はそれを 1 枚の宣言的 spec にまとめ、Docker BuildKit 上で回すために作られた。結果として、ビルドには `docker build` 以外のツールが不要になる (Microsoft Community Hub ブログ、cncf/sandbox #396)。

Microsoft は Dalec を製品として提供していない。Sandbox 提案は、AKS が upstream Kubernetes に対して持つ関係と同じ位置づけで説明している。Microsoft は Dalec を自社のコンプライアンスビルドに downstream で使い、オープンに開発する。販売はしない (cncf/sandbox #396)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2023 | Azure Upstream チームが GitHub リポジトリを作成 (2023-06-08) |
| 2025 | CNCF Sandbox 提案を起票 (cncf/sandbox #396、2025-07-18)、Sandbox として採択 (2025-10-08)、リポジトリを `Azure/dalec` から `project-dalec` 組織へ移管 |
| 2026 | `v0.21.x` リリースラインが活発。本ドキュメントは `0d888c2` (タグ `v0.21.2` の近傍) を基準 |

## どう進化したか

明確な転換点は 2 つ、ガバナンスと名称であり、両者は同時に起きた。2025-07-18、Riya Choudary が Azure Upstream チームを代表して CNCF Sandbox 提案を起票した。スポンサー連絡先は Microsoft の Brendan Burns で、Jeremy Rickard (TOC メンバー)、Lachie Evenson (Governing Board メンバー)、Bridget Kromhout ら CNCF の関係者が支持した (cncf/sandbox #396)。提案は投票を通過し (issue に `gitvote/passed` ラベル)、2025-10-08 に Sandbox レベルで採択された (CNCF プロジェクトページ)。

その採択の前後で、プロジェクトは Microsoft の名前空間から離れた。リポジトリは `Azure/dalec` から `project-dalec/dalec` へ移った。GitHub は旧パスから 301 リダイレクトを返し、Go module は `github.com/project-dalec/dalec` になり、著作権表記は「Dalec a Series of LF Projects, LLC」と読める (README)。コードは同じで、住所がベンダー中立な CNCF 組織へ変わった。Microsoft はその後も KubeCon NA 2025 と EU 2026 で Dalec を CNCF プロジェクトとして紹介している (Microsoft オープンソースブログ)。

## 現在地

Dalec は活発な CNCF Sandbox プロジェクトで、リリースは着実なペースにある。基準コミット時点 (2026-06-26) では `v0.21.x` ラインが現行だ。ガバナンスは `GOVERNANCE.md` (「Dalec Project Governance」) に定義され、メンテナ、メンテナになる手続き、ミーティング、セキュリティレスポンスチーム、投票を扱う。コントリビューションには署名付き DCO が必須で、CNCF の `dco-2` GitHub App が PR ごとに強制する (README)。メンテナは依然として全員 Microsoft である (`MAINTAINERS.md` によれば Brian Goff、Jeremy Rickard、Peter Engelbert、emeritus に Sertac Ozercan)。中立な組織への移管は、まだコントリビュータ層の広がりには結びついていない。採用事例のページで再び触れる点だ。
