# 採用事例・エコシステム

## 誰が使っているか

以下の採用先はすべて、pin コミット時点のプロジェクト同梱 [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) に明記されている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Docker / Moby | engine の下回りのランタイム (当時も現在も) | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Google Kubernetes Engine | 1.14 から提供、1.19 から既定。Autopilot は launch 時から containerd のみ | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Amazon EKS / Fargate / Bottlerocket | EKS は CRI として 1.21 から (1.22 で既定)、Fargate は Firecracker 併用、Bottlerocket は OS の中核ランタイム | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Azure Kubernetes Service | Linux ノード 1.19+、Windows 1.20+ | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| IBM Cloud Kubernetes Service | 1.11+ で CRI ランタイム | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| k3s (Rancher / SUSE) | 軽量 Kubernetes の組み込みランタイム | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Talos Linux、Deckhouse、VMware TKG/TCE | 既定の CRI ランタイム | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| Kata Containers、firecracker-containerd | VM ベースのコンテナを駆動するカスタム v2 shim | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |
| OpenFaaS faasd、Balena、LinuxKit、BuildKit、Cloud Foundry Guardian | 実行基盤 | [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md) |

## 採用のシグナル

- GitHub: stars 20,870、forks 3,979 ([GitHub API](https://api.github.com/repos/containerd/containerd)、2026-06-22 取得)。
- CNCF LFX Insights ([CNCF プロジェクトページ](https://www.cncf.io/projects/containerd/) 経由): total contributors 6,382 (前年比 +10% 程度)、contributing organizations 1,667、最初の commit 2015-07-17、健全性スコア "Excellent (83)"。
- containerd は主要な 3 つのマネージド Kubernetes すべてで既定の CRI ランタイムである。これは最も実質的な採用シグナルで、大半の Kubernetes クラスタが containerd 上で動く。

## エコシステム

- nerdctl: containerd 向けの Docker 互換 CLI (約 10k stars)。
- BuildKit: イメージビルド。containerd 上で動く。
- stargz-snapshotter・SOCI: snapshotter プラグインによる遅延イメージ pull。
- runwasi: shim 経由で Wasm ワークロードを実行 (Rust)。
- ネットワーク用の CNI プラグイン、overlayfs・devmapper・zfs・btrfs 用の各 snapshotter。

## 代替候補

containerd は安定 API を持つ汎用ランタイムであり、CRI は多数あるプラグインの 1 つである。誠実な比較は次の通り。

| 代替 | 違い |
| --- | --- |
| CRI-O | 設計上 Kubernetes 専用。表面が小さく、汎用ランタイム API を持たない |
| Docker / Moby | competitor でなく containerd の上位。内部で containerd を使う |
| Podman | daemonless で rootless を第一とする。containerd でなく conmon + crun を使う |
| runc / crun / youki | containerd の下で動く OCI ランタイム。containerd の代替ではない |
| gVisor / Kata / Firecracker | より強い隔離ランタイム。containerd の shim として接続する |

Kubernetes が既定とするランタイムやプログラム可能なランタイム API が欲しいなら containerd を選ぶ。最小限の Kubernetes 専用ランタイムが欲しいなら CRI-O。daemonless な単一ホストのワークフローが欲しいなら Podman を選ぶ。
