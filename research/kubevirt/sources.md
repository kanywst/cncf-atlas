# sources: KubeVirt

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は 2026-06-24。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | kubevirt/kubevirt (commit 55a003d) | <https://github.com/kubevirt/kubevirt> | 2026-06-24 |
| 2 | repo | ADOPTERS.md | <https://github.com/kubevirt/kubevirt/blob/main/ADOPTERS.md> | 2026-06-24 |
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

## コード参照 (path:line)

| 箇所 | 内容 |
| --- | --- |
| `cmd/virt-controller/virt-controller.go:28` | virt-controller の main、`watch.Execute()` |
| `pkg/virt-controller/watch/vmi/vmi.go:306` | VMI reconcile の `execute()` |
| `pkg/virt-controller/watch/vmi/vmi.go:364` | `sync()` 呼び出し |
| `pkg/virt-controller/watch/vmi/lifecycle.go:66` | `sync()` 本体 |
| `pkg/virt-controller/watch/vmi/lifecycle.go:156` | `RenderLaunchManifest(vmi)` |
| `pkg/virt-controller/watch/vmi/lifecycle.go:1105` | `createPod()`、`:1107` で Pods().Create |
| `pkg/virt-controller/services/template.go:325` | `RenderLaunchManifest` 本体 |
| `pkg/virt-handler/vm.go:2043` | `syncVirtualMachine()`、`:2055` で gRPC `SyncVirtualMachine` |
| `pkg/virt-launcher/virtwrap/manager.go:1371` | `LibvirtDomainManager.SyncVMI()` |
| `pkg/virt-launcher/virtwrap/converter/converter.go:967` | `Convert_v1_VirtualMachineInstance_To_api_Domain` |
| `staging/src/kubevirt.io/api/core/v1/types.go:47` | `VirtualMachineInstance` |
| `staging/src/kubevirt.io/api/core/v1/types.go:82` | `VirtualMachineInstanceSpec` |
| `staging/src/kubevirt.io/api/core/v1/types.go:1750` | `VirtualMachineInstanceMigration` |
| `staging/src/kubevirt.io/api/core/v1/types.go:1938` | `VirtualMachine` |
| `pkg/virt-launcher/virtwrap/api/schema.go:112` | `api.Domain` |
| `pkg/virt-launcher/virtwrap/api/schema.go:215` | `api.DomainSpec` |
| `LICENSE:1` | Apache License 2.0 |
| `go.mod:1` | module `kubevirt.io/kubevirt`、Go 1.24 |
