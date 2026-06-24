# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS` ファイルは無いため、以下の名前付き採用例は公開された Kubernetes ケーススタディから引いた。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Spotify | 自前オーケストレータ Helios から Kubernetes へ移行。bin-packing と multi-tenancy で平均 CPU 利用率が 2〜3 倍向上、最大級のサービスは 1 秒あたり 1000 万超のリクエストを処理 | [Kubernetes case study: Spotify](https://kubernetes.io/case-studies/spotify/) |
| adidas | 6 ヶ月で EC サイトの 100% を Kubernetes 化。ロード時間を半減し、リリース頻度を 4〜6 週に 1 回から 1 日 3〜4 回へ。4,000 pods / 200 nodes / 月 80,000 ビルドを稼働 | [Kubernetes case study: adidas](https://kubernetes.io/case-studies/adidas/) |

## 採用のシグナル

2026-06-22 に GitHub API から取得: `kubernetes/kubernetes` は 123,184 stars / 43,267 forks。CNCF 系資料はコントリビュータ数を 8,012 と引用し、2016 年以降およそ +996% としている ([IBM: History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history))。リリースは規則的なマイナーサイクルで、基準コミット時点の直近安定版は `v1.36.2` (2026-06-12)。

## エコシステム

Kubernetes は単体のツールというより大きなスタックの土台だ。コンテナランタイムは CRI 経由で差し込む (containerd, CRI-O)。ネットワークは CNI プラグイン (Cilium, Calico)。ストレージは CSI ドライバ。スケジューラは framework プラグインまたは extender で拡張する。監視は Prometheus、アプリのパッケージングは Helm が一般的だ。たとえば adidas は cloud native プラットフォームを Kubernetes + Prometheus の上に構築した ([Kubernetes case study: adidas](https://kubernetes.io/case-studies/adidas/))。ディストリビューションとマネージド提供には GKE, EKS, AKS, OpenShift, Rancher, k3s がある。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Docker Swarm | 構築は簡単だが機能とエコシステムがはるかに小さい。同等の深さの宣言的コントローラモデルは無い |
| HashiCorp Nomad | 非コンテナワークロードも動かす軽量スケジューラ。組み込みプリミティブとエコシステムは少ない |
| Apache Mesos / Marathon | データセンターの混在ワークロード向けの 2 段スケジューラ。コンテナネイティブで CRD 駆動のモデルへの寄せ方は弱い |

本質的な差は、宣言的 API とコントローラ reconcile モデル、CRD とインターフェースによるプラガブルな拡張性、そして周囲のエコシステムの大きさだ。そのモデルと移植性が欲しいなら Kubernetes を選ぶ。運用コストが必要性を上回るなら軽量な代替を選ぶ。
