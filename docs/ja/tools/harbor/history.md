# 歴史

## 発祥

Harbor は 2014 年、VMware の中国 R&D 組織で社内プロジェクトとして始まりました。コンテナ利用者が初期に直面したイメージ保管の課題を解くためのものです。VMware は 2016 年 3 月にオープンソース化し、Kubernetes の台頭と並走して伸びました。位置づけは当初から一貫しています。コンテンツを保存・署名・スキャンするレジストリで、Docker Distribution に企業が求めるセキュリティ・アイデンティティ・管理機能を足したものです。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2014 | VMware の中国 R&D で社内プロジェクトとして発足。 |
| 2016 | VMware がオープンソース化 (3 月)。 |
| 2018 | CNCF へ donate、Sandbox 受理 (7/31)、Incubating へ昇格 (11/14)。 |
| 2020 | CNCF を Graduated (6/15、アナウンスは 6/23)。 |
| 2026 | v2.16.0 へ向け活発に開発中。最新 GA は v2.14.4。 |

## どう進化したか

Harbor の節目は 2020-06-15 の Graduated 昇格でした。OSS レジストリとして初の CNCF Graduated であり、かつ中国生まれで初の CNCF Graduated プロジェクトです。この昇格は Harbor が VMware 製品ではなく成熟したベンダ中立プロジェクトであることを示しました。

artifact モデルは時間とともに一般化しました。コンテナイメージのレジストリとして始まったものが、今やイメージ・Helm chart・その他の OCI 成果物を 1 つの `artifact.Artifact` 抽象で扱います (`src/pkg/artifact/model.go:32-48`)。同じ project・RBAC・クォータ・スキャンの仕組みがすべてに適用されます。

署名はエコシステム全体の動きを追ってきました。README にはイメージ署名用の Notary v1 (Docker Content Trust) がまだ記載されています (`README.md:39`) が、プロジェクトは manifest push 時のゲートとして検証する Cosign (sigstore) へ移ってきました (`src/server/registry/route.go:81`)。v2.15.0 からは Harbor 自身のリリース成果物も Cosign で署名されます (`README.md:65`)。

## 現在地

Harbor は minor / patch を定期的なリズムでリリースします。ここでドキュメント化した時点では `VERSION` ファイルは開発中の `v2.16.0` を指し、`v2.14.4` (2026-05-11) が最新 GA です。ガバナンスは CNCF の下で運営され、2 つのタイムゾーンで隔週のコミュニティコールがあります (`README.md:16`)。執筆時点で報告されているリポジトリのメトリクスは star 約 28,755、fork 約 5,264 です。
