# sources: KubeVirt

各出典に番号を振り、ドキュメント側の引用と対応させる。初回アクセス日は 2026-06-24。2026-11-16 に `3a1a19f` へ re-pin し、#1 / #2 と #13 以降を確認。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | kubevirt/kubevirt (commit 3a1a19f) | <https://github.com/kubevirt/kubevirt> | 2026-11-16 |
| 2 | repo | ADOPTERS.md | <https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md> | 2026-11-16 |
| 3 | repo | docs/getting-started.md | <https://github.com/kubevirt/kubevirt/blob/main/docs/getting-started.md> | 2026-06-24 |
| 4 | repo | docs/updates.md | <https://github.com/kubevirt/kubevirt/blob/main/docs/updates.md> | 2026-06-24 |
| 5 | blog | CNCF: KubeVirt becomes a CNCF incubating project | <https://www.cncf.io/blog/2022/04/19/kubevirt-becomes-a-cncf-incubating-project/> | 2026-06-24 |
| 6 | landscape | CNCF projects: KubeVirt | <https://www.cncf.io/projects/kubevirt/> | 2026-06-24 |
| 7 | blog | CNCF: KubeVirt v1.0 has landed! | <https://www.cncf.io/blog/2023/07/11/kubevirt-v1-0-has-landed/> | 2026-06-24 |
| 8 | blog | Red Hat: What is KubeVirt? | <https://www.redhat.com/en/topics/virtualization/what-is-kubevirt> | 2026-06-24 |
| 9 | news | InfoQ: CNCF Accepts KubeVirt as an Incubating Project | <https://www.infoq.com/news/2022/06/cncf-kubevirt-incubating-project/> | 2026-06-24 |
| 10 | blog | SUSE: Comparing HCI Solutions: Harvester and OpenStack | <https://www.suse.com/c/rancher_blog/comparing-hyperconverged-infrastructure-solutions-harvester-and-openstack/> | 2026-06-24 |
| 11 | blog | Ubuntu: Kubernetes vs OpenStack | <https://ubuntu.com/blog/kubernetes-vs-openstack> | 2026-06-24 |
| 12 | blog | Portworx: Top 5 Kubernetes-Based Alternatives to VMware | <https://portworx.com/blog/top-5-kubernetes-based-alternatives-to-vmware/> | 2026-06-24 |
| 13 | toc | cncf/toc#1822: KubeVirt Graduation Application (gitvote/passed、2026-11-04 close) | <https://github.com/cncf/toc/issues/1822> | 2026-11-16 |
| 14 | repo | kubevirt/kubevirt releases (v1.9.1 / v1.10.0-rc.1) | <https://github.com/kubevirt/kubevirt/releases> | 2026-11-16 |
| 15 | toc | cncf/toc#2359: [LEVEL CHANGE] KubeVirt Graduation (2026-11-04 close) | <https://github.com/cncf/toc/issues/2359> | 2026-11-16 |
| 16 | compare | 55a003d...3a1a19f (2,174 commits) | <https://github.com/kubevirt/kubevirt/compare/55a003d...3a1a19f> | 2026-11-16 |

## コード参照 (path:line、commit `3a1a19f`)

| 箇所 | 内容 |
| --- | --- |
| `cmd/virt-controller/virt-controller.go:27` | virt-controller の main、`watch.Execute()` |
| `pkg/virt-controller/watch/vmi/vmi.go:309` | VMI reconcile の `execute()` |
| `pkg/virt-controller/watch/vmi/vmi.go:370` | `sync()` 呼び出し |
| `pkg/virt-controller/watch/vmi/lifecycle.go:66` | `sync()` 本体 |
| `pkg/virt-controller/watch/vmi/lifecycle.go:156` | `RenderLaunchManifest(vmi)` |
| `pkg/virt-controller/watch/vmi/lifecycle.go:184` | `c.createPod(...)` 呼び出し |
| `pkg/virt-controller/watch/vmi/lifecycle.go:1090` | `createPod()`、`:1092` で Pods().Create |
| `pkg/virt-controller/services/template.go:395` | `RenderLaunchManifest` 本体 |
| `pkg/virt-handler/vm.go:2101` | `syncVirtualMachine()`、`:2113` で gRPC `SyncVirtualMachine` |
| `pkg/virt-launcher/virtwrap/manager.go:1804` | `LibvirtDomainManager.SyncVMI()`、`:1839` で converter 呼び出し、`:1847` で `lookupOrCreateVirDomain()` |
| `pkg/virt-launcher/virtwrap/converter/converter.go:43` | `Convert_v1_VirtualMachineInstance_To_api_Domain`、`:78` configurator リスト (30 個)、`:160` hypervisor 分岐 (KVM / MSHV)、`:171` `NewDomainBuilder` |
| `pkg/virt-launcher/virtwrap/converter/types/builder.go:29` | `Configurator` interface、`:42` で順に `Configure()` |
| `staging/src/kubevirt.io/api/core/v1/types.go:46` | `VirtualMachineInstance` |
| `staging/src/kubevirt.io/api/core/v1/types.go:92` | `VirtualMachineInstanceSpec` |
| `staging/src/kubevirt.io/api/core/v1/types.go:1887` | `VirtualMachineInstanceMigration` |
| `staging/src/kubevirt.io/api/core/v1/types.go:2075` | `VirtualMachine` |
| `pkg/virt-launcher/virtwrap/api/schema.go:117` | `api.Domain` |
| `pkg/virt-launcher/virtwrap/api/schema.go:227` | `api.DomainSpec` |
| `LICENSE:2` | Apache License 2.0 (1 行目は空行) |
| `go.mod:3` | `go 1.26.0` (module 宣言は `:1`) |
