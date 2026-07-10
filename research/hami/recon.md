# recon: HAMi

調査メモ。自分用の密度。出典は sources.md の番号で参照。`file:line` は pinned commit 基準。

## 基本情報

- repo: Project-HAMi/HAMi (git remote で確認 (S1))
- pinned commit: `2487a240edb78705c2cbf35829f95f67793817ed` (2026-07-07) / 近いタグ: v2.9.0 (2026-05-19)
  - 注意: HEAD は master 追従で v2.9.0 のリリースブランチとは分岐している。`git describe` はタグを引けない (shallow clone, depth 1)。近いリリースは v2.9.0。
- 言語 / ビルド: Go (go 1.26.2, go.mod) がコントロールプレーン。GPU 内側の隔離ライブラリ HAMi-core は C/CUDA で別リポ (`libvgpu` サブモジュール = Project-HAMi/HAMi-core (S6))
- ライセンス: Apache-2.0 (LICENSE, go.mod)
- CNCF 成熟度: **Incubating** (2026-07-02 昇格) (S2)(S5)。Sandbox 受理は 2024-08-21 (S2)(S4)。
  - ⚠️ タスク指定は Sandbox だが、CNCF の projects ページ実物では Incubating。pinned commit の README (README.md:25) はまだ "CNCF Sandbox" のまま (未更新)。書き段階で要判断 (status.md 参照)。
- カテゴリ (CATEGORY_ORDER から): Orchestration & Scheduling (CNCF Landscape も orchestration-management--scheduling-orchestration に配置 (S1))
- GitHub signals (2026-07-09 取得 (S1)): star 3,720 / fork 611 / contributors 129 / created 2021-09-14 / Apache-2.0
- 別名: HAMi = Heterogeneous AI Computing Virtualization Middleware。旧称 `k8s-vGPU-scheduler` (README.md:23)。CNAI Landscape にも掲載 (README.md:25)。

## 歴史の素材

- 2021-09-14: GitHub リポジトリ作成 (`gh repo view` createdAt (S1))。前身は 4Paradigm の `k8s-vGPU-scheduler` (README.md:23、CNCF sandbox 申請 #97 も原所有者を 4paradigm と記載 (S3))。
- 2024-04-15: CNCF Sandbox 申請 (cncf/sandbox issue #97) (S3)。
- 2024-08-21: CNCF Sandbox 受理 (S2)(S4)。2024 H2 arrivals の 1 つ (S4)。
- 2026-07-02: CNCF Incubating に昇格 (S2)(S5)。
- HAMi-core (GPU 内側の CUDA hijack ライブラリ) は当初 Dynamia AI と NVIDIA のエンジニアがアーキテクチャを設計、その後 4Paradigm などが maintainer に加わりマルチベンダのガバナンスに発展 (Dynamia AI blog (S5)(S14))。
- リリース系譜: 最古タグ v1.0.0.0 (2024-07-25)、直近 v2.9.0 (2026-05-19)。タグ命名は途中で `v1.1.x.y` 4 桁から `v2.x.y` semver に整理された (git tag 一覧)。

出典の弱点: shallow clone のため first commit / donate PR の一次ソースはリポからは引けていない。日付は CNCF/blog 側の二次ソース。書き段階で一次確認できると強い。

## アーキテクチャの素材

HAMi は「アプリ無改変で GPU を分割共有する」ために、Kubernetes のスケジューリング経路と kubelet の device-plugin 経路の両方に割り込む。README の How It Works が全体像 (README.md:57-66)。

コンポーネント (cmd/, pkg/ ツリー):

- **Mutating webhook** (`pkg/scheduler/webhook.go`): Pod 作成時に admission で介入し、GPU リソースを要求する Pod の `schedulerName` を HAMi スケジューラに向け替え、privileged コンテナ除外や quota チェックを行う。
- **Scheduler extender** (`pkg/scheduler/`, `cmd/scheduler`): kube-scheduler の extender として `/filter` (Predicate) と `/bind` を HTTP で提供。ノード/GPU 単位で fit 判定・スコアリングし、割当結果を Pod annotation に書く。
- **Device plugins** (`cmd/device-plugin/nvidia`, `pkg/device-plugin/nvidiadevice/...`): kubelet device-plugin API を実装。`Allocate()` で annotation に書かれた割当を実デバイスに解決し、環境変数とマウント (HAMi-core) をコンテナに注入。ベンダごとに `pkg/device/{nvidia,ascend,cambricon,hygon,iluvatar,metax,mthreads,...}` が `Devices` インタフェース (`pkg/device/devices.go:36`) を実装。
- **HAMi-core / libvgpu.so** (別リポ (S6), `libvgpu` サブモジュール): コンテナ内で `LD_PRELOAD` される CUDA/NVML hijack ライブラリ。`CUDA_DEVICE_MEMORY_LIMIT_*` と `CUDA_DEVICE_SM_LIMIT` を読み、メモリ確保上限と SM 使用率を実行時に強制する。in-container の隔離はここが担う (device-plugin はマウントと env 注入のみ)。
- **vGPUmonitor / metrics** (`cmd/vGPUmonitor`, `pkg/monitor`, `pkg/metrics`): Pod ごとの GPU 使用量を集計し Prometheus に出す。

### 代表フロー: 「1 GPU の一部 (gpumem 3000MB) を要求する Pod」を end-to-end で追う

要求例 (README.md:73-79):

```yaml
resources:
  limits:
    nvidia.com/gpu: 1
    nvidia.com/gpumem: 3000
```

デフォルトのリソース名は `nvidia.com/gpu` (枚数), `nvidia.com/gpumem` (MB), `nvidia.com/gpumem-percentage`, `nvidia.com/gpucores` (SM %) (`pkg/device/nvidia/device_test.go:114-117` が既定値を確認)。

1. **Admission (webhook)**: Pod 作成が `/webhook` に来る (`cmd/scheduler/main.go:147` → `routes.WebHookRoute` → `webhook.Handle`)。`webhook.Handle` (`pkg/scheduler/webhook.go:53`) が Pod をデコードし、コンテナが 0 なら拒否 (:60)、privileged はスキップ (:74)、各コンテナで `device.GetDevices()` の各ベンダ実装の `MutateAdmission` を呼ぶ (:80-81)。NVIDIA 実装は `pkg/device/nvidia/device.go:345`。GPU リソースを持つ Pod なら `hasResource=true` となり、`config.SchedulerName` が設定されていれば Pod の `schedulerName` を書き換える (:93-94)。最後に `fitResourceQuota` (:100, 定義 :111) で namespace quota を超えないか確認し、JSONPatch を返す (:108)。

2. **Filter (extender predicate)**: kube-scheduler が候補ノード集合を HAMi の `/filter` に POST (`cmd/scheduler/main.go:145` → `routes.PredicateRoute`, `pkg/scheduler/routes/route.go:42`)。body は 1MB 制限付きでデコード (:50, `extenderv1.ExtenderArgs`)、キャッシュ同期待ち (:62) 後に `s.Filter` (`pkg/scheduler/scheduler.go:741`)。`Filter` は:
   - `device.Resourcereqs(pod)` で要求を集計、0 なら失敗イベント (:743-758)。
   - `getNodesUsage` で各ノードの現在の GPU 使用状況を取得 (:763)。
   - `calcScore` で fit 判定 + スコア (:772)。fit の本体は各ベンダの `Fit`。NVIDIA は `pkg/device/nvidia/device.go:749`。
   - スコア降順ソートし最良ノードを選ぶ (:787-788)、`AssignedNodeAnnotations` と割当デバイスを annotation にまとめ (:794-800、各ベンダ `PatchAnnotations`)、`PatchPodAnnotations` で Pod に書く (:807)。返すのは選ばれた 1 ノード名 (:818)。

3. **Fit の中身 (どの物理 GPU を切るか)**: `NvidiaGPUDevices.Fit` (`pkg/device/nvidia/device.go:749`) がノード上の各 `DeviceUsage` を末尾から走査し、health (:761)、型一致 `checkType` (:766)、NUMA (:772)、UUID 指定 (:781)、time-slicing 枚数 `Count<=Used` (:788)、`Coresreq>100` 補正 (:793)、メモリ算出 (memreq / percentage, :798-804)、quota (:805)、空きメモリ `Totalmem-Usedmem<memreq` (:810)、空きコア (:815)、排他要求 `cores==100` 競合 (:821) を順にチェックして通る GPU を選ぶ。落ちた理由は `reason` map に集計される。

4. **Bind (extender bind)**: `/bind` (`route.go:98` → `scheduler.Bind` `pkg/scheduler/scheduler.go:670`) が `DeviceBindPhase=allocating` と bind 時刻 annotation を付け (:704-716)、`kubeClient...Pods().Bind()` で実バインド (:722)。

5. **Allocate (device plugin, ノード側)**: kubelet が当該ノードの HAMi device-plugin の `Allocate()` を呼ぶ (`pkg/device-plugin/nvidiadevice/nvinternal/plugin/server.go:593`)。`getPendingPod` で対象 Pod を特定 (:597)、annotation から割当済みデバイス要求を取り出し (`GetNextDeviceRequest`, :630)、非 MIG 経路で:
   - `CUDA_DEVICE_MEMORY_LIMIT_<i>` を `<usedmem>m` で env 注入 (:661-662)。
   - `CUDA_DEVICE_SM_LIMIT` = `Usedcores` (:664)。
   - `CUDA_DEVICE_MEMORY_SHARED_CACHE` にキャッシュファイルパス (:665)。
   - host の `libvgpu.so` をコンテナ内 `.../vgpu/libvgpu.so` に、`ld.so.preload` を `/etc/ld.so.preload` にマウント (:682-711)。これで HAMi-core がコンテナ内の全プロセスに `LD_PRELOAD` される。
   - `eraseNextDeviceTypeFromAnnotation` で消費済みを消し (:653)、`PodAllocationTrySuccess` (:730)。

6. **実行時隔離 (HAMi-core, コンテナ内)**: preload された `libvgpu.so` が CUDA/NVML を hijack し、注入された `CUDA_DEVICE_MEMORY_LIMIT` を超えるメモリ確保を拒否、`CUDA_DEVICE_SM_LIMIT` に応じて kernel launch を絞る。つまり「割当の決定」はスケジューラ、「割当の物理解決とマウント」は device-plugin、「実際のメモリ/コア強制」は HAMi-core、と 3 層に分かれる (README.md:57-66 と Allocate 実装で確認)。

設計判断のポイント:

- kube-scheduler を置き換えず extender として拡張 (webhook で schedulerName を張り替える)。既存スケジューラ資産を壊さない。
- スケジューリングポリシー: node と GPU で独立に binpack / spread を選べる (`pkg/util/types.go:64-73`)。GPU 側は `topology-aware` も (:72)。デフォルトは node=binpack, gpu=spread (`cmd/scheduler/main.go:70-71`)。
- ベンダ差は `Devices` インタフェース (`pkg/device/devices.go:36-50`) で吸収。NVIDIA 以外 (Ascend/Cambricon/Hygon/Metax/...) も同じ 6 セクションのメソッド群を実装。

## 内部実装の素材

主要ディレクトリ:

- `cmd/scheduler` — extender + webhook + metrics の HTTP サーバ (main.go:143-189 でルート登録)。
- `cmd/device-plugin/nvidia` — NVIDIA device-plugin エントリ。
- `cmd/vGPUmonitor` — 使用量モニタ。
- `pkg/scheduler` — Filter/Bind/Score/webhook のロジック本体。
- `pkg/device` — ベンダ非依存の型 + 各ベンダ実装 (`nvidia`, `ascend`, `cambricon`, `hygon`, `iluvatar`, `metax`, `mthreads`, `enflame`, `kunlun`, `awsneuron`, `biren`, `vastai`, `amd`)。
- `pkg/device-plugin/nvidiadevice/nvinternal` — device-plugin の実装 (plugin/, rm/, cdi/, mig/, imex/)。
- `libvgpu` (submodule) — HAMi-core、C/CUDA の in-container 隔離ライブラリ (S6)。`docker/Dockerfile.hamicore` が `./libvgpu` を `build.sh` でビルドし `libvgpu.so` を成果物にする。

中核データ構造 (`pkg/device/devices.go`):

- `Devices` インタフェース (:36-50): 全ベンダ共通の契約。`MutateAdmission` / `Fit` / `PatchAnnotations` / `ScoreNode` / `GetNodeDevices` / `GenerateResourceRequests` など。新ベンダ対応はこの実装を足すだけ。
- `DeviceUsage` (:80-97): スケジューラが握る「今の 1 枚の GPU の状態」。`Count/Used` (time-slicing の枚数), `Totalmem/Usedmem`, `Totalcore/Usedcores`, `Numa`, `Type`, `Health`, `MigUsage` など。Fit の判定はこの構造体のフィールド比較。
- `ContainerDeviceRequest` (:143-149): 1 コンテナの要求。`Nums` (枚数), `Memreq` (MB), `MemPercentagereq`, `Coresreq` (%)。`MemPercentagereq==101` が「パーセント指定なし」の番兵値 (Fit :801 で使用)。
- `ContainerDevice` (:133-141) / `PodDevices` (:157): 割当結果。annotation にエンコードされて webhook→scheduler→device-plugin 間で受け渡される (`OneContainerMultiDeviceSplitSymbol` などの区切り文字, :159-)。

深追いした 1 パス: **Fit の GPU 選択ループ** (`pkg/device/nvidia/device.go:749-830`)。デバイス配列を末尾から (`i := len(devices)-1; i>=0; i--`, :758) 走査するのが特徴。spread/binpack のソート結果と組み合わせて「末尾優先」で埋める設計。`memreq` は絶対値 (`Memreq`) 優先、無ければ `Totalmem * MemPercentagereq / 100` で百分率から算出 (:798-804)。`Coresreq==100 && dev.Used>0` を排他要求とみなして共有中の GPU を弾く (:821) 一方、`Usedcores==Totalcore && Coresreq==0` の「コア無指定を満杯 GPU に載せない」判定 (:827) もあり、共有と排他の境界条件が細かい。落選理由は `common.*` 定数 (CardInsufficientMemory 等) で集計され、上位でイベント化される。

驚き/非自明:

- 実行時のメモリ/コア強制はコントロールプレーンではなく、コンテナ内 `LD_PRELOAD` の C ライブラリ (HAMi-core) 頼み。device-plugin の `Allocate` は env とマウントを注ぐだけ (server.go:661-711)。カーネル/ドライバ改変なしで「見かけの vGPU」を作る方式。
- `CUDA_DISABLE_CONTROL=true` の env があると `ld.so.preload` マウントをスキップ = 隔離を意図的に無効化できる (server.go:694-711)。
- request body に 1MB 上限 (`route.go:33`)、`io.LimitReader` で extender の DoS 面を絞っている (:50, :103)。

## 採用事例の素材

出典付きのみ。リポに ADOPTERS.md は無い (find で 0 件)。CNCF ケーススタディが一次に近い。

- **SF Technology** (順豊科技、SF Express のテック部門) — CNCF case study (S7)。
- **KE Holdings Inc.** (貝殻找房) — CNCF case study (S8)。
- **NIO** (蔚来) — CNCF case study (S9)。
- HAMi でフィルタした CNCF ケーススタディ一覧が更新カタログ (S10) (`docs/general-technical-review.md:29-33` が参照元をまとめている)。

GitHub signals (2026-07-09, `gh repo view` (S1)): star 3,720 / fork 611 / contributor 129。Docker Hub `projecthami/hami` の pulls バッジあり (README badge)。OpenSSF Best Practices #9416 バッジ (README)。

弱点: 形式的なユーザサーベイは限定的 (docs/general-technical-review.md:29 自認)。名前が出せる本番採用は上記 CNCF ケーススタディが中心。

## 代替・エコシステム

統合先 (いずれも一次ドキュメントあり):

- **Volcano**: Volcano 管理下の NVIDIA 共有を Volcano vGPU device-plugin (HAMi-core ベースの隔離) で実現 (S11)。バッチ AI と組み合わせる王道。
- **Koordinator**: HAMi と組んだ end-to-end GPU 共有 (S12)。
- **KAI Scheduler**: 共有隔離の設計は発展途上 (docs/general-technical-review.md:47 の PR 参照)。

主な代替 (本質的な差):

- **NVIDIA GPU Operator の time-slicing**: kubelet に GPU を N 分割の複製リソースとして見せるだけ。メモリ/コアの隔離が無く、プロセスが互いのメモリを踏める。HAMi は HAMi-core で per-Pod のメモリ上限と SM 制限を実効化する点が違う。
- **NVIDIA MIG**: ハード分割で強い隔離だが、対応 GPU (A100/H100 系) 限定、粒度が固定プロファイル。HAMi は任意 MB 単位のソフト分割 + MIG も扱える (pkg に mig あり)。
- **NVIDIA MPS**: SM 共有はできるがメモリ隔離が弱く、耐障害境界が緩い。HAMi は device-plugin 経由で MPS も選択肢に持つ (plugin/mps.go)。
- **run:ai / 商用 GPU オーケストレータ**: 同種の分割共有 + スケジューリングを提供する商用。HAMi は CNCF の OSS でベンダ横断 (NVIDIA/Ascend/Cambricon/Hygon/Metax/Mthreads/Iluvatar...) が売り。
- HAMi のポジション: 「kube-scheduler を置換せず extender + webhook + device-plugin + preload ライブラリで、アプリ無改変・任意粒度・マルチベンダの GPU 共有」。ハード隔離 (MIG) とドライバ改変なしのソフト隔離の中間を、複数ベンダで統一的に埋める層。
