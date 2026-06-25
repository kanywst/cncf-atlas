# 採用事例・エコシステム

## 誰が使っているか

出典付きで挙げられる named adopter はない。メインリポジトリのルートに `ADOPTERS.md` は無く、CNCF Incubating のブログも企業名を挙げずに「startups から major carriers まで」の採用と述べるにとどまる。採用企業を捏造する代わりに、本ページでは下記の検証可能なシグナルを示す。Incubation 時点のメンテナ所属は公開データだ。Microsoft、Alibaba、VMware、Intel、Inspur、Sangfor、Tongji University がメンテナを出している (CNCF ブログ, 2025-07-02)。

## 採用のシグナル

- GitHub (観測 2026-06-25): stars 1968、forks 427、主要言語 Go (`gh repo view openyurtio/openyurt`)。
- CNCF Incubation 時点でメンテナが 3 人から 9 人に増加、コントリビュータ約 170 人 (CNCF ブログ, 2025-07-02)。
- CNCF 成熟度: 2020 年 9 月に Sandbox、2025 年 7 月 2 日に Incubating (CNCF ブログ)。
- リリースは 2026 年 5 月 6 日の `v1.7.0` に到達、Kubernetes 1.34 まで認証 (`README.md:53`)。

## エコシステム

- YurtIoTDock 経由の EdgeX Foundry デバイス管理 (`pkg/apis/iot/`)。
- リージョン間の L3 メッシュ接続を担う Raven (`pkg/apis/raven/`)。
- リポジトリ同梱の Helm chart: `charts/yurt-manager`、`charts/yurthub`、`charts/yurt-iot-dock`。
- ノードの join/reset/token/renew 操作を行う `yurtadm` (`pkg/yurtadm/cmd/`)。
- flannel などの CNI プラグインは NodePool の `HostNetwork` オプションで許容される (`pkg/apis/apps/v1beta2/nodepool_types.go:47-51`)。

## 代替候補

OpenYurt を際立たせる点は、upstream の Kubernetes コントロールプレーンを無傷に保ち、エッジの挙動をノードサイドカーとコントローラとして足すことだ (`README.md:24-25`)。素の Kubernetes にエッジ自律を足したいときに選ぶ。主要な代替はスタックのより多くを再実装または置換する。

| 代替 | 違い |
| --- | --- |
| [KubeEdge](https://kubeedge.io) | CNCF Incubating。CloudCore/EdgeCore と独自プロトコル、MQTT デバイス層でコントロールプレーンの一部を再実装し、素の apiserver 経路を維持しない |
| [SuperEdge](https://superedge.io) | これも Kubernetes へのエッジ自律アドオン。OpenYurt との差は主にコンポーネント構成とプロジェクトガバナンス |
| [k3s](https://k3s.io) | 軽量な単一バイナリの Kubernetes ディストロ。小フットプリントのクラスタを解く問題であり、クラウド管理のエッジ自律ではない |
