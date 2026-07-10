# 採用事例・エコシステム

## 誰が使っているか

Eraser のリポジトリに ADOPTERS ファイルは無い。そのためこのページは、公開された引用可能な出典を持つ 1 社だけを名指しし、あとは GitHub のシグナルに頼る。確実な連携先は Azure Kubernetes Service で、そのマネージド「Image Cleaner」アドオンが内部で Eraser を動かす。Microsoft のドキュメントは、Image Cleaner が `eraser-controller-manager` と collector / trivy-scanner / remover コンテナをデプロイし、未使用・脆弱なイメージを削除すると明記している ([AKS Image Cleaner ドキュメント](https://learn.microsoft.com/en-us/azure/aks/image-cleaner))。Sandbox 申請文は、OSS プロジェクトとマネージドアドオンが別ロードマップで運用されると注記している ([cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24))。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Azure Kubernetes Service | マネージドの Image Cleaner アドオンが Eraser を動かし、未使用・脆弱なイメージをノードから削除 | [AKS Image Cleaner ドキュメント](https://learn.microsoft.com/en-us/azure/aks/image-cleaner) |

## 採用のシグナル

2026-07-08 時点 (`gh repo view eraser-dev/eraser`): スター 611、fork 71、GitHub contributors API でおよそ 35 contributors。リポジトリは 2021-05-28 作成、最終 push は 2026-04-09 で、topics に `cncf` / `kubernetes` / `trivy` / `security-tools` を含む。Eraser は CNCF Sandbox プロジェクトとして掲載されている ([CNCF プロジェクトページ](https://www.cncf.io/projects/eraser/)、2023-06-30 受理)。README は OpenSSF Best Practices と Scorecard のバッジを掲げる (`src/README.md:5-7`)。直近の安定版は `v1.4.1` (2025-12-02)、その後に `v1.5.0-beta.0` プレリリースがある。

## エコシステム

Eraser はコンテナランタイムとスキャナの間に位置する。Trivy はワーカー Pod 内で動かす既定スキャナで、スキャン工程は `ImageProvider` インターフェースで定義されるので別スキャナに置換できる (`pkg/scanners/template/scanner_template.go:21`)。containerd や CRI-O とは CRI API で通信し、`v1` を試して `v1alpha2` にフォールバックする (`pkg/cri/client.go:47`)。`pkg/metrics` から OTLP メトリクスを export し、除外 ConfigMap をサポートし、include/exclude の NodeFilter で対象ノードを選抜する。最も目立つ下流は AKS Image Cleaner アドオンで、同じコンポーネント群をマネージド提供として包む ([AKS Image Cleaner ドキュメント](https://learn.microsoft.com/en-us/azure/aks/image-cleaner))。

## 代替候補

Eraser の特徴は、非実行イメージをポリシー (明示リストか脆弱性閾値) でノードから削除しつつ、実行中コンテナが使うイメージは決して消さないことを保証する点にある。

| 代替 | 違い |
| --- | --- |
| kubelet のイメージ GC | Kubernetes ネイティブだが、ディスク使用率閾値で削除し、脆弱性や許可/拒否リストの概念が無い。Eraser がその穴を埋める ([cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24)) |
| Trivy 単体 | 脆弱性を検出するが、ノードからイメージを削除しない。Eraser は Trivy をスキャナとして動かし、その判定に基づいて動く (`pkg/scanners/trivy`) |
| kube-image-keeper | 使用中イメージをキャッシュ/ミラーして registry 障害に備えるので、削除ではなく保全であり、Eraser とは目的が逆 ([enix/kube-image-keeper](https://github.com/enix/kube-image-keeper)) |
