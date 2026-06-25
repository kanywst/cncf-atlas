# KubeVirt

> KVM 仮想マシンを Kubernetes ネイティブなワークロードとして実行・管理する。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go (`go.mod:1`, `go 1.24.0`)
- **ライセンス**: Apache-2.0 (`LICENSE:1`)
- **リポジトリ**: [kubevirt/kubevirt](https://github.com/kubevirt/kubevirt)
- **ドキュメント基準コミット**: `55a003d` (main HEAD, 2026-06-24)

## 何をするものか

KubeVirt は、同じクラスタ上でコンテナの隣にフル仮想マシンを動かす Kubernetes アドオンである。中核となる `VirtualMachineInstance` (VMI) をはじめとするカスタムリソース群と、それらを稼働中の KVM/QEMU ゲストへ変換するコントローラ群を定義する。VM は `kubectl` で作成・監視・削除できる通常の Kubernetes オブジェクトになる。

各 VM は専用の Pod の中で動く。KubeVirt は libvirt と QEMU をその Pod の内側に置くため、ゲストは Kubernetes のスケジューリング・Pod ネットワーク・永続ボリューム・eviction をそのまま受け継ぐ。クラスタの横に別建ての hypervisor コントロールプレーンを運用する必要はない。

対象は、すでに Kubernetes を運用していて、コンテナ化できないワークロード (レガシー VM イメージ、アプライアンス、フルカーネルを要するゲスト) を抱えるチームである。プロジェクトが掲げる設計指針は、両者が衝突したら仮想化の流儀より Kubernetes の流儀を優先する、というものだ ([v1.0 アナウンス](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/))。

## いつ使うか

- Kubernetes を運用済みで、VM のまま残すべきワークロード (レガシーイメージ、フルカーネルゲスト、アプライアンス) を、ひとつのコントロールプレーンで扱いたい。
- VM を別の仮想化プラットフォームではなく、クラスタのスケジューラ・`NetworkPolicy`・`StorageClass`・監視スタックと共有したい。
- 単体 hypervisor からの集約を進めており、Kubernetes ネイティブな移行先が欲しい。
- Kubernetes を運用していない場合は不向き。VM をホストするためだけにクラスタを立てるのは、従来型 hypervisor には不要な層を増やす。
- ノードがハードウェア仮想化を出せず、software emulation の性能コストを許容できない場合も不向き。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [kubevirt/kubevirt リポジトリ](https://github.com/kubevirt/kubevirt) (コミット `55a003d`)
2. [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md)
3. [docs/getting-started.md](https://github.com/kubevirt/kubevirt/blob/main/docs/getting-started.md)
4. [docs/updates.md](https://github.com/kubevirt/kubevirt/blob/main/docs/updates.md)
5. [CNCF: KubeVirt becomes a CNCF incubating project](https://www.cncf.io/blog/2022/04/19/kubevirt-becomes-a-cncf-incubating-project/)
6. [CNCF projects: KubeVirt](https://www.cncf.io/projects/kubevirt/)
7. [CNCF: KubeVirt v1.0 has landed!](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/)
8. [Red Hat: What is KubeVirt?](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)
9. [InfoQ: CNCF Accepts KubeVirt as an Incubating Project](https://www.infoq.com/news/2022/06/cncf-kubevirt-incubating-project/)
