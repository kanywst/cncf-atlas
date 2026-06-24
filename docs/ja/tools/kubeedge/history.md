# 歴史

## 起源

KubeEdge は Huawei Cloud が開発し、2018 年 11 月に Apache 2.0 でオープンソース化した。CNCF はこれを業界初のクラウドネイティブなエッジコンピューティングプロジェクトと位置づけている。GitHub リポジトリは 2018-09-28 に作成された。狙いは、データセンターから遠く不安定なリンクの先にあるエッジハードウェアや IoT デバイスへ Kubernetes のオーケストレーションを届けることだった。しかも各ノードにフルの Kubernetes ノードスタックを強いずに、だ。[CNCF graduation announcement](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/) と [KubeEdge graduation blog](https://kubeedge.io/blog/cncf-graduation-announcement/) を参照。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2018 | Huawei Cloud が Apache 2.0 で KubeEdge を OSS 化。リポジトリ作成は 2018-09-28。 |
| 2019 | CNCF Sandbox 入り。エッジ領域で最初の参加プロジェクト。 |
| 2020 | 2020 年 9 月に CNCF Incubating へ昇格。 |
| 2024 | 2024-10-15 に CNCF Graduated。 |
| 2026 | v1.23.0 を 2026-03-11 にリリース。 |

## どう進化したか

プロジェクトは 2 プレーン構成 (クラウドの `cloudcore`、エッジの `edgecore`) を保ったまま、その周囲に機能を増やしてきた。近年のリリースは信頼性とデバイスモデリングに焦点を当てる。2025-11-04 に出た v1.22.0 はエッジリソース更新の hold/release 機構、Beehive のサブモジュール単位の再起動ポリシー、Thing Model ベースのデバイスモデル更新を追加した。[v1.22 release blog](https://kubeedge.io/blog/release-v1.22/) を参照。Beehive の再起動ポリシーの実装は、成長率付きバックオフを持つ `ModuleRestartPolicy` としてコードに見える (`staging/src/github.com/kubeedge/beehive/pkg/core/module.go:27-44`)。

## 現在地

KubeEdge はおおむね四半期ごとのマイナーリリースだ。v1.23.0 が最新タグで 2026-03-11 公開、ドキュメント基準コミットはそこから 89 コミット先の master にある。卒業時点 (2024-10-15) で CNCF は 15 組織からのメンテナと、35 か国以上・110 組織以上にまたがる 1,600 人超の contributor を報告した ([CNCF announcement](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/))。プロジェクトは CNCF のガバナンス下にあり、信頼できるエッジオーケストレーションとデバイス管理という掲げた方向で開発を続けている。
