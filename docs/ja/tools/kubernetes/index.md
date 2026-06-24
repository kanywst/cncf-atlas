# Kubernetes

> 多数のマシンにまたがってコンテナを動かすプラットフォーム。望ましい状態を宣言すると、コントローラがクラスタをそこへ収束させる。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes)
- **ドキュメント基準コミット**: `8c64324b` (master, 2026-06-22)

## 何をするものか

Kubernetes はマシンのプールの上でコンテナ化されたワークロードを動かす。Pod・Deployment・Service といったオブジェクトを API サーバへ投入すると、API サーバはそれを etcd に保存し、一群のコントローラが望ましい状態と観測された状態を絶えず比較してその差を埋めにいく。この reconcile ループが中核の考え方だ。

コントロールプレーンが「何をどこで動かすか」を決め、各ノードのエージェント (kubelet) がそれを実現する。スケジューラが Pod ごとにノードを選び、コントローラがレプリカ数やロールアウトといった上位オブジェクトを管理し、kubelet がコンテナランタイム経由でコンテナを起動する。すべて宣言的で、手順ではなく終了状態を記述する。

位置づけはアプリケーションフレームワークの下、生の計算資源の上だ。クラウドプロバイダ・ネットワーク・ストレージ・ランタイムは定義済みインターフェース (CRI, CNI, CSI) 経由で差し込まれるため、Kubernetes 自身は特定の環境ではなくオーケストレーションモデルに集中できる。

## いつ使うか

- 一握りを超える数のコンテナを動かし、スケジューリング・自己修復・ロールアウトを手書きスクリプトなしで欲しいとき。
- 宣言的 API とコントローラで、システムが自力で目標状態へ収束する仕組みが欲しいとき。
- プラガブルなインターフェース経由で、クラウドでもオンプレでも同じように動く移植可能な基盤が欲しいとき。
- フォークではなく、カスタムリソースとコントローラでプラットフォームを拡張したいとき。

単一ホスト上の 1 コンテナや、プロセスマネージャやマネージドのサーバーレスランタイムの方が運用が簡単な小さく静的なワークロードには過剰だ。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [kubernetes/kubernetes](https://github.com/kubernetes/kubernetes) (master, pinned `8c64324b`)、参照日 2026-06-22。
2. [CNCF Projects: Kubernetes](https://www.cncf.io/projects/kubernetes/)、参照日 2026-06-22。
3. [IBM: The History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history)、参照日 2026-06-22。
4. [Google Cloud: The Kubernetes origin story](https://cloud.google.com/blog/products/containers-kubernetes/from-google-to-the-world-the-kubernetes-origin-story)、参照日 2026-06-22。
5. [Wikipedia: Kubernetes](https://en.wikipedia.org/wiki/Kubernetes)、参照日 2026-06-22。
6. [Kubernetes case study: Spotify](https://kubernetes.io/case-studies/spotify/)、参照日 2026-06-22。
7. [Kubernetes case study: adidas](https://kubernetes.io/case-studies/adidas/)、参照日 2026-06-22。
