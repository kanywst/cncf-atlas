# 歴史

## 起源

containerd は 2014 年に Docker 社内で、Docker engine の下に位置するランタイムマネージャとして誕生した。役割は、実際にコンテナを動かす runc プロセス群を管理することだった。これは 2015 年に Docker の libcontainer が OCI のリファレンスランタイム runc になった流れに連なる。containerd は runc を駆動し、稼働中コンテナを追跡する層になった ([ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md)、[CNCF graduation 発表](https://www.cncf.io/announcements/2019/02/28/cncf-announces-containerd-graduation/))。

Docker 1.11 は containerd を engine の中核ランタイムとして統合した。これ以降、`docker run` はコンテナのライフサイクルを containerd に委譲し、containerd が runc を呼んでカーネルを叩く構成になった ([Docker ブログ](https://www.docker.com/blog/containerd-vs-docker/)、[DataCamp](https://www.datacamp.com/blog/containerd-vs-docker))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2014 | Docker 社内で engine の下回りのランタイムマネージャとして誕生 |
| 2016 | Docker 1.11 に runc を駆動する中核ランタイムとして統合 |
| 2017 | 2017-03-29 に CNCF へ Incubating プロジェクトとして寄贈 |
| 2017 | 1.0 リリース: 安定 API、CRI プラグインを内蔵化 |
| 2019 | 2019-02-28 に CNCF を卒業、5 番目の卒業プロジェクト |
| 2024+ | 2.x 系: module path が `/v2` に、sandbox API・CRI の整理 |
| 2026 | 2.3 系が現行。pin コミット `e96fd14b8` は `2.3.0+unknown` を報告 |

## どう進化したか

Docker は containerd を独立プロジェクトとして切り出し、2017 年 3 月に CNCF へ寄贈した。ここでは Incubating として受理された ([graduation 発表](https://www.cncf.io/announcements/2019/02/28/cncf-announces-containerd-graduation/))。同年の 1.0 リリースで公開 API が定まり、CRI プラグインが内蔵化された。これにより Kubernetes は Docker を介さず containerd を直接使えるようになった。

2.0 系では Go の module path が `github.com/containerd/containerd/v2` に移り、ランタイムが再編された。pod 形式の隔離向けに sandbox API も拡充された。コードベースは `core/` のドメインロジックと `plugins/` のプラグイン配線を分離しており、この構造は pin コミットで確認できる。

## 現在地

containerd は 2.x 系の CNCF 卒業プロジェクトである。pin コミット `e96fd14b8` は `v2.3.0` 近傍にあり、2.3 リリースブランチは `v2.3.2` を出している。卒業時点で CNCF は committer 14 名、commit 4,406、contributor 166 名を報告し、参加企業に Alibaba、Cruise Automation、Docker、Facebook、Google、Huawei、IBM、Microsoft、NTT、Tesla が挙がる ([graduation 発表](https://www.cncf.io/announcements/2019/02/28/cncf-announces-containerd-graduation/))。CNCF プロジェクトページは継続的な成長と "Excellent" の健全性スコアを報告している ([CNCF プロジェクトページ](https://www.cncf.io/projects/containerd/))。
