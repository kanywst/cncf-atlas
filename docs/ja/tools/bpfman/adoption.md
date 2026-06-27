# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS.md` も `USERS.md` も存在せず、bpfman を本番で運用している組織を名指しできる一次情報も見つからない。このディープダイブでは採用企業を捏造しない。引用できるのは、プロジェクトのベンダー背景と CNCF における位置づけだ。

記載メンテナは全員 Red Hat 所属だ (`MAINTAINERS.md`: Dave Tucker、Andrew McDermott、Andre Fredette、Billy McFall。Andrew Stoycos は emeritus)。Red Hat が Emerging Technologies グループで起案した (出典: [Red Hat Emerging Technologies](https://next.redhat.com/project/bpfman/))。ADOPTERS ファイルやケーススタディが出るまでは、シングルベンダの Sandbox プロジェクトとして扱うのが妥当だ。

## 採用のシグナル

| シグナル | 値 | 観測日 |
| --- | --- | --- |
| GitHub スター | 約 750 | 2026-06-27 |
| フォーク | 約 84 | 2026-06-27 |
| オープン issue | 約 23 | 2026-06-27 |
| 最新リリース | v0.6.0 (2026-03-31) | 2026-06-27 |
| リポジトリ作成 | 2021-12-02 | 2026-06-27 |
| CNCF 成熟度 | Sandbox (受理 2024-06-19) | 2026-06-27 |

GitHub 数値の出典: [bpfman/bpfman](https://github.com/bpfman/bpfman)。CNCF プロジェクトページはより大きなコントリビュータ数・組織数を載せるが、それらは operator など関連リポジトリを集計しており、bpfman 本体のコントリビュータとは読めない (出典: [CNCF プロジェクトページ](https://www.cncf.io/projects/bpfman/))。Fedora で bpfman をデフォルトの eBPF プログラムマネージャとして出荷する提案も進行中だ (出典: [Fedora 40 解説](https://www.ebpf.top/en/post/bpfman_fedora_40/))。

## エコシステム

bpfman は eBPF アプリケーションの下層に位置し、アプリではなくマネージャだ。Rust 製 eBPF ライブラリ `aya` の上に構築される。Kubernetes 上では別の operator と agent が Custom Resource Definition (CRD) を通じて駆動する。bytecode は任意の registry から OCI (Open Container Initiative) イメージとして配布し、権限分離のため systemd の socket activation と連携し、CSI (Container Storage Interface) ドライバで map を Pod にマウントし、ログとメトリクスを OpenTelemetry へ出す。他の Kubernetes eBPF プロジェクトと並んで言及されることが多いが、それらが bpfman 経由でプログラムをロードしていると確認できる一次情報はない (出典: [eBPF Applications Landscape](https://ebpf.io/applications/))。

## 代替候補

誠実な比較はこうだ。bpfman は用途中立のプログラムマネージャで、名の知れた eBPF プロジェクトの多くは自前のプログラムを管理するアプリケーションだ。1 ノードで多数の独立した eBPF プログラム、特に 1 つの XDP/TC フックに複数を、特権ワークロードなしで動かしたいなら bpfman を選ぶ。Cilium や Falco のような特定用途が欲しく、自前の eBPF プログラムを占有させてよいなら、そのアプリを選ぶ。

| 代替 | 違い |
| --- | --- |
| bpftool / libbpf | 標準的な低レベル eBPF ツール。共有 XDP/TC フックの複数プログラム用ディスパッチャや、再起動復元の DB はない |
| Cilium | 自前の eBPF プログラムを出荷・管理するネットワーク/セキュリティアプリ。任意プログラムの中立なローダではない |
| Falco | 自前の eBPF プローブを占有するランタイムセキュリティツールで、サードパーティのプログラムを管理するものではない |
| aya | bpfman が構築の土台にする Rust 製 eBPF ライブラリ。プログラムを書いてロードするツールキットで、ノード単位のライフサイクル管理層ではない |
