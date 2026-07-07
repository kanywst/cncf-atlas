# 歴史

## 起源

コードは CoHDI プロジェクトより前から存在する。IBM Research が CoHDI 発足前に Composable Resource Operator を開発し、CoHDI 発足時にその中核として寄与した。ADOPTERS ファイルは IBM Research を "Since 2024" と記載し、`composable-resource-operator` リポジトリの作成日は 2024-03-11 である。その出自はソースにも残っている。両 CRD は今も API group `cro.hpsys.ibm.ie.com` を使う (`api/v1alpha1/groupversion_info.go:29`)。

解こうとした課題は構造的なものだ。Kubernetes はハードウェアを起動時にノードへ割り当て、コンポーザブルハードウェアの概念を持たないため、高価なアクセラレータは遊休時でもホストへ静的に固定されたままになる。これは稼働率を下げ、生成 AI が電力消費を押し上げる中でコストとエネルギーを悪化させる。CoHDI の主張は、PCIe / CXL デバイス (GPU / DPU / IPU / SmartNIC / FPGA / NVMe / CXL memory) をオンデマンドでノードへ合成することであり、IOWN Global Forum の Data-Centric Infrastructure as a Service (DCIaaS) に沿う発想である。この枠組みは CNCF Sandbox 提案 [cncf/sandbox Issue #361](https://github.com/cncf/sandbox/issues/361) に由来する。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2024 | IBM Research の Composable Resource Operator リポジトリ作成 (2024-03-11)。後に CoHDI へ統合。 |
| 2025-04 | Fujitsu と Red Hat のエンジニアが CNCF Sandbox 提案を起票 ([Issue #361](https://github.com/cncf/sandbox/issues/361))。 |
| 2025 | CoHDI Japan が Cloud Native Community Japan の SIG として発足。 |
| 2025-12-19 | CNCF に Sandbox 成熟度で受理 ([CNCF プロジェクトページ](https://www.cncf.io/projects/cohdi/))。 |
| 2026-06-23 | commit 761a00b、tag v0.2.0 (本ドキュメントの基準バージョン)。 |

## どう進化したか

CoHDI は単一の IBM オペレーターから 3 部構成のスイートへ成長した。`composable-resource-operator` (着脱エンジン) に加え、空きプールのデバイスを Kubernetes DRA の ResourceSlice に載せる `composable-dra-driver`、待機 Pod を検知して合成を起動する `dynamic-device-scaler` を追加した。オペレーター自体も IBM 由来を超えて広がり、複数のハードウェアベンダーを 1 つのインタフェースの背後に抽象化した。`CdiProvider` interface (`internal/cdi/client.go:34`) は今や Fujitsu FTI_CDI、SNIA Sunfish、NEC の実装を持ち、実行時に選択される (`internal/controller/composableresource_adapter.go:63`)。

この取り組みは上流 Kubernetes のスケジューリングと連動する。意図する起動パスはスケジューラがハードウェア着脱まで Pod を保持することに依存しており、それが [KEP-5007 (device-attach-before-pod-scheduled)](https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/5007-device-attach-before-pod-scheduled) の主題である。

## 現在地

プロジェクトは 2025-12-19 時点で CNCF Sandbox であり、オペレーターにリリースタグを付ける (本書のバージョンは `v0.2.0`)。ガバナンスは複数ベンダーにまたがる。ADOPTERS ファイルは NTT、NEC、Fujitsu/Fsas Technologies、IBM Research を参加者として記録し、CoHDI Japan SIG が Cloud Native Community Japan の下で活動する。コードベースはまだ初期段階だ。この commit 時点の README には未解決の Git マージコンフリクトマーカーが残っており (`README.md:181`)、若く動きの速いリポジトリであることの小さな証左になっている。
