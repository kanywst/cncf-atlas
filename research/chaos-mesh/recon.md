# recon: Chaos Mesh

調査メモ。自分用の密度。出典は URL を添える。`path:line` は research/chaos-mesh/src 配下の clone を指す。

## 基本情報

- repo: `chaos-mesh/chaos-mesh` (<https://github.com/chaos-mesh/chaos-mesh>)
- pinned commit: `8c13a9fb8d69a4299af99de9ddc9370c61ebf247` (2026-06-22, `main`)
- 近いタグ: 直近リリースは `v2.8.3` (2026-06-10)。pin した commit は `v2.8.3` の後ろ、`main` 上の開発版。shallow clone なので `git describe` はタグに到達できない (`No tags can describe`)。
- 言語: Go (`go 1.25.11`、`go.mod:3`)。daemon の一部は Linux 専用 (`*_linux.go` / `*_darwin.go` のビルドタグ分割)。UI は TypeScript + pnpm (`ui/`)。
- ビルド: `make all` / `make image` / コンポーネント単体は `make local/chaos-daemon` 等 (`CLAUDE.md` の Development Commands)。
- ライセンス: Apache-2.0。`LICENSE` 1-3 行目が `Apache License Version 2.0`。各 `.go` の冒頭にも Apache ヘッダ。GitHub API の `license.spdx_id` も `Apache-2.0`。
- CNCF 成熟度: Incubating (2022-02-16 に Sandbox から昇格)。
- カテゴリ: Chaos Engineering

## エントリポイント (cmd/)

`cmd/` に 7 つのバイナリ。中核 3 つ:

- `chaos-controller-manager`: オペレータ本体。Chaos CRD を reconcile する。`func main` は `cmd/chaos-controller-manager/main.go:60`。DI に Uber `fx` を使い、`fx.New(...)` で `controllers.Module` / `selector.Module` / `types.ChaosObjects` を組んで `fx.Invoke(Run)` (同 `main.go:77-92`)。
- `chaos-daemon`: 各ノードに DaemonSet (privileged) で常駐。対象 Pod の namespace に入って network / fs / kernel / プロセスを実際にいじる gRPC サーバ。`cmd/chaos-daemon/main.go`。
- `chaos-dashboard`: Web UI + API。`cmd/chaos-dashboard/main.go`。

補助: `chaos-builder` (CRD ボイラープレート生成)、`chaos-daemon-helper`、`watchmaker` (TimeChaos 用、Linux/Darwin 別実装)、`generate-makefile`。

## 歴史の素材

- 起源: PingCAP が分散 DB TiDB の耐障害性検証のために作った社内 chaos engineering プラットフォームが出自。従来の決定論的テストが分散 / K8s 時代に追いつかないという CTO Ed Huang の問題意識。出典: <https://www.pingcap.com/press-release/announcing-chaos-mesh-as-a-cncf-sandbox-project/>。
- OSS 化: 2019-12-31 に公開。7 か月で ~2,000 stars / 44 contributors。出典: 同 PingCAP プレスリリース。
- CNCF Sandbox 提案: 2020-02-21 (cncf/tag-app-delivery issue #23 <https://github.com/cncf/tag-app-delivery/issues/23>)。
- CNCF 受理: 2020-07-14 に Sandbox。PingCAP 発で TiKV に次ぐ 2 つ目の CNCF プロジェクト。出典: <https://www.cncf.io/blog/2022/02/16/chaos-mesh-moves-to-the-cncf-incubator/>。
- 2.0 GA: 2021-09。Workflow / Schedule などを追加し「chaos engineering ecology」へ。出典: <https://www.cncf.io/blog/2021/09/01/chaos-mesh-2-0-ga-to-a-chaos-engineering-ecology/>。
- Incubating 昇格: 2022-02-16、CNCF TOC 投票で承認。Sandbox 以降 v1.0 / v2.0 と 30 のマイナーリリース。出典: 同 CNCF Incubator blog。
- 直近リリース v2.8.3 は 2026-06-10 (GitHub Releases API)。

## アーキテクチャの素材

3 コンポーネント構成 (`src/CLAUDE.md` の Project Overview):

1. controller-manager が Chaos CRD を watch して reconcile。
2. daemon が privileged DaemonSet で実害注入。
3. dashboard が設計 / 監視 UI。

Chaos は CRD で表現。`api/v1alpha1/` に種別ごとの types: `podchaos` / `networkchaos` / `iochaos` / `stresschaos` / `timechaos` / `kernelchaos` / `httpchaos` / `dnschaos` / `jvmchaos` / `blockchaos` / クラウド系 (`awschaos` / `azurechaos` / `gcpchaos`) / `physical_machine_chaos`。`config/crd/bases/` に 23 個の CRD YAML。さらに「子 CRD」`PodNetworkChaos` / `PodIOChaos` / `PodHttpChaos` がノード単位の実体を表す (親 CRD が選択結果を子に書き、daemon が子を見て動く)。

### Reconcile はパイプライン合成

`controllers/chaosimpl/` の各種別が共通の `ChaosImpl` インターフェース (`Apply` / `Recover`) を実装し、共通の reconcile パイプラインから駆動される。パイプライン段の順序は `controllers/common/step.go:26-33`:

```text
finalizers.InitStep -> desiredphase.Step -> condition.Step -> records.Step -> finalizers.CleanStep
```

`Pipeline.Reconcile` は各段を順に呼び、`Requeue` / `RequeueAfter` を集約する (`controllers/common/pipeline/pipeline.go:69-106`)。`desiredphase` 段が実験終了まで常に `RequeueAfter` を返すので、即時 requeue させない設計コメントあり (同 `pipeline.go:85-92`)。

設計原則 (`controllers/README.md` 由来、`src/CLAUDE.md` に要約): 1 フィールド 1 コントローラ / コントローラは独立動作 / ロジックは ~100 語で説明可能 / リトライは `ctrl.Result{Requeue: true}, nil` で exponential backoff に任せる。

## 内部実装の素材 (代表 1 本を端から端まで)

題材: StressChaos の CPU/メモリ負荷注入。CRD 作成 -> records reconciler -> impl.Apply -> daemon gRPC -> stress-ng 起動、まで追える。

### 1. records 段がターゲットを選んで Apply/Recover を決める

`controllers/common/records/controller.go:64`。`records == nil` なら selector で対象 Pod/コンテナを引いて `Record` 列を作る (`records/controller.go:84-115`)。各 record について `desiredPhase` と現 `Phase` から `Apply` / `Recover` / `Nothing` を決める状態機械 (`records/controller.go:128-149`)。コメントが状態遷移を明記:

```text
Not Injected -> Not Injected/* -> Injected -> Injected/* -> Not Injected
```

`Apply` なら `r.Impl.Apply(...)` を呼び、戻りの `Phase` で `InjectedCount++` と Event 記録、失敗時は `needRetry = true` (`records/controller.go:151-186`)。最後に `RetryOnConflict` で status を更新 (`records/controller.go:231-261`)。

### 2. StressChaos impl がコンテナを解決して daemon へ gRPC

`controllers/chaosimpl/stresschaos/impl.go:43`。`decoder.DecodeContainerRecord` で対象コンテナの ID と daemon への `PbClient` を得る (同 `impl.go:44-52`)。`Stressors.Normalize()` で cpu/memory の stress-ng 引数文字列を組み (`impl.go:67-75`)、`pb.ExecStressRequest{Scope: CONTAINER, Target: containerId, EnterNS: true, ...}` を作って `pbClient.ExecStressors(ctx, &req)` (`impl.go:77-87`)。戻りの PID / 起動時刻を `Status.Instances` に記録 (`impl.go:90-101`)。

### 3. daemon が対象コンテナの namespace + cgroup で stress-ng を起動

gRPC service 定義は `pkg/chaosdaemon/pb/chaosdaemon.proto:7-34` (`rpc ExecStressors` は同 `:20`)。サーバ実装 `pkg/chaosdaemon/stress_server_linux.go:33` が `ExecCPUStressors` / `ExecMemoryStressors` を呼ぶ。

CPU 側 `stress_server_linux.go:112`:

- `crClient.GetPidFromContainerID` で対象コンテナの PID を取得 (`:118`)。
- `cgroups.GetAttacherForPID` でそのコンテナの cgroup attacher を得る (`:123`)。
- `bpm.DefaultProcessBuilder("stress-ng", ...).EnablePause()`、`EnterNS` なら `SetNS(pid, bpm.PidNS)` で対象 PID namespace に入れる (`:128-132`)。
- プロセスを起動 (`:135`) してから cgroup に attach (`:141`)。

### 非自明な設計判断

stress-ng は最初から走らせない。`EnablePause()` で「pause」ラッパとして起動 -> 対象コンテナの cgroup に attach -> その後 `SIGCONT` を送って実体を resume する (`stress_server_linux.go:128-167`)。cgroup に入れてから動かすことで、負荷プロセスが対象コンテナの resource limit の内側で消費するのを保証する。順序を逆にすると一瞬ホスト側で無制限に負荷がかかりうる。`comm` を読んで `pause` が消えるまでループで `SIGCONT` を送り続ける泥臭い実装 (`:148-167`、TODO コメント付き)。

DI も非自明: controller-manager は Uber `fx` でモジュール合成し、種別ごとの `ChaosImpl` を登録する (`cmd/chaos-controller-manager/main.go:77-92`、`controllers/common/fx.go:128-144`)。`PickChildCRDPredicate` で親 CRD の reconcile を子 CRD (`PodNetworkChaos` 等) の変化からトリガーする (`controllers/common/fx.go:154-169`)。

## 中核データ構造 (3-5)

- `ChaosImpl` interface: 全種別が実装する 2 メソッド `Apply` / `Recover(ctx, index, records, obj) (Phase, error)`。`controllers/chaosimpl/types/types.go:25-29`。これが種別の差を吸収する継ぎ目。
- `Record`: ターゲット 1 個の注入状態。`Id` / `SelectorKey` / `Phase` / `InjectedCount` / `RecoveredCount` / `Events`。`api/v1alpha1/common_types.go:78-88`。
- `Phase` (`Not Injected` / `Injected`) と `DesiredPhase` (`Run` / `Stop`)。reconciler の状態機械の軸。`api/v1alpha1/common_types.go:61-97`。
- `ExperimentStatus` / `ChaosStatus`: `DesiredPhase` + `Records` + `Conditions` (`Selected` / `AllInjected` / `AllRecovered` / `Paused`)。`api/v1alpha1/common_types.go:36-76`。
- `InnerObject` / `InnerObjectWithSelector` / `InnerObjectWithCustomStatus`: 全 Chaos CRD が満たす共通インターフェース群。duration / paused / oneshot 判定と webhook validation を含む。`api/v1alpha1/common_types.go:146-182`。
- `ExecStressRequest` (proto): daemon への負荷注入リクエスト。`Scope` / `Target` (containerId) / `CpuStressors` / `MemoryStressors` / `EnterNS` / `OomScoreAdj`。`pkg/chaosdaemon/pb/chaosdaemon.proto`。

## 採用事例の素材

repo の `ADOPTERS.md` (40+ adopters と明記) から、出典付きで名前を出せるもの:

- ByteDance: 自社 chaos プラットフォームの下回り fault injection エンジンとして Chaos Mesh を統合。
- Tencent (Interactive Entertainment): TKE 移行後、fault isolation / service degradation 検証に使用。ブログ <https://chaos-mesh.org/blog/Securing-Online-Gaming-Combine-Chaos-Engineering-with-DevOps-Practices/>。
- NetEase Fuxi Lab: 社内ハイブリッドクラウドの安定性向上。
- DataStax: AstraDB (Cassandra ベース DBaaS) テストの Fallout に組み込み。動画 <https://youtu.be/Kw7gMurHJnQ>。
- Authzed: TimeChaos で vDSO 時刻を偽装し SpiceDB を検証。動画 <https://youtu.be/3rjWxgdtBTw>。
- Percona: Percona Kubernetes Operators のテスト。<https://www.percona.com/blog/2020/11/05/chaosmesh-to-create-chaos-in-kubernetes/>。
- RabbitMQ: NetworkChaos でネットワーク遅延耐性を検証。
- GreptimeDB / PingCAP (TiPocket) / KingNet / DigitalChina / Xpeng / Maycur / Prudential / Qiniu なども ADOPTERS に記載。
- Vendors: Microsoft (Azure Chaos Studio が Chaos Mesh fault を統合、AKS Pod kill) <https://docs.microsoft.com/en-us/azure/chaos-studio/chaos-studio-tutorial-aks>、KubeSphere App Store、Civo Kubernetes marketplace。

CNCF の紹介でも adopters として ByteDance / NetEase / PingCAP / Tencent / Microsoft Azure を列挙 (<https://www.cncf.io/projects/chaosmesh/>)。

注: ADOPTERS リストは自己申告。捏造はしていないが「production で使用」かまでは各社の記載粒度に依存。

## 採用シグナル (数値 + 日付)

2026-06-24 時点、GitHub API (`repos/chaos-mesh/chaos-mesh`):

- stars: 7,763
- forks: 1,007
- open issues: 549
- contributors: ~221 (anon 込み、`contributors?per_page=1&anon=true` の last page)
- MAINTAINERS.md 記載のメンテナ系エントリ: 21 行規模
- created: 2019-09-04、最終 push: 2026-06-23

外部比較記事 (arXiv 2505.13654) では Chaos Mesh 74 リリース、LitmusChaos 106 リリースで、両者が K8s ネイティブ chaos の二強として長期採用を維持と記載。

## 代替・エコシステム

- LitmusChaos (CNCF、2022 Incubating、現 Harness Chaos Engineering の基盤): 最大の対抗。ChaosHub による 50+ プリビルド実験と多クラウド (AWS/GCP/Azure/VMware) カバレッジが強み。`ChaosEngine` + `ChaosExperiment` の二段 CRD でやや冗長。出典: <https://reintech.io/blog/litmuschaos-vs-chaos-mesh-kubernetes-chaos-tool-comparison-2026>。
- 本質的な差 (Chaos Mesh 側):
  - 種別ごと 1 CRD で `kubectl apply` するだけ。GitOps と相性が良い。
  - 低レベル fault が独自: TimeChaos (clock skew)、JVMChaos、KernelChaos、IOChaos。分散合意 / 分散ロック / TTL キャッシュ系の検証に効く。
  - トレードオフ: privileged DaemonSet 前提で「クラスタに侵襲的」。運用負荷は高め。出典: <https://blog.container-solutions.com/comparing-chaos-engineering-tools>。
- その他: Chaos Toolkit (汎用 / 宣言的)、Gremlin (商用 SaaS)、Steadybit (商用)、AWS FIS (AWS マネージド)、Netflix Chaos Monkey / Simian Army (platform-agnostic の元祖)。
- エコシステム統合: Azure Chaos Studio (Chaos Mesh fault を AKS で実行)、KubeSphere App Store、Civo marketplace、Prometheus メトリクス、Workflow (Argo 風の実験オーケストレーション)、Schedule (cron) を内蔵。
