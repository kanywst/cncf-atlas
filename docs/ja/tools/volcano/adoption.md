# 採用事例・エコシステム

## 誰が使っているか

以下の組織は、Volcano コミュニティの [adopters ファイル](https://github.com/volcano-sh/community/blob/master/adopters.md)に本番ユーザーとして記載されている。ユースケースは本番という記載以上には個別に詳述されていない。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Huawei Cloud | 本番のバッチスケジューリング | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Tencent | 本番のバッチスケジューリング | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Baidu | 本番のバッチスケジューリング | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| IQIYI | 本番のバッチスケジューリング | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Xiaohongshu | 本番のバッチスケジューリング | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| DiDi | 本番のバッチスケジューリング | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| iFlytek | 本番のバッチスケジューリング | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Kingsoft Cloud | 本番のバッチスケジューリング | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |
| Zoom | 本番のバッチスケジューリング | [adopters.md](https://github.com/volcano-sh/community/blob/master/adopters.md) |

リストには本番ユーザーとして Bosszhipin・Ruitian Capital・Momenta も名を連ねている。

## 採用のシグナル

2026-06-25 時点、GitHub API で計測:

- スター 5,699、フォーク 1,415、open issue 657。
- コントリビュータ: GitHub contributors API はおよそ 447 まで及ぶ (匿名を含む)。
- [CNCF Incubation ブログ](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/)は、Sandbox 受理から Incubation までにコントリビュータが 70+ から 350+、組織が 5 から 50+ へ増えたと報告している。

## エコシステム

Volcano は [README](https://github.com/volcano-sh/volcano) によれば、Spark・Flink・Ray・PyTorch・TensorFlow・MindSpore・PaddlePaddle・Kubeflow・MPI/Horovod・Argo・KubeGene などのバッチ・AI フレームワークと統合する。Apache Spark は Kubernetes 上の built-in バッチスケジューラとして Volcano を採用した ([CNCF Spark ブログ](https://www.cncf.io/blog/2022/06/30/why-spark-chooses-volcano-as-built-in-batch-scheduler-on-kubernetes/))。GPU や NPU などヘテロデバイスにも対応する。マルチクラスタスケジューリング向けには別途 `volcano-sh/volcano-global` フェデレーションスケジューラがある。

## 代替候補

| 代替 | 違い |
| --- | --- |
| `kube-scheduler` (デフォルト) | Pod を 1 つずつスケジュールし、gang・キュー・フェアシェアを持たない。Volcano はバッチワークロードのためにこれを置換または補完する。 |
| `kube-batch` | Volcano のスケジューラの土台となった前身。現在はほぼ非活発で、Volcano が後継。 |
| Apache YuniKorn (CNCF) | 同じく Kubernetes 向けのバッチ/キュースケジューラで、階層キューが中心。Volcano は VolcanoJob CRD のライフサイクルと、より広い plugin 群 (NUMA, device, topology) で差別化する。 |
| Kueue (Kubernetes SIG) | ジョブのキューイングとクォータに特化し、配置はスケジューラに委ねる。Volcano はスケジューリングアルゴリズム自体まで踏み込む。 |
| YARN 等の従来 HPC スケジューラ | Kubernetes ネイティブでなく、別のリソースマネージャを要する。 |

ワークロードが gang 形かつ Kubernetes ネイティブなら Volcano を、既存スケジューラの上にキューイングだけが欲しいなら Kueue を選ぶとよい。
