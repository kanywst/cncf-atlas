# Volcano

> AI・ML・ビッグデータワークロードを動かすクラスタに、gang スケジューリング・キュー・フェアシェアを足す Kubernetes ネイティブなバッチスケジューラ。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [volcano-sh/volcano](https://github.com/volcano-sh/volcano)
- **ドキュメント基準コミット**: `7110813` (master, 2026-06-24)

## 何をするものか

Volcano は Kubernetes 向けのバッチスケジューリングシステム。デフォルトの `kube-scheduler` とは別プロセスとして動き、Pod の `schedulerName` で対象を振り分けて、自前で配置と bind を決める。スケジューラ部分は Kubernetes SIG-Scheduling の `kube-batch` プロジェクトを土台にしている。

解く中心的な課題は、デフォルトスケジューラが Pod を 1 つずつしか配置しないことにある。分散学習やビッグデータジョブでは、一群の Pod が全部同時に起動するか、1 つも起動しないかのどちらかであるべきで、1 つずつの配置は誤りになる。Volcano は gang スケジューリング (all-or-nothing 配置)、フェアシェアやキャパシティポリシーを持つキュー、差し替え可能なスケジューリングアルゴリズム群を足す。さらに、複数タスクから成るバッチワークロードのライフサイクル全体を管理する `Job` CRD を提供する。

スケジューラの他に、Volcano は CRD を reconcile するコントローラマネージャ、admission Webhook マネージャ、オンライン・オフライン混載ワークロードの colocation と QoS を担うオプションのノードエージェントを動かす。

## いつ使うか

- 分散学習 (PyTorch, TensorFlow, MPI/Horovod) や Spark/Flink ジョブを動かし、Pod の部分配置がリソースを無駄にしたりジョブをデッドロックさせる場合。
- 1 つのクラスタを共有するチーム間で、フェアシェア・キャパシティ・階層クォータ付きのキューが必要な場合。
- トポロジ対応や NUMA 対応の配置、あるいは GPU/NPU など scalar デバイスのスケジューリングが欲しい場合。
- 長命なサービスや Deployment しか動かさないなら不向き。デフォルトの `kube-scheduler` で足り、Volcano は運用コストが増えるだけになる。

## このディープダイブの構成

- [歴史](./history): Huawei での起源、kube-batch の系譜、CNCF までの道のり。
- [アーキテクチャ](./architecture): 4 つのプロセスと 1 スケジューリングサイクルの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、代替に何があるか。
- [内部実装](./internals): session と statement のトランザクションモデルをソースから読む。
- [はじめに](./getting-started): インストールと最初の VolcanoJob 実行。

## 出典

1. volcano-sh/volcano (README, LICENSE, ソース): <https://github.com/volcano-sh/volcano>
2. 固定コミット `7110813`: <https://github.com/volcano-sh/volcano/commit/7110813b198e99d0282170ef022f51ceb43d9403>
3. Cloud Native Batch System Volcano moves to the CNCF Incubator: <https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/>
4. Volcano project page (CNCF): <https://www.cncf.io/projects/volcano/>
5. Why Spark chooses Volcano as built-in batch scheduler on Kubernetes: <https://www.cncf.io/blog/2022/06/30/why-spark-chooses-volcano-as-built-in-batch-scheduler-on-kubernetes/>
6. Volcano adopters list: <https://github.com/volcano-sh/community/blob/master/adopters.md>
