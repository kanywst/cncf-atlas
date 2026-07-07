# recon: CoHDI (composable-resource-operator)

調査メモ。CoHDI プロジェクトの中核実装である `composable-resource-operator` を読んだ記録。出典 URL と `file:line` を残す。

## 基本情報

- repo: [CoHDI/composable-resource-operator](https://github.com/CoHDI/composable-resource-operator)
- pinned commit: `761a00ba43d29524f21082cf157f1d4d361e465e` / 近いタグ: `v0.2.0` (commit 日時 2026-06-23)
- 言語 / ビルド: Go 1.24 (`go.mod` の `go 1.24.0`, `toolchain go1.24.3`) / kubebuilder + controller-runtime ベース、`make build` / `make docker-build IMG=...`
- ライセンス: Apache-2.0 (GitHub License API の `spdx_id` が `Apache-2.0`、`LICENSE` 冒頭も Apache License Version 2.0)
- 主エントリポイント: `cmd/main.go:61` の `func main()`
- CNCF 成熟度: Sandbox (2025-12-19 受理)
- カテゴリ: Orchestration & Scheduling

CoHDI は「Composable Hardware in Disaggregated Infrastructure」(分離型インフラにおけるコンポーザブルハードウェア、発音は "Cody")の略。プロジェクトは GitHub の [CoHDI org](https://github.com/CoHDI) に複数リポジトリを持つ。中核ソフトウェアスイートは 3 つ。

- `composable-resource-operator`: CDI (Composable Device Infrastructure、コンポーザブルデバイス基盤) の REST API を叩いてノードへ GPU を着脱する Operator。本調査の対象。最古 (2024-03-11 作成)・最多 star。
- `composable-dra-driver`: Kubernetes DRA (Dynamic Resource Allocation、動的リソース割り当て) 用ドライバ。リソースプール内の空き GPU を ResourceSlice に載せる。
- `dynamic-device-scaler`: スケジューラが待機している Pod を検知し、着脱を Operator にリクエストする。

本リポジトリを正本に選んだ理由: 3 コンポーネントの中で唯一明確な機能説明 (`Proof Of Concept showcasing composable GPUs in Kubernetes`) を持ち、作成が最も古く (2024-03)、star 数も最多 (23)。CDI システムへ実際に着脱要求を出す箇所であり、ディープダイブの中心になる。

## 歴史の素材

- 出自: IBM Research が CoHDI プロジェクト発足前から Composable Resource Operator を開発。CoHDI 発足後はその一部として継続。出典: [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) の IBM Research 行 (Since 2024)。リポジトリ作成日も 2024-03-11 (GitHub API)。
- 課題: Kubernetes はコンポーザブルハードウェアの概念を持たず、リソースはノード起動時に静的に割り当てられる。GPU など高価なアクセラレータが静的固定されることで稼働率低下とコスト増を招く。出典: 本リポジトリ [README.md](https://github.com/CoHDI/composable-resource-operator/blob/main/README.md) の Description、`cncf/sandbox` の [Issue #361](https://github.com/cncf/sandbox/issues/361)。
- 動機 (AI / 省電力): 生成 AI による電力消費増を背景に、PCIe / CXL 接続デバイス (GPU / DPU / IPU / SmartNIC / FPGA / NVMe / CXL memory) を動的に合成して適材適所で使い省電力化する。IOWN Global Forum の DCIaaS (Data-Centric Infrastructure as a Service) を意識。出典: [Issue #361](https://github.com/cncf/sandbox/issues/361)。
- マイルストーン:
  - 2025-04-07: Fujitsu (oguchi.naoki / tagashira) と Red Hat (hsugiyam) が CNCF Sandbox 提案を起票 ([Issue #361](https://github.com/cncf/sandbox/issues/361))。
  - 2025: CoHDI Japan が Cloud Native Community Japan の SIG として発足。
  - 2025-12-19: CNCF Sandbox に Sandbox 成熟度で受理。出典: [CNCF project page](https://www.cncf.io/projects/cohdi/)。
  - 2026-06-23: 本調査対象コミットおよびタグ `v0.2.0`。

## アーキテクチャの素材

全体像 (org の [profile README](https://github.com/CoHDI/.github/blob/main/profile/README.md) の "How it works")。

1. Pod が worker node に存在しない GPU を要求する。
2. スケジューラは resource pool 用 ResourceSlice に空き GPU があると分かると Pod をスケジュール待機させる。
3. `dynamic-device-scaler` がこの状況を検知し、`composable-resource-operator` の Custom Resource を介して GPU 着脱を要求する。
4. `composable-resource-operator` が CDI システムの REST API へ着脱を要求する。
5. CoHDI Manager が PCI スイッチを制御し GPU を worker node へ物理接続する。
6. ベンダー DRA プラグインが GPU を ResourceSlice に載せ、Pod がスケジュールされる。

関連: スケジューラ側の上流提案 [KEP-5007 (device-attach-before-pod-scheduled)](https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/5007-device-attach-before-pod-scheduled)。

本 Operator は controller-runtime Manager に 3 つの reconciler と 1 つの validating webhook を登録する (`cmd/main.go:167`, `:176`, `:186`、webhook は `ENABLE_WEBHOOKS` ガード `:196` 配下の `SetupWebhookWithManager` `:197`)。

- `ComposabilityRequestReconciler` (`internal/controller/composabilityrequest_controller.go:72`): ユーザー向け CRD (Custom Resource Definition、カスタムリソース定義) `ComposabilityRequest` を見て、希望台数・割り当てポリシーを満たすよう内部 CRD `ComposableResource` を増減する。
- `ComposableResourceReconciler` (`internal/controller/composableresource_controller.go:82`): 個々の `ComposableResource` の状態機械を回し、CDI プロバイダの API を呼んで実デバイスを着脱する。
- `UpstreamSyncerReconciler` (型 `internal/controller/upstreamsyncer_controller.go:40`、goroutine 起動は `SetupWithManager` `:49`、`syncInterval := 1 * time.Minute` `:61`): 1 分間隔の goroutine で CDI 側の実状態とクラスタ状態のドリフトを照合する。
- `ComposabilityRequestCustomValidator` (`internal/webhook/v1alpha1/composabilityrequest_webhook.go:60`): 同一 type / model の重複リクエストや、`differentnode` ポリシーでの `target_node` 指定を弾く。

### 2 つの CRD

`ComposabilityRequest` (ユーザー向け、Cluster スコープ) は希望リソースの type / model / size / allocation_policy / target_node を指定する (`api/v1alpha1/composabilityrequest_types.go:36`, `:40`)。`ComposableResource` (内部、ユーザーは read-only 扱い) は個々のデバイス 1 台のライフサイクルを追う (`api/v1alpha1/composableresource_types.go:27`)。両 CRD の API group は `cro.hpsys.ibm.ie.com` で、IBM 由来の名前空間が残っている。

### 設計判断

非自明な判断は CDI プロバイダの抽象化、二段 reconcile、upstream ドリフト検知の 3 点。

- プロバイダ抽象: `CdiProvider` interface (`internal/cdi/client.go:34`) が `AddResource` / `RemoveResource` / `CheckResource` / `GetResources` を定義し、`NewComposableResourceAdapter` (`internal/controller/composableresource_adapter.go:40`) が環境変数 `CDI_PROVIDER_TYPE` で実装を切り替える (`SUNFISH` / `NEC` / `FTI_CDI`)。`FTI_CDI` はさらに `FTI_CDI_API_TYPE` で `CM` (Composition Manager) と `FM` (Fabric Manager) に分岐する (`composableresource_adapter.go:63`)。ハードウェアベンダーごとの管理 API 差異をこの層で吸収する。
- 二段 reconcile: 「希望台数 + ポリシー」を持つ `ComposabilityRequest` を、台数ぶんの `ComposableResource` (各々が独立した状態機械) に分解する。下記の代表操作で詳述。
- upstream ドリフト検知: `UpstreamSyncerReconciler`。CDI ファブリック側に居るが対応する CR が無いデバイスを猶予期間付きで追跡し、孤児デバイスを自動で detach する。

## 内部実装の素材

### 中核データ構造 (3-5)

1. `ComposabilityRequestSpec` / `ScalarResourceDetails` (`api/v1alpha1/composabilityrequest_types.go:36`, `:40`): ユーザー向け要求。`Type` (`gpu` / `cxlmemory` の enum)、`Model`、`Size`、`AllocationPolicy` (`samenode` / `differentnode`)、`TargetNode`、`OtherSpec` (ノード容量条件)。Status 側は `Resources map[string]ScalarResourceStatus` で各 CR の状態を集約する (`:67`, `:74`)。
2. `ComposableResourceSpec` / `ComposableResourceStatus` (`api/v1alpha1/composableresource_types.go:27`, `:36`): デバイス 1 台ぶん。`TargetNode`、`DeviceID` (シリアル番号)、`CDIDeviceID` (CDI 側 UUID)。
3. `CdiProvider` interface と `DeviceInfo` 構造体 (`internal/cdi/client.go:34`, `:25`): プロバイダ抽象。`DeviceInfo` は upstream 照合用の正規化形 (NodeName / MachineUUID / DeviceID / CDIDeviceID など)。
4. `FTIClient` (`internal/cdi/fti/fm/client.go:50`): Fujitsu CDI の Fabric Manager 実装。`compositionServiceEndpoint` / `tenantID` / `clusterID` / `token` を保持。
5. `CachedToken` (`internal/cdi/fti/token.go:58`): OAuth2 / OIDC (OpenID Connect) トークンのキャッシュ。`sync.RWMutex` で保護し、`leeway` (30 秒) を引いた expiry で先回り更新する (`token.go:74` の `GetToken`)。トークンは Kubernetes Secret `credentials` から username / password / client_id / client_secret / realm を読み、password grant で取得する (`token.go:103` の `Token`)。

### 代表的コア操作: GPU を 1 台 attach する (end to end)

`ComposabilityRequest` を 1 件作ってから GPU がノードに見えるまでを追う。

1. ユーザーが `ComposabilityRequest` (例: `type: gpu`, `size: 2`, `model: NVIDIA-A100-PCIE-40GB`) を作成。webhook が重複 / ポリシーを検証する (`internal/webhook/v1alpha1/composabilityrequest_webhook.go:100` の `validateRequest`)。
2. `ComposabilityRequestReconciler.Reconcile` (`composabilityrequest_controller.go:72`) から `handleComposabilityRequestChange` (`:98`) へ。State が空なので `handleNoneState` (`:197`) が finalizer を付け State を `NodeAllocating` にする (`:207`)。
3. `handleNodeAllocatingState` (`:213`) が全ノードを取得し、`AllocationPolicy` (`samenode` / `differentnode`) と `OtherSpec` 容量条件に従って割り当て先ノードを決める。決定後 `Status.Resources` に生成名でエントリを作り (`:474` から `:479`)、State を `Updating` にする (`:481`)。生成名は `utils.GenerateComposableResourceName` (`internal/utils/stringutils.go:26`)。
4. `handleUpdatingState` (`:487`) が `Status.Resources` に対応する `ComposableResource` を作成し (`:522` から `:542`)、余剰 CR を削除する。全 CR が `Online` になるまで 30 秒ごとに requeue する (`:557`)。
5. `ComposableResourceReconciler.Reconcile` (`composableresource_controller.go:82`)。新規 CR は State が空なので `handleNoneState` (`:185`) が finalizer を付け State を `Attaching` にする (`:204`)。
6. `handleAttachingState` (`:209`): まず `utils.EnsureGPUDriverExists` (`internal/utils/gpus.go:64`) で NVIDIA ドライバ存在を確認。`DeviceID` 未設定なら `adapter.CDIProvider.AddResource(resource)` を呼ぶ (`:231`)。`ErrWaitingDeviceAttaching` なら 30 秒後 requeue (`:236`)。
7. `FTIClient.AddResource` (`internal/cdi/fti/fm/client.go:100`): `getNodeMachineID` でノードから machine UUID を解決し (`:103`)、`token.GetToken()` でトークンを取得し (`:109`)、`ScaleUpBody` を組み (`:115`)、`PATCH https://<endpoint>/fabric_manager/api/v1/machines/<id>/update` を送る (`:147`)。レスポンスを `ScaleUpResponse` にデコードし、`OptionStatus` の先頭 1 文字で判定する (`:195`: `0` = 正常, `1` = Warning でも成功扱い, `2` = Critical で失敗)。成功時は `SerialNum` を deviceID、`ResourceUUID` を CDIDeviceID として返す (`:196`)。
8. 制御が `handleAttachingState` に戻り、deviceID / CDIDeviceID を Status に書く (`:245` から `:247`)。`DEVICE_RESOURCE_TYPE` が `DRA` なら `nvidia-smi` 実行と kubelet plugin Pod の再起動 (`:272`, `:279`)、`DEVICE_PLUGIN` なら device-plugin / dcgm DaemonSet を再起動する (`:257`, `:264`)。
9. `utils.CheckGPUVisible` (`internal/utils/gpus.go:185`) でクラスタが新デバイスを認識したか確認する (`:288`)。見えれば State を `Online` (`:293`)、見えなければ 30 秒後 requeue (`:298`)。
10. `ComposableResource` の Status 変化を `ComposabilityRequest` 側が Watch して拾う (`SetupWithManager` の `Watches` と `resourceStatusUpdatePredicate`, `composabilityrequest_controller.go:684`, `:658`)。`handleComposableResourceChange` (`:169`) が変化を `ComposabilityRequest.Status.Resources` に反映する。全 CR が `Online` になると (`canRun` 判定 `:551`) `handleUpdatingState` が State を `Running` にする (`:552`)。

detach 側は逆順。`handleDetachingState` (`composableresource_controller.go:333`) が `CheckNoGPULoads` で負荷の無さを確認し (`force_detach` でスキップ可)、DRA 時は `CreateDeviceTaint` で再スケジュールを止め (`:357` / `internal/utils/gpus.go:858`)、`DrainGPU` (`internal/utils/gpus.go:330`) の後に `RemoveResource` で FM へ scaledown を送る (`:367`)。

### node から machine UUID への解決 (追う価値あり)

`FTIClient.getNodeMachineID` (`internal/cdi/fti/fm/client.go:416`) は環境で 2 経路に分かれる。`clusterID` がある (OpenShift) 場合は Node annotation `machine.openshift.io/machine` から `Metal3Machine`、その annotation `metal3.io/BareMetalHost` から `BareMetalHost`、さらにその annotation `cluster-manager.cdi.io/machine` を辿って machine UUID を得る (`:423` から `:449`)。無い場合は Node の `spec.providerID` から `fsas-cdi://` プレフィックスを剥がす (`:457`)。Metal3 / cluster-api-provider-metal3 / OpenShift Machine API に密結合している点が実装上の特徴。

### upstream ドリフト検知

`UpstreamSyncerReconciler` (型 `internal/controller/upstreamsyncer_controller.go:40`、`SetupWithManager` の ticker `:49` 配下) は 1 分間隔で `GetResources()` を呼び、CDI ファブリック上のデバイス一覧とクラスタの `ComposableResource` を突き合わせる (`syncUpstreamData`, `:79`)。対応する CR の無い孤児デバイスを `missingDevices` map で追跡し、猶予期間 `missingDeviceGracePeriod` (10 分, `:38`) を超えたら detach 用 CR を `cohdi.io/ready-to-detach-device-id` ラベル付きで生成する (`createDetachCR`, `:140`)。

### 実コードで見つけた注意点

- `README.md:181` から `:187` に未解決の Git マージコンフリクトマーカーが残存している (`<<<<<<< HEAD` / `=======` / `>>>>>>> c7b5d52 (docs: enhance project documentation)`)。`v0.2.0` 時点で混入したまま。ドキュメント品質の実例として記録。
- `AddResource` の `OptionStatus[:1]` (`fm/client.go:195`) は文字列の先頭 1 文字を直接スライスしており、`OptionStatus` が空文字なら panic し得る。getting-started には影響しないが内部実装の注意点。

## 採用事例の素材

出典: [ADOPTERS.md](https://github.com/CoHDI/.github/blob/main/ADOPTERS.md) (参照日 2026-06-27)。記載組織のみ列挙、捏造なし。

- NTT (Since 2022): ICT インフラ事業者として IOWN プロジェクトの DCI (Data Centric Infrastructure) の一部に CoHDI を統合予定。
- NEC (Since 2025): CDIM (Composable Disaggregated Infrastructure Manager, [project-cdim](https://github.com/project-cdim)) の OSS 開発元として CoHDI と協業。
- Fujitsu / Fsas Technologies Inc. (Since 2025): サーバ / ストレージベンダーとして CDI 向けサーバシステムと共に CoHDI を開発。
- IBM Research (Since 2024): CoHDI 発足前から Composable Resource Operator を開発、現在も CoHDI の一部として継続。

ディストリビューションの予定 (同 ADOPTERS.md、いずれも "will include" = 予定段階): Red Hat OpenShift と SUSE Rancher が worker node のデバイス動的スケーリングのソリューションとして CoHDI を含める予定。

GitHub シグナル (参照日 2026-06-27, GitHub API): `composable-resource-operator` は star 23 / fork 8 / contributors 10 / commit 約 58 (`per_page=1` の Link ヘッダ last=58)。`composable-dra-driver` は star 6、`dynamic-device-scaler` は star 6。OpenSSF Best Practices badge (project 12016) と OpenSSF Scorecard を README に掲示。

## 代替・エコシステム

エコシステム / 統合先:

- Kubernetes DRA、sig-node / sig-scheduling / sig-autoscaling、上流 [KEP-5007](https://github.com/kubernetes/enhancements/tree/master/keps/sig-scheduling/5007-device-attach-before-pod-scheduled)。
- NVIDIA GPU Operator と nvidia-dra-driver-gpu (`go.mod` が `github.com/NVIDIA/gpu-operator` に依存、`composableresource_controller.go:257` などで DaemonSet 名を直指定)。
- Metal3 BareMetalHost / cluster-api-provider-metal3 / OpenShift Machine API (`fm/client.go:416` の machine UUID 解決)。
- CDI プロバイダ実装: FTI_CDI (Fujitsu、CM / FM の 2 API)、SUNFISH (SNIA Sunfish 準拠)、NEC。
- IOWN Global Forum の DCIaaS。

代替と本質的な差:

- 素の Kubernetes DRA: デバイスの予約・割り当ては行うが、ノードに繋がる物理ハードウェアの集合は起動時に固定。CoHDI は PCIe / CXL ファブリックを操作してノードの物理構成自体を実行時に変える点が異なる。
- NVIDIA GPU Operator: ドライバ / device-plugin / DCGM のライフサイクル管理が主で、GPU は静的前提。CoHDI はその前段で GPU の着脱そのものを担い、GPU Operator を再起動して認識を更新させる関係 (補完的)。
- Project CDIM ([project-cdim](https://github.com/project-cdim)): CDI そのものの管理プラットフォーム。CoHDI から見ると下位の CDI システム側であり、競合ではなく連携先 (NEC が ADOPTERS に明記)。
- ノードオートスケーラ (Cluster Autoscaler 等): ノード台数を増減するが個別デバイスの合成はしない。CoHDI はノードを増やさずデバイスを足す方向。
