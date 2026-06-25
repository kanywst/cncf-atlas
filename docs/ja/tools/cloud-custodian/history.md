# 歴史

## 起源

Cloud Custodian は 2016 年に Capital One 社内で Kapil Thangavelu が作成した。同行はパブリッククラウドへ移行中で、タグ付け・クリーンアップ・コンプライアンスチェックの場当たり的なスクリプトが乱立していた。狙いは、それらを一貫したメトリクスとレポートを持つ軽量で柔軟な単一ツールにまとめることだった ([CNCF blog, 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/))。GitHub リポジトリは 2016-03-01 に作成された ([GitHub REST API](https://api.github.com/repos/cloud-custodian/cloud-custodian))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | Capital One で Kapil Thangavelu が作成。リポジトリは 2016-03-01 開設 |
| 2020 | 2020-06-25 に CNCF Sandbox 受理 (Capital One が寄贈) |
| 2022 | 2022-09-14 に TOC 投票で CNCF Incubating へ昇格 |
| 2026 | リリース系列 `0.9.51` (`0.9.51.0` は 2026-05-28 公開) |

## どう進化したか

最初は AWS 専用だったが、マルチクラウドエンジンへと成長した。Azure・GCP などのプロバイダ対応はコアではなく `tools/` 配下の別パッケージに置かれ、`c7n` コアはクラウド非依存に保たれ、各プロバイダは独立して配布される。同じパターンから周辺ツールが生まれた: 通知の `c7n_mailer`、マルチアカウント実行の `c7n_org`、適用前に IaC をスキャンする `c7n_left` などである ([README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md))。

ガバナンスは単一企業からコミュニティモデルへ移行した。プロジェクトは作業を機能エリア (AWS・GCP・Azure・Tencent・Oracle の各プロバイダ、`c7n-org`、通知、ドキュメント、リリース) に分割し、各エリアに `OWNERS.md` と `CODEOWNERS` で追跡されるエリアメンテナを置く。コアメンテナがエリア横断の判断と CNCF 連携を担う ([GOVERNANCE.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/GOVERNANCE.md))。

Incubating 昇格時点で、プロジェクトはコントリビュータ 350 名以上、貢献組織 130 以上、GitHub スター 4.3K、ダウンロード 1.5 億超を報告した ([CNCF blog, 2022-09-14](https://www.cncf.io/blog/2022/09/14/cloud-custodian-becomes-a-cncf-incubating-project/))。

## 現在地

Cloud Custodian は引き続き CNCF Incubating プロジェクトである ([CNCF project page](https://www.cncf.io/projects/cloud-custodian/))。PyPI には `c7n` として、プロバイダツールは付随モジュールとして公開され、コンテナイメージは Docker Hub で `cloudcustodian/c7n` として公開される ([PyPI](https://pypi.org/project/c7n/), [Docker Hub](https://hub.docker.com/r/cloudcustodian/c7n))。2026-06-24 時点の観測で、リポジトリはスター 6,014、フォーク 1,625、コントリビュータ約 418 名を擁し、`0.9.51` リリース系列にある ([GitHub REST API](https://api.github.com/repos/cloud-custodian/cloud-custodian))。
