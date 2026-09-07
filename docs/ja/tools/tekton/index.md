# Tekton

> Kubernetes ネイティブな CI/CD フレームワーク。パイプラインもタスクもその実行もカスタムリソースで、すべてのステップは Pod の中のコンテナ。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Incubating (受け入れ 2026-03-13、発表 2026-03-24)
- **言語**: Go 1.26.4
- **ライセンス**: Apache-2.0
- **リポジトリ**: `tektoncd/pipeline`
- **記述時のコミット**: `9dec5e4b` (2026-09-04、`v1.16.0` の 4 コミット先)

## 何をするものか

Tekton は継続的デリバリのための語彙を Kubernetes に与える。作業の単位は `Task` で、その中身は順序付きの step の並び。step ひとつがコンテナイメージとコマンドの組になる。ワークフローは `Pipeline` で、タスク同士の依存関係の集合として書く。実行するには `TaskRun` か `PipelineRun` を作ればよく、クラスタ内のコントローラがそれを Pod に変える。

ビルドサーバは存在しない。スケジューラは Kubernetes のスケジューラ、隔離の境界はコンテナ、状態は他の Kubernetes オブジェクトと同じく etcd にある。`TaskRun` はちょうど 1 つの Pod に対応するので、あるタスクの step 同士はファイルシステムとネットワーク名前空間を共有する。逆にタスクをまたいでデータを渡すには、永続ボリュームのような workspace を明示的に用意する必要がある。

紛らわしいことに「Tekton」はファミリの名前でもあり、コンポーネントの名前でもある。ファミリには Triggers (受け取ったイベントから実行を作る)、Chains (ビルド成果物に署名し provenance を出す)、Results (実行履歴の長期保管)、CLI の `tkn`、Dashboard、Operator、Hub が含まれる。このディープダイブが扱うのは Tekton Pipelines、つまり CRD を定義してワークロードを走らせる中核のコンポーネント。

## いつ使うか

- すでに Kubernetes を運用していて、CI/CD を同じクラスタ上のオブジェクトにしたい。RBAC もアドミッション制御も監査ログも同じものが効く。
- 同じパイプライン定義を、どのクラウドでもオンプレでも、準拠したクラスタなら無改造で動かしたい。
- デリバリのプラットフォームを他チームに提供する側にいる。Tekton は意図的にフレームワークであって、製品としての体験を持たない。Red Hat OpenShift Pipelines や IBM Cloud Continuous Delivery はその上に作られた製品。
- サプライチェーンの provenance を重視していて、署名と SLSA 属性の生成を実行基盤そのものに組み込みたい。Tekton Chains がその役目を担う。

向かないケース:

- Web UI とマーケットプレイスがあり、運用するクラスタも要らないホスト型の体験がほしい。そこは GitHub Actions や GitLab CI に分がある。
- ワークロードがコンテナではない、あるいは Kubernetes クラスタを持っておらず持ちたくもない。Tekton には他の実行モデルが無い。

## このディープダイブの構成

- [歴史](./history): どこから来て、なぜ存在するのか。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールして最初の構成を動かす。

## 出典

1. [Tekton Becomes a CNCF Incubating Project](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/), CNCF, 2026-03-24.
2. [A Year of Tekton](https://cd.foundation/blog/2019/11/15/a-year-of-tekton/), CD Foundation, 2019-11-15.
3. [Introducing the Continuous Delivery Foundation](https://opensource.googleblog.com/2019/03/introducing-continuous-delivery-foundation.html), Google Open Source Blog, 2019-03.
4. [The Tekton Pipelines Beta release](https://opensource.googleblog.com/2020/05/the-tekton-pipelines-beta-release.html), Google Open Source Blog, 2020-05.
5. [Tekton Graduation](https://tekton.dev/blog/2022/10/26/tekton-graduation/), tekton.dev, 2022-10-26.
6. [Tekton Incubation Application (cncf/toc#1310)](https://github.com/cncf/toc/issues/1310), CNCF TOC.
7. [Tekton Moves to the CNCF](https://cd.foundation/announcement/2026/03/24/tekton-moves-to-the-cncf/), CD Foundation, 2026-03-24.
8. [Tekton documentation](https://tekton.dev/docs/), tekton.dev.
9. [Tekton DevStats](https://tekton.devstats.cncf.io/), CNCF.
