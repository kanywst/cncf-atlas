# 採用事例・エコシステム

## 誰が使っているか

repo には自己申告の adopters リスト `USERS.md` が同梱され、pin したコミット時点で 445 エントリあった (出典 7)。CNCF 卒業アナウンスは本番採用組織を別途明記している (出典 1)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Adobe | adopters ファイルと卒業アナウンスに記載 | [USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md), [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| BlackRock | 本番採用組織として明記。Argo Events を寄贈 | [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| Capital One | 本番採用組織として明記 | [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| Intuit | プロジェクトの発祥。採用組織として明記 | [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| Tesla | 本番採用組織として明記 | [CNCF](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/) |
| Alibaba Group | adopters ファイルに記載 | [USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md) |
| BMW Group | adopters ファイルに記載 | [USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md) |
| Bosch | adopters ファイルに記載 | [USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md) |

卒業アナウンスは Google、PagerDuty、Peloton、Snyk、Swisscom、Volvo も挙げ、350+ 組織が本番利用 (Incubator 参加時から 250% 増) と述べている (出典 1)。

## 採用のシグナル

2026-06-22 に `argoproj/argo-cd` を GitHub API で観測 (出典 3)。

- スター: 23,219
- フォーク: 7,353
- open issue: 4,216
- コントリビュータ: おおよそ 2,000 超 (anon 含むページネーション末尾が page 2033)

## エコシステム

- 兄弟の Argo プロジェクト: Rollouts (progressive delivery)、Workflows、Events が同じ傘の下で連携する。
- ApplicationSet (`applicationset/`) はマルチクラスタ/モノレポ向けに Application を量産する。
- `gitops-engine` は共有の差分・同期ライブラリで、本 repo に取り込み済み。Argo CD と Flux 系の双方が使える。
- 商用/マネージド: Akuity (創業者の会社)、Codefresh、downstream の Red Hat OpenShift GitOps (出典 1, 4)。

## 代替候補

直接の代替は Flux CD である。どちらも CNCF Graduated の GitOps コントローラ。web UI / SSO / RBAC / マルチクラスタ可視化を最初から内包し、application-centric なモデルが欲しいなら Argo CD を選ぶ。小さくコンポーザブルなコントローラ群 (GitOps Toolkit) を好み、内蔵 UI が要らないなら Flux を選ぶ。

| 代替 | 違い |
| --- | --- |
| Flux CD | コンポーザブルなコントローラ toolkit で UI 非内包。Argo CD は application-centric で UI/SSO/RBAC を統合 |
| Spinnaker | より広いマルチクラウド CD プラットフォームで重く、Git pull ネイティブではない |
| CI からの push (kubectl/Helm) | 外部 push モデル。Argo CD は pull 型でドリフトを継続的に reconcile する |
