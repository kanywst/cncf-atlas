# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS.md` はなく (GitHub API は 404 を返す)、本ディープダイブでは Dalec を本番で動かしている第三者組織を出典付きで確認できなかった。文書化された唯一の利用者はベンダー自身である。Microsoft の Azure Upstream チームがコンプライアンスビルドに社内利用している。これは第三者の採用ではなくベンダーのセルフユースなので、下表は外部採用を主張せず、文書化された関係を記す。

| 組織 | 関係 | 出典 |
| --- | --- | --- |
| Microsoft (Azure Upstream) | Dalec を作成し、コンプライアンスビルド (署名済みパッケージ・SBOM・provenance) に社内利用 | [Microsoft Community Hub ブログ](https://techcommunity.microsoft.com/blog/linuxandopensourceblog/dalec-declarative-package-and-container-builds/4465290) |
| CNCF | 2025-10-08 以降、Dalec を Sandbox プロジェクトとしてホスト | [CNCF プロジェクトページ](https://www.cncf.io/projects/dalec/) |

## 採用のシグナル

出典を示せる外部 adopter がいないため、ここでは測定可能なシグナルの比重が大きい。2026-06-26 時点 (GitHub REST API) で、stars 310、forks 54、contributors 約 38、open issues 95、watchers 12。最新リリースは `v0.21.2` (2026-06-25) で、`v0.21.x` ラインは活発なリリースペースを示す。メンテナは全員 Microsoft である (`MAINTAINERS.md` によれば Brian Goff、Jeremy Rickard、Peter Engelbert、emeritus に Sertac Ozercan)。したがって現状は単一ベンダーのプロジェクトで、中立な CNCF 組織への移管は、まだクロスベンダーのメンテナ層には結びついていない。この集中が、勘案すべき主要なガバナンスリスクである (出典: GitHub API、`MAINTAINERS.md`、CNCF プロジェクトページ)。

## エコシステム

Dalec は BuildKit のフロントエンド機構の上に立つ。spec が LLB になり、任意の BuildKit (ローカル Docker・`buildx`・CI) がそれを solve するので、実行時の依存は専用サービスではなく Docker/BuildKit である (moby/buildkit、Docker フロントエンドドキュメント)。出力面ではネイティブな distro パッケージングを対象とする。Azure Linux・AlmaLinux・Rocky Linux 向けの RPM、Debian・Ubuntu 向けの DEB、加えて Windows ターゲットだ (`targets/`)。サプライチェーンメタデータでは SBOM と provenance を生成し、パッケージへの署名もできるので、SBOM/provenance 標準の in-toto・SLSA や、署名の Notary Project・Sigstore と並ぶ位置にある。最小 CVE コンテナの文脈では、同じく Microsoft 発の Copa (copacetic) と隣接する。

## 代替候補

Dalec の特徴は、ソースからネイティブな distro パッケージをビルドし、テストし、署名・attestation 付きの最小コンテナを組み立てる。それを 1 枚の YAML spec と素の `docker build` で行う点にある。以下の代替は、その範囲の一部を担う。

| 代替 | 違い |
| --- | --- |
| nfpm | ビルド済み成果物から DEB/RPM/APK を組むだけ。ソースからのビルド・テスト・コンテナ化・attestation はしない |
| GoReleaser | 内部で nfpm/BuildKit を呼ぶリリースオーケストレータ。スコープはリリース自動化で、ネイティブ distro パッケージのソースビルドが主目的ではない |
| 素の Dockerfile / Buildx Bake | 汎用のイメージビルド。RPM `.spec`・`debian/` ディレクトリ・自前スクリプトを書く必要があり、Dalec はそれを 1 枚の YAML spec に置き換える |
| OpenSUSE Build Service (OBS) | ホスト型のマルチ distro ビルドサービス。Dalec はローカルや CI の Docker で完結するクライアント側フロントエンド |
