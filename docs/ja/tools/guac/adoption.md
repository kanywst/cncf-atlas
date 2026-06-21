# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS.md` はなく、README に adopters セクションもないため、このディープダイブでは出典付きの本番エンドユーザ事例は見つからなかった。捏造はせず、下表にはプロジェクトと文書化された関係を持つ組織を挙げる。これは「作っている/支援している」組織であって、本番で動かしているという公式表明ではない。

| 組織 | 関係 | 出典 |
| --- | --- | --- |
| Kusari、Google、Purdue University、Citi | 創設コラボレーター | [Kusari ブログ](https://www.kusari.dev/blog/graph-for-understanding-artifact-composition-guac-joins-openssf-as-incubating-project) |
| OpenSSF | GUAC を incubating プロジェクトとしてホスト | [OpenSSF プロジェクトページ](https://openssf.org/projects/guac/) |
| Red Hat | Trustify プロジェクトを GUAC コミュニティへコントリビュート | [Red Hat ブログ](https://www.redhat.com/en/blog/red-hat-contributes-trustify-project-openssfs-guac-community) |

## 採用のシグナル

出典付きの採用組織が示せないため、ここでは測定可能なシグナルがより重要になる。2026-06-22 時点 (GitHub REST API): スター 1,508、フォーク 205、コントリビュータ 70。プロジェクトは OpenSSF の incubating プロジェクトとして活発に開発中で、直近のタグ付きリリース以降も `main` にコミットがある (出典: GitHub API、OpenSSF プロジェクトページ)。

## エコシステム

GUAC はサプライチェーンメタデータを生成するツールの下流に位置し、幅広いフォーマットとソースを統合する。SPDX と CycloneDX の SBOM、in-toto/SLSA attestation (ITE6/DSSE)、OpenVEX と CSAF、OpenSSF Scorecard の結果を取り込み、deps.dev・OSV・ClearlyDefined・endoflife.date からグラフを拡充できる (`pkg/handler/processor/process/process.go:57`, `pkg/ingestor/parser/parser.go:109`)。収集元には file・OCI・GCS・S3・git・GitHub・Kubescape が含まれる (`pkg/handler/collector/`)。ストレージは keyvalue (インメモリ) と ent+PostgreSQL をサポート対象として備え、ArangoDB・Neo4j・Neptune も存在する (`pkg/assembler/backends/backends.go:27`)。

## 代替候補

GUAC の差別化点は、アーティファクトごとの SBOM ストアでもスキャナでもなく、多数のアーティファクトと外部メタデータを横断する関係グラフとクエリ層である点にある。

| 代替 | 違い |
| --- | --- |
| Dependency-Track | 追跡対象プロジェクト中心のコンポーネント/脆弱性分析ダッシュボード。任意のサプライチェーンドキュメントと外部ソースを集約する汎用 GraphQL グラフではない |
| Trustify | Red Hat が 2026 年に GUAC コミュニティへコントリビュートした隣接プロジェクト。競合ではなく統合 ([Red Hat ブログ](https://www.redhat.com/en/blog/red-hat-contributes-trustify-project-openssfs-guac-community)) |
| 素の SBOM リポジトリ | 個々の SBOM を保存・取得する。ドキュメント横断でエンティティを正規化したり、アーティファクト横断のクエリに答えたりはしない |
