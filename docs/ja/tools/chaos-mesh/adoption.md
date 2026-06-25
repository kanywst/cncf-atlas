# 採用事例・エコシステム

## 誰が使っているか

リポジトリの `ADOPTERS.md` は 40 を超える組織を列挙する。以下は、Chaos Mesh をどう使っているかを公開された出典付きで示せるものに絞った。ADOPTERS の記載は自己申告であり、「production で使用」の粒度は各社の書きぶりに依存する。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| ByteDance | 自社カオスプラットフォームの下回りの障害注入エンジンとして Chaos Mesh を統合。 | [ADOPTERS.md](https://github.com/chaos-mesh/chaos-mesh/blob/master/ADOPTERS.md) |
| Tencent (Interactive Entertainment) | TKE 移行後、fault isolation と service degradation の検証に使用。 | [Chaos Mesh blog](https://chaos-mesh.org/blog/Securing-Online-Gaming-Combine-Chaos-Engineering-with-DevOps-Practices/) |
| DataStax | Cassandra ベースの DBaaS である AstraDB のテストに、Fallout へ Chaos Mesh を組み込み。 | [トーク](https://youtu.be/Kw7gMurHJnQ) |
| Authzed | SpiceDB のテストで TimeChaos を使い vDSO の時刻を偽装。 | [トーク](https://youtu.be/3rjWxgdtBTw) |
| Percona | Percona Kubernetes Operators のカオステスト。 | [Percona blog](https://www.percona.com/blog/2020/11/05/chaosmesh-to-create-chaos-in-kubernetes/) |
| NetEase Fuxi Lab | 社内ハイブリッドクラウドの安定性向上。 | [ADOPTERS.md](https://github.com/chaos-mesh/chaos-mesh/blob/master/ADOPTERS.md) |

CNCF のプロジェクトページも adopters として ByteDance / NetEase / PingCAP / Tencent / Microsoft Azure を挙げている。`ADOPTERS.md` の他の名前には RabbitMQ / GreptimeDB / KingNet / DigitalChina / Xpeng / Maycur / Prudential / Qiniu などがある。

## 採用のシグナル

2026-06-24 時点、`repos/chaos-mesh/chaos-mesh` の GitHub REST API より:

- Stars: 7,763
- Forks: 1,007
- Open issues: 549
- Contributors: 約 221 (anonymous 込み)
- 作成: 2019-09-04、最終 push: 2026-06-23

比較研究 (arXiv 2505.13654) は Chaos Mesh の 74 リリースに対し LitmusChaos を 106 リリースと数え、両者を長期採用を維持する Kubernetes ネイティブ chaos ツールの二強と位置づけている。

## エコシステム

- Microsoft Azure Chaos Studio が Chaos Mesh の障害を統合し、AKS に対して実験を実行する (Pod kill を含む) ([Azure docs](https://docs.microsoft.com/en-us/azure/chaos-studio/chaos-studio-tutorial-aks))。
- KubeSphere App Store と Civo Kubernetes marketplace 経由で配布。
- Prometheus メトリクスを内蔵し、Workflow (Argo 風の実験オーケストレーション) と Schedule (cron) をプロジェクト自体に同梱。

## 代替候補

| 代替 | 違い |
| --- | --- |
| LitmusChaos (CNCF) | ChaosHub が 50+ のプリビルド実験と広いマルチクラウドカバレッジを持つが、`ChaosEngine` + `ChaosExperiment` の二段 CRD モデルでやや冗長。 |
| Chaos Toolkit | Kubernetes 固有でない、汎用・宣言的なカオスフレームワーク。 |
| Gremlin / Steadybit | 商用 SaaS のカオスプラットフォーム。 |
| AWS FIS | AWS マネージドの障害注入、AWS リソースにスコープ。 |
| Chaos Monkey / Simian Army | Netflix の platform-agnostic な元祖。細粒度障害でなくインスタンス停止に焦点。 |

Kubernetes 上で、障害種別ごと 1 CRD のきれいな `kubectl apply` と GitOps 適合を望み、分散合意・ロック・TTL キャッシュの検証に低レベル障害 (TimeChaos / JVMChaos / KernelChaos / IOChaos) が要るなら Chaos Mesh を選ぶ。トレードオフは、privileged DaemonSet を前提とするためクラスタに侵襲的で、運用コストが高めになること ([Container Solutions の比較](https://blog.container-solutions.com/comparing-chaos-engineering-tools))。

## 出典

1. ADOPTERS.md: <https://github.com/chaos-mesh/chaos-mesh/blob/master/ADOPTERS.md>
2. Chaos Mesh プロジェクトページ (CNCF): <https://www.cncf.io/projects/chaosmesh/>
3. GitHub REST API repos/chaos-mesh/chaos-mesh: <https://api.github.com/repos/chaos-mesh/chaos-mesh>
4. Microsoft Azure Chaos Studio + Chaos Mesh (AKS): <https://docs.microsoft.com/en-us/azure/chaos-studio/chaos-studio-tutorial-aks>
5. LitmusChaos vs Chaos Mesh (reintech): <https://reintech.io/blog/litmuschaos-vs-chaos-mesh-kubernetes-chaos-tool-comparison-2026>
6. Comparing Chaos Engineering Tools (Container Solutions): <https://blog.container-solutions.com/comparing-chaos-engineering-tools>
7. Chaos Engineering in the Wild (arXiv 2505.13654): <https://arxiv.org/html/2505.13654v1>
