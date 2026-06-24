# 歴史

## 起源

Cilium は 2015 年末に始まった。Thomas Graf、Daniel Borkmann、André Martins、Madhu Challa らが、Linux カーネルネットワーキングの出身者として開始した。彼らは Open vSwitch や iptables 時代のツールに携わってきた。彼らの賭けは、コンテナの動的・短命な性質がアドレスベースのネットワーキングを追い越してしまっており、eBPF なら IP ではなく intent と identity に駆動される高性能なコンテナ datapath を実現できる、というものだった。最初期のバージョンは IPv6 only で、これは時代に早すぎた ([Cloud Native Now](https://cloudnativenow.com/features/the-cilium-story-so-far/), [Heavybit Kubelist Ep.30](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-30-cilium-and-ebpf-with-thomas-graf-of-isovalent))。リポジトリ自体は 2015-12-16 に GitHub 上で作成された ([GitHub API](https://api.github.com/repos/cilium/cilium))。

プロジェクト開始の翌年、Thomas Graf と Dan Wendlandt が商業的に支えるため Isovalent (当初 Covalent) を共同創業した。両者は Nicira / Open vSwitch 時代からの繋がりがある ([Cloud Native Now](https://cloudnativenow.com/features/the-cilium-story-so-far/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | プロジェクト開始、GitHub にリポジトリ作成 (2015-12-16) |
| 2016 | Thomas Graf と Dan Wendlandt が Isovalent (当初 Covalent) を共同創業 |
| 2021 | CNCF に Incubating レベルで受理 (2021-10-13) |
| 2022 | graduation 申請を提出 (2022-10-27) |
| 2023 | CNCF を Graduated (2023-10-11)、CNI として初 |
| 2023 | Cisco が Isovalent 買収を発表 (2023-12-21) |

## どう進化したか

Cilium は 2021-10-13 に Incubating として CNCF に入り、2023-10-11 に graduate し、CNI として初の Graduated プロジェクトになった。graduation 時点で CNCF は、commit 数で Kubernetes に次ぐ最も活発なプロジェクトの 1 つであると述べ、7 社のメンテナ企業と 800 人超の個人コントリビュータを挙げた ([CNCF announcement](https://www.cncf.io/announcements/2023/10/11/cloud-native-computing-foundation-announces-cilium-graduation/), [CNCF project page](https://www.cncf.io/projects/cilium/))。graduation 申請は 2022-10-27 に提出され、完了まで約 1 年を要した。

この期間にスコープは CNI プラグインを大きく超えて広がった。kube-proxy 置換、eBPF と per-node Envoy で構築されたサイドカーレスのサービスメッシュ、マルチクラスタネットワーキングのための ClusterMesh、透過暗号化、BGP、そして Hubble 可観測性レイヤが加わった ([The New Stack](https://thenewstack.io/cilium-cncf-graduation-could-mean-better-observability-security-with-ebpf/))。

2023-12-21、Cilium 最初のコードから約 7 年後、Cisco が Isovalent 買収を発表した。Cisco は以前から同社の Series A 投資家だった。Thomas Graf は Cisco Security 内の CTO 兼 VP Engineering に就き、Cilium と Tetragon はともに CNCF 下のオープンソースとして継続すると述べられた ([The Register](https://www.theregister.com/2023/12/22/cisco_acquires_isovalent), [The New Stack](https://thenewstack.io/cisco-gets-cilium-what-it-means-for-developers/))。

## 現在地

本プロジェクトは Graduated な CNCF プロジェクトである。ドキュメント基準コミットでは `VERSION` ファイルが `main` 上で `1.20.0-dev` を示しており、これは未リリースの開発版だ。直近の安定リリースタグは `v1.19.5` である。メンテナとコミッタは [MAINTAINERS.md](https://github.com/cilium/cilium/blob/main/MAINTAINERS.md) に列挙され、ガバナンスとコントリビュータラダーは別リポジトリの [cilium/community](https://github.com/cilium/community/blob/main/GOVERNANCE.md) に文書化されている。多くのメンテナは Isovalent/Cisco 所属だが、社外コミッタも存在する。
