# 採用事例・エコシステム

## 誰が使っているか

以下の名前はプロジェクトの [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) から取った。独立したケーススタディではなく、プロジェクトへの自己申告だ。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Huawei Cloud | Intelligent EdgeFabric (IEF) エッジサービス | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| China Unicom | WoCloud のエッジ提供 | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| Raisecom Technology | 工場の作業安全 AI 監視。China Telecom Research Institute と設計 | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| KubeSphere | プラットフォームのエッジ対応 | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| DaoCloud | プラットフォームのエッジ対応 | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |
| XingHai IoT | スマートキャンパス。中国 80 都市で 741 案件 | [ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md) |

ADOPTERS.md には Two Win・PITS・jylink・ICTNJ・Jingying Shuzhi も記載されている。

## 採用のシグナル

2024-10-15 の卒業時点で CNCF は 15 組織からのメンテナと、35 か国以上・110 組織以上にまたがる 1,600 人超の contributor を報告した ([CNCF announcement](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/))。この 1,600+ は CNCF の広い定義での数で、コードのコミッタ数ではない。2026-06-22 にリポジトリで測ると、GitHub 上のコード contributor は約 309 人、スター 7,485、フォーク 1,951 だった ([kubeedge/kubeedge](https://github.com/kubeedge/kubeedge))。リリースはおおむね四半期ごとのマイナーで、v1.23.0 は 2026-03-11 公開 ([releases](https://github.com/kubeedge/kubeedge/releases))。

## エコシステム

KubeEdge は上流 Kubernetes の上で動く (vendored。v1.22 系は Kubernetes v1.31.12 に対してビルド)。`eventbus` モジュール経由で MQTT ブローカ越しに IoT デバイスを接続し、新しいデバイスプロトコルは `staging/src/github.com/kubeedge/mapper-framework` 配下の mapper フレームワークで追加できる。KubeSphere や DaoCloud などのプラットフォームは KubeEdge をエッジレイヤとして取り込む (ADOPTERS.md より)。

## 代替候補

| 代替 | 違い |
| --- | --- |
| K3s (SUSE/Rancher) | フルだが削ぎ落とした Kubernetes をエッジでそのまま動かす。オフラインファーストの分割コントロールプレーンやデバイス CRD は内蔵しない。 |
| OpenYurt (CNCF, Alibaba 由来) | 最も近い競合。同じくノードとエッジの自律性に焦点。KubeEdge はさらに MQTT と Device CRD ベースの IoT 管理まで踏み込む。 |
| Akri (CNCF) | エッジのリーフデバイス発見だけに特化。KubeEdge の devicetwin/mapper と重なるが守備範囲が狭い。 |
| SuperEdge | ノード自律性という似た目標を持つもう 1 つのエッジ Kubernetes ディストロ。 |

ノードがオフラインになり、かつ物理デバイスも管理するなら KubeEdge。安定した接続のもとで通常の小さい Kubernetes が欲しいなら K3s。デバイス管理面なしでエッジ自律性が欲しいなら OpenYurt を選ぶ。
