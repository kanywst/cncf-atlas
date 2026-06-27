# Armada

> 多数の Kubernetes クラスタにまたがるバッチジョブを、クラスタ自体の外側でキューイング・スケジューリングする高スループットスケジューラ。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [armadaproject/armada](https://github.com/armadaproject/armada)
- **ドキュメント基準コミット**: `85b582d` (タグ v0.21.5 直後、commit date 2026-06-25)

## 何をするものか

Armada は Kubernetes 上に構築されたバッチワークロードシステムである。多数の Kubernetes クラスタにまたがる数万ノード上で、1 日あたり数百万ジョブを動かすことを目指して設計されている (README:16)。Armada のジョブは、Kubernetes Pod に加えて任意の補助オブジェクト (Service、Ingress) と、所属キュー名などの Armada 固有メタデータからなる (`docs/system_overview.md:7-11`)。

Armada が存在するのは、素の Kubernetes が抱える 3 つの限界を超えるためである。単一クラスタは一定ノード数を超えるとスケールしにくく、クラスタ内 etcd ストアは非常に高いジョブスループットを支えられず、デフォルトの kube-scheduler はバッチ向けに作られていない (README:20-22)。Armada はキューとスケジューリングをクラスタ外の専用ストレージ層に保持し、数百万ジョブからなるキューを維持できるようにしている (README:21)。

control plane がジョブを受理・スケジュール・状態追跡する。executor は worker cluster ごとに 1 つ動き、control plane と当該クラスタの Kubernetes API を橋渡しする (`docs/system_overview.md:21`)。G-Research がプロジェクトを立ち上げ、CNCF に寄贈し、現在は Sandbox プロジェクトである。

## いつ使うか

- 機械学習・シミュレーション・データ解析などのバッチワークロードを、単一 Kubernetes クラスタに収まらないノード数にまたがって動かしたいとき。
- 多数のユーザ・チーム間の fair queuing、関連ジョブの gang-scheduling、preemption、キュー単位のレート制限が必要なとき (README:23-26)。
- etcd に過負荷をかけず、数百万の待機ジョブを保持するキューが欲しいとき (README:21)。
- 単一クラスタで規模が足りる場合は適さない。その場合は Volcano や Kueue のようなクラスタ内バッチスケジューラの方が簡潔。
- 汎用のサービスワークロードオーケストレータではない。有限時間で終わるバッチジョブが対象 (`docs/system_overview.md:7`)。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. armadaproject/armada リポジトリと README: <https://github.com/armadaproject/armada>
2. Armada CNCF プロジェクトページ (Sandbox、受理 2022-07-25): <https://www.cncf.io/projects/armada/>
3. CNCF ブログ "Armada - how to run millions of batch jobs over thousands of compute nodes using Kubernetes" (2021-01-25): <https://www.cncf.io/blog/2021/01/25/armada-how-to-run-millions-of-batch-jobs-over-thousands-of-compute-nodes-using-kubernetes/>
4. ADOPTERS.md: <https://github.com/armadaproject/armada/blob/master/ADOPTERS.md>
5. GitHub REST API リポジトリメタデータ: <https://api.github.com/repos/armadaproject/armada>
6. 基準コミット時点のソース: <https://github.com/armadaproject/armada/tree/85b582dedbf1e4a0c049ff3255bf23fda83fd3b4>
