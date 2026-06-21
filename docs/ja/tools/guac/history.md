# 歴史

## 起源

GUAC は Kusari、Google、Purdue University、Citi の共同で作られ、GitHub リポジトリは 2022-06-10 に作成された (GitHub API `created_at`)。発端となった課題は、SBOM や attestation の生成量は増える一方で、それらが孤立して存在するため、ポートフォリオ全体にまたがる問い (「どのアーティファクトがこの脆弱性の影響を受けるか」) にうまく答えられなかったことである。GUAC は「集約と統合 (aggregation and synthesis)」レイヤを埋めるよう設計され、多数のドキュメントに外部メタデータ (deps.dev、OSV、ClearlyDefined) を組み合わせて、監査・ポリシー・リスクのツールがクエリできる 1 つのグラフにまとめる (README)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2022 | GitHub リポジトリ作成。Kusari・Google・Purdue・Citi の創設コラボレーション |
| 2024 | OpenSSF に incubating プロジェクトとして参加。Supply Chain Integrity WG 配下 (2024-03-07) |
| 2026 | Red Hat が Trustify プロジェクトを GUAC コミュニティへコントリビュート |

## どう進化したか

最も明確なガバナンスの転換は OpenSSF 入りである。2024-03-07 に GUAC は OpenSSF の incubating プロジェクトとして受理され、OpenSSF のプロジェクトライフサイクルにおいて incubating の due diligence レビューを最初に通過したプロジェクトとされる (OpenSSF ブログ、InfoQ)。これによりプロジェクト README に記載のある Supply Chain Integrity WG 配下に置かれた。

GUAC を取り巻くエコシステムは統合が進んでいる。2026 年に Red Hat は自社の Trustify プロジェクトを GUAC コミュニティへコントリビュートし (Red Hat ブログ)、隣接するサプライチェーンの取り組みを競合ではなく同じ傘の下に持ち込んだ。

## 現在地

GUAC は OpenSSF の incubating プロジェクトとして活発に開発中であり、README 自身がそう明記して Supply Chain Integrity WG へコントリビュータを誘導している。ドキュメント基準コミット時点のリポジトリは Go 1.26 を対象とし、5 つの CLI バイナリと複数のストレージバックエンドを備え、直近のタグ付きリリース以降も `main` で開発が続いている (出典 2、3、4)。
