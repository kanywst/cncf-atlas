# Karmada

> 複数クラスタ/クラウドへワークロードを Kubernetes ネイティブ API のまま配布・スケジューリングするコントロールプレーン。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [karmada-io/karmada](https://github.com/karmada-io/karmada)
- **ドキュメント基準コミット**: `658499d` (2026-06-22, master, タグ `v1.19.0-alpha.0` 付近)

## 何をするものか

Karmada は専用のコントロールプレーン (独自の `karmada-apiserver` と etcd) を立て、そこに素の Kubernetes リソーステンプレート (普通の `Deployment` や `Service` など) と Karmada 独自の CRD を一緒に保存する。メンバークラスタを登録し、`PropagationPolicy` で各テンプレートをどこへ配るかを宣言すると、Karmada がワークロードを対象クラスタへコピーしてスケジューリングする。アプリのマニフェストは無改造のまま。

動作は 2 モードある。Push モードではコントロールプレーンが各メンバークラスタの API を直接叩く。Pull モードでは `karmada-agent` がメンバークラスタ内で動き、自分の側へ Work を取りに来る。コントロールプレーンからネットワーク的に到達できないクラスタに向く。

非推奨となった KubeFed の後継にあたる。単純なコピーにとどまらず、Karmada はクラスタ横断スケジューリングを足している: 1 つの Deployment のレプリカを重みや実残容量でクラスタ間に分割し、クラスタごとの override を当て、容量変化に応じて再スケジュールできる。Lua ベースのリソースインタプリタにより、Go を再コンパイルせず任意の CRD を Karmada に教えられる。

## いつ使うか

- 複数の Kubernetes クラスタ (マルチリージョン、マルチクラウド、オンプレ + クラウド) でワークロードを動かしており、1 か所で宣言・スケジューリングしたい。
- ワークロードのレプリカを 1 クラスタに固定するのでなく、静的な重みや実残容量でクラスタ間に分割したい。
- 共通テンプレートの上に、クラスタごとのカスタマイズ (イメージレジストリ、レプリカ数、env) を override ポリシーで載せたい。
- Deployment 以外の CRD (Flink, Ray, Kubeflow のジョブ) を、オペレータを書き換えずにクラスタ横断で配りたい。

単一クラスタで足りる場合や、ラベルで静的に分けた少数クラスタへの GitOps 配信だけが欲しい場合は、追加のコントロールプレーンは不要なオーバーヘッドになる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [karmada-io/karmada](https://github.com/karmada-io/karmada) (README, code), 参照 2026-06-24。
2. [Karmada Adopters](https://karmada.io/adopters/), 参照 2026-06-24。
3. [Karmada 公式サイト](https://karmada.io/), 参照 2026-06-24。
4. [Karmada brings Kubernetes multi-cloud capabilities to CNCF Incubator](https://www.cncf.io/blog/2023/12/12/karmada-brings-kubernetes-multi-cloud-capabilities-to-cncf-incubator/), CNCF blog, 参照 2026-06-24。
5. [Karmada CNCF プロジェクトページ](https://www.cncf.io/projects/karmada/), 参照 2026-06-24。
6. [Karmada and Open Cluster Management: two new approaches](https://www.cncf.io/blog/2022/09/26/karmada-and-open-cluster-management-two-new-approaches-to-the-multicluster-fleet-management-challenge/), CNCF blog, 参照 2026-06-24。
7. [Karmada launches Adopter Group](https://www.cncf.io/blog/2025/03/26/karmada-launches-adopter-group/), CNCF blog, 参照 2026-06-24。
8. [GitHub REST API: repos/karmada-io/karmada](https://api.github.com/repos/karmada-io/karmada), 参照 2026-06-24。
