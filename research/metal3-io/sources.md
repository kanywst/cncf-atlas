# sources: metal3-io (baremetal-operator)

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は 2026-06-24。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | metal3-io/baremetal-operator (source, pinned `56169b71`) | <https://github.com/metal3-io/baremetal-operator> | 2026-06-24 |
| 2 | blog (CNCF) | Metal3.io becomes a CNCF incubating project | <https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/> | 2026-06-24 |
| 3 | blog (project) | Metal³: Baremetal Provisioning for Kubernetes (2019-04-30) | <https://metal3.io/blog/2019/04/30/Metal-Kubed-Baremetal-Provisioning-for-Kubernetes.html> | 2026-06-24 |
| 4 | blog (project) | Baremetal Operator (2019-09-11) | <https://metal3.io/blog/2019/09/11/Baremetal-operator.html> | 2026-06-24 |
| 5 | talk | Introducing Metal³: Kubernetes Native Bare Metal Host Management, KubeCon NA 2019 | <https://metal3.io/blog/2019/12/04/Introducing_metal3_kubernetes_native_bare_metal_host_management.html> | 2026-06-24 |
| 6 | docs | Metal3 Book — Bare Metal Operator introduction | <https://book.metal3.io/bmo/introduction> | 2026-06-24 |
| 7 | landing | Metal³ - Metal Kubed (project site) | <https://metal3.io/> | 2026-06-24 |
| 8 | article | Bare Metal in a Cloud Native World (alternatives) | <https://thenewstack.io/bare-metal-in-a-cloud-native-world/> | 2026-06-24 |
| 9 | list | awesome-baremetal (alternatives landscape) | <https://github.com/alexellis/awesome-baremetal/blob/master/README.md> | 2026-06-24 |
| 10 | article | Provision Bare Metal K8s with Cluster API & Canonical MAAS | <https://www.spectrocloud.com/blog/how-to-provision-bare-metal-k8s-clusters-with-cluster-api-and-canonical-maas> | 2026-06-24 |
| 11 | data | GitHub API repo stats for baremetal-operator (`gh repo view`) | <https://github.com/metal3-io/baremetal-operator> | 2026-06-24 |

## コード上のアンカー (commit `56169b71`)

| 主題 | path:line |
| --- | --- |
| Reconcile エントリ | `internal/controller/metal3.io/baremetalhost_controller.go:119` |
| provisioner 生成 + 状態機械実行 | `internal/controller/metal3.io/baremetalhost_controller.go:240`, `:250` |
| status 書き戻し | `internal/controller/metal3.io/baremetalhost_controller.go:270` |
| actionProvisioning → Provision 呼び出し | `internal/controller/metal3.io/baremetalhost_controller.go:1365`, `:1392` |
| 状態機械本体 / handlers マップ | `internal/controller/metal3.io/host_state_machine.go:177`, `:44` |
| ensureCapacity (Ironic スロット待ち) | `internal/controller/metal3.io/host_state_machine.go:87`, `:107` |
| Provisioner インタフェース / Result | `pkg/provisioner/provisioner.go:143`, `:257` |
| Go plugin (.so) ローダ | `pkg/provisioner/plugin.go:99` |
| プラグインパス解決 (main) | `main.go:78`, `:240` |
| BareMetalHost / ProvisionStatus / 状態定数 | `apis/metal3.io/v1alpha1/baremetalhost_types.go:865`, `:822`, `:294` |
