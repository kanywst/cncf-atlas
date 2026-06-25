# 歴史

## 起源

KubeVirt は 2016 年末、Red Hat 社内の「仮想マシンをコンテナの中で動かし Kubernetes でデプロイできるか」という問いから始まった。リポジトリは 2016-12-16 に作成され、2017 年 1 月に正式発足・OSS 化された ([Red Hat: What is KubeVirt?](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)、[InfoQ](https://www.infoq.com/news/2022/06/cncf-kubevirt-incubating-project/))。狙いは、すでに Kubernetes に投資しているチームが、第二のプラットフォームを抱えずに VM ワークロードを残せるようにすることだった。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | リポジトリ作成 (2016-12-16)、Red Hat 社内でプロトタイピング |
| 2017 | 正式発足・OSS 化 |
| 2019 | CNCF Sandbox 受理 (2019-09-06) |
| 2020 | Red Hat OpenShift Virtualization (KubeVirt + KVM) が GA |
| 2022 | CNCF Incubating に昇格 (2022-04-19) |
| 2023 | v1.0 リリース、リリース頻度を年 3 回へ変更 |

## どう進化したか

初期のプロジェクトは Kubernetes を密に追いかけ、頻繁にリリースしていた。2023 年 7 月の v1.0 リリースでリリースモデルを変更し、毎月のリリースから Kubernetes のリリースモデルに合わせた年 3 回へ移行した。本番ユーザ向けの安定性へ舵を切ったシグナルである ([CNCF: KubeVirt v1.0 has landed!](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/))。

アーキテクチャ上の一貫した軸は Kubernetes との整合性だ。プロジェクトは指針を「衝突したら仮想化より Kubernetes を優先する」と表明しており、VM が Pod の中で動き、並行コントロールプレーンではなく標準のスケジューラ・ネットワーク・ストレージを再利用するのはこのためである ([CNCF v1.0 blog](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/))。

## 現在地

KubeVirt は CNCF Incubating プロジェクト (2022-04-19 昇格) で、年 3 回ほどリリースする。2026-06-24 時点の最新リリースは `v1.8.4` (2026-06-16)。2025 年 11 月時点では CNCF Graduation のプロセス中で、ADOPTERS は 41 件と報じられた ([CNCF projects: KubeVirt](https://www.cncf.io/projects/kubevirt/))。コードベースは Go (`go.mod:1`, `go 1.24.0`)、Apache-2.0 ライセンス (`LICENSE:1`)。
