# 採用事例・エコシステム

## 誰が使っているか

以下の採用企業は [kubescape/project-governance の中央 ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) によるもの。CLI リポジトリ自身の `ADOPTERS.md` はそこへリダイレクトする。同ファイルは Well-Known Companies として AWS、Energi Danmark、Gitpod、Intel、Orange Business、Rabobank、VMware (Bitnami) を挙げ、加えて下記のユースケース付きエントリを記載する。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Cox Communications | 約 3,000 アプリの CI パイプラインで K8s ベストプラクティスのセキュリティ解析 | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |
| Swisscom AG | CIS フレームワークで Helm chart / manifest をスキャン | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |
| Schwarz IT (SIT) | エッジ Kubernetes クラスタの継続的コンプライアンス | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |
| Fusioncore.ai | Software Bill of Behavior | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |
| ARMO | 脆弱性モニタリング | [ADOPTERS.md](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md) |

## 採用のシグナル

2026-06-24 時点の GitHub API 実測 ([リポジトリ](https://github.com/kubescape/kubescape)):

- stars 11,492 / forks 950 / open issues 72。リポジトリ作成は 2021-08-12。
- contributors は約 205 名規模 (GitHub contributors API の末尾ページ、anon 込み)。
- 最新リリースは `v4.0.9`、2026-05-29 公開。
- 配布チャネル: Homebrew、Krew、Chocolatey、`install.sh`、Helm (in-cluster)、GitHub Action、VS Code 拡張。README に OpenSSF Best Practices バッジ (#6944) と Scorecard バッジがある。

## エコシステム

`kubescape` org 内の関連リポジトリ (`gh repo list kubescape` 実測、[リポジトリ](https://github.com/kubescape/kubescape)):

- `regolibrary`: スキャナが使う control 群 (NSA/CISA、MITRE、CIS)。エンジンと分離されている。
- `node-agent`: eBPF ランタイムエージェント。4.0 で host-sensor を吸収した。
- `operator`、`kubevuln`、`kollector`、`storage`、`gateway`、`synchronizer`: in-cluster microservices。`helm-charts` で配備する。
- `cel-admission-library`: VAP 用の既製ポリシー。`vscode-kubescape`、`lens-extension`、`headlamp-plugin`、`github-action` が IDE / CI 統合を提供する。

統合先: CVE / SBOM の Grype と Syft、署名検証の Cosign/Sigstore、`kubescape patch` の image patch を担う Copacetic、README が言及する eBPF ランタイム監視の Inspektor Gadget、Prometheus exporter。

## 代替候補

藁人形論法ではなく、実際の差を挙げる。

| 代替 | 違い |
| --- | --- |
| Trivy (Aqua) | アーティファクト横断スキャナ (image / IaC / SBOM / secret)。misconfig も自前で持つ。Kubescape はフレームワーク準拠 (NSA/CISA、MITRE、CIS) と risk / compliance スコアに寄せ、画像スキャンは Grype を内蔵する。 |
| kube-bench (Aqua) | ノードレベルの CIS Kubernetes Benchmark に特化。Kubescape は CIS を含むが workload / manifest / Helm / IDE / CI まで広く、remediation や VAP 生成も持つ。 |
| Checkov / Polaris | IaC・マニフェストの静的チェック中心。ランタイムや in-cluster オペレータは守備範囲外。 |
| Falco (CNCF Graduated) | ランタイム脅威検知に特化。Kubescape は posture + 脆弱性 + ランタイム (node-agent) を 1 プラットフォームに束ねるので、競合というより補完寄り。 |
