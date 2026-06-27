# bpfman

> eBPF (extended Berkeley Packet Filter) プログラムをノード上でロード・アタッチ・追跡するマネージャ。アプリケーションがカーネルへ特権アクセスせずに済むようにする。

- **カテゴリ**: Runtime
- **CNCF 成熟度**: Sandbox
- **言語**: Rust (Kubernetes 連携の一部は Go)
- **ライセンス**: Apache-2.0 (組込みの eBPF ディスパッチャ bytecode は GPL-2.0-only または BSD-2-Clause)
- **リポジトリ**: [bpfman/bpfman](https://github.com/bpfman/bpfman)
- **ドキュメント基準コミット**: `8e5a9d2` (タグ v0.6.0 直後、2026-04-21)

## 何をするものか

bpfman は Linux ホスト上の eBPF プログラムのライフサイクルを管理する。eBPF は XDP (eXpress Data Path)、TC (Traffic Control)、kprobe、tracepoint といったフックでカーネル内のサンドボックス化プログラムを動かす仕組みだ。通常は各アプリが自前で特権付きで eBPF をロードし、アタッチしたフックを単独で占有する。bpfman はこれを管理対象の操作に変える。bytecode をロードし、フックにアタッチし、結果を記録するので、再起動をまたいで状態が残る。

定義的な能力は 2 つ。1 つは、カーネルが本来「1 インターフェースに 1 プログラム」しか許さない XDP/TC フックで、ディスパッチャを介して複数の独立した eBPF プログラムを共存させること。もう 1 つは、すべてのロードとアタッチを組込みデータベースに永続化し、クラッシュや再起動の後にプログラムと pin を復元できることだ。

bpfman は eBPF アプリケーションではなく管理レイヤだ。Cilium、Falco、libbpf を置き換えるものではない。それらのツールチェーンが生成したプログラムを OCI (Open Container Initiative) イメージとして配布されたものとしてロード/アンロードし、1 ノード上で安全に共存させる。

## いつ使うか

- 異なるベンダーの複数 XDP/TC プログラムを同じネットワークインターフェースに載せたい。
- ワークロードに特権や CAP_BPF を与えずに、Kubernetes クラスタへ eBPF プログラムをロードしたい。
- eBPF の状態 (ロード済みプログラム、アタッチ、map pin) をプロセス再起動や再起動後も残したい。
- eBPF bytecode を OCI イメージとして配布し、それを取得してロードするマネージャがほしい。

自己完結した単一の eBPF アプリだけを出荷し、そのフックを自前で占有する場合 (Cilium や Falco はすでに自分のプログラムを管理する) や、Linux 以外で動かす場合には適さない。

## このディープダイブの構成

- [歴史](./history): bpfd としての出自、改名、daemonless への転換。
- [アーキテクチャ](./architecture): workspace の crate 群とロードの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周辺に何があるか。
- [内部実装](./internals): ソースから読む重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [bpfman/bpfman (GitHub, source of truth)](https://github.com/bpfman/bpfman)
2. [bpfman (CNCF プロジェクトページ)](https://www.cncf.io/projects/bpfman/)
3. [\[Sandbox\] bpfman application (cncf/sandbox issue #76)](https://github.com/cncf/sandbox/issues/76)
4. [Launching bpfman (install / load / attach)](https://bpfman.io/v0.6.0/getting-started/launching-bpfman/)
5. [bpfman documentation home](https://bpfman.io/main/)
6. [eBPF wrapped 2023 (Red Hat)](https://www.redhat.com/en/blog/ebpf-wrapped-2023)
7. [bpfman blog (改名アナウンス)](https://bpfman.io/main/blog/)
8. [bpfman (Red Hat Emerging Technologies)](https://next.redhat.com/project/bpfman/)
9. [Introduction to BPF Manager / Fedora 40](https://www.ebpf.top/en/post/bpfman_fedora_40/)
10. [eBPF Applications Landscape](https://ebpf.io/applications/)
