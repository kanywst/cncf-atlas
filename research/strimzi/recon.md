# recon: Strimzi

調査メモ。Strimzi = Apache Kafka を Kubernetes 上で Operator パターンで運用するためのプロジェクト。自分用の密度で残す。出典は URL 付き。`file:line` は clone した `src/` (pinned commit) 基準。

## 基本情報

- repo: `strimzi/strimzi-kafka-operator`
- pinned commit: `9505103de40c9756faa4d8cf97ca7c2791c46424` (2026-06-23) / 近いタグ: HEAD は最新安定版 `1.0.1` (2026-06-17) より後、`1.1.0-rc1` (2026-06-22) 相当の main。shallow clone のため `git describe` は不可。
- 言語 / ビルド: Java 21 (`pom.xml:44` `<maven.compiler.release>21`) / マルチモジュール Maven (`make all` = compile + test + docker build。`AGENTS.md` 参照)
- ライセンス: Apache License 2.0 (`LICENSE` 冒頭で確認、全ソース冒頭ヘッダ `License: Apache License 2.0` と一致、GitHub API `license.spdx_id=Apache-2.0`)
- CNCF 成熟度: Incubating (2024-02-08 に Sandbox から昇格。下記参照)
- カテゴリ (指定): Messaging & Streaming
- 主要依存: Apache Kafka `4.3.0` (`pom.xml:87`)、Fabric8 Kubernetes Client `7.7.0` (`pom.xml:75`)、Vert.x (非同期実行モデル)
- main エントリポイント: `cluster-operator/src/main/java/io/strimzi/operator/cluster/Main.java:62` (`public static void main`)

### tagline 案

- EN: Run and operate Apache Kafka on Kubernetes through declarative custom resources and operators.
- JA: Apache Kafka を宣言的なカスタムリソースと Operator で Kubernetes 上に構築・運用する。

## 歴史の素材

- 2017: Red Hat 社内で「Kafka のようなステートフルワークロードを K8s でどう動かすか」を検討開始。当初は 3 人の開発者。([Red Hat Developer](https://developers.redhat.com/articles/2024/06/26/open-innovation-red-hats-impact-kafka-and-strimzi-ecosystem))
- 2018-01: `0.1.0` リリース。実体は Docker イメージ + K8s YAML の集まり。2018-03 の `0.2.0` で初めて Operator パターンらしい形に。([Strimzi blog: incubation](https://strimzi.io/blog/2024/02/08/strimzi-incubation/))
- 2019-08-28: CNCF に donate、Sandbox として受理。([CNCF projects: Strimzi](https://www.cncf.io/projects/strimzi/))
- 2024-02-08: CNCF Incubating へ昇格。当時 1600+ contributors / 180+ 組織 / 15 public adopters と発表。([CNCF blog](https://www.cncf.io/blog/2024/02/08/strimzi-joins-the-cncf-incubator/))
- KRaft 移行: 最新コードは ZooKeeper を完全に廃止し KRaft only。`cluster-operator/.../operator/assembly/` 配下を `grep -ril zookeeper` してもヒットなし。Kafka 4.x (ここでは 4.3.0) は KRaft only のため。KRaft 関連は `KRaftMetadataManager.java` / `KRaftVersionChangeCreator.java` が担当。
- Kafka CRD は `v1` API に到達 (`api/.../kafka/Kafka.java:80` `@Version(Constants.V1)`)。以前の `v1beta2` から昇格済みで、これが 1.0.0 系メジャーリリースに対応。

## アーキテクチャの素材

トップレベルは Maven マルチモジュール (`AGENTS.md` のモジュール表が一次情報)。重要なものだけ:

- `api/`: CRD / API モデル。`Kafka`, `KafkaNodePool`, `KafkaTopic`, `KafkaUser`, `KafkaConnect`, `KafkaMirrorMaker2`, `KafkaBridge`, `KafkaRebalance`, `StrimziPodSet` などの Java POJO。CRD はここから生成 (`crd-generator/`)。
- `cluster-operator/`: 中核。Kafka クラスタ本体と周辺コンポーネントを reconcile するメイン Operator。
- `topic-operator/`: `KafkaTopic` CR を Kafka 上のトピックに反映 (独立した `Main.java`)。
- `user-operator/`: `KafkaUser` CR を Kafka のユーザ / ACL / TLS 証明書に反映。
- `operator-common/`: 共有ユーティリティ。`Reconciliation.java`、Fabric8 ベースの resource operator 群。
- `kafka-init/`, `kafka-agent/`, `tracing-agent/`: Kafka コンテナ内で動く補助 (rack 設定取得、broker メトリクス/設定、OTel トレース)。
- `certificate-manager/`: 自前の CA / TLS 証明書管理。
- `mockkube/`, `test/`, `systemtest/`: テスト基盤 (mock K8s、E2E)。

### 起動フロー (`Main.java`)

1. `main` (`cluster-operator/.../Main.java:62`): `ClusterOperatorConfig.buildFromMap(System.getenv())` で env から設定構築 (`:66`)。
2. Vert.x を Micrometer/Prometheus メトリクス有効で生成 (`:77-82`)。`/healthy` `/ready` `/metrics` を出す HTTP サーバを 8080 で起動 (`startHealthServer`, `:275`)。
3. `leaderElection` (`:230`): K8s Lease ベースのリーダー選出。リーダーでなくなると `System.exit(1)` してコンテナ再起動 (`:247`)。HA は active/passive。
4. `deployClusterOperatorVerticles` (`:151`): namespace ごとに 1 つの `ClusterOperator` verticle をデプロイ (`:188-199`)。クラスタ全体監視なら 1 verticle。各 assembly operator (`KafkaAssemblyOperator` など) を生成 (`:180-184`)。`certManager = new OpenSslCertManager()` と 12 文字パスワード生成器もここで注入 (`:172-178`)。

### reconcile の共通骨格 (`AbstractOperator.java`)

- `reconcile(Reconciliation)` (`cluster-operator/.../assembly/AbstractOperator.java:181`): メトリクスカウンタ increment → `withLock(...)` で同一 CR の同時 reconcile を排他 (`:188`) → CR が存在すれば `reconcileResource`、無ければ `reconcileDeletion` (`:190`)。
- `reconcileResource` (`:211`): label selector 不一致なら skip (`:215`)、`strimzi.io/pause-reconciliation` アノテーションがあれば paused 扱いで status だけ更新 (`:226`)、spec が null なら NotReady (`:243`)、それ以外は具象クラスの `createOrUpdate` (`:157` 抽象メソッド) を呼ぶ。
- 設計: Operator は「watch でイベント駆動」かつ「定期 resync」の両輪。reconcile は冪等な desired-vs-actual の diff & apply。

## 内部実装の素材

### 代表オペレーションを 1 本通す: `Kafka` CR の reconcile

入口は `KafkaAssemblyOperator.createOrUpdate` (`cluster-operator/.../assembly/KafkaAssemblyOperator.java:156`)。`ReconciliationState` (mutable な reconcile 中状態; `:261`) を作り、`reconcile(reconcileState)` (`:231`) が以下を Vert.x Future の `.compose(...)` チェーンで直列実行する (`:234-249`):

```text
initialStatus
  -> reconcileCas (clusterCa / clientsCa の生成・更新)
  -> emitCertificateSecretMetrics
  -> versionChange (Kafka / metadata バージョン変更の判定)
  -> reconcileKafka          <- Kafka 本体 (broker/controller pod 群)
  -> reconcileCruiseControl
  -> reconcileEntityOperator (topic-operator + user-operator のデプロイ)
  -> reconcileKafkaExporter
  -> reconcileKafkaAutoRebalancing
```

`reconcileKafka` の実体は `KafkaReconciler.reconcile(KafkaStatus, Clock)` (`cluster-operator/.../assembly/KafkaReconciler.java:250`)。これも長い Future チェーンで、desired state を順に収束させる (`:252-283`)。要点だけ抜くと:

```text
networkPolicy -> manualRollingUpdate -> pvcs -> serviceAccount
  -> RBAC (clusterRoleBinding / role / roleBinding)
  -> scaleDown -> listeners (外部公開のリスナ構成)
  -> certificateSecrets -> brokerConfigurationConfigMaps (broker ごとの設定)
  -> jmxSecret -> podDisruptionBudget
  -> podSet                  <- ここで pod 群を作る (核心)
  -> rollingUpdate(podSetDiffs)  <- 必要な broker だけ rolling restart
  -> podsReady -> serviceEndpointsReady -> headlessServiceEndpointsReady
  -> clusterId -> defaultKafkaQuotas -> nodeUnregistration -> metadataVersion
  -> deletePersistentClaims -> ... -> updateKafkaStatus
```

`podSet()` (`KafkaReconciler.java:904`):

```java
protected Future<Map<String, ReconcileResult<StrimziPodSet>>> podSet() {
    return strimziPodSetOperator
            .batchReconcile(
                    reconciliation,
                    reconciliation.namespace(),
                    kafka.generatePodSets(imagePullPolicy, imagePullSecrets, this::podSetPodAnnotations),
                    kafka.getSelectorLabels()
            )
            .compose(podSetDiff -> waitForNewNodes().map(podSetDiff));
}
```

`kafka.generatePodSets(...)` が desired な `StrimziPodSet` (中に pod テンプレートのリスト) を作り、`batchReconcile` が現状との diff を取って apply。その diff (`podSetDiffs`) を `rollingUpdate(podSetDiffs)` (`:937`) に渡し、`ReconcilerUtils.reasonsToRestartPod(...)` (`:940`) で「設定変更 / 証明書変更 / FS リサイズ」など restart 理由を pod 単位で判定して、必要な broker だけを 1 台ずつ rolling restart する。これにより無停止でのローリング更新を実現。

### 非自明な設計判断: StatefulSet ではなく自前の StrimziPodSet

Strimzi は K8s 標準の StatefulSet を使わず、独自 CRD `StrimziPodSet` + 自前コントローラ `StrimziPodSetController` (`cluster-operator/.../assembly/StrimziPodSetController.java:60`, `implements Runnable`) で pod を直接管理する。理由は StatefulSet の制約 (ローリング更新順序の制御、個別 pod の操作、broker ごとに異なる設定/ストレージを当てる、KRaft の controller/broker 混在ロールなど) を Operator 側で完全に握るため。`StrimziPodSetSpec` は `selector` と `List<Map<String, Object>> pods` (生の pod 定義リスト) を持つだけのシンプルな構造 (`api/.../podset/StrimziPodSetSpec.java:31-32`)。コントローラは informer + `ArrayBlockingQueue` の自前 work queue で動く (`StrimziPodSetController.java:53,64`)。

### 中核データ構造 (3-5)

1. `Kafka` (`api/src/main/java/io/strimzi/api/kafka/model/kafka/Kafka.java:82`): Fabric8 `CustomResource<KafkaSpec, KafkaStatus>` を継承するトップレベル CR。`@Version(Constants.V1)` `@Group(...)` (`:80-81`)。`RESOURCE_KIND = "Kafka"` (`:87`)。
2. `KafkaSpec` (`api/.../kafka/KafkaSpec.java:35-41`): `kafka` (KafkaClusterSpec), `entityOperator`, `clusterCa` / `clientsCa` (CertificateAuthority), `kafkaExporter`, `cruiseControl`, `maintenanceTimeWindows` を保持。Kafka 全体の desired state。
3. `StrimziPodSet` / `StrimziPodSetSpec` (`api/.../podset/StrimziPodSetSpec.java:31-32`): `selector` + `pods: List<Map<String,Object>>`。pod 群を StatefulSet 抜きで宣言する内部 CRD。
4. `NodeRef` (`cluster-operator/.../model/NodeRef.java:16`): `record NodeRef(String podName, int nodeId, String poolName, boolean controller, boolean broker)`。KRaft で 1 ノードが controller / broker いずれか or 両方になりうるのを表現する不変レコード。reconcile 全体で node を指す共通キー。
5. `Reconciliation` (`operator-common/.../common/Reconciliation.java`): 1 回の reconcile を識別するコンテキスト (namespace / name / kind / 連番)。ログ・メトリクス・ロックのキーに使う。

### KafkaNodePool

`KafkaNodePool` CR (`api/.../nodepool/KafkaNodePool.java`) で broker / controller のグループ (レプリカ数、ストレージ、ロール) を分離定義できる。reconcile 中で node pool 群を集めて `KafkaCluster` モデルを構築 → pod 群へ展開する流れ (`KafkaAssemblyOperator.java:468-545` の `kafkaReconciler()` 周辺)。

## 採用事例の素材

出典は repo 内 `ADOPTERS.md` (一次情報、本人申告) と CNCF/Red Hat 発表。捏造なし。

- CNCF 昇格時点 (2024-02): 1600+ contributors / 180+ 組織 / 15 public adopters。([CNCF blog](https://www.cncf.io/blog/2024/02/08/strimzi-joins-the-cncf-incubator/))
- `ADOPTERS.md` 記載の Users (抜粋、各社の use case 注記あり):
  - Reddit: Strimzi で 500 broker の Kafka fleet を運用、MirrorMaker でのデータレプリケーション、Kafka Connect での CDC。
  - Decathlon: Kafka Connect + Strimzi on K8s でのデータ連携 (Medium 記事リンクあり)。
  - AppsFlyer: 高スループットなクラスタを多数運用、毎秒数千万メッセージ、ローカル ephemeral storage 利用。
  - CERN, Vera C. Rubin Observatory (天文台の Observatory Control System / テレメトリ基盤), SBB CFF FFS, Swisscom, Atruvia, DPG Media, Skillsoft, Banco Mercantil ほか。
  - Vendors: Axual, Ænix (Cozystack で Kafka as a Service) ほか。
- GitHub stats (2026-06-24, GitHub API): stars 5,843 / forks 1,507 / open issues 145 / created 2016-05-06。

## 代替・エコシステム

- 同種 (Kafka on K8s Operator): Confluent for Kubernetes (CFK, プロプライエタリ)、Banzai Cloud Koperator (旧 banzaicloud/kafka-operator)、Aiven / Redpanda などのマネージド or 別実装。Strimzi の差: 完全 OSS (Apache-2.0)、CNCF 中立ガバナンス、ベンダ非依存、Kafka 本体は upstream をそのまま使う。
- メッセージング隣接 (CNCF): NATS、Pulsar (非 CNCF だが競合) など。Strimzi はあくまで「Apache Kafka を K8s で運用する Operator」であって新しいブローカ実装ではない点が本質的な差。
- 統合先: Cruise Control (リバランス、`KafkaRebalance` CR)、Kafka Connect / MirrorMaker2 (CR で管理)、Kafka Bridge (HTTP-Kafka)、Kafka Exporter + Prometheus/Grafana、OpenTelemetry tracing-agent、cert-manager 連携 (TLS)、OAuth/OIDC 認証。
- ガバナンス: 独立した [governance リポジトリ](https://github.com/strimzi/governance/blob/main/GOVERNANCE.md) で定義 (`GOVERNANCE.md` がそこを指す)。

## install / 最小構成

最小手順 (公式 [Quickstart](https://strimzi.io/quickstarts/) 準拠、minikube/kind 等):

```bash
kubectl create namespace kafka
# Cluster Operator をインストール (install/ 配下の YAML を namespace 指定で適用)
kubectl create -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
# 単一ノードの Kafka クラスタ例 (KRaft, persistent) をデプロイ
kubectl apply -f examples/kafka/  -n kafka   # repo 同梱の examples
# 準備完了を待つ
kubectl wait kafka/my-cluster --for=condition=Ready --timeout=300s -n kafka
```

- repo 内 `install/cluster-operator/` に RBAC + Deployment + CRD の YAML、`examples/kafka/` に Kafka CR サンプル、`helm-charts/` に Helm chart。Operator が CR を watch して上記 reconcile チェーンを回す。
