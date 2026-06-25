# OpenCost

> Kubernetes とクラウドのコストをリアルタイムに按分する、ベンダー中立な CNCF 仕様と実装。

- **カテゴリ**: Observability
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [opencost/opencost](https://github.com/opencost/opencost)
- **ドキュメント基準コミット**: `4d117aa` (develop, 2026-06-19)

## 何をするものか

OpenCost は Kubernetes 上のワークロード実行コストを計測し按分する。クラスタ内で動き、Prometheus から使用量メトリクスを読み、クラウドプロバイダのプライシングを掛け合わせ、結果を namespace・pod・controller の単位まで分解する。さらに別パイプラインでクラウドの請求データを取り込み、クラスタ外の支出も同じモデルに乗せる。

このプロジェクトは 2 つの顔を同時に持つ。1 つは「Kubernetes コスト監視はこうあるべき」という文書化された仕様 (OpenCost Specification)、もう 1 つはその仕様のリファレンス実装だ。仕様策定には Adobe・AWS・Google・Microsoft・New Relic・SUSE・Mindcurv・D2iQ・Armory が参加した。実装は、商用の Kubecost 製品の土台でもあるコスト按分エンジンそのものである。

スタック上では Prometheus の隣、observability レイヤに位置する。OpenCost は Prometheus の消費者 (メトリクスをクエリする) であり生産者 (自身のコストメトリクスを `/metrics` で公開する) でもあるため、既存の監視スタックを置き換えるのではなく組み込まれる。

## いつ使うか

- Kubernetes 上でワークロードを動かしており、アカウント単位のクラウド請求ではなく namespace・pod・controller 別のコスト内訳が欲しいとき。
- idle (アイドル) や shared (共有) コストを、原因不明の差分として残さずチームに帰属させたいとき。
- すでに Prometheus を運用しており、コストデータを他のテレメトリと同じ場所に置きたいとき。
- 商用 FinOps 製品にコミットする前に、ベンダー中立でセルフホストの OSS ベースラインが欲しいとき。

向かないのは、クラスタ内の内訳が不要でアカウント単位のクラウド請求だけで十分な場合だ。この場合はクラウドプロバイダ純正のコストツールの方が単純だ。また、マルチクラスタ集約・長期保持・SSO・アラートを最初から揃えたい場合も向かない。そこは商用 Kubecost へのアップグレードや他の FinOps プラットフォームの領分になる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [OpenCost Advances to CNCF Incubation (公式ブログ)](https://opencost.io/blog/cncf-incubation/)
2. [Apptio: Celebrating OpenCost's Journey to CNCF Incubation](https://www.apptio.com/blog/opencost-cncf-incubation/)
3. [CNCF: OpenCost, a new CNCF Sandbox Project (2022-12-06)](https://www.cncf.io/blog/2022/12/06/opencost-a-new-cncf-sandbox-project-for-real-time-kubernetes-cost-monitoring/)
4. [CNCF: OpenCost advances to the CNCF Incubator (2024-10-31)](https://www.cncf.io/blog/2024/10/31/opencost-advances-to-the-cncf-incubator/)
5. [CNCF Projects: OpenCost](https://www.cncf.io/projects/opencost/)
6. [Introducing OpenCost (公式ブログ)](https://opencost.io/blog/introducing-opencost/)
7. [GitHub: opencost/opencost](https://github.com/opencost/opencost)
8. [ADOPTERS.MD at commit 4d117aa](https://github.com/opencost/opencost/blob/develop/ADOPTERS.MD)
9. [Grafana Labs: How Grafana Labs uses and contributes to OpenCost](https://grafana.com/blog/2023/02/02/how-grafana-labs-uses-and-contributes-to-opencost-the-open-source-project-for-real-time-cost-monitoring-in-kubernetes/)
10. [OpenCost README at commit 4d117aa](https://github.com/opencost/opencost/blob/develop/README.md)
11. [OpenCost Documentation](https://www.opencost.io/docs/)
