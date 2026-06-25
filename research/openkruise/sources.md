# sources: OpenKruise

各出典に番号を振り、recon / ドキュメント側の引用と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | openkruise/kruise (GitHub) | <https://github.com/openkruise/kruise> | 2026-06-24 |
| 2 | repo | ソース tree (tag v1.9.0, pinned `439d98db`) | <https://github.com/openkruise/kruise/tree/v1.9.0> | 2026-06-24 |
| 3 | case-study | OpenKruise becomes a CNCF incubating project (CNCF blog) | <https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/> | 2026-06-24 |
| 4 | project | OpenKruise (CNCF projects page) | <https://www.cncf.io/projects/openkruise/> | 2026-06-24 |
| 5 | blog | OpenKruise: The Cloud-Native Platform for Alibaba's Double 11 (Alibaba Cloud) | <https://www.alibabacloud.com/blog/openkruise-the-cloud-native-platform-for-the-comprehensive-process-of-alibabas-double-11_596966> | 2026-06-24 |
| 6 | blog | OpenKruise v1.0, reaching new peaks of application automation (CNCF) | <https://www.cncf.io/blog/2021/12/23/openkruise-v1-0-reaching-new-peaks-of-application-automation/> | 2026-06-24 |
| 7 | docs | InPlace Update (OpenKruise docs) | <https://openkruise.io/docs/core-concepts/inplace-update> | 2026-06-24 |
| 8 | docs | CloneSet (OpenKruise docs) | <https://openkruise.io/docs/user-manuals/cloneset> | 2026-06-24 |
| 9 | docs | SidecarSet (OpenKruise docs) | <https://openkruise.io/docs/user-manuals/sidecarset> | 2026-06-24 |
| 10 | docs | Installation (OpenKruise docs) | <https://openkruise.io/docs/installation> | 2026-06-24 |
| 11 | blog | OpenKruise v1.7: SidecarSet Supports Native Kubernetes Sidecar Containers (Alibaba Cloud) | <https://www.alibabacloud.com/blog/openkruise-v1-7-sidecarset-supports-native-kubernetes-sidecar-containers_601775> | 2026-06-24 |
| 12 | api | GitHub REST API repos/openkruise/kruise (stars/forks/contributors) | <https://api.github.com/repos/openkruise/kruise> | 2026-06-24 |
| 13 | repo | Releases (v1.9.0, 2026-06-21) | <https://github.com/openkruise/kruise/releases> | 2026-06-24 |

## path:line アンカー (一次)

- `main.go:236-267` webhook 先行セットアップ → controller 登録
- `cmd/daemon/main.go:85` kruise-daemon `NewDaemon`
- `pkg/controller/cloneset/cloneset_controller.go:198-200,202-401,403-456` Reconcile / doReconcile / syncCloneSet
- `pkg/controller/cloneset/sync/cloneset_update.go:47,254-320` realControl.Update / updatePod
- `pkg/util/inplaceupdate/inplace_update.go:57-119,313-424` 型定義 / Update / updatePodInPlace
- `apis/apps/pub/inplace_update.go:52-105` InPlaceUpdateState
- `apis/apps/v1beta1/cloneset_types.go:41,177,202` CloneSetSpec / UpdateStrategy / Status
- `pkg/webhook/pod/mutating/pod_readiness.go:30-37` readiness gate 注入
- `LICENSE.md:1-4` Apache-2.0
