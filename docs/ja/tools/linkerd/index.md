# Linkerd

> Pod 間トラフィックに mTLS・メトリクス・信頼性を、軽量な Rust 製サイドカープロキシ経由で追加する Kubernetes 向けサービスメッシュ。

- **カテゴリ**: Service Mesh & Networking
- **CNCF 成熟度**: Graduated
- **言語**: Go (コントロールプレーンと CLI) と Rust (ポリシーコントローラとデータプレーンの proxy)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [linkerd/linkerd2](https://github.com/linkerd/linkerd2)
- **ドキュメント基準コミット**: `7977d50` (タグ `edge-26.6.3` 付近)

## 何をするものか

Linkerd は Kubernetes 向けのサービスメッシュである。メッシュ対象の各 Pod の隣に小さな proxy を置き、その Pod の TCP トラフィックを proxy 経由で流す。トラフィックが proxy を通るようになると、アプリのコードを変えずに、Pod 間の相互 TLS、ゴールデンメトリクス (成功率・リクエストレート・レイテンシ)、リトライ、トラフィック分割が得られる。

プロジェクトは 2 つのリポジトリにまたがる。コントロールプレーンと `linkerd` CLI は `linkerd/linkerd2` (Go、Rust 製ポリシーコントローラを含む) にある。データプレーンの proxy は `linkerd/linkerd2-proxy` にあり、Rust で書かれた専用のマイクロプロキシである (出典 6)。決定的な選択はこの proxy にある。Linkerd は Envoy を使わない。低レイテンシ・低メモリ・メモリ安全を狙った小さな Rust proxy を載せる (出典 12, 13)。

Linkerd は「サービスメッシュ」という用語を世に広めたプロジェクトである (出典 4, 13)。2017 年に CNCF に参加し、2021 年にサービスメッシュとして史上初の Graduated に到達した (出典 1, 2)。

## いつ使うか

- Kubernetes 上で動かしており、最小限の設定でサービス間 mTLS をデフォルトで有効にしたい。
- アプリのコードを編集せずにゴールデンメトリクスとトラフィックレベルの信頼性 (リトライ・タイムアウト・トラフィック分割) が欲しい。
- 運用面を小さく保ちたい。CLI 主導のインストール、コンパクトなコードベース、ワークロードごとのチューニングが不要な proxy を重視する。
- Istio の全機能セットや非 Kubernetes ワークロードが必要なら向かない。Linkerd は Kubernetes 中心である。
- サイドカーなしでカーネルレベルのネットワーキングが欲しいなら向かない。その場合は Cilium の eBPF モデルが近い (出典 12)。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

- 出典 1: [CNCF Announces Linkerd Graduation](https://www.cncf.io/announcements/2021/07/28/cloud-native-computing-foundation-announces-linkerd-graduation/)
- 出典 2: [Announcing Linkerd's Graduation (linkerd.io)](https://linkerd.io/2021/07/28/announcing-cncf-graduation/)
- 出典 3: [Linkerd (CNCF projects page)](https://www.cncf.io/projects/linkerd/)
- 出典 4: [Linkerd Joins the CNCF (2017)](https://linkerd.io/2017/01/24/linkerd-joins-the-cloud-native-computing-foundation/)
- 出典 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- 出典 6: [linkerd/linkerd2-proxy (Rust data plane)](https://github.com/linkerd/linkerd2-proxy)
- 出典 7: [Linkerd 2.x Adopters & Case Studies](https://linkerd.io/community/adopters/)
- 出典 8: [ADOPTERS.md (linkerd2)](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md)
- 出典 9: [Linkerd surpasses Istio adoption with 118% growth in 2021](https://www.cncf.io/blog/2022/03/04/linkerd-surpasses-istio-adoption-in-europe-and-north-america-with-118-growth-in-2021/)
- 出典 10: [Linkerd 2024 Security Audit](https://linkerd.io/2025/02/18/linkerd-2024-security-audit/)
- 出典 11: [CNCF TAG Contributor Strategy: Linkerd governance review (#648)](https://github.com/cncf/tag-contributor-strategy/issues/648)
- 出典 12: [Linkerd vs Istio (Buoyant)](https://www.buoyant.io/linkerd-vs-istio)
- 出典 13: [What is a service mesh? (linkerd.io)](https://linkerd.io/what-is-a-service-mesh/)
- 出典 14: [Imagine Learning highlights Linkerd cost savings (InfoQ)](https://www.infoq.com/news/2025/09/linkerd-cost-savings/)
