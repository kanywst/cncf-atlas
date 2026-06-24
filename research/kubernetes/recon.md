# recon: kubernetes

調査メモ。コンテナオーケストレーションの本丸。CNCF 最初の卒業プロジェクト。出典は URL + `path:line` で残す。

## 基本情報

- repo: `kubernetes/kubernetes` (module path `k8s.io/kubernetes`, `go.mod:7`)
- pinned commit: `8c64324b69ac1e444979f2fddf07a63baa759e5a` (master, commit date 2026-06-22T10:23:44Z)
- 近いタグ: master HEAD は v1.37 開発サイクル中。直近の alpha タグは `v1.37.0-alpha.1`、直近の安定リリースは `v1.36.2` (2026-06-12 公開)。depth-1 clone なのでローカルに tag は無く、`git ls-remote --tags` で確認した。
- 言語: Go (`.go-version` = `1.26.4`)
- ビルド: GNU Make。`make all` で全バイナリ、`make all WHAT=cmd/kube-scheduler` で個別 (`Makefile:84-86`, `Makefile:93`)。`make quick-release` でコンテナイメージ。
- ライセンス: Apache-2.0。`LICENSE` 冒頭が "Apache License Version 2.0"、`gh api` の `license.spdx_id` も `Apache-2.0` で一致。
- CNCF 成熟度: Graduated。
- カテゴリ (bucket): Orchestration & Scheduling。

## 歴史の素材

- Google の社内クラスタ管理 Borg / Omega が前身。Kubernetes は Google における第 3 世代のコンテナ管理基盤で、15 年以上の本番運用知見を取り込んだもの。`README.md:14` でも Borg 由来を明記。出典: [Google Cloud blog: Kubernetes origin story](https://cloud.google.com/blog/products/containers-kubernetes/from-google-to-the-world-the-kubernetes-origin-story), [IBM: History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history)。
- 2013 年に Craig McLuckie / Joe Beda / Brendan Burns が社内提案、Brian Grant / Tim Hockin らが合流。社内コードネームは "Project 7" (Star Trek の Seven of Nine 由来、ロゴの 7 本スポークの根拠)。名称はギリシャ語 kubernḗtēs (操舵手)。出典: [Wikipedia: Kubernetes](https://en.wikipedia.org/wiki/Kubernetes)。
- 2014-06-06 OSS として公開 (GitHub repo の `created_at` = `2014-06-06T22:56:04Z` と一致)。1.0 は 2015-07-21 (OSCON) リリース、同時に Google と Linux Foundation が CNCF 設立を発表し Kubernetes を寄贈。出典: [IBM: History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history)。
- CNCF: 2016-03-10 に Incubating で受理、2018-03-06 に Graduated へ昇格 (CNCF 初の卒業)。出典: [CNCF projects: Kubernetes](https://www.cncf.io/projects/kubernetes/)。

## アーキテクチャの素材

トップレベルのディレクトリ構成 (`/bin/ls cmd`, `pkg` で確認):

- `cmd/`: コントロールプレーン / ノードの実行バイナリ。`kube-apiserver`, `kube-controller-manager`, `kube-scheduler`, `kube-proxy`, `kubelet`, `kubeadm`, `kubectl` など。各 `main` は薄く Cobra コマンドへ委譲 (例: `cmd/kube-scheduler/scheduler.go:29` の `func main()` が `app.NewSchedulerCommand()` を呼ぶだけ)。
- `pkg/`: 各コンポーネントの実装本体 (`scheduler`, `kubelet`, `proxy`, `controller`, `controlplane`, `kubeapiserver`, `registry` など)。
- `staging/src/k8s.io/*`: 外部に `k8s.io/api`, `k8s.io/client-go`, `k8s.io/apimachinery` などとして公開されるライブラリ群。monorepo 内で開発し published repo へ同期する設計。
- `api/`, `plugin/`, `cluster/`, `test/`, `vendor/`: API 定義 / 認証プラグイン / クラスタ起動スクリプト / テスト / ベンダリング依存。

設計の骨子は「API サーバを中心に etcd を真実の源とし、各コントローラ / スケジューラ / kubelet が宣言的な望ましい状態へ収束させる reconcile ループ」。今回はスケジューラの 1 サイクルを代表操作として end-to-end で追った。

## 内部実装の素材

スケジューリング 1 サイクルの追跡。Pod を 1 個ノードへ割り当てる流れ。すべて `pkg/scheduler/schedule_one.go`。

1. `ScheduleOne` (`schedule_one.go:67`): キューから次のエンティティを `NextEntity` で取得し、Pod なら `scheduleOnePod` へ分岐 (`:86`)。PodGroup (gang scheduling) は別経路。
2. `scheduleOnePod` (`schedule_one.go:93`): Pod に対応する scheduling profile (Framework) を解決 (`frameworkForPod`, `:103`)。`framework.NewCycleState()` で 1 サイクル分の scratch 状態を生成 (`:121`)。
3. `schedulingCycle` (`schedule_one.go:169`): まず `sched.Cache.UpdateSnapshot(...)` でノード情報スナップショットを更新 (`:177`)。続いて `schedulingAlgorithm` (`:181`) が `sched.SchedulePod` (=`schedulePod`) を呼ぶ (`:264`)。
4. `schedulePod` (`schedule_one.go:564`): フィルタ → スコアリング → 選択。
   - `findNodesThatFitPod` (`:573`, 実体 `:622`): `RunPreFilterPlugins` (`:633`) の後にフィルタプラグインで feasible node を絞る。0 件なら `FitError` (`:580`)。
   - feasible が 1 件ならそのまま採用 (`:588-598`)。
   - 複数なら `prioritizeNodes` でスコア付け (`:600`)、`newSortedNodeScores(...).Pop()` で最高スコアノードを選ぶ (`:605-606`)。`ScheduleResult.SuggestedHost` を返す。
5. `prepareForBindingCycle` (`schedule_one.go:196`): `assumeAndReserve` で Pod を割り当て済みとしてキャッシュへ楽観的に書き込み (`:204`)、Reserve / Permit プラグインを実行 (`:211`)。
6. 楽観的 assume 済みなので binding は別 goroutine へ: `go sched.runBindingCycle(...)` (`schedule_one.go:141`)。これで次の Pod のスケジューリングは API への Bind 完了を待たずに進む。
7. `bindingCycle` (`schedule_one.go:391`): Permit 待ち (`WaitOnPermit`, `:425`)、PreBind を経て `bind` (`:1142`)。`bind` は extender bind が無ければ `RunBindPlugins` (`:1152`)。
8. 既定の bind 実装 `DefaultBinder.Bind` (`pkg/scheduler/framework/plugins/defaultbinder/default_binder.go:52`): `v1.Binding{Target: {Kind:"Node", Name: nodeName}}` を作り (`:54-57`)、`util.BindPod(ctx, clientSet, binding)` で API サーバの Pod binding サブリソースへ POST (`:71`)。これが Pod を実際にノードへ束縛する唯一の API 書き込み。

### 中核データ構造

1. `Scheduler` (`pkg/scheduler/scheduler.go:68`): `Cache` (ノード/Pod 内部キャッシュ), `SchedulingQueue`, 差し替え可能な `SchedulePod func(...)` (`:87`), `Profiles` (profile.Map), `nodeInfoSnapshot`, `percentageOfNodesToScore` を保持。スケジューラの中枢。
2. `QueuedPodInfo` (`pkg/scheduler/framework/types.go:719`): `*PodInfo` + `QueueingParams` + `PodSignature` を埋め込む。スケジューリングキュー上の Pod を表す単位。`Gated()` で gating プラグイン待ちか判定 (`:747`)。
3. `CycleState` (`pkg/scheduler/framework/cycle_state.go:28`): 1 スケジューリングサイクル限定の plugin 間共有スクラッチ。プラグインが任意の key/value を読み書きする (`state.Write(...)`)。
4. `Framework` interface (`pkg/scheduler/framework/interface.go:200`): PreFilter / Filter / Score / Reserve / Permit / PreBind / Bind などの拡張点を定義。スケジューラの挙動はすべてこの plugin 列で構成される。
5. `ScheduleResult` (`schedule_one.go` で多用): `SuggestedHost`, `EvaluatedNodes`, `FeasibleNodes`。アルゴリズムの出力。

### 非自明な設計判断

大規模クラスタでスケジューラは全ノードを評価しない。`numFeasibleNodesToFind` (`schedule_one.go:858`) が評価対象ノード数を適応的に絞る。`percentageOfNodesToScore` 未指定 (0) 時は `percentage = 50 - numAllNodes/125` を使い、下限 5% でクランプ (`:871-876`)。さらに評価ノード数の下限は `minFeasibleNodesToFind = 100` (`:57`, `:879-881`)。

意図: ノードが増えるほど 1 サイクルあたりの探索割合を意図的に下げ、十分な数の feasible node が見つかった時点で打ち切る。最適配置を諦める代わりにスケジューリングのレイテンシを抑えるトレードオフ。加えて assume してから非同期 bind する流れ (`schedule_one.go:134-141`) も、API 往復をクリティカルパスから外すスループット最適化で、これも非自明。

## 採用事例の素材

repo に `ADOPTERS` ファイルは無い (`ls ADOPTERS*` で該当なし)。公開ケーススタディから引用:

- Spotify: Helios (自前オーケストレータ) から Kubernetes へ移行。bin-packing と multi-tenancy で CPU 利用率が平均 2-3 倍改善、最大級のサービスは 1 秒あたり 1000 万超のリクエストを処理。出典: [Kubernetes case study: Spotify](https://kubernetes.io/case-studies/spotify/)。
- adidas: 6 ヶ月で EC サイト 100% を Kubernetes 化、ロード時間半減、リリース頻度を 4-6 週に 1 回から 1 日 3-4 回へ。4,000 pods / 200 nodes / 月 80,000 ビルドで最重要システムの 40% を稼働。出典: [Kubernetes case study: adidas](https://kubernetes.io/case-studies/adidas/)。

採用規模の数値 (2026-06-22 取得): GitHub stars 123,184 / forks 43,267 (`gh api repos/kubernetes/kubernetes`)。CNCF 系資料は contributor 数を 8,012 と引用 (2016 以降 +996%、出典: [IBM: History of Kubernetes](https://www.ibm.com/think/topics/kubernetes-history))。

## 代替・エコシステム

- 直接の代替/隣接: Docker Swarm, HashiCorp Nomad, Apache Mesos/Marathon。本質的な差は宣言的 API + コントローラ reconcile モデル、CRD によるプラガブルな拡張性、巨大なエコシステム。
- ディストリ/マネージド: GKE, EKS, AKS, OpenShift, Rancher, k3s。
- 連携先: container runtime は CRI 経由 (containerd, CRI-O)、ネットワークは CNI (Cilium, Calico)、ストレージは CSI、スケジューラ拡張は scheduler framework plugin / extender。監視は Prometheus、パッケージングは Helm。adidas も cloud native platform に Kubernetes + Prometheus を採用 (上記ケーススタディ)。
- エントリポイント整理: 制御系 `cmd/kube-apiserver/apiserver.go:32`, `cmd/kube-scheduler/scheduler.go:29`、ノード側 `cmd/kubelet/kubelet.go:35`。
