# 歴史

## 起源

OpenKruise は 2019 年 6 月に Alibaba Cloud がオープンソース化した。Alibaba が自社プラットフォームと大規模運用 (Double 11 を含む) のために作り込んだワークロード自動化パターンを、上流互換の Kubernetes 拡張としてコミュニティに還元したもの。GitHub リポジトリが正規の upstream であり、Alibaba 社内の downstream は公開インターフェース上の結合コードだけを足す形で、社内専用コードは 5% 未満とされる ([Alibaba Cloud blog](https://www.alibabacloud.com/blog/openkruise-the-cloud-native-platform-for-the-comprehensive-process-of-alibabas-double-11_596966))。

名前 "Kruise" は "cruise" のもじり。"K" は Kubernetes を指し、Kubernetes 上での自動航行 (auto-cruise) を表す ([CNCF projects page](https://www.cncf.io/projects/openkruise/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | Alibaba Cloud が OpenKruise をオープンソース化 (6 月)。 |
| 2020 | CNCF Sandbox プロジェクトに受理 (2020-11-10)。 |
| 2021 | OpenKruise v1.0 リリース (12 月)。アプリ自動化の新たな到達点とされる。 |
| 2023 | TOC 投票により CNCF Incubating へ昇格 (2023-03-02)。 |
| 2026 | v1.9.0 リリース (2026-06-21)。 |

## どう進化したか

最初は少数の強化版ワークロードコントローラから始まり、ワークロード・sidecar 管理・ジョブ・ノードレベル操作をカバーする広範な CRD とコントローラの集合へと育った。2023 年 3 月の Sandbox から Incubating への昇格で 36 番目の incubating プロジェクトとなり、Backstage / Cilium / Istio / Knative / OpenTelemetry などと並んだ ([CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/))。

1.x 系でスコープが広がった。SidecarSet は v1.7 で native Kubernetes sidecar コンテナ (`restartPolicy: Always` を持つ `initContainers`) に対応した ([Alibaba Cloud blog](https://www.alibabacloud.com/blog/openkruise-v1-7-sidecarset-supports-native-kubernetes-sidecar-containers_601775))。当初コンテナイメージだけに限られていた in-place update は、v1.8 系で kubelet の resize subresource 経由の resource 要求もカバーするよう拡張された。

## 現在地

OpenKruise は CNCF Incubating プロジェクトとして活発に開発が続いており、最新リリースは 2026-06-21 の v1.9.0 ([Releases](https://github.com/openkruise/kruise/releases))。コードは Go で controller-runtime ベース。コア (`openkruise/kruise`) は単一リポジトリで、kruise-rollouts や OpenKruiseGame といった周辺は別リポジトリ。コミュニティは採用企業名を公開しており、プロジェクト発端と同じ規模での利用が続いていると報告されている。
