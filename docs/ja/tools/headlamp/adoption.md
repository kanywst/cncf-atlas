# 採用事例・エコシステム

## 誰が使っているか

リポジトリはツリー内に `ADOPTERS.md` を保持しており、以下の組織の一次資料はこれである。各エントリはその組織が Headlamp をどう使うかを記述したもので、推測は含まない。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Microsoft | Headlamp に貢献し社内利用。AKS デスクトップ体験 (`Azure/aks-desktop`) の基盤 | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Oracle | Oracle Cloud Native Environment (OCNE) の UI を Headlamp とプラグインで構築 | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| EPAM Systems | `edp-headlamp` として KubeRocketCI に統合 | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Virginia Tech | 学内 IT Common Platform の UI として 6 クラスタを管理、独自プラグインを開発 | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Swisscom | Cloud Native Network Function (CNF) の管理 UI として利用 | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Orange | マネージドデータサービスの開発者向け UI | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| KA-NABELL | マイクロサービス DevOps の運用ハブ。Knative プラグイン等を開発・貢献 | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |
| Millennium bcp, WhizUs GmbH | 採用組織として記載 | [ADOPTERS.md](https://github.com/kubernetes-sigs/headlamp/blob/main/ADOPTERS.md) |

## 採用のシグナル

2026-07-08 時点 (GitHub REST API): スター 6,835、フォーク 922、コントリビュータ約 281 名。リポジトリ作成は 2019-11-08。最新リリースは `v0.43.0` (2026-06-16) で、本稿が基準にするツリーの 1 コミット前だ。プロジェクトは OpenSSF Best Practices バッジ (project 7551) を持ち、OpenSSF Scorecard を公開する (README)。記名された採用組織のリストは Sandbox プロジェクトとしては珍しく幅広く、クラウドベンダー・通信事業者・大学・日本の EC 企業に及ぶ。これはスター数単独よりも強い採用シグナルである。

## エコシステム

Headlamp は fork ではなくプラグインで拡張され、それを支えるエコシステムが形成されている。公式プラグイン集は `headlamp-k8s/plugins` にあり、プラグインマーケットプレイスがあり、サードパーティがプラグインを作り梱包する手段として `@kinvolk/headlamp-plugin` SDK と `pluginctl` CLI がある。プラグインの他にも、バックエンドは Helm・port-forward・Prometheus メトリクス表示・OpenTelemetry 計装を統合し、クラスタ内 Web デプロイに加えて Electron のデスクトップアプリとして出荷される。Kubernetes SIG UI サブプロジェクトとして、いまや Kubernetes プロジェクト自身のガバナンスの内側にある。

## 代替候補

Headlamp の本質的な差は、プラグインで拡張可能なマルチクラスタ UI が、ブラウザとデスクトップの両方で動き、常に自前のバックエンドを経由してプロキシする点だ。主要な代替はそれぞれその一部をカバーする。

| 代替 | 違い |
| --- | --- |
| Kubernetes Dashboard | 公式のクラスタ内 Web UI。閲覧中心で拡張性は限定的。Headlamp は書き込み操作・プラグイン・マルチクラスタ・デスクトップ配布を足す |
| Lens / OpenLens | デスクトップ中心の IDE 的 Kubernetes UI。Lens 本体は商用寄り (Mirantis)。Headlamp は Apache-2.0 で Web/デスクトップ両対応、プラグインで拡張 |
| k9s | 高速なキーボード駆動運用向けのターミナル (TUI) ナビゲータ。Headlamp はブラウザ GUI で非ターミナル利用者にも届く |
| Octant (アーカイブ) | VMware による先行のプラグイン型ダッシュボード。開発終了。Headlamp が似た位置を占め、今も保守されている |
