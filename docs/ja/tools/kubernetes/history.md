# 歴史

## 起源

Kubernetes は Google から生まれた。本番ワークロードを大規模に動かしてきた 15 年以上の経験、すなわち社内システム Borg、そしてその後継 Omega の知見の上に、コミュニティのアイデアを組み合わせて作られた ([README.md:13](https://github.com/kubernetes/kubernetes/blob/8c64324b69ac1e444979f2fddf07a63baa759e5a/README.md#L13))。Google は Kubernetes を自社における第 3 世代のコンテナ管理基盤と位置づけ、Borg の運用知見を引き継いだものだと述べている ([Google Cloud origin story](https://cloud.google.com/blog/products/containers-kubernetes/from-google-to-the-world-the-kubernetes-origin-story))。

プロジェクトは 2013 年に Craig McLuckie・Joe Beda・Brendan Burns によって Google 社内で提案され、まもなく Brian Grant・Tim Hockin らが合流した。社内コードネームは "Project 7" で、Star Trek の Seven of Nine に由来する。ロゴの 7 本のスポークはこれが理由だ。名称自体はギリシャ語で「操舵手」を意味する ([Wikipedia: Kubernetes](https://en.wikipedia.org/wiki/Kubernetes))。リポジトリは 2014-06-06 にオープンソースとして公開された ([IBM: History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2014 | 2014-06-06 にオープンソースとして公開 |
| 2015 | 2015-07-21 に OSCON で 1.0 をリリース。Google と Linux Foundation が CNCF 設立を発表し Kubernetes を寄贈 |
| 2016 | 2016-03-10 に CNCF へ Incubating として受理 |
| 2018 | 2018-03-06 に Graduated へ昇格。CNCF 初の卒業 |

リリース日・卒業日の出典は [IBM](https://www.ibm.com/think/topics/kubernetes-history) と [CNCF](https://www.cncf.io/projects/kubernetes/)。

## どう進化したか

Kubernetes は Google のプロジェクトから、CNCF を通じてコミュニティ統治のプロジェクトへ移った。2016 年 3 月に Incubating として受理され、2018 年 3 月に卒業した。CNCF の成熟度モデルで卒業した最初のプロジェクトだ ([CNCF: Kubernetes](https://www.cncf.io/projects/kubernetes/))。コードベースはモノレポで、コンポーネントは `cmd/` と `pkg/` に置かれ、他プロジェクトが利用するライブラリは `staging/src/k8s.io/*` 配下で開発され、`k8s.io/client-go` や `k8s.io/apimachinery` といった独立リポジトリへ同期される。

## 現在地

Kubernetes は規則的なマイナーリリースのサイクルで出荷されている。基準コミットの時点で master ブランチは v1.37 の開発サイクル中で、直近の alpha タグは `v1.37.0-alpha.1`、直近の安定リリースは 2026-06-12 公開の `v1.36.2` だ。統治は単一ベンダーではなく CNCF と SIG の体制を通じて行われ、コントリビュータ数は 2016 年以降ほぼ 1000% 増えている ([IBM: History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history))。
