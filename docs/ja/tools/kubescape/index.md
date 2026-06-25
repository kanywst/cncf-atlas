# Kubescape

> IDE からクラスタまでをカバーする Kubernetes セキュリティの OSS プラットフォーム。構成・脆弱性・ランタイムを一気通貫でスキャンする。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [kubescape/kubescape](https://github.com/kubescape/kubescape)
- **ドキュメント基準コミット**: `8274975` (2026-06-23, master, タグ v4.0.9 の直後)

## 何をするものか

Kubescape は Kubernetes のセキュリティ問題をスキャンする。ワークロード・マニフェスト・Helm チャートを NSA/CISA、MITRE ATT&CK、CIS といったコンプライアンスフレームワークに照らして検査し、コンテナイメージの既知脆弱性をスキャンし、risk スコアと compliance スコアを出力する。このリポジトリの CLI がスキャンエンジン本体で、継続的な in-cluster 監視は別リポジトリ (`kubescape` org) の microservices 群が担う。

ARMO が開発を始めたプロジェクトで、Go で書かれている。スキャンエンジンはポリシー内容 (control ルール) をバイナリに埋め込まず、実行時に別リポジトリから取得する。そのためルールセットは CLI を再ビルドせずに更新できる。ルールは Open Policy Agent (OPA) の Rego エンジンで評価し、画像スキャンは Grype と Syft に委譲する。

スタックの中では「shift-left からランタイムまで」の位置に収まる。開発者は IDE や CI でマニフェストに対して実行し、同じプロジェクトが稼働クラスタ向けに operator と node-agent を出している。

## いつ使うか

- 名前付きフレームワーク (NSA/CISA、MITRE、CIS) に対して Kubernetes の posture を測り、risk または compliance の閾値で CI をゲートしたい。
- マニフェスト・Helm チャート・稼働クラスタのスキャンと画像脆弱性スキャンを 1 つのツールでやりたい。
- スキャナバイナリと独立してポリシー内容を更新したい。完全な air-gapped 運用の選択肢も欲しい。
- ノードレベルの CIS ベンチマーク検査だけで十分なら向かない (kube-bench の方が狭く単純)。純粋なランタイム脅威検知だけなら Falco の方が専門的。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとスキャンの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [kubescape/kubescape リポジトリと GitHub API](https://github.com/kubescape/kubescape) (stars/forks/license/created/release の実測値)。
2. [CNCF projects の Kubescape ページ](https://www.cncf.io/projects/kubescape/)。
3. [Kubescape becomes a CNCF incubating project (CNCF ブログ)](https://www.cncf.io/blog/2025/02/26/kubescape-becomes-a-cncf-incubating-project/)。
4. [ARMO Launches Expanded Version of Kubescape (Business Wire)](https://www.businesswire.com/news/home/20211012005814/en/ARMO-Launches-Expanded-Version-of-Kubescape-Worlds-First-Open-Source-Kubernetes-Testing-Tool-Compliant-with-NSA-CISA-Hardening-Guidance)。
5. [Kubescape 1 周年と OSS 化のアナウンス (Medium, ARMO)](https://medium.com/@jonathan_37674/kubescape-one-year-anniversary-open-source-announcment-armo-a1c25a44c054)。
6. [Kubescape 中央 ADOPTERS.md (kubescape/project-governance)](https://github.com/kubescape/project-governance/blob/main/ADOPTERS.md)。
7. [Announcing Kubescape 4.0 (CNCF ブログ)](https://www.cncf.io/blog/2026/03/26/announcing-kubescape-4-0-enterprise-stability-meets-the-ai-era/)。
8. [Kubescape 4.0 Brings Runtime Security and AI Agent Scanning (InfoQ)](https://www.infoq.com/news/2026/03/kubescape-40/)。
9. [Kubescape Self-Assessment (CNCF TAG Security)](https://tag-security.cncf.io/community/assessments/projects/kubescape/self-assessment/)。
10. [Kubescape Achieves CNCF Incubation Status (The New Stack)](https://thenewstack.io/kubescape-achieves-cncf-incubation-status/)。
11. [ARMO が $30M 調達 (VentureBeat)](https://venturebeat.com/security/first-fully-open-source-kubernetes-security-platform-armo-raises-30-million)。
