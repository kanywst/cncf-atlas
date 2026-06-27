# sources: Carina

各出典に番号を振り、recon.md / 将来のドキュメント側引用と対応させる。アクセス日は 2026-06-26。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | carina-io/carina (source, README, deploy manifests) | <https://github.com/carina-io/carina> | 2026-06-26 |
| 2 | case-study | Carina, CNCF project page (Sandbox 受理 2022-12-14) | <https://www.cncf.io/projects/carina/> | 2026-06-26 |
| 3 | repo | carina-io/carina Releases (latest v0.14.0, 2025-04-16) | <https://github.com/carina-io/carina/releases> | 2026-06-26 |
| 4 | repo | cncf/toc #974 Carina Sandbox onboarding | <https://github.com/cncf/toc/issues/974> | 2026-06-26 |
| 5 | repo | cncf/sandbox #204 Carina onboarding | <https://github.com/cncf/sandbox/issues/204> | 2026-06-26 |
| 6 | listing | CNCF Sandbox Projects | <https://www.cncf.io/sandbox-projects/> | 2026-06-26 |
| 7 | blog | CNCF blog: cloud native projects in sandbox | <https://www.cncf.io/blog/2025/08/11/exploring-cloud-native-projects-in-sandbox-13-arrivals-from-2024-h2/> | 2026-06-26 |
| 8 | api | GitHub REST API repos/carina-io/carina (stars/forks/license/pushed) | <https://api.github.com/repos/carina-io/carina> | 2026-06-26 |

## コード内アンカー (commit aec3a9f / tag v0.14.0)

- CSI CreateVolume: `pkg/csidriver/driver/controller.go:54`
- LogicVolume CRD 作成とポーリング: `pkg/csidriver/driver/k8s/logicvolume_service.go:161`, `:195`, `:210`
- ノード reconcile / createLV: `controllers/logicvolume_controller.go:60`, `:153`, `:165`
- ノードフィルタ: `controllers/logicvolume_controller.go:356`, `:364`
- LVM 実行層: `pkg/devicemanager/volume/volume.go:48`, `pkg/devicemanager/lvmd/lvm.go:258`
- CRD 型: `api/v1/logicvolume_types.go:63`, `api/v1beta1/nodestorageresource_types.go:65`
- API モデル: `api/api.go:4` (VgGroup), `:15` (PVInfo), `:25` (Disk), `:116` (Raid)
- DeviceManager: `pkg/devicemanager/manager.go:54`
- スケジューラ Score: `scheduler/schedulerplugin/localstorage/storage-plugins.go:153`
- ドライバ名 / 定数: `constants.go:23`
- ライセンス: `LICENSE:1` (Apache 2.0)
