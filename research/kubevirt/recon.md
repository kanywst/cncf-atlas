# recon: KubeVirt

調査メモ。出典は URL とリポジトリの `path:line` で残す。アクセス日は 2026-06-24。

## 基本情報

- repo: [kubevirt/kubevirt](https://github.com/kubevirt/kubevirt)
- pinned commit: `55a003dcb350dab77deb4659bae81aefb1eb570d` (main HEAD, 2026-06-24)
- 近いタグ: 直近リリース `v1.8.4` (2026-06-16) の後。shallow clone なので `git describe` は不可、`gh release view` で確認。
- 言語 / ビルド: Go 1.24 (`go.mod:1` module `kubevirt.io/kubevirt`) / Bazel + Make (`hack/` スクリプト群、`hack/cluster-deploy.sh:96`)
- ライセンス: Apache-2.0。`LICENSE:1` の本文と `gh repo view` の `licenseInfo.key=apache-2.0` で一致確認。
- CNCF 成熟度: Incubating
- カテゴリ (tools.ts の CATEGORY_ORDER から): Orchestration & Scheduling
- tagline (en): Run and manage KVM virtual machines as first-class Kubernetes workloads.
- tagline (ja): KVM 仮想マシンを Kubernetes ネイティブなワークロードとして実行・管理する。

マルチバイナリ構成なので単一の main はない。インストール起点は `virt-operator`。各コンポーネントの main は `cmd/<name>/`。

## 歴史の素材

- 2016 年末に Red Hat 社内で「VM をコンテナの中で動かし Kubernetes でデプロイできるか」という問いから着手。リポジトリ作成日は 2016-12-16 (`gh repo view` の `createdAt`)。出典: [Red Hat: What is KubeVirt?](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)
- 2017 年 1 月に正式発足・OSS 化。出典: [InfoQ: CNCF Accepts KubeVirt as an Incubating Project](https://www.infoq.com/news/2022/06/cncf-kubevirt-incubating-project/)
- 2019-09-06 CNCF Sandbox 受理。出典: [CNCF projects: KubeVirt](https://www.cncf.io/projects/kubevirt/)
- 2020 年 Red Hat OpenShift Virtualization (KubeVirt + KVM) が GA。出典: [Red Hat: What is KubeVirt?](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)
- 2022-04-19 CNCF Incubating に昇格。出典: [CNCF blog: KubeVirt becomes a CNCF incubating project](https://www.cncf.io/blog/2022/04/19/kubevirt-becomes-a-cncf-incubating-project/)
- 2023-07 v1.0 リリース。同時にリリース頻度を毎月から年 3 回へ変更し Kubernetes のリリースモデルに合わせた。出典: [CNCF blog: KubeVirt v1.0 has landed!](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/)
- 設計指針: 「If in conflict, then prefer Kubernetes over Virtualization」。出典: 同上 CNCF v1.0 blog。
- 2025-11 時点で CNCF Graduation 申請中、ADOPTERS は 41 件と報じられる。出典: [CNCF projects: KubeVirt](https://www.cncf.io/projects/kubevirt/)

## アーキテクチャの素材

トップレベルのコンポーネント (`cmd/` 配下に各 main、`pkg/` に実装)。

- `virt-operator`: KubeVirt 本体のインストール / アップグレード / ライフサイクル管理を行う operator。クラスタへの導入起点 (`docs/getting-started.md:32`)。
- `virt-api`: aggregated API server。CRD のバリデーション用 admission webhook と、console / VNC / pause などの subresource を提供。
- `virt-controller`: クラスタレベルのコントローラ群。VMI / VirtualMachine / migration / replicaset / pool を reconcile。main は `cmd/virt-controller/virt-controller.go:28` で `watch.Execute()` を呼ぶだけ。
- `virt-handler`: 各ノードで動く DaemonSet。VMI の期待状態をノード上のドメインへ反映し、ノード内の `virt-launcher` と gRPC で通信する (`pkg/virt-handler/vm.go`)。
- `virt-launcher`: VM 1 台ごとに 1 つ立つ Pod。内部に libvirt + qemu を抱え、`LibvirtDomainManager` (`pkg/virt-launcher/virtwrap/manager.go`) でドメインを操作。
- `virtctl`: ユーザ向け CLI (`cmd/virtctl`)。start/stop/console/vnc/migrate など API では出しにくい操作を担う。

リクエストの流れ (VM 起動): ユーザが `VirtualMachine` を作成 -> VM コントローラが `VirtualMachineInstance` (VMI) を生成 -> VMI コントローラが `virt-launcher` Pod を作成 -> 標準スケジューラが Pod をノードに配置 -> そのノードの `virt-handler` が VMI を検知し gRPC で `virt-launcher` にドメイン同期を依頼 -> `virt-launcher` が VMI を libvirt ドメイン XML に変換し qemu を起動。

## 内部実装の素材

代表操作「VMI から実 VM が立つまで」を端から端まで追う。

1. virt-controller の起点。`cmd/virt-controller/virt-controller.go:28` の `main()` は `watch.Execute()` だけを呼ぶ。
2. VMI の reconcile ループ。`pkg/virt-controller/watch/vmi/vmi.go:306` `execute(key)` がキャッシュから VMI を取り、expectation を満たしていれば `:364` で `c.sync(vmi, pod, dataVolumes)` を呼ぶ。

   ```go
   syncErr, pod := c.sync(vmi, pod, dataVolumes)
   err = c.updateStatus(vmi, pod, dataVolumes, syncErr)
   ```

3. Pod がまだ無い場合の本体。`pkg/virt-controller/watch/vmi/lifecycle.go:66` `sync()` が DataVolume 準備や backend storage、ネットワーク検証を通したうえで `:156` で launch manifest を描画する。

   ```go
   templatePod, err = c.templateService.RenderLaunchManifest(vmi)
   ```

4. Pod 仕様の組み立て。`pkg/virt-controller/services/template.go:325` `RenderLaunchManifest(vmi)` が compute コンテナ (virt-launcher イメージ) / volume / リソース / securityContext などを盛り込んだ `*k8sv1.Pod` を返す。
5. Pod 作成。`lifecycle.go:174` で `c.createPod(...)` を呼び、その実体 `lifecycle.go:1105` の `createPod()` が `c.clientset.CoreV1().Pods(namespace).Create(...)` (`:1107`) を実行。以降は標準スケジューラがノードへ割り当てる。
6. ノード側の同期。`pkg/virt-handler/vm.go:2043` `syncVirtualMachine()` が options を組み立て、`:2055` で `client.SyncVirtualMachine(vmi, options)` を gRPC 経由で同ノードの virt-launcher に送る。
7. ドメイン化。`pkg/virt-launcher/virtwrap/manager.go:1371` `LibvirtDomainManager.SyncVMI()` が `:1399` 付近で `converter.Convert_v1_VirtualMachineInstance_To_api_Domain(vmi, domain, c)` を呼び、VMI を libvirt の `api.Domain` へ変換。その後 `lookupOrCreateVirDomain()` でドメインを定義し qemu を起動する。
8. 変換器の本体。`pkg/virt-launcher/virtwrap/converter/converter.go:967` `Convert_v1_VirtualMachineInstance_To_api_Domain(...)` が CPU / memory / disk / network / firmware を libvirt XML 表現にマッピングする。Kubernetes API の宣言型仕様と libvirt の命令的世界の境界がここ。

中核データ構造:

- `VirtualMachineInstance` (`staging/src/kubevirt.io/api/core/v1/types.go:47`): 実行中の VM 1 台を表す。`Spec` + `Status` の素直な K8s オブジェクト。
- `VirtualMachineInstanceSpec` (`types.go:82`): `Domain DomainSpec` に加え `NodeSelector` / `Affinity` / `Tolerations` / `TopologySpreadConstraints` / `EvictionStrategy` を持つ。スケジューリングと退避が Pod と同じ語彙で書かれているのがポイント (`types.go:92-131`)。
- `VirtualMachine` (`types.go:1938`) と `VirtualMachineSpec` (`types.go:2003`): VMI を所有する宣言的な親。`RunStrategy` で起動/停止/再起動方針を表す。
- `VirtualMachineInstanceMigration` (`types.go:1750`): live migration を駆動する CR。
- `VirtualMachineInstanceReplicaSet` (`types.go:1641`): VMI を複数台レプリカ管理する。
- `api.Domain` / `api.DomainSpec` (`pkg/virt-launcher/virtwrap/api/schema.go:112` / `:215`): libvirt ドメイン XML の Go 表現。VMI とは別系統の型で、converter が両者を橋渡しする。

非自明な設計判断: VMI 1 台に対し virt-launcher Pod を 1 つ立て、libvirt と qemu を**その Pod の中**で動かす。これにより VM が第一級の Kubernetes ワークロードになり、標準スケジューラ・Pod ネットワーク・PVC・eviction をそのまま使える。virt-handler 自身は libvirt を動かさず、ノード内の virt-launcher に gRPC で委譲する (`vm.go:2055`)。宣言型 (VMI) と命令型 (libvirt) の変換を converter 1 か所に閉じ込めている (`converter.go:967`)。

## 採用事例の素材

すべて [ADOPTERS.md](https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md) の記載をリポジトリ実物 (`ADOPTERS.md`) で確認。

- NVIDIA (End-user, 2018): Kubernetes と KubeVirt を基盤に GeForce NOW などを提供。
- Cloudflare (End-user, 2018): コアデータセンタで CI runner などコンテナ化しづらい用途に KubeVirt を使用。
- CoreWeave (End-user, 2020): GPU 主体の K8s ネイティブクラウド。VDI など非コンテナ化ワークロードをベアメタル上で併置。
- Arm (End-user, 2021): aarch64 上の KubeVirt 性能最適化に貢献。
- Civo (End-user, 2020): テナントクラスタ provisioning に利用。
- Aussie Broadband (End-user, 2023): ベアメタル上で VM とコンテナを橋渡し。
- Microsoft (Vendor, 2023): Azure Operator Nexus で VM ワークロードのホストに利用。

ベンダ系では Red Hat (OpenShift Virtualization) / SUSE (Rancher Harvester) が KubeVirt を内包。CNCF ケーススタディに Swisscom (KubeVirt + Kube-OVN によるソブリンクラウド) がある。出典: [CNCF blog: KubeVirt becomes a CNCF incubating project](https://www.cncf.io/blog/2022/04/19/kubevirt-becomes-a-cncf-incubating-project/)

採用規模シグナル (2026-06-24 時点、`gh repo view`): stars 6,917 / forks 1,710。contributor 数は GitHub contributors API のページネーション (per_page=1) で約 361 人。

## 代替・エコシステム

- Rancher / SUSE Harvester: KubeVirt + Longhorn + RKE2 を ISO で固めた HCI アプライアンス。KubeVirt を「生」で使わず製品化したもの。出典: [SUSE: Comparing HCI Solutions: Harvester and OpenStack](https://www.suse.com/c/rancher_blog/comparing-hyperconverged-infrastructure-solutions-harvester-and-openstack/)
- Red Hat OpenShift Virtualization: KubeVirt の商用ディストリビューション。出典: [Red Hat: What is KubeVirt?](https://www.redhat.com/en/topics/virtualization/what-is-kubevirt)
- OpenStack: フル機能のクラウド基盤。ベアメタル管理と高度ネットワークで先行するが、アプリ管理層は弱い。Kubernetes ネイティブではない。出典: [Ubuntu: Kubernetes vs OpenStack](https://ubuntu.com/blog/kubernetes-vs-openstack)
- VMware vSphere: 従来のエンタープライズ標準。Broadcom 買収後のライセンス変更で移行検討が増えている。出典: [Portworx: Top 5 Kubernetes-Based Alternatives to VMware](https://portworx.com/blog/top-5-kubernetes-based-alternatives-to-vmware/)

本質的な差: KubeVirt は別建ての hypervisor 基盤を用意せず、既存 Kubernetes に CRD で VM を載せ、VM と Pod を同じ namespace / NetworkPolicy / StorageClass / 監視スタックで扱える点。Harvester や OpenShift Virtualization はこの上に乗る。

エコシステム統合: ストレージは CDI / Rook、L2 ネットワークは Multus / Kube-OVN、サービスメッシュは Istio、自動化は Tekton / ArgoCD、移行は Konveyor。出典: [CNCF blog: KubeVirt v1.0 has landed!](https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/)

## インストール / 最小構成

`docs/getting-started.md:32-33` の手順に対応。リリース版なら operator マニフェストと KubeVirt CR を適用する。

```bash
export RELEASE=v1.8.4
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-operator.yaml
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-cr.yaml
kubectl -n kubevirt wait kv kubevirt --for condition=Available
```

前提: ノードでハードウェア仮想化が使えること。使えない環境では KubeVirt CR に software emulation 設定が必要。`virtctl` を別途入手して `virtctl start <vm>` などを実行する。出典: [docs/updates.md](https://github.com/kubevirt/kubevirt/blob/main/docs/updates.md) の `kubectl apply` 例 (`docs/updates.md:88-89`)。
