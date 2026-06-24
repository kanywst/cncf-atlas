# 歴史

## 起源

Argo は 2016 年のスタートアップ Applatix で始まった。創業者は Hong Wang、Jesse Suen、Alexander Matyushentsev で、コンテナと Kubernetes 向けの DevOps スイートを作ろうとした。最初に出たのが Argo Workflows である (出典 4, 6)。

Applatix は Intuit に買収される。Intuit 内で、多数のクラスタと namespace を管理する Kubernetes ネイティブのデプロイツールが無いという具体的な課題に直面した。Intuit は金融企業でコンプライアンス要件があるため、Git を監査可能な真実とする GitOps アプローチを選び、その必要から Argo CD が生まれた (出典 4, 6)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | Applatix 創業。最初のプロジェクトは Argo Workflows (出典 4, 6) |
| 2017 | Argo をオープンソース化 (出典 4) |
| 2018 | Argo Workflows 公開 (2018-01)。Argo CD と Argo Events が続く。argo-cd repo は 2018-02-09 に GitHub 作成 (出典 3, 4, 5) |
| 2019 | Argo Rollouts リリース (出典 4) |
| 2020 | CNCF Incubator に受理 (2020-04) (出典 1, 2) |
| 2022 | Argo が CNCF で卒業 (2022-12-06) (出典 1, 2) |

## どう進化したか

Argo CD は単一の Argo CNCF エントリ配下の 4 サブプロジェクト (CD / Workflows / Rollouts / Events) の 1 つである。BlackRock は Argo Events をプロジェクトに寄贈した (出典 1, 4)。創業者は後に Akuity を設立し、商用のマネージドとサポートを提供している (出典 4)。

ソースツリーには注目すべき構造変更が見える。差分計算と同期のロジックは `gitops-engine` にあり、元は別リポジトリ (`argoproj/gitops-engine`) だった。pin したコミットでは argo-cd monorepo 内の `gitops-engine/` に取り込まれ、`go.mod:374` の `replace github.com/argoproj/argo-cd/gitops-engine => ./gitops-engine` でローカル module 化されている。import パスもそれに合わせて変わった (例: `controller/sync.go:15`)。

## 現在地

プロジェクトは CNCF Graduated である。recon 時点の安定最新リリースは `v3.4.4` (2026-06-18) で、pin した master は `VERSION` が `3.6.0`、`v3.5.0-rc1` が RC として存在する。つまり `master` から minor/patch を頻繁にリリースしている。module パス `github.com/argoproj/argo-cd/v3` (`go.mod:1`) が現行のメジャー系列を v3 と示す。CNCF 卒業レポートは 350+ 組織が本番利用 (Incubator 参加時から 250% 増) と記している (出典 1)。
