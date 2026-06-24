# 歴史

## 起源

Helm はスタートアップ Deis が 2015 年 10 月に開発を始めた。サンフランシスコでの初回 KubeCon で初披露された。チームは既存ツール `deisctl` を Kubernetes 向けに書き直し、その成果を Homebrew・apt・yum といったパッケージマネージャを手本に作った。目標は「Kubernetes のパッケージマネージャ」。この最初の版は今は Helm Classic と呼ばれる。出典は [プロジェクトの歴史](https://helm.sh/community/history/) と [Helm 3 Preview pt1](https://helm.sh/blog/helm-3-preview-pt1/)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | Deis が Helm を作り、初回 KubeCon で発表 (Helm Classic)。 |
| 2016 | Deis と Google の Kubernetes Deployment Manager チームがシアトルで合流し Helm 2 を作ると決定。プロジェクトは Kubernetes 配下へ。 |
| 2017 | Microsoft が Deis を買収。 |
| 2018 | Helm が独立プロジェクトとなり CNCF incubating に参加。 |
| 2019 | Helm 3 リリース。Tiller を削除し、クライアントが Kubernetes API を直接叩く構成へ。 |
| 2020 | CNCF が Helm を卒業させる (10 番目の卒業プロジェクト)。 |
| 2025 | KubeCon NA で Helm 4 リリース。ネイティブ server-side apply とプラグイン再設計。 |

## どう進化したか

2016 年の Google Deployment Manager チームとの合流が Helm 2 を生んだ。Deployment Manager のサーバサイド成分は Tiller となり、リリース状態を保持してクライアントに代わって変更を適用する in-cluster コンポーネントになった。出典は [プロジェクトの歴史](https://helm.sh/community/history/)。

2018 年に Helm は Kubernetes サブプロジェクトから独立し CNCF incubating に入り、Monocular・Chart Repo・ChartMuseum といった関連作業を傘下に収めた。出典は [プロジェクトの歴史](https://helm.sh/community/history/)。

2019 年後半の Helm 3 は Tiller を完全に削除した。クライアントはユーザ自身の資格情報で Kubernetes API を直接叩くようになり、保護すべき特権的な in-cluster サービスがなくなったことでセキュリティと RBAC が単純化した。出典は [CNCF Helm 3 alpha の告知](https://www.cncf.io/blog/2019/05/16/helm-3-preview-helm-3-alpha-release-available-and-whats-next/)。2020-04-30 に Helm は CNCF Graduated に到達した。出典は [CNCF 卒業の告知](https://www.cncf.io/announcements/2020/04/30/cloud-native-computing-foundation-announces-helm-graduation/) と [Microsoft の記事](https://opensource.microsoft.com/blog/2020/05/01/helm-package-manager-kubernetes-now-cncf-graduated-project)。

## 現在地

Helm 4 は 2025 年 11 月の KubeCon NA でリリースされた。約 6 年ぶりのメジャーリリースで、ネイティブ server-side apply を追加し、プラグインシステムを WASM ベースで作り直した。このディープダイブは v4 系を読む。ピン留めしたコミット `74fa4fce` は `main` 上でタグ `v4.2.2` の数コミット先にあり、`internal/version/version.go` は `version = "v4.2"`、Go モジュールパスは `helm.sh/helm/v4`。
