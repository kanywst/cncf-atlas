# recon: metal3-io (baremetal-operator)

Metal3 ("Metal Kubed") のコア実装リポジトリ baremetal-operator (BMO) を読む。BMH CRD を Kubernetes API として公開し、裏で OpenStack Ironic を駆動してベアメタルを払い出すコントローラ。プロジェクトは複数リポに分かれる (BMO / CAPM3 / IPAM / ironic-standalone-operator)。deep-dive の主対象は BMO で確定。

## 基本情報

- repo: `metal3-io/baremetal-operator`
- pinned commit: `56169b71d8e1cb761b734d3a3918f59597e97db1` (main HEAD, 2026-06-24 10:28 UTC)
- 近いタグ: `v0.13.0` (最新リリース。HEAD は main で v0.13.0 より先)
- 言語 / ビルド: Go (go 1.25.0、`go.mod`) / `make build` (controller-runtime + kubebuilder スタイル)
- メインエントリ: `main.go` (602 行)。controller-manager バイナリ
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認。GitHub API でも `apache-2.0`)
- CNCF 成熟度: Incubating (2025-08-27 TOC 承認)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Orchestration & Scheduling
- リポジトリ規模: 非テスト `.go` 117 ファイル。CRD 型は別 Go モジュール (`apis/metal3.io/`)、BMC プロトコルも別モジュール (`pkg/hardwareutils/`)

タグライン案:

- EN: Kubernetes-native bare metal host provisioning that drives OpenStack Ironic through the BareMetalHost CRD.
- JA: BareMetalHost CRD で OpenStack Ironic を駆動し、ベアメタルを Kubernetes ネイティブに払い出すプロビジョナ。

## 歴史の素材

- 2019: Red Hat が開始、すぐ Ericsson が参画。当初は "MetalKube" と呼ばれた。設計方針は「ベアメタル払い出しを再発明せず、既存の実績ある Ironic に乗る」。出典: [Metal³: Baremetal Provisioning for Kubernetes (2019-04-30)](https://metal3.io/blog/2019/04/30/Metal-Kubed-Baremetal-Provisioning-for-Kubernetes.html)、[CNCF incubation blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)。
- BMO リポジトリの作成日は 2019-01-23 (GitHub API `createdAt`)。
- 2019-09: BMO 紹介記事。BMC ベンダ (iLO / iDRAC / iRMC 等) を IPMI/Redfish で抽象化し、Ironic を「ディスク wipe → OS イメージ書込 → reboot → Node 登録」のプロセスで駆動。出典: [Baremetal Operator (2019-09-11)](https://metal3.io/blog/2019/09/11/Baremetal-operator.html)。
- 2019-11 KubeCon NA: Russell Bryant & Doug Hellmann (Red Hat) が "Introducing Metal³" を発表。Cluster API の infrastructure backend として位置づけ。出典: [Introducing Metal³ (2019-12-04)](https://metal3.io/blog/2019/12/04/Introducing_metal3_kubernetes_native_bare_metal_host_management.html)。
- 2020-09: CNCF Sandbox 入り。
- 2025-08-27: CNCF Incubating 昇格。sandbox 期間で 57 の active contributing org (Ericsson と Red Hat がリード)。出典: [CNCF blog](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)。
- 主要な進化: Ironic デプロイを shell ベースから Ironic Standalone Operator (IrSO) に置き換え。プロビジョナを Go の `plugin` (.so) 機構で差し替え可能にした (後述)。

## アーキテクチャの素材

トップレベル構成 (BMO リポ内、`CLAUDE.md` のリポ構造表とも一致):

- `apis/metal3.io/v1alpha1/` — CRD 型 (BareMetalHost ほか)。独立 Go モジュール。
- `internal/controller/metal3.io/` — Reconcile ロジックと有限状態機械。
- `internal/webhooks/metal3.io/` — validating/defaulting webhook。
- `pkg/provisioner/` — Provisioner インタフェースと実装 (ironic / fixture / demo) + plugin ローダ。
- `pkg/hardwareutils/` — BMC プロトコル処理。独立 Go モジュール。
- `config/`, `ironic-deployment/` — Kustomize マニフェスト (CRD / RBAC / webhook、`make manifests` で自動生成)。

BMO 全体は Ironic のオーケストレータ。BMO 自体は Ironic API を叩くだけで、実際の電源制御 (IPMI/Redfish)・PXE/virtual media・ディスク書込は Ironic が行う。

### 代表操作のエンドツーエンド: BareMetalHost の provisioning

1. controller-runtime が Reconcile を起動。`Reconcile()` が BMH を取得 (`internal/controller/metal3.io/baremetalhost_controller.go:119`、取得は `:132`)。`metal3.io/paused` annotation があれば即 return (`:148`)。
2. host data 整合 → HardwareDetails を annotation から取り込み → 新規オブジェクトに finalizer 付与 (`baremetalhost_controller.go:154`, `:162`, `:175`)。
3. BMC credentials secret を解決・検証 (`:200` `buildAndValidateBMCCredentials`)。state が None/Unmanaged なら空 creds (`:197`)。
4. `reconcileInfo` を組み立て (`:231`)、`ProvisionerFactory.NewProvisioner(...)` で provisioner を生成 (`:240`)。`ErrNotReady` なら RequeueAfter で再試行 (`:242`)。
5. `newHostStateMachine(...)` → `stateMachine.ReconcileState(ctx, info)` で状態機械を 1 ステップ進める (`:250`-`:251`)。`actResult.Result()` が controller-runtime の `ctrl.Result` を返す (`:252`)。
6. 状態機械 `host_state_machine.go:177 ReconcileState`: defer で `updateHostStateFrom` (`:181`) を仕掛けつつ、delete 判定・detached 判定・ensureRegistered を順に評価 (`:190`, `:195`, `:199`)、現在状態の handler を `handlers()` マップ (`:44`) から引いて実行。
7. provisioning 状態は `handleProvisioning` (`host_state_machine.go:540`) → `actionProvisioning` (`baremetalhost_controller.go:1365`)。ここで `prov.Provision(ctx, ProvisionData{...})` を呼ぶ (`:1392`)。`provResult.Dirty` なら `actionContinue{RequeueAfter}` で再キュー (`:1417`)、work なし & image 一致で `actionComplete{}` → 次状態 `Provisioned` (`host_state_machine.go:548`)。
8. 状態遷移時、(de)provisioning 系は `ensureCapacity` で Ironic 側スロット空きを確認し、無ければ `actionDelayed` で待機 (`host_state_machine.go:107`-`:114`, `:87`)。
9. Reconcile 末尾: `actResult.Dirty()` または condition 変化があれば `saveHostStatus` で status subresource を書き戻し、postSaveCallbacks (metric 観測) と events を発火 (`baremetalhost_controller.go:270`-`:286`)。

設計判断: pull 型の reconcile + 明示的な有限状態機械。状態は `Status.Provisioning.State` に永続化され、各 reconcile はべき等な 1 ステップ。`actionResult` インタフェース (Result/Dirty) で「再キュー要否」と「status 保存要否」を型で表現し、無限ループ (回復不能エラーの保存ループ) を避ける (`:266`-`:269` のコメント)。

## 内部実装の素材

### 中核データ構造

1. `BareMetalHost` (`apis/metal3.io/v1alpha1/baremetalhost_types.go:865`) — `Spec BareMetalHostSpec` (`:462`) と `Status BareMetalHostStatus` (`:762`)。kubebuilder マーカで shortName `bmh`/`bmhost`、status subresource、printcolumn (Status/State/Consumer/BMC/Online/Error/Age) を定義 (`:855`-`:863`)。
2. `ProvisioningState string` (`:294`) — 状態機械のキー。`StateNone=""`, `registering`, `inspecting`, `preparing`, `available`/`ready`, `provisioning`, `provisioned`, `deprovisioning`, `powering off before delete`, `deleting`, `externally provisioned`, `unmanaged` など (`:297`-`:346`)。
3. `ProvisionStatus` (`:822`) — 直近の provisioning 結果。`State`, Ironic node UUID `ID` (`:829`)、適用済み `Image`/`RootDeviceHints`/`BootMode`/`RAID`/`Firmware`/`CustomDeploy`。
4. `OperationalStatus string` (`:225`) — `OK`/`discovered`/`error`/`delayed`/`detached`。State (provisioning ライフサイクル) とは直交。`delayed` は容量待ち。
5. `provisioner.Provisioner` インタフェース (`pkg/provisioner/provisioner.go:143`) — Register / InspectHardware / Prepare / Provision / Deprovision / Delete / PowerOn / PowerOff / HasCapacity / GetFirmwareSettings など 30 近いメソッド。各々 `Result{Dirty, RequeueAfter, ErrorMessage}` (`:257`) を返す非同期モデル。実装は ironic (本番) / fixture (コンパイル時バイパス) / demo。

### 追う価値のあるパス: provisioner プラグイン機構 (非自明)

provisioner backend は Go の標準 `plugin` パッケージで `.so` として実行時ロードされる。これが最も非自明な設計判断。

- `main.go:78`-`:81`: `defaultProvisionerName="ironic"`, `defaultProvisionerPluginDir="/plugins"`, suffix `-provisioner.so`。`fixture` だけはコンパイル時組込でプラグインロードをスキップ (`main.go:81` コメント)。
- `main.go:227`-`:264`: K8s I/O より前にプラグインを open し、bad path は fail-fast。`pluginPath = <dir>/<name>-provisioner.so` (`:240`)、`provisioner.Open(pluginPath, name)` (`:241`)。`HostConfigure` で plugin が必要とする scheme 追加・cache 設定 (`HostRequirements.AddToScheme` / `CacheByObject`) を host 側に注入 (`:251`-`:264`, `:318`)。
- `pkg/provisioner/plugin.go:99 Open`: `plugin.Open` 後、`PluginName` (`func() string`)、`NewProvisionerFactory` (`func(PluginConfig)(Factory,error)`) のシンボルを lookup しシグネチャ検証。`HostConfigure` は任意 (`:135`)。`PluginName()` が期待名と不一致なら拒否 (`:116`)。
- 効果: ironic backend を本体から疎結合化し、サードパーティが SDK イメージ (`docker-build-sdk` make ターゲット) で独自 provisioner プラグインを差し込める。代償として Go plugin の制約 (同一 Go/依存バージョンでのビルド必須、Linux 限定的) を背負う。

### その他の気づき

- CRD 型が別 Go モジュール (`apis/`) なので、外部コントローラ (CAPM3 等) が BMO 本体を import せず型だけ使える。
- `pkg/provisioner/fixture` はテスト用にプロビジョナをモックし、`provisionerNameFixture` 選択時はプラグインロード自体を回避。e2e でも fixture と ironic を切替 (`test/e2e/config/{fixture,ironic}.yaml`)。
- deprovision に失敗し続けても delete 要求時は 3 回 (`retryCount`) 超で諦めて削除へ進む (`host_state_machine.go:580`-`:585`)。creds が無く Ironic 未登録なら power off を飛ばして削除 (`:587`-`:595`)。運用上「ホストが残っても削除は前進させる」割り切り。

## 採用事例の素材

CNCF incubation blog が "growing list of adopters" として明記 (出典: [CNCF blog 2025-08-27](https://www.cncf.io/blog/2025/08/27/metal3-io-becomes-a-cncf-incubating-project/)):

- Fujitsu
- IKEA
- SUSE
- Ericsson
- Red Hat

採用シグナル:

- BMO リポ単体 (GitHub API, 2026-06-24): star 743 / fork 316 / contributors 約 133 / Apache-2.0 / created 2019-01-23。最新リリース v0.13.0。
- プロジェクト全体 DevStats 風 (CNCF incubation blog 時点, 2025-08): GitHub star 1,523 / merged PR 8,368 / issue 1,434 / contributors 186 / releases 187 / active contributing org 57。
- OpenSSF Best Practices (project 9985)、OpenSSF Scorecard、CLOMonitor のバッジを README に掲示。脆弱性開示プロセス・依存自動更新・SHA pin を governance として整備 (CNCF blog)。

## 代替・エコシステム

エコシステム (同 metal3-io org の周辺): `cluster-api-provider-metal3` (CAPM3、Cluster API 連携)、`ip-address-manager` (IPAM)、`ironic-standalone-operator` (IrSO、Ironic を K8s 上に展開)、`ironic-image` / `ironic-agent-image`、`metal3-dev-env` (開発環境)、`metal3-helm-chart`。BMO は CAPM3 の infrastructure backend として `Metal3MachineTemplate` 経由で Cluster API に接続。

代替 (出典: [The New Stack, Bare Metal in a Cloud Native World](https://thenewstack.io/bare-metal-in-a-cloud-native-world/)、[awesome-baremetal](https://github.com/alexellis/awesome-baremetal/blob/master/README.md)、[Spectro Cloud MAAS+CAPI](https://www.spectrocloud.com/blog/how-to-provision-bare-metal-k8s-clusters-with-cluster-api-and-canonical-maas)):

- OpenStack Ironic (standalone): Metal3 が乗っている当の BMaaS。IPMI/Redfish ドライバでベンダ非依存。Metal3 はこれを K8s CRD + CAPI で包む関係なので「競合」ではなく土台。
- Canonical MAAS: 10 年級で最も成熟。IaaS 風 API、DNS/ネット管理込み。K8s ネイティブではなく外部システム。CAPI は `cluster-api-provider-maas` 経由。
- Tinkerbell (Equinix Metal): provisioning の各ステップを Docker image (workflow) で定義する microservices 型。Ironic を使わない。宣言的 IaC 寄り。
- Sidero (Sidero Labs / Talos): CAPI 対応のベアメタル管理。Talos Linux 前提に寄る。
- Foreman / xCAT: 汎用ライフサイクル管理・大規模クラスタ管理。K8s ネイティブではない。

本質的な差: Metal3 は (a) K8s CRD ファースト (BareMetalHost が一級リソース)、(b) Ironic の実績あるハード対応を再利用、(c) Cluster API の純正 infrastructure provider という 3 点で、汎用 BMaaS (MAAS/Tinkerbell/Ironic standalone) と差別化される。

## インストール / 最小構成

出典: [Metal3 Book — BMO introduction](https://book.metal3.io/bmo/introduction)、リポジトリ `Makefile` / `README.md`。

- 最小の BareMetalHost には `spec.bmc.address`、`spec.bmc.credentialsName` (BMC user/pass を持つ Secret)、`spec.bootMACAddress` (起動 NIC の MAC、BMC の MAC ではない)、`spec.online: true` が必要。BMC プロトコルは IPMI または Redfish、ブートは network か virtual media。
- 開発: `make tilt-up` (kind クラスタ + tilt) や `make install` (CRD 適用) → `make deploy` (controller を kustomize で展開) → `make run` (ローカルから ironic plugin 込みで起動)。ironic backend は別途デプロイが必要 (IrSO もしくは `ironic-deployment/` の kustomize)。
- 単体テストは envtest 前提で `make unit` (素の `go test` は不可、`CLAUDE.md` 記載)。e2e は libvirt VM + BMC エミュレータで `./hack/ci-e2e.sh`。
