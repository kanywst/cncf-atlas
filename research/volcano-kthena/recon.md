# recon: volcano-kthena (Kthena)

調査メモ。出典は URL 付き。コードは pinned commit を実読して `path:line` で残す。

## 基本情報

- repo: `volcano-sh/kthena`（<https://github.com/volcano-sh/kthena>）
- pinned commit: `affd5be8b40aca466c7e39fb8fe41ed6e6ce3b44`（2026-06-24, `main` HEAD）
- 近いタグ: `v0.4.0`（2026-04-21 リリース、tag sha `2916fb7`）。pin した commit は v0.4.0 より約2ヶ月後の `main` 先端で、この commit 自体にタグは無い。shallow clone のため `git describe` は空を返す。
- 言語 / ビルド: Go（`go.mod` で `go 1.26.0`）/ `make build`（`Makefile`）。クラスタ無しの一発起動は `./hack/local-up-kthena.sh`（`README.md:77`）
- ライセンス: Apache-2.0。`LICENSE` を実読して確認（`Apache License Version 2.0`）。`gh repo view` も `apache-2.0` を返す
- CNCF 成熟度: Kthena は単独プロジェクトではなく Volcano のサブプロジェクト。親の Volcano が CNCF Incubating（2020-04 Sandbox 受理、2022-03-21 Incubating 昇格）。Kthena は Volcano の傘下で Incubating 扱い
- カテゴリ（tools.ts の指定）: Orchestration & Scheduling
- 主な成果物（エントリポイント2つ）:
  - `cmd/kthena-router/main.go:40`（データプレーン、gin ベースの L7 ルータ）
  - `cmd/kthena-controller-manager/main.go:54`（コントロールプレーン、CRD reconcile + webhook サーバ）

## 歴史の素材

- 2026-01-28 に Volcano コミュニティが Kthena を正式発表。「AI 学習に閉じていた Volcano の能力を推論まで広げ、AI ライフサイクル全体を一気通貫で扱う」サブプロジェクトと位置づけ。Huawei Cloud（Volcano の起案元）が主導、Xiaobo Qi（Huawei Cloud ディレクタ）のコメントあり。出典: [CNCF blog 2026-01-28](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/)
- repo 作成は 2025-05-08（`gh repo view` の `createdAt`）。発表より前に開発が走っていた。
- リリース履歴（`gh release list`）:
  - v0.1.0: 2025-10-31
  - v0.2.0: 2025-12-10
  - v0.3.0: 2026-01-31（CNCF 発表とほぼ同時）
  - v0.4.0: 2026-04-21（pin 時点の最新）
- 親 Volcano の系譜: kube-batch（gang scheduling 対応）から発展し Volcano に改名。2019-06 KubeCon Shanghai で OSS 化、2020-04 CNCF 入り、2022 Incubating。出典: [Cloud Native Batch System Volcano moves to the CNCF Incubator](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/)
- 2026-03 時点で Volcano は「Volcano v1.14 / Kthena v0.3.0 / AgentCube」を束ねた AI-Native 統合スケジューリング基盤へ拡張中。出典: [Beyond Batch: Volcano Evolves](https://www.cncf.io/blog/2026/03/23/beyond-batch-volcano-evolves-into-the-ai-native-unified-scheduling-platform/)

## アーキテクチャの素材

コントロールプレーンとデータプレーンが分離していて、片方だけでもデプロイ可能（`README.md:55`）。

トップレベルのコンポーネント:

- **kthena-controller-manager**（コントロールプレーン）: CRD を reconcile して推論レプリカの deploy / scale / upgrade を回す。gang scheduling は Volcano に委譲する。有効化できる controller は `modelserving` / `modelbooster` / `autoscaler`（`cmd/kthena-controller-manager/main.go:81-82`）。webhook サーバは secure port 8443、証明書を自動生成して ValidatingWebhook / MutatingWebhook の CABundle を自分で更新する（`main.go:74`, `:178-182`）。
- **kthena-router**（データプレーン）: 推論トラフィックの入口。リクエストを model 名 / ヘッダ / URI で分類し、ロードバランスとトラフィック制御を当てて適切な推論インスタンスへ振る。prefill-decode 分離ルーティングをネイティブ対応。`README.md:64` 自身が「router は参照実装（reference implementation）であり、Gateway Inference Extension が PD 分離を未サポートなので暫定。標準 API gateway の後段にも置ける」と明言。

CRD 群（`pkg/apis`）:

- `networking/v1alpha1`: `ModelRoute`（マッチ規則 + レート制限）、`ModelServer`（バックエンド pod 群の宣言、PDGroup / KVConnector / TrafficPolicy）。router 側が参照する。
- `workload/v1alpha1`: `ModelServing`、`ServingGroup`、`ModelBooster`、`AutoscalingPolicy`、`AutoscalingPolicyBinding`。controller-manager 側が reconcile する。

リクエストの流れは下の「内部実装」で端から端まで追う。

設計判断（非自明、後述）: LWS（LeaderWorkerSet）/ dual-LWS パターンを採らず、単一 `ServingGroup` に Prefill/Decode の role を持たせ、gang scheduling は Volcano の PodGroup に委譲する。

## 内部実装の素材

### 代表オペA: 推論リクエストが router を端から端まで通る経路

入口は gin ハンドラ。

1. `Router.HandlerFunc()`（`pkg/kthena-router/router/router.go:210`）。`/v1/models` の GET は `ListModels` で即返し（`:216-220`）。それ以外は本処理へ。
2. `ParseModelRequest`（`router.go:491`）でボディを読み、`model` フィールドを取り出す。OpenAI 互換ボディの最小 struct（`pkg/kthena-router/handlers/request.go:29` の `OpenAIRequestBody`）。
3. プロンプト抽出 → tokenizer で入力トークン数を算出（失敗時は `len(promptStr)/4` のフォールバック、`router.go:269-273`）。メトリクスと access log に記録。
4. レート制限。`r.loadRateLimiter.RateLimit(modelName, promptStr)`（`router.go:285`）。input/output トークンとリクエスト数の3種を判定し、超過は HTTP 429。
5. fairness scheduling が無効なら `doLoadbalance`（`router.go:322`→`:335`）、有効なら `handleFairnessScheduling`（`router.go:327`→`:1037`、VTC 的な公平キュー）。
6. `doLoadbalance`（`router.go:335`）の本体:
   - `r.store.MatchModelServer(modelName, req, gatewayKey)` で ModelRoute を先にマッチ（`router.go:359`）。LoRA かどうかもここで判定。
   - `/v1/` パスかつマッチ成功なら `getPodsAndServer`（`router.go:369`→`:513`）で pod 群と `ModelServer` を取得。pod 0 件なら 404。
   - マッチ外なら `handleHTTPRoute`（`router.go:383`→`:528`）で Gateway API の HTTPRoute / InferencePool 経由を試す。両方ダメなら 404。
   - `framework.Context` を組む（`router.go:451-457`）: `Model` / `Prompt` / `ModelServerName` / `PDGroup` / `MetricsRecorder`。
   - `r.scheduler.Schedule(ctx, pods)`（`router.go:459`）で pod を採点・選抜。
   - 選抜結果（`ctx.BestPods[0]`）を access log に記録し（`router.go:475-481`）、`proxyModelEndpoint`（`router.go:484`→`:682`）で実際にプロキシ。
7. `proxyModelEndpoint`（`router.go:682`）: PD 非分離なら `proxy`（`:614`）でそのまま転送、PD 分離（KVConnector あり）なら `proxyToPDDisaggregated`（`:943`）へ。後者は prefill→decode を connector（NIXL / MoonCake / SGLang、`pkg/kthena-router/connectors/`）で KV 転送しつつ2段で叩く。
8. プロキシ完了後に `r.scheduler.RunPostHooks(ctx, i)`（`router.go:675`, `:1024`）で on-flight カウンタ等を後処理。

### 代表オペB: スケジューラの採点ロジック（オペA の心臓）

`SchedulerImpl.Schedule`（`pkg/kthena-router/scheduler/scheduler_impl.go:119`）。

```go
// scheduler_impl.go:119
func (s *SchedulerImpl) Schedule(ctx *framework.Context, pods []*datastore.PodInfo) error {
    if s.syncOnFlight {
        s.store.SyncOnFlightCounts() // least-request 有効時、Redis から横断的な in-flight 数を同期
    }
    pods, err := s.RunFilterPlugins(pods, ctx) // 不適格 pod を除外
    // ...
    if ctx.PDGroup != nil { // PD 分離: decode を採点→上位N、各 decode に対応する prefill を O(1) で引く
        decodePods, _ := s.store.GetDecodePods(ctx.ModelServerName)
        scores := s.RunScorePlugins(decodePods, ctx)
        topNDecodePods := TopNPodInfos(scores, topN)
        // ... s.store.GetPrefillPodsForDecodeGroup(ctx.ModelServerName, decodePodName) ...
    }
    scores := s.RunScorePlugins(pods, ctx) // PD 集約: 普通に採点
    ctx.BestPods = TopNPodInfos(scores, topN)
}
```

- デフォルトの score plugin は3つ、それぞれ weight 1（`scheduler_impl.go:68-72`）: `least-request` / `least-latency` / `prefix-cache`。filter は `least-request` のみ（`:73-75`）。デフォルト引数も同ファイル `:76-80` にハードコード（例 prefix-cache は `blockSizeToHash:64, maxBlocksToMatch:128, maxHashCacheSize:50000, topKMatches:5`）。
- 各 plugin の score は `[0,100]`（`pkg/kthena-router/scheduler/framework` の `ScorePlugin` コメント `:52`）。`RunScorePlugins`（`scheduler_impl.go:211`）で `score * weight` を pod ごとに合算。`TopNPodInfos`（`:255`）で降順ソートして上位 `topN=5`（`:36`）を返す。
- `prefix-cache` plugin: `PrefixCache.Score`（`pkg/kthena-router/scheduler/plugins/prefix_cache.go:162`）→ `hashPrompt`（`:208`）でプロンプトを `blockSizeToHash` 単位でブロックハッシュ化 → `ModelPrefixStore.FindTopMatches`（`pkg/kthena-router/scheduler/plugins/cache/prefix_store.go:141`）。prefix store は sharded（`modelHashes.getShard`, `prefix_store.go:63`）+ LRU（`cache/lru.go`）で、pod 削除イベント（`onPodDeleted`, `:97`）と hash eviction（`onHashEvicted`, `:235`）で掃除する。KV キャッシュ局所性をルータ側（エンジン外）で推定して同じ pod に寄せる狙い。
- 他 plugin: `least_latency.go`（TTFT/TPOT 加重、`TTFTTPOTWeightFactor`）、`least_request.go`（待ち + in-flight）、`kvcache_aware.go`、`lora_affinity.go`、`gpu.go`、`random.go`。

### 代表オペC: controller 側で ServingGroup を Volcano gang にする

`pkg/model-serving-controller/controller/model_serving_controller.go`。`PodGroupManager` インタフェース（`:72-80`）が `CreateOrUpdatePodGroup` / `DeletePodGroup` / `CleanupPodGroups` を持ち、実体は `podgroupmanager.NewManager(... volcanoClient ...)`（`:194`）。NetworkTopology が外れたら PodGroup を掃除する（`:282`）。つまり gang scheduling は自前実装せず Volcano の `scheduling.volcano.sh/v1beta1` PodGroup に委譲している。`ModelServingSpec.SchedulerName` のデフォルトは `volcano`（`pkg/apis/workload/v1alpha1/model_serving_types.go:47`）。

### 中核データ構造（3〜5）

1. `datastore.PodInfo`（`pkg/kthena-router/datastore/store.go:282`）: ルータが持つ各バックエンド pod の実行時ビュー。`GPUCacheUsage` / `RequestWaitingNum` / `RequestRunningNum` / `TTFT` / `TPOT`（`dto.Histogram`）/ `onFlightRequestNum atomic.Int64`（`:300`、Redis 連携でルータ横断の in-flight を反映）/ `models sets.Set[string]`（base + LoRA）。`mutex sync.RWMutex` で保護。scheduler の全 plugin はこの構造体を採点する。
2. `framework.Context`（`pkg/kthena-router/scheduler/framework`, `:29`）: 1リクエスト分のスケジューリング文脈。`Model` / `Prompt *common.ChatMessage` / `Hashes []uint64`（prefix block ハッシュ）/ `ModelServerName` / `PDGroup` / `DecodePods` / `PrefillPods` / `BestPods`。PD 分離か集約かで使うフィールドが分岐する。
3. `ServingGroup` + `Role` + `GangPolicy`（`pkg/apis/workload/v1alpha1/servinggroup_types.go:110`, `:55`, `:25`）: gang の最小単位。`Role` は `EntryTemplate`（entry pod、必ず1つ）+ `WorkerTemplate` + `WorkerReplicas`（`:69-79`）。`GangPolicy.MinRoleReplicas map[string]int32`（`:42`）で role ごとに gang の最小本数を指定（例 prefill:1, decode:1）。`NetworkTopology`（`:46`）は Volcano の `NetworkTopologySpec` をそのまま埋め込む。
4. `ModelServingSpec`（`pkg/apis/workload/v1alpha1/model_serving_types.go:36`）: `Replicas`（ServingGroup の本数）/ `SchedulerName`（default volcano）/ `Template ServingGroup` / `RolloutStrategy`（ServingGroupRollingUpdate or RoleRollingUpdate）/ `RecoveryPolicy`（ServingGroupRecreate / RoleRecreate / None）/ `Plugins []PluginSpec`（pod をカスタムする plugin chain、`:101`）。
5. `ModelBooster` / `ModelBackend`（`pkg/apis/workload/v1alpha1/model_booster_types.go:200`, `:51`）: 一番上位の「1 CR で1モデルを立てる」抽象。`Backend.Type`（vLLM / vLLMDisaggregated）、`ModelURI`（`hf://` `s3://` `pvc://` `ms://` のみ許可、`:59`）、`CacheURI`（`hostpath://` `pvc://`）、`MinReplicas` / `MaxReplicas`、`AutoscalingPolicy`、`ModelMatch`。router 用の `ModelServer`（`pkg/apis/networking/v1alpha1/modelserver_types.go:24`）は `WorkloadSelector`（中に `PDGroup`）/ `WorkloadPort` / `KVConnectorSpec` / `TrafficPolicy` / `Retry` を持つ。

### 非自明な設計判断

LWS（LeaderWorkerSet）や dual-LWS / StatefulSet / Pod の多層パターンを意図的に避け、単一 `ServingGroup`（中に Prefill/Decode の `Role`）+ Volcano gang scheduling で多ノード・PD 分離を表現する。理由は「Volcano の gang scheduling と統合するには別アーキが必要で、dual-LWS の層構造は彼らのユースケースで明確な利点なく複雑さだけ増えた」から。これが llm-d（dual-LWS + Gateway API Inference Extension）や AIBrix（StormService/RoleSet）との一番の差別点。出典: [pacoxu: How to choose the inference orchestration solution?](https://pacoxu.wordpress.com/2025/12/03/how-to-choose-the-inference-orchestration-solution-aibrix-or-kthena-or-dynamo/)

副次的に非自明な点: KV キャッシュ局所性・prefix キャッシュ一致をエンジン内ではなく router の L7 採点層で推定し（`prefix_cache.go` の sharded LRU prefix store）、PD 分離時は decode/prefill の対応付けを `datastore` に事前カテゴライズした O(1) lookup（`GetDecodePods` / `GetPrefillPodsForDecodeGroup`）で引く。さらに in-flight 数を Redis 経由でルータ横断同期する（`PodInfo.onFlightRequestNum`, `SyncOnFlightCounts`）。

## 採用事例の素材

- 引用できる named な Kthena 本番採用組織は、pin 時点では見つからない。プロジェクトは2026-01 公開の新顔で、ADOPTERS ファイルも未確認。捏造しない。
- 起案・主導は Huawei Cloud（Volcano の起案元として Kthena もローンチ）。出典: [CNCF blog 2026-01-28](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/)。これは「採用組織」ではなく「開発元」として記載。
- 注意: CNCF の Volcano Incubator 記事が挙げる Amazon / HP / Google / Oracle 等は Volcano のコントリビュータ/組織であり、Kthena の採用組織ではない。混同しない。
- 採用シグナル（`gh repo view`, 参照日 2026-06-25）: stars 381 / forks 138 / contributors 62 / 最新リリース v0.4.0（2026-04-21）。新興のわりにコントリビュータ数とリリース頻度は立ち上がっている。

## 代替・エコシステム

- 統合先（推論エンジン）: vLLM / SGLang / Triton(TGI) を「置き換えず上に乗る」オーケストレーション層として統合。`ModelBackend.Type` は vLLM / vLLMDisaggregated を持つ。KV 転送 connector は NIXL / MoonCake / SGLang（`pkg/kthena-router/connectors/`）。vLLM 公式に Kthena 連携ドキュメントあり: [docs.vllm.ai Kthena](https://docs.vllm.ai/en/stable/deployment/integrations/kthena/)、Ascend NPU 版も: [vllm-ascend Using Volcano Kthena](https://docs.vllm.ai/projects/ascend/en/main/user_guide/deployment_guide/using_volcano_kthena.html)。
- スケジューラ統合: Volcano scheduler（gang / network-topology-aware）。autoscaling は KEDA / Prometheus 連携の例あり（`examples/keda-autoscaling`, `examples/prometheus-autoscaler`）。Gateway API（HTTPRoute / InferencePool）にも対応。
- 実際の代替と本質的な差:
  - llm-d（Red Hat 主導）: Gateway API Inference Extension（GIE/IGW）にネイティブで密結合。EPP（Endpoint Picker）が llm-d リポに移管されたほど。PD 分離は dual-LWS。KServe と層で組み合わせる前提。Kthena との差は「GIE 標準準拠 vs Volcano gang 依存」。出典: [Introducing Gateway API Inference Extension (Kubernetes blog)](https://kubernetes.io/blog/2025/06/05/introducing-gateway-api-inference-extension/)、[pacoxu 比較](https://pacoxu.wordpress.com/2025/12/03/how-to-choose-the-inference-orchestration-solution-aibrix-or-kthena-or-dynamo/)。
  - AIBrix（vLLM プロジェクト発）: co-design 思想。高密度 LoRA、LLM 特化オートスケーラ、VTC fair queuing、StormService/RoleSet で PD 分離。超大規模・多テナント寄り。出典: [AIBrix paper (arXiv)](https://arxiv.org/html/2504.03648v1)。
  - KServe: モデルサービングのコントロールプレーン（ライフサイクル/ガバナンス）。LLM 特化スケジューラではなく llm-d と層で組む補完関係。`LLMInferenceService` を v0.16 で追加。出典: [KServe + llm-d blog](https://kserve.github.io/website/blog/cloud-native-ai-inference-kserve-llm-d)。
  - NVIDIA Dynamo: 同種の推論オーケストレーション候補として比較対象に挙がる。出典: 上記 pacoxu 比較。
- 全体トレンド: ロードバランスと KV キャッシュ管理を「エンジン内」から「クラスタオーケストレーション層」へ押し上げるのが本流で、Gateway API Inference Extension がその結節点。Kthena はそこに Volcano gang scheduling という別解で参入。

## インストール / 最小構成

- クラスタ無しの一発起動: `./hack/local-up-kthena.sh`（`README.md:77`）。`--help` でオプション。
- ビルド: `make build`（`generate fmt vet` 込み）。イメージは `make docker-build-all`（router / controller / downloader / runtime の4イメージ）。
- 最小動作: kthena-controller-manager を入れて `ModelBooster`（または `ModelServing`）を1つ apply → モデルが ServingGroup として立つ → kthena-router を前段に置いて OpenAI 互換 `/v1/chat/completions` を叩く。`ModelBackend.ModelURI` は `hf://` などで指定。クイックスタート: [docs/kthena/docs/getting-started/quick-start.md](https://github.com/volcano-sh/kthena/blob/main/docs/kthena/docs/getting-started/quick-start.md)。

## タグライン案

- EN: Kubernetes-native LLM inference orchestration that pairs Volcano gang scheduling with KV-cache-aware, prefill-decode routing.
- JA: Volcano の gang scheduling と KV キャッシュ対応の prefill-decode ルーティングを組み合わせた、Kubernetes ネイティブな LLM 推論オーケストレータ。
