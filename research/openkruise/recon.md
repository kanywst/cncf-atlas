# recon: OpenKruise

調査メモ。OpenKruise (リポジトリは `openkruise/kruise`) を実コードで確認した一次情報。出典 URL と `file:line` を残す。

## 基本情報

- repo: `openkruise/kruise`
- pinned commit: `439d98db56ac49050f8973c51fccbabfba283a95` (master, コミットメッセージ `changelog 1.9.0`, author date 2026-06-21) / 近いタグ: `v1.9.0` (`b1e001a957ce62bf87894d0212f5e704a8e9c2b4`, 2026-06-21 リリース)。HEAD はタグ直後の master。
- 言語 / ビルド: Go (`go 1.23.0`, `go.mod:1-3`) / `make build` (`Makefile:79` = `generate fmt vet manifests` 後に manager バイナリをビルド)。コンテナは `Dockerfile`。
- ライセンス: Apache License 2.0。`LICENSE.md` 冒頭で確認 (`LICENSE.md:1-4`)。GitHub API は `NOASSERTION` を返すがこれはファイル名が `LICENSE.md` で SPDX 自動判定が外れるため。ソースヘッダも `Copyright 2020 The Kruise Authors. / Apache License, Version 2.0` (`main.go:2-8`)。
- CNCF 成熟度: Incubating (2023-03-02 昇格)。Sandbox 受理は 2020-11-10。
- カテゴリ (tools.ts): Orchestration & Scheduling

## 何をするものか (一行)

Kubernetes 標準ワークロードを CRD で拡張し、Pod を再作成せずにコンテナイメージだけ差し替える in-place update、sidecar 注入/独立アップグレード、大規模リリース制御を足すコンポーネント群。

## 歴史の素材

- Alibaba Cloud が 2019 年 6 月にオープンソース化。内部の大規模運用 (Double 11) で培ったワークロード自動化を上流互換の形でコミュニティに還元したもの。OpenKruise on GitHub が upstream 本体で、社内 downstream は公開インターフェース上の結合機能のみ (社内専用コードは 5% 未満) とされる。出典: Alibaba Cloud blog "OpenKruise: The Cloud-Native Platform ... Double 11"。
- 名前 "Kruise" は "cruise" のもじり。"K" = Kubernetes、Kubernetes 上の自動航行 (auto-cruise) を示す。出典: 同上 / CNCF プロジェクトページ。
- CNCF 受理: Sandbox 2020-11-10 → Incubating 2023-03-02 (TOC 投票)。当時 Incubating は 36 プロジェクト目で、同列に Backstage/Cilium/Istio/Knative/OpenTelemetry 等。出典: CNCF blog "OpenKruise becomes a CNCF incubating project" (2023-03-02)。
- v1.0 到達は 2021-12。出典: CNCF blog "OpenKruise v1.0"。直近 v1.9.0 は 2026-06-21 リリース (`git tag` / GitHub releases)。

## アーキテクチャの素材

実体は 2 つのデプロイ単位に分かれる。

1. kruise-manager: コントローラ群 + admission webhook を 1 バイナリに同居させた中央コンポーネント。`main.go` がエントリポイント。起動順は webhook を先にセットアップ/初期化してから (`main.go:236-245`) controller を登録する (`main.go:267` `controller.SetupWithManager(mgr)`)。webhook readiness を待ってからコントローラを動かす設計 (`main.go:260-262`)。leader election id は `kruise-manager` (`main.go:129-130`)。
2. kruise-daemon: 各ノードに DaemonSet で常駐する per-node エージェント。エントリは `cmd/daemon/main.go` (`NewDaemon` `cmd/daemon/main.go:85`)。担当は CRI 経由のイメージ事前 pull、ランタイムコンテナ meta 報告、コンテナ再作成、Pod probe。サブパッケージで構成が見える: `pkg/daemon/{criruntime,kuberuntime,imagepuller,containermeta,containerrecreate,podprobe}`。

コントローラ一覧 (`pkg/controller/` 直下) は CRD と 1:1 対応する: `cloneset`, `statefulset` (Advanced StatefulSet), `daemonset` (Advanced DaemonSet), `sidecarset`, `uniteddeployment`, `broadcastjob`, `advancedcronjob`, `ephemeraljob`, `imagepulljob` / `imagelistpulljob`, `nodeimage`, `nodepodprobe`, `podprobemarker`, `containerrecreaterequest`, `containerlaunchpriority`, `persistentpodstate`, `podunavailablebudget`, `podreadiness`, `resourcedistribution`, `sidecarterminator`, `workloadspread`。

API は `apis/apps/{v1alpha1,v1beta1,pub,defaults}` と共有型 `apis/apps/pub` + `apis/policy`。GroupVersion は `apps.kruise.io` と `policy.kruise.io` (RBAC マーカー `cloneset_controller.go:192` 参照)。CloneSet は v1alpha1 から v1beta1 への conversion を持つ (`apis/apps/v1beta1/cloneset_conversion.go`)。

webhook は in-place update を成立させる要。mutating webhook が Kruise 管理 Pod に PodReadinessGate を注入する (`pkg/webhook/pod/mutating/pod_readiness.go:30-37`、`util.InjectReadinessGateToPod(pod, appspub.KruisePodReadyConditionType)`)。これにより in-place 更新中に Pod を NotReady に落として traffic を抜ける。

## 内部実装の素材: CloneSet の更新を端から端まで追う

代表オペレーション = CloneSet の rolling in-place update。controller-runtime の Reconcile から CRI へイメージ反映が伝わるまで。

1. `Reconcile` は `reconcileFunc` (= `doReconcile`) に委譲する (`pkg/controller/cloneset/cloneset_controller.go:198-200`)。
2. `doReconcile` が CloneSet を取得し (`cloneset_controller.go:219-230`)、scale expectation を満たすか確認してから (`:246-277`) Pod/PVC を列挙して claim する (`:280-303`)。ControllerRevision を列挙・ソートし current/update revision を決める (`:306-316`)。resourceVersion expectation で informer cache の鮮度を待つ (`:318-338`)。
3. revision が変わっていれば ImagePullJob を作ってイメージを事前 pull する (`:368-373` `createImagePullJobsForInPlaceUpdate`)。これが kruise-daemon の imagepuller を駆動する。
4. `syncCloneSet` (`:403`) が `ApplyRevision` で current/update の Pod テンプレートを復元し (`:413-420`)、まず `syncControl.Scale` (`:426`)、scale が無ければ `syncControl.Update` (`:441`) を呼ぶ。
5. `realControl.Update` (`pkg/controller/cloneset/sync/cloneset_update.go:47`) が更新対象 Pod ごとに `updatePod` (`:152`, 定義 `:254`) を呼ぶ。`PodUpdatePolicy` が `InPlaceIfPossible` か `InPlaceOnly` で (`cloneset_update.go:259-260`)、かつ `inplaceControl.CanUpdateInPlace` が true なら (`:268`) `inplaceControl.Update` (`:306`) に入る。in-place 不可かつ `InPlaceOnly` の時はエラー (`:319-320`)。
6. 共通 in-place 実装 `pkg/util/inplaceupdate/inplace_update.go` の `realControl.Update` (`:313`):
   - `CalculateSpec` で更新差分 (`UpdateSpec`) を算出する (`:317`)。差分が image だけに収まらなければ nil となり in-place 不可。
   - `CheckPodNeedsBeUnready` が true なら `InPlaceUpdateReady` condition を `ConditionFalse` にして readiness gate を落とす。conflict retry 付き (`:326-347`)。
   - `updatePodInPlace` (`:350`, 定義 `:362`) で実 patch を行う。
7. `updatePodInPlace` (`:362-424`): conflict retry の中で最新 Pod を取り直し、revision hash を書き (`:371`)、`InPlaceUpdateState` annotation (`apps.kruise.io/inplace-update-state`) を JSON で焼き込む (`:379-387`)。grace=0 なら `PatchSpecToPod` で Pod spec の image (と必要なら resource) を差し替え (`:392`)、`UpdatePod` で apiserver に書く (`:417`)。resource 変更は `/resize` subresource への strategic merge patch (`:402`, 対応 RBAC は `cloneset_controller.go:188`)。grace>0 なら spec を `inplace-update-grace` annotation に保存して猶予期間後に適用する (`:411-413`)。
8. kubelet は Pod spec の image 変更だけならコンテナを再起動するが Pod は再作成しない。kruise-daemon の containermeta がランタイム上の実イメージを報告し、`Refresh` (`inplace_update.go:121`) が `CheckContainersUpdateCompleted` で完了判定する (`:140`)。完了したら readiness gate を戻す。launch priority が違う複数コンテナは `NextContainerImages` 等で次バッチに回し、`PreCheckBeforeNext` 通過後に `updateNextBatch` で順次更新する (`:146-160`)。

## 中核データ構造 (3-5)

- `CloneSetSpec` / `CloneSetStatus` (`apis/apps/v1beta1/cloneset_types.go:41`, `:202`) と `CloneSetUpdateStrategy` (`:177`): Deployment 相当 + `volumeClaimTemplates`、`UpdateStrategy.PodUpdatePolicy` (Recreate / InPlaceIfPossible / InPlaceOnly)、partition によるカナリア。
- `UpdateSpec` (`pkg/util/inplaceupdate/inplace_update.go:86`): in-place で差し替える `ContainerImages map[string]string`、`ContainerResources`、`ContainerRefMetadata`、`MetaDataPatch`、`GraceSeconds`、old/new template。`VerticalUpdateOnly()` (`:100`) で resource のみ更新かを判定する。
- `InPlaceUpdateState` (`apis/apps/pub/inplace_update.go:52`): Pod annotation に焼く更新状態。`Revision`、`LastContainerStatuses` (更新前 imageID 記録 = 完了判定の基準)、`NextContainerImages`/`NextContainerResources` (launch priority 順の次バッチ)、`ContainerBatchesRecord`。完了判定は `InPlaceUpdateContainerStatus.ImageID` (`:103-105`) を現状と突合する。
- `UpdateOptions` (`inplace_update.go:64`): ワークロードごとに差し替える関数群 (`CalculateSpec`, `PatchSpecToPod`, `CheckPodNeedsBeUnready`, `CheckContainersUpdateCompleted`)。これで CloneSet / Advanced StatefulSet / Advanced DaemonSet が同一 in-place エンジンを共有しつつ挙動を変える。
- `inplaceupdate.Interface` (`inplace_update.go:79`): `CanUpdateInPlace` / `Update` / `Refresh` の 3 メソッド。各ワークロードコントローラがこれを保持する。

## 非自明な設計判断

in-place update は「Kubernetes が Pod spec の `image` フィールド patch だけはコンテナ再作成なしで許す」という上流の制約を逆手に取った設計。差分が image (と v1.8 以降は resource/resize subresource) に閉じる時だけ in-place を選び、それ以外は通常の Recreate にフォールバックする。再作成しないので scheduler / CNI / CSI への副作用と PVC 再バインドを避けられ、大規模で速い。

成立条件として 2 つの仕掛けが要る。1 つ目、mutating webhook が Kruise 管理 Pod に独自 readiness gate (`apps.kruise.io/pod-ready`) を注入し (`pkg/webhook/pod/mutating/pod_readiness.go:37`)、更新中の Pod を能動的に NotReady にして traffic を抜く。2 つ目、kruise-daemon が各ノードで CRI からランタイムの実コンテナ meta を読んで報告し、コントローラが「新イメージが本当に走り出したか」を kubelet status に頼らず判定する。コントローラ単独では成立せず、webhook + per-node daemon の三者構成が in-place update の前提になっている点が非自明。

## 採用事例の素材 (出典付きのみ)

CNCF Incubating 昇格 blog (2023-03-02) が明示列挙: Alibaba Group, Baidu, Bringg, LinkedIn, Lyft, Shopee, Oppo, Spectro Cloud。Alibaba は Double 11 で OpenKruise ワークロードを 10 万近く稼働し数百万コンテナを管理 (Alibaba Cloud blog)。リポジトリ内に `ADOPTERS.md` は無い (ルート確認済み、採用一覧は CNCF/コミュニティ側)。捏造はしない。

## 採用シグナル (数値, 参照日 2026-06-24)

- GitHub stars 5,273 / forks 892 / open issues 93 (GitHub API `repos/openkruise/kruise`, 2026-06-24)。
- contributors: GitHub contributors API のページネーション末尾が page 161 (per_page=1, anon 込み) で約 160 名超。
- 作成 2019-05-30、最新 push 2026-06-21、最新リリース v1.9.0 (2026-06-21)。
- 言語は Go 単一。

## 代替・エコシステム

- 上流 Kubernetes Deployment / StatefulSet / DaemonSet: CloneSet / Advanced StatefulSet / Advanced DaemonSet が上位互換。差は in-place update、partition カナリア、per-Pod PVC、削除コスト制御、並列更新。
- Argo Rollouts / Flagger: プログレッシブデリバリ (canary/blue-green、メトリクス解析) が主眼。OpenKruise は Pod 再作成回避とワークロード拡張そのものが主眼で、レイヤが違う。Argo Rollouts は CloneSet を対象ワークロードとして統合できる。
- KubeVela / OAM: OpenKruise を実行基盤ワークロードとして上に重ねる (同じ Alibaba 系エコシステム)。
- 関連プロジェクト: kruise-rollouts (プログレッシブデリバリ用の別リポ)、kruise-game (ゲームサーバ向け OpenKruiseGame)、kruise-helm (チャート)。
- 統合: sidecar 注入は Istio 等のサービスメッシュ sidecar 運用と競合/補完する。v1.7 以降は Kubernetes 1.28+ native sidecar (`initContainers[].restartPolicy=Always`) に対応。

## インストール / 最小構成

- 要件: Helm v3.5+、Kubernetes は新しめのバージョン推奨 (古い doc では CRD conversion 都合で 1.13+ が下限)。
- 手順:

  ```bash
  helm repo add openkruise https://openkruise.github.io/charts/
  helm repo update
  helm install kruise openkruise/kruise --version 1.9.0 \
    --namespace kruise-system --create-namespace
  ```

- 動作確認: `kruise-controller-manager` Deployment と `kruise-daemon` DaemonSet が `kruise-system` に立つ。最小例として CloneSet を 1 つ apply し、`spec.template` の image を変えて `updateStrategy.type: InPlaceIfPossible` にすると Pod が再作成されず image だけ差し替わるのを `kubectl get pod -w` で観察できる。
