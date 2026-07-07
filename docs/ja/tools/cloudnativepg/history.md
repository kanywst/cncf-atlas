# 歴史

## 起源

CloudNativePG は、PostgreSQL コンサルティング会社 2ndQuadrant (後に EDB が買収) の PostgreSQL エキスパートと Kubernetes 管理者によって着想された。GOVERNANCE ドキュメントには「originally conceived by PostgreSQL experts and Kubernetes administrators within 2ndQuadrant」と記されている。

最初は EDB のプロプライエタリ製品「Cloud Native PostgreSQL」として存在した。2022-04-21 に EDB はこれを CloudNativePG に改名し、Apache License 2.0 で OSS 化、1,400 を超える過去コミット履歴付きで公開し、同時に v1.15.0 をリリースした。EDB のローンチ記事はその動機を説明している。外部の高可用ツールに依存しない、Kubernetes ネイティブで level-triggered な operator を PostgreSQL コミュニティにもたらすことだ。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2022 | EDB が operator を CloudNativePG として OSS 化し v1.15.0 をリリース (2022-04-21)、その後 IP をベンダー中立コミュニティへ Apache-2.0 で寄贈。 |
| 2024 | CNCF Sandbox 申請を cncf/sandbox issue #128 として起票 (2024-09-24)、2025 年 1 月レビューのマイルストーンに割当。 |
| 2025 | CNCF Sandbox に承認 (2025 年 1 月レビュー、gitvote 可決)。 |
| 2026 | 安定版は v1.29.1 (2026-05-08)。`main` には v1.30.0-rc1 のマニフェストが同梱。 |

## どう進化したか

最も大きなガバナンスの転換は 2022 年の寄贈だった。EDB はコード・商標・意思決定を独自の GOVERNANCE を持つオープンコミュニティへ移し、単一ベンダーの資産であることをやめた。その後コミュニティは CNCF 加盟を目指し、2025 年 1 月に Sandbox プロジェクトとして到達した。

技術面で注目すべき転換はプラグインアーキテクチャへの移行だ。当初は barman-cloud を使って operator に内蔵されていたバックアップと WAL (Write-Ahead Log、先行書き込みログ) の処理が、gRPC ベースのサイドカープラグイン機構である CNPG-i (CloudNativePG Plugin Interface) へ移行している。barman-cloud 機能はコアバイナリ内ではなくプラグイン (`cloudnative-pg/barman-cloud` 依存) の背後に置かれるようになった。

## 現在地

プロジェクトは安定マイナーライン (2026 年半ば時点で v1.29.x) を出荷し、次のマイナー (v1.30.0) をリポジトリの `releases/` ディレクトリに同梱したリリース候補で準備している。メンテナは次のガバナンス目標が CNCF Incubation だと公言しており、創設者の 1 人 Gabriele Bartolini が KubeCon NA 2025 の振り返り記事でその道筋を説明した。開発はコミュニティ主導で、EDB を含む複数組織がコントリビュータに名を連ねる。
