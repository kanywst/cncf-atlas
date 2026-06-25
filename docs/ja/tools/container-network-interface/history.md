# 歴史

## 起源

CNI は CoreOS の rkt コンテナエンジンのネットワーク機構から生まれた。rkt は appc (App Container) 仕様を中心に作られており、その networking 部分を切り出して、他のランタイムも再利用できる複数ベンダー共通の契約にした。CoreOS は後に rkt 自体を 2017 年 3 月に CNCF へ寄贈しており、両者が当初いかに密接だったかが分かる ([CNCF becomes home to rkt](https://www.cncf.io/announcements/2017/03/29/cloud-native-computing-foundation-becomes-home-pod-native-container-engine-project-rkt/))。

設計目標は最小の契約だった。CNI はコンテナのネットワーク接続性と、コンテナ削除時の割り当てリソース回収だけに関心を持つ (`README.md:13`)。アドレスをどう割り当てるか、パケットをどうルーティングするかなど、それ以外はすべてプラグインに委ねられる。

公開リポジトリは 2015-04-05 に作成された ([containernetworking/cni](https://github.com/containernetworking/cni))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | `containernetworking/cni` リポジトリ作成 (2015-04-05) |
| 2017 | CNCF が CNI を 10 番目のホストプロジェクトとして Incubating で受諾 (2017-05-23) |
| 2017 | 仕様 0.4.0 で CHECK コマンドと、CHECK / DEL 用の cached result を導入 |
| 2021 | 仕様 1.0.0 で result 型を整理 |
| 2024 | 仕様 1.1.0 で GC と STATUS コマンドを追加 |
| 2025 | `v1.3.0` タグ付け (2025-04-07) |

## どう進化したか

競合は Docker の Container Network Model (CNM) で、libnetwork が実装していた。CNM は Docker と強く結合していたのに対し、CNI はランタイム非依存で小さかった。Kubernetes が CNM ではなく CNI を選んだことで、CNI は Pod ネットワーキングの事実上の標準になった ([Nuage: CNM vs CNI](https://www.nuagenetworks.net/blog/container-networking-standards/))。

その後、仕様は段階的に拡張され、各段階はライブラリに痕跡を残している。仕様 0.4.0 では、ADD が返した結果を CHECK と DEL が再生できるよう cached result を追加した (`libcni/api.go:549-553`, `libcni/api.go:593-601`)。1.0.0 のサイクルで result 型を再編した。仕様 1.1.0 ではガベージコレクションとステータス確認を追加し、いずれも設定の CNI バージョンでゲートされる (`libcni/api.go:818`, `libcni/api.go:857`)。result パッケージが実装する現行の仕様バージョンは `1.1.0` である (`pkg/types/100/types.go:30`)。

## 現在地

CNI は 2017-05-23 に CNCF の Technical Oversight Committee に受諾され、現在も Incubating のままである ([CNCF hosts CNI](https://www.cncf.io/blog/2017/05/23/cncf-hosts-container-networking-interface-cni/), [CNCF project page](https://www.cncf.io/projects/container-network-interface-cni/))。最新のタグ付きリリースは `v1.3.0` (2025-04-07) で、本書が基準とするコミットはそれより後の main の作業 (2025-12-15) である。プロジェクトは明確な分担を保つ。このリポジトリは仕様と組み込み可能なライブラリを持ち、参照データプレーンプラグインは [containernetworking/plugins](https://github.com/containernetworking/plugins) から提供される。
