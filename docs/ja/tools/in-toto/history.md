# 歴史

## 起源

in-toto は 2015 年、NYU Tandon の Secure Systems Lab で Justin Cappos の下に始まった。当時学生だった Santiago Torres-Arias が NJIT の協力者とともに開発を主導した。名前はラテン語の "in toto" (全体として) に由来し、成果物を個別に確認するのではなくサプライチェーンを端から端まで検証するという狙いを表している ([Sbomify](https://sbomify.com/2024/08/14/what-is-in-toto/), [NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/))。

設計は USENIX Security 2019 で "in-toto: Providing farm-to-table guarantees for bits and bytes" として発表され、Datadog における最初の本番デプロイも記録された ([USENIX 論文](https://www.usenix.org/system/files/sec19-torres-arias.pdf))。資金は NSF・DARPA・AFRL から提供された ([NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | NYU Tandon Secure Systems Lab でプロジェクト開始 ([Sbomify](https://sbomify.com/2024/08/14/what-is-in-toto/)) |
| 2016 | Python 実装リポジトリ作成 (2016-05-24) ([GitHub API](https://api.github.com/repos/in-toto/in-toto)) |
| 2019 | USENIX Security 論文発表、CNCF Sandbox 受理 (2019-08-14) ([USENIX 論文](https://www.usenix.org/system/files/sec19-torres-arias.pdf), [CNCF プロジェクトページ](https://www.cncf.io/projects/in-toto/)) |
| 2022 | CNCF Incubator へ移行 (2022-03-10) ([CNCF ブログ](https://www.cncf.io/blog/2022/03/10/supply-chain-security-project-in-toto-moves-to-the-cncf-incubator/)) |
| 2023 | in-toto 仕様 v1.0 リリース ([CNCF プロジェクトページ](https://www.cncf.io/projects/in-toto/)) |
| 2025 | CNCF を卒業 (Graduated)。TOC 投票 2025-02-10、発表 2025-04-23 ([CNCF 発表](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/)) |

## どう進化したか

プロジェクトは単一の Python ツールから階層的なエコシステムへ成長した。中核は仕様 (in-toto/docs)、attestation フレームワーク (in-toto/attestation、ITE-6 (in-toto Enhancement 6) エンベロープ)、複数言語のリファレンス実装に分かれ、ここで扱う Python リポジトリがその原型である ([NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/))。Python コード自体は新しいメタデータに DSSE (Dead Simple Signing Envelope) を採用しつつ、旧来の Metablock 形式も残し、両者を単一の `Metadata` 抽象としてモデル化している (in_toto/models/metadata.py:50)。

CNCF での歩みは、相次ぐ重大インシデント後のサプライチェーンセキュリティ全体の盛り上がりと並走した。in-toto は 2019 年に Sandbox、2022 年に Incubator、2025 年に Graduated となった ([CNCF プロジェクトページ](https://www.cncf.io/projects/in-toto/))。Cappos の研究室からは TUF に続く 2 つ目の CNCF 卒業プロジェクトであり、両者はよく併用される ([NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/))。

## 現在地

in-toto は CNCF Graduated プロジェクトである ([CNCF 発表](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/))。Python 実装は 3.x 系で、ドキュメント基準コミットでは v3.1.0 タグの少し先の `develop` ブランチを指す。掲げる方向性は、in-toto 仕様のリファレンス実装であり続けること、そして attestation フレームワーク (ITE-6) が SLSA など他の predicate type の土台となるエンベロープを担うことである ([SLSA v1.1 FAQ](https://slsa.dev/spec/v1.1/faq))。
