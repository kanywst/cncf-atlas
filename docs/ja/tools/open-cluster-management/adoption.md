# 採用事例・エコシステム

## 誰が使っているか

以下の組織はすべて、基準コミット時点のプロジェクトの `ADOPTERS.md` に、組織自身が書いた用途とともに載っている ([ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md))。同じ採用者を扱う公開資料が別にあれば、それも併記した。

| 組織 | 種別・開始年 | 用途 | 出典 |
| --- | --- | --- | --- |
| Red Hat | Vendor, 2021 | founding member。OCM は Red Hat Advanced Cluster Management for Kubernetes の基盤コンポーネント。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Alibaba Cloud | Vendor, 2021 | 分散クラウドコンテナ基盤 ACK One の Fleet 管理機能が OCM ベース。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md), [KubeCon China 2021 講演](https://kccncosschn21.sched.com/event/pcaU) |
| Ant Group | End user, 2021 | 世界中に散らばる数十のクラスタ (各数千ノード) を hub から追加・管理。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| eBay | End user, 2024 | 190 超のクラスタへのアプリ配布。ManifestWork と Placement で Argo CD の Project と Application のマニフェストを運び、デプロイ自体は各クラスタの Argo CD が行う。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md), [CNCF ブログ](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/) |
| AppsCode | End user, contributor, 2022 | AppsCode Container Engine のマルチクラスタ管理。KubeDB が動かすデータベース向けに独自 add-on を作っている。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Xiaohongshu | End user, 2022 | 初期の採用者。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Spectro Cloud | Vendor, 2025 | Mural プラットフォームでのクラスタ横断のリソース連携。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Guidewire | End user, 2025 | 保険顧客向けのクラウド基盤。EKS クラスタ向けの AWS IAM ベースの登録を実装して寄贈。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md) |
| Groww | End user, 2025 | セル型デプロイ。人が手動で制御しながら ManifestWork を段階的に生成する独自の rollout コントローラを作っている。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md), [CNCF ブログ](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/) |
| VESSL AI | End user, contributor, 2025 | 複数クラウドの GPU クラスタを 1 つの hub に登録し、AI の学習・推論ワークロードを配置。 | [ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md), [CNCF ブログ](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/) |

adopters ファイルには統合先も 2 つ載っている。RamenDR はワークロードと永続データの災害復旧を行う Placement の拡張、KubeStellar Console は OCM のガイド付きインストールを含む。非公開の採用者がほかにもいる旨も書かれている。

## 採用のシグナル

- CNCF の Incubation 発表 (2026-11-10): Red Hat、Guidewire、eBay、AppsCode、Spectro Cloud などを含む 8 組織の 27 メンテナ、16 カ国 84 組織の 537 コントリビュータ、1,370 の pull request ([CNCF ブログ](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/))。
- GitHub (2026-11-15): `open-cluster-management-io/ocm` は 1,133 stars、193 forks ([GitHub API](https://api.github.com/repos/open-cluster-management-io/ocm))。contributors API はこの 1 リポジトリについて 106 アカウントを返す。CNCF の数字はより多くのリポジトリを含むので、両者は比べられない。
- 2022 年には 70 人超・15 社超のコントリビュータを報告していた ([CNCF ブログ, 2022-10-31](https://www.cncf.io/blog/2022/10/31/open-cluster-management-november-2022-update/))。
- リリースの頻度: 2025 年 6 月に `v1.0.0`、その後 2026 年 10 月の `v1.4.0` までマイナーリリースが 4 回 ([releases](https://github.com/open-cluster-management-io/ocm/releases))。

## エコシステム

adopters ファイルに統合先の一覧がある ([ADOPTERS](https://github.com/open-cluster-management-io/ocm/blob/b4e4b232350d6967008372423e5aa7a967d80a9f/ADOPTERS.md))。主なパターン:

- **GitOps。** Argo CD の Cluster Decision Resource generator が OCM の PlacementDecision を読み、ApplicationSet の対象クラスタを決める。Argo CD add-on と Argo CD Agent を使うと、各クラスタが自前の Argo CD を動かす pull モデルになる。[Argo のディープダイブ](../argo/)も参照。
- **バッチと AI のスケジューリング。** Kueue の MultiKueue は OCM を使ってワーカークラスタを構成できる。Fluid と Flower には add-on がある。
- **アプリケーション基盤。** [KubeVela](../kubevela/) と KubeStellar が OCM の上で動かす方法を文書化している。
- **ネットワークとメッシュ。** Submariner と Istio のマルチクラスタメッシュが add-on として提供されている。
- **クラスタのライフサイクル。** Cluster API がクラスタを作り、OCM が登録する。リポジトリの `solutions/cluster-api` に手順がある。
- **可観測性とツール。** OpenTelemetry add-on、Meshery、Janus の Backstage プラグイン、Krkn のカオステスト。
- **ほかのマルチクラスタエンジン。** [Clusternet](../clusternet/) は OCM の add-on を提供している。

## 代替候補

2 つのプロジェクトを比べた 2022 年の CNCF ブログは、違いを次のように書いている: "Karmada provides a more complete full stack end to end solution"、一方で "OCM provides a robust modular framework and APIs that enable other Kubernetes ecosystem projects to integrate with it" ([CNCF ブログ, 2022-09-26](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/))。

| 代替 | 違い |
| --- | --- |
| [Karmada](../karmada/) | 専用の API サーバを立て、素の Deployment をテンプレートとして受け取り、ポリシーで配る。レプリカをクラスタ間で分割する。Push と Pull の両方に対応。OCM の hub は普通のクラスタで、配送の単位はクラスタごとの明示的な ManifestWork。 |
| [Clusternet](../clusternet/) | 同じく hub とエージェントの構成で、独自のスケジューリングと配布の API を持つ。OCM の add-on としても動く。 |
| KubeFed | Kubernetes federation v2 で、現在は[アーカイブ済み](https://github.com/kubernetes-retired/kubefed)。OCM はアーカイブ後の後継を名乗り、`solutions/migrate-kubefed` に移行ガイドを置いている。 |
| Argo CD 単体 | ApplicationSet は Argo CD 自身に登録されたクラスタを対象にできる。OCM と組むとクラスタの選択は Placement に移り、pull モデルの add-on を使えば各 managed cluster が自前の Argo CD を動かす ([CNCF ブログ](https://www.cncf.io/blog/2026/11/10/open-cluster-management-ocm-becomes-a-cncf-incubating-project/))。 |
