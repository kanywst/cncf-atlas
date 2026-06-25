# Litmus

> Kubernetes 向けのクラウドネイティブなカオスエンジニアリング。中央コントロールプレーンと、再利用可能な実験を共有する ChaosHub を備える。

- **カテゴリ**: Chaos Engineering
- **CNCF 成熟度**: Incubating
- **言語**: Go (コントロールプレーン)、TypeScript/React (web UI)
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [litmuschaos/litmus](https://github.com/litmuschaos/litmus)
- **ドキュメント基準コミット**: `97cfc6f1` (tag 3.30.0、2026-06-17)

## 何をするものか

Litmus は Kubernetes ワークロードに対してカオス実験を実行するフレームワークである。障害 (fault) を Kubernetes カスタムリソースとして宣言し、対象を指定すると、Litmus が障害を注入しつつ、システムが期待される定常状態を保てるかを検証する。

プロジェクトは 2 つの面に分かれる。ChaosCenter がコントロールプレーンで、実験を作成・スケジュール・可視化する Go マイクロサービス群と React UI からなる。実行プレーンは各対象クラスタ内で動き、実際に障害を注入するオペレータ群である。本リポジトリは主にコントロールプレーンを含む。障害のコードは sister repo の `litmuschaos/litmus-go` に、実験バンドルは `litmuschaos/chaos-charts` にある。

設計はマルチクラスタ前提である。1 つの ChaosCenter インスタンスが多数の対象クラスタを同時に管理し、各クラスタのエージェントが逆向きにコントロールプレーンへダイヤルバックする。障害は ChaosHub を通じて共有・バージョン管理され、チームは実験定義を書き直さず再利用できる。

## いつ使うか

- Kubernetes でワークロードを動かしていて、カオス実験をカスタムリソースとして表現し GitOps フローに乗せたい。
- 複数クラスタにまたがる実験を 1 つのコントロールプレーンから駆動したい。NAT やファイアウォール内のクラスタも含む。
- 使い捨てスクリプトではなく、再利用・共有できる障害定義と定常状態チェック (probe) が欲しい。
- 実験結果から resiliency スコアと Prometheus メトリクスを得たい。

向かないのは、対象が Kubernetes 上にない場合 (マネージドなクラウドリソース障害サービスの方が適することがある) や、自前で運用するコントロールプレーンを持たないホスト型 SaaS が欲しい場合である。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [litmuschaos/litmus リポジトリ](https://github.com/litmuschaos/litmus) (pinned `97cfc6f1`、tag 3.30.0)、参照 2026-06-24。
2. [Litmus CNCF プロジェクトページ](https://www.cncf.io/projects/litmus/)、参照 2026-06-24。
3. [LitmusChaos becomes a CNCF incubating project](https://www.cncf.io/blog/2022/01/11/litmuschaos-becomes-a-cncf-incubating-project/)、参照 2026-06-24。
4. [LitmusChaos Q4 2025 update](https://www.cncf.io/blog/2026/01/22/litmuschaos-q4-2025-update-community-contributions-and-project-progress/)、参照 2026-06-24。
5. [LitmusChaos 3.0: robust, lean, developer-centric](https://www.cncf.io/blog/2023/11/07/litmuschaos-3-0-making-chaos-engineering-robust-lean-and-developer-centric/)、参照 2026-06-24。
6. [ChaosNative launches to accelerate Litmus adoption](https://www.prnewswire.com/news-releases/chaosnative-launches-to-accelerate-litmus-adoption-in-enterprises-301225911.html)、参照 2026-06-24。
7. [LitmusChaos proposal for Sandbox (cncf/toc #390)](https://github.com/cncf/toc/issues/390)、参照 2026-06-24。
8. [Litmus Docs: Installation](https://docs.litmuschaos.io/docs/getting-started/installation)、参照 2026-06-24。
9. [Litmus Docs: Architecture summary](https://docs.litmuschaos.io/docs/3.0.0/architecture/architecture-summary)、参照 2026-06-24。
10. [ADOPTERS.md](https://github.com/litmuschaos/litmus/blob/master/ADOPTERS.md)、参照 2026-06-24。
11. [litmuschaos/litmus-go](https://github.com/litmuschaos/litmus-go)、参照 2026-06-24。
12. [litmuschaos/chaos-charts](https://github.com/litmuschaos/chaos-charts)、参照 2026-06-24。
13. [GitHub release 3.30.0](https://github.com/litmuschaos/litmus/releases/tag/3.30.0)、参照 2026-06-24。
14. [CNCF Landscape (Litmus)](https://landscape.cncf.io/?selected=litmus)、参照 2026-06-24。
