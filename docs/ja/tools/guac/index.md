# GUAC

> GUAC (Graph for Understanding Artifact Composition) は、ソフトウェアサプライチェーンのメタデータ (SBOM、attestation、VEX、scorecard) をクエリ可能なグラフに集約し、多数のアーティファクトを横断して監査・ポリシー・リスクの問いに答えられるようにする。

- **カテゴリ**: Supply Chain
- **CNCF 成熟度**: Independent (CNCF プロジェクトではなく、OpenSSF の Supply Chain Integrity WG 配下の incubating プロジェクト)
- **言語**: Go (`go 1.26.0`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [guacsec/guac](https://github.com/guacsec/guac)
- **ドキュメント基準コミット**: `362e6da` (main, 2026-06-20)

## 何をするものか

GUAC はサプライチェーンドキュメント (SPDX / CycloneDX の SBOM、in-toto/SLSA attestation、OpenVEX / CSAF、OpenSSF Scorecard の結果) を取り込み、それらが記述するエンティティを正規化し、GraphQL でクエリできる単一のグラフに書き込む。アーティファクトごとに SBOM を孤立して保存するのではなく、パッケージ・ソース・アーティファクト・ビルダー、そしてそれらに関する証拠 (evidence) を 1 つの連結モデルにつなぐ。

さらに、SBOM の中には存在しないメタデータでグラフを拡充する。取り込み時に外部ソース (脆弱性は OSV、ライセンスは ClearlyDefined、endoflife.date、deps.dev) へ並行して問い合わせ、結果を同じノードの証拠として付与できる。GUAC が占める位置はサプライチェーン透明性モデルの「集約と統合 (aggregation and synthesis)」レイヤであり、SBOM や attestation を生成するツールの上、答えを消費するポリシー・ダッシュボードツールの下に位置する。

GUAC は、すでにサプライチェーンメタデータを生成していて、それをポートフォリオ規模でクエリする必要があるチーム向けである (どのイメージが脆弱なパッケージに依存しているか、どのビルドに SLSA attestation が欠けているか、このリリースにどんなライセンスが含まれるか)。SBOM ストアではなく、関係グラフとクエリ層である。

## いつ使うか

- 多数のアーティファクトにまたがる多数の SBOM/attestation を持ち、横断的な答えが必要 (「全イメージのうち log4j に依存しているのはどれか」)。
- サプライチェーンデータを、第三者の脆弱性・ライセンス・EOL シグナルで 1 箇所にまとめて拡充したい。
- ポリシーやダッシュボードツールが構築の土台にできる、正規化済みエンティティ上の安定した GraphQL API がほしい。
- アーティファクトごとに 1 つの SBOM を保存・取得するだけなら不向き。よりシンプルな SBOM リポジトリで十分。
- スキャナや attestation 生成器ではない。GUAC はそれらが生成したものを消費する側であり、証拠自体は作らない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとドキュメントがグラフに流れる経路。
- [採用事例・エコシステム](./adoption): 誰が作り、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ取り込みコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [guacsec/guac README](https://github.com/guacsec/guac) (参照 2026-06-22)
2. [guac ソース (固定コミット 362e6da)](https://github.com/guacsec/guac/tree/362e6dacedaa22af63c157b2c9d3e39a51da437f) (参照 2026-06-22)
3. [GUAC Joins OpenSSF as Incubating Project (OpenSSF)](https://openssf.org/blog/2024/03/07/guac-joins-openssf-as-incubating-project/) (参照 2026-06-22)
4. [OpenSSF プロジェクトページ: GUAC](https://openssf.org/projects/guac/) (参照 2026-06-22)
5. [GUAC Joins OpenSSF as Incubating Project (InfoQ)](https://www.infoq.com/news/2024/03/guac-incubating-openssf/) (参照 2026-06-22)
6. [GUAC Joins OpenSSF (Kusari)](https://www.kusari.dev/blog/graph-for-understanding-artifact-composition-guac-joins-openssf-as-incubating-project) (参照 2026-06-22)
7. [GUAC Tutorial (Wiz)](https://www.wiz.io/academy/guac-overview) (参照 2026-06-22)
8. [Red Hat contributes Trustify to the GUAC community](https://www.redhat.com/en/blog/red-hat-contributes-trustify-project-openssfs-guac-community) (参照 2026-06-22)
9. [GUAC ドキュメント / セットアップ](https://docs.guac.sh/) (参照 2026-06-22)
10. [GitHub REST API repos/guacsec/guac](https://api.github.com/repos/guacsec/guac) (参照 2026-06-22)
