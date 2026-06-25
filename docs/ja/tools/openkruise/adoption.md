# 採用事例・エコシステム

## 誰が使っているか

pinned コミットのリポジトリに `ADOPTERS.md` は無く、採用企業一覧は CNCF 側にある。CNCF Incubating 昇格 blog (2023-03-02) が以下の組織を明示列挙している ([CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/))。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Alibaba Group | Double 11 規模で OpenKruise ワークロードを稼働。約 10 万ワークロード・数百万コンテナを管理 | [Alibaba Cloud blog](https://www.alibabacloud.com/blog/openkruise-the-cloud-native-platform-for-the-comprehensive-process-of-alibabas-double-11_596966) |
| Baidu | 採用企業として列挙 | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Bringg | 採用企業として列挙 | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| LinkedIn | 採用企業として列挙 | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Lyft | 採用企業として列挙 | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Shopee | 採用企業として列挙 | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Oppo | 採用企業として列挙 | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |
| Spectro Cloud | 採用企業として列挙 | [CNCF blog](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/) |

## 採用のシグナル

GitHub REST API で 2026-06-24 に観測 ([API](https://api.github.com/repos/openkruise/kruise)):

- stars 5,273 / forks 892 / open issues 93。
- contributors: API のページネーション末尾は約 160 名超 (per_page=1, anon 込みで page 161)。
- 作成 2019-05-30、最新 push 2026-06-21、最新リリース v1.9.0 (2026-06-21)。
- 言語は Go 単一。

## エコシステム

- kruise-rollouts: プログレッシブデリバリ用の別リポジトリ。OpenKruise ワークロードを駆動できる。
- OpenKruiseGame (kruise-game): 同じ基盤上に構築したゲームサーバ向けワークロード。
- kruise Helm チャート: サポートされるインストール経路。
- KubeVela / OAM: OpenKruise ワークロードの上にアプリケーションモデルを重ねる (同じ Alibaba 系エコシステム)。
- サービスメッシュ: SidecarSet の sidecar 管理は Istio などのメッシュ sidecar 運用と競合・補完する。v1.7 以降は native Kubernetes sidecar に対応。

## 代替候補

| 代替 | 違い |
| --- | --- |
| 上流 Deployment / StatefulSet / DaemonSet | OpenKruise の CloneSet / Advanced StatefulSet / Advanced DaemonSet が上位互換。in-place update、partition カナリア、Pod ごと PVC、削除コスト制御、並列更新を足す。 |
| Argo Rollouts / Flagger | プログレッシブデリバリ (canary / blue-green、メトリクス解析、トラフィックシフト) が主眼。OpenKruise は Pod 再作成回避とワークロードプリミティブが主眼で、Argo Rollouts は CloneSet を対象ワークロードにできる。 |
| KubeVela / OAM | ワークロードの上のアプリケーションモデル・プラットフォーム層であり、ワークロードコントローラそのものではない。 |
