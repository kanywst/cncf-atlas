# 歴史

## 起源

Antrea は VMware で始まった。Open vSwitch (OVS) をデータプレーンに使うオープンソースの CNI プラグインとして、2019-11-18 にサンディエゴの KubeCon North America で「Project Antrea」として発表された ([出典 2](https://blogs.vmware.com/opensource/2019/11/18/announcing-project-antrea/))。リポジトリ自体は 2019-10-25 に作成され、当初は VMware の Tanzu GitHub org に置かれていた。

OVS を採用した動機は発表時に具体的に語られている。OVS はルール数が増えても性能が安定するが、iptables は遅くなる。OVS は Linux と Windows の両方で動く。IPFIX、NetFlow、sFlow を通じて既存のネットワークツールと統合できる。プログラマビリティにより機能追加が速い ([出典 2](https://blogs.vmware.com/opensource/2019/11/18/announcing-project-antrea/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | リポジトリ作成 (2019-10-25)、KubeCon NA で Project Antrea 発表 (2019-11-18) ([出典 2](https://blogs.vmware.com/opensource/2019/11/18/announcing-project-antrea/)) |
| 2021 | Project Antrea 1.0 リリース (2021-04-15) ([出典 3](https://blogs.vmware.com/opensource/2021/04/15/its-here-project-antrea-1-0/)) |
| 2021 | CNCF に Sandbox 成熟度で受理 (2021-04-28) ([出典 4](https://www.cncf.io/projects/antrea/)) |
| 2026 | v2.6.2 リリース (2026-06-13) ([出典 10](https://github.com/antrea-io/antrea/releases/tag/v2.6.2)) |

## どう進化したか

Antrea 1.0 は 2021-04-15 に出荷された ([出典 3](https://blogs.vmware.com/opensource/2021/04/15/its-here-project-antrea-1-0/))。その直後、2021-04-28 に Sandbox 成熟度で CNCF に受理された。公式文言は「Antrea was accepted to CNCF on April 28, 2021 at the Sandbox maturity level」である ([出典 4](https://www.cncf.io/projects/antrea/))。プロジェクト自身の告知は 2021-05-05 に続いた ([出典 5](https://antrea.io/posts/2021-05-05-antrea-joins-cncf-sandbox/))。

寄贈後、プロジェクトは VMware の Tanzu org から独立した `antrea-io` GitHub org へ移り、これが現在の canonical リポジトリである。Go モジュールも v2 系を反映し `antrea.io/antrea/v2` と宣言され (`go.mod:1`)、ツールチェインは Go 1.26.0 に固定されている (`go.mod:3`)。

## 現在地

プロジェクトは v2 系にある。本ディープダイブが固定したコミット `65be43d` は v2.6.2 リリースタグ (2026-06-13) より後の `main` 上にある。チェックインされた `VERSION` ファイルは次のマイナーである `v2.7.0-dev` を示す。Antrea は CNCF Sandbox プロジェクトであり、VMware vSphere Kubernetes Service (VKS) のデフォルト CNI である ([出典 6](https://thenewstack.io/vmwares-antrea-brings-programmable-networks-to-kubernetes/))。
