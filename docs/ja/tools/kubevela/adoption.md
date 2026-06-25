# 採用事例・エコシステム

## 誰が使っているか

以下はプロジェクトの ADOPTERS ファイルに production users として記載され、いくつかは CNCF incubation 告知でも名指しされている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Alibaba Cloud | ACK ONE / BizWorks / SAE を支える | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |
| China Merchants Bank (招商銀行) | アプリ配信プラットフォーム | [CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/) |
| ByteDance | コンテナ化ゲームプラットフォーム | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |
| Baidu | MEG マイクロサービス | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |
| NetEase Games | アプリ配信 | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |
| Springer Nature | アプリ配信 | [ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md) |

ADOPTERS ファイルにはこの他にも production users として JD Cloud・China Mobile Cloud・Li Auto・XPeng Motors・Geely Auto・Shein・OceanBase・wasmCloud・Vortexa が記載される。別の development & testing セクションには Intuit・Siemens Technology・HSBC・Mercedes-Benz Group China・Guidewire・Trendyol・DaoCloud・Didi Chuxing が挙がる ([ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md))。

## 採用のシグナル

GitHub API での計測 (2026-06-24):

- star 7,833
- fork 1,030
- contributor 253
- open issue 214

リポジトリ作成は 2020-07-03。安定版最新タグは `v1.10.8`、プレリリース最新は `v1.11.0-alpha.3` (2026-04-13)。CNCF incubation レビュー時点で、プロジェクトは contributor 90+ から 290+ へ、貢献組織 20+ から 70+ へ成長したと報告している ([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/))。

## エコシステム

KubeVela は他のツールを置き換えるのではなくラップするよう作られている。Helm chart を直接配信でき、Crossplane CRD をネイティブなコンポーネントとして扱う ([KubeVela docs](https://kubevela.io/docs/))。community 製の Terraform controller が Terraform module をコンポーネントとしてレンダリングし、設定言語の代替として KCL との連携もある ([KCL + KubeVela](https://www.kcl-lang.io/blog/2023-12-15-kubevela-integration))。`src/pkg/addon` 配下のアドオンシステムがさらなる拡張をパッケージ化する。Argo CD・Crossplane・KubeVela を 1 つの配信スタックに組み合わせる構成も知られる ([KubeVela talk](https://kubevela.io/videos/talks/en/devops-toolkit-2/))。

## 代替候補

KubeVela の差別化点は、OAM ベースのアプリ中心抽象に workflow とマルチクラスタ配信を単一の control plane へまとめたことだ。CUE モジュールの柔軟性が強みで、トレードオフは複雑性がプラットフォーム設定側に移ること ([LibHunt 比較](https://www.libhunt.com/compare-kubevela-vs-crossplane))。

| 代替 | 違い |
| --- | --- |
| Helm | 生の Kubernetes マニフェストをパッケージ化・テンプレート化する。KubeVela は 1 つ上の層で、Helm chart を 1 コンポーネントとして配信できる ([KubeVela docs](https://kubevela.io/docs/)) |
| Argo CD | Git 駆動でマニフェストを同期する。層が違い、置き換えではなく併用されることが多い ([KubeVela talk](https://kubevela.io/videos/talks/en/devops-toolkit-2/)) |
| Crossplane | CRD でクラウドインフラをプロビジョニングする。KubeVela は Crossplane CRD をネイティブなコンポーネントとして消費する ([KubeVela docs](https://kubevela.io/docs/)) |
