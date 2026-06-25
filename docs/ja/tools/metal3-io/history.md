# 歴史

## 起源

Metal3 は 2019 年に Red Hat で始まり、早期に Ericsson が参画した。当初は "MetalKube" と呼ばれた。創設時の設計方針は明快で、ベアメタル払い出しを再発明せず、実績ある OpenStack Ironic の上に作る、というものだった。2019 年 4 月の発表は、本プロジェクトを Kubernetes ネイティブなベアメタル払い出しとして位置づけた ([出典 3](https://metal3.io/blog/2019/04/30/Metal-Kubed-Baremetal-Provisioning-for-Kubernetes.html))。baremetal-operator リポジトリの作成日は 2019-01-23 である ([出典 1](https://github.com/metal3-io/baremetal-operator))。

2019 年 9 月の記事は baremetal-operator 自体を紹介した。BMC ベンダ (iLO・iDRAC・iRMC など) を IPMI と Redfish で抽象化し、ディスク wipe・OS イメージ書き込み・reboot・Node 登録という手順で Ironic を駆動する ([出典 4](https://metal3.io/blog/2019/09/11/Baremetal-operator.html))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | Red Hat が MetalKube を開始。baremetal-operator リポは 2019-01-23 作成。Ericsson が早期参画 ([出典 3](https://metal3.io/blog/2019/04/30/Metal-Kubed-Baremetal-Provisioning-for-Kubernetes.html)) |
| 2019 | KubeCon NA の "Introducing Metal³" で Cluster API の infrastructure backend として位置づけ ([出典 5](https://metal3.io/blog/2019/12/04/Introducing_metal3_kubernetes_native_bare_metal_host_management.html)) |
| 2020 | CNCF Sandbox 入り ([出典 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)) |
| 2025 | 2025-08-27 に CNCF Incubating へ昇格 ([出典 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)) |

## どう進化したか

KubeCon NA 2019 で Russell Bryant と Doug Hellmann (Red Hat) が "Introducing Metal³" を発表し、Cluster API の infrastructure backend として位置づけた。これにより、クラウドインスタンスと同じようにベアメタルホストがクラスタ生成に供給できるようになった ([出典 5](https://metal3.io/blog/2019/12/04/Introducing_metal3_kubernetes_native_bare_metal_host_management.html))。

その後の大きな転換は 2 つ。1 つは Ironic 自体のデプロイ方法で、shell ベースのスクリプトから、Ironic を Kubernetes 上で動かす Ironic Standalone Operator (IrSO) へ移った。もう 1 つはプロビジョナ backend が Go の `plugin` 機構で差し替え可能になったことで、実行時に `.so` としてロードされ、Ironic 統合はコアコントローラから疎結合になった ([内部実装](./internals) 参照)。

## 現在地

Metal3 は 2025-08-27 に CNCF Incubating へ到達した。Sandbox 期間中、active contributing org は 57 で、Ericsson と Red Hat がリードした ([出典 2](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/))。ドキュメント基準コミット時点での baremetal-operator の最新リリースは v0.13.0 で、main はそのタグより先行する ([出典 1](https://github.com/metal3-io/baremetal-operator))。プロジェクトは複数リポにまたがる。baremetal-operator (コア)、`cluster-api-provider-metal3`、`ip-address-manager`、`ironic-standalone-operator` である。
