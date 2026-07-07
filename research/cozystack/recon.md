# recon: Cozystack

調査メモ。出典は URL 付き、コードは `research/cozystack/src` の `file:line` を実際に開いて確認したもの。

## 基本情報

- repo: `cozystack/cozystack` (<https://github.com/cozystack/cozystack>)
- pinned commit: `f5c408d2fc2a7b4efea131848e4facf9d51a0423` (2026-06-27, `main` ブランチ)
- 近いタグ: `v1.5.1` (最新リリース, 2026-06-24)。pinned commit は v1.5.1 の数コミット先の `main` HEAD
- 言語 / ビルド: Go 1.26.4 (`go.mod:5`)。`make build` (Makefile:12)。コンテナ image は `ghcr.io/cozystack/cozystack/*` に publish
- ライセンス: Apache-2.0 (`LICENSE` 冒頭、GitHub API の `spdx_id` も `Apache-2.0` で一致)
- CNCF 成熟度: Sandbox (2025-02-28 TOC 投票で受理。<https://www.cncf.io/projects/cozystack/>)
- カテゴリ: App Definition & GitOps
- main エントリポイント (中核 API): `cmd/cozystack-api/main.go:27`

用語先出し定義:

- PaaS = Platform as a Service。アプリ実行基盤をサービスとして提供する形態。
- GitOps = 望ましい状態を Git/OCI に置き、コントローラが継続調整するデリバリ方式。ここでは Flux が担う。
- HelmRelease = Flux helm-controller の CRD (Custom Resource Definition, カスタムリソース定義)。Helm chart を 1 リリースとして宣言的に管理する。
- 集約 API サーバ (aggregated apiserver) = kube-apiserver が `APIService` 経由で特定 API group を委譲する別プロセスの apiserver。

## 歴史の素材

- 作者は Andrei Kvapil (@kvaps)、ロシア発のコンサル企業 Ænix が開発・スポンサー。README:18 が "originally built and sponsored by Ænix" と明記 (<https://github.com/cozystack/cozystack/blob/main/README.md>)。
- GitHub repo 作成日 2023-11-21 (GitHub API `created_at`)。Kvapil 自身が「自分のクラウドを作る長年の夢の結実」と表現 (Ænix blog: <https://blog.aenix.io/cozystack-becomes-a-cncf-sandbox-project-3702b8906971>)。
- CNCF Sandbox 受理: 2025-02-28 に TOC が全会一致で受理、2025-04-28 に CNCF が公式アナウンス (<https://www.cncf.io/blog/2025/04/28/open-source-paas-cozystack-becomes-a-cncf-sandbox-project/>)。CNCF 移管の動機として「Apache-2.0 のままであることの保証 (Mongo/Redis/Terraform/Vault のようなライセンス変更を避ける)」を挙げている (同 Ænix blog)。
- Sandbox 申請の議論は cncf/sandbox#87、#322、onboarding #351、TAG App Delivery レビュー #719 に残る (<https://github.com/cncf/sandbox/issues/322>)。
- マイルストーン: v0.8.0 で FluxCD Operator / E2E テスト / ARM 対応を追加 (Ænix blog)。バージョンは現在 v1.5 系まで進行 (リリースタグ実測)。OpenSSF Best Practices badge #10177 を取得 (README バッジ)。

## アーキテクチャの素材

Cozystack は「Kubernetes を土台にしてプライベートクラウド/PaaS を作るためのフレームワーク」。1 つのバイナリではなく、複数コントローラ + 大量の Helm chart カタログの集合体。

ベースの技術スタック (README:20 周辺、CNCF ページ): Talos Linux (immutable OS), Flux (GitOps デリバリ), KubeVirt (VM), Kamaji + Cluster API (マネージド k8s のコントロールプレーン), CloudNativePG (Postgres), LINSTOR/Piraeus + SeaweedFS (storage), Cilium + Kube-OVN (network), MetalLB (LB), Grafana/VictoriaMetrics (observability)。

Go バイナリ群 (`cmd/`、実測):

- `cozystack-api` — 集約 apiserver。ユーザ向けの `apps.cozystack.io` / `core.cozystack.io` API を提供 (中核。後述)。
- `cozystack-operator` — Package/Platform を調整し、システムコンポーネントの HelmRelease を生成する operator。
- `cozystack-controller` — プラットフォーム横断のコントローラ。
- 補助: `backup-controller`, `backupstrategy-controller`, `flux-shard-operator` (Flux の負荷を shard 分割), `flux-plunger`, `kubeovn-plunger`, `lineage-controller-webhook`, `check-readiness`, `cozypkg` (chart パッケージング CLI)。

Helm chart カタログ (`packages/`、実測):

- `packages/apps/` — ユーザが触る catalog。`kubernetes`, `postgres`, `mariadb`, `mongodb`, `redis`, `clickhouse`, `kafka`, `rabbitmq`, `nats`, `opensearch`, `qdrant`, `foundationdb`, `harbor`, `vm-instance`, `vm-disk`, `vpc`, `vpn`, `tenant`, `http-cache`, `tcp-balancer`, `bucket`, `openbao` など 22 種。
- `packages/system/` — CSI/CNI/operator など 130+ のシステムコンポーネント chart。`*-rd` 接尾辞は ApplicationDefinition (= リソース定義) を配る chart。
- `packages/core/` — `installer`, `platform`, `talos`, `flux-aio`。

中核の流れ (リクエスト/データフロー):

1. ユーザは `apps.cozystack.io/v1alpha1` の `Postgres` や `Kubernetes` 等のリソースを tenant namespace に作る (kubectl/REST)。
2. kube-apiserver が `apps.cozystack.io` group を `cozystack-api` (集約 apiserver) に委譲。
3. `cozystack-api` の REST storage が、そのリソースを Flux の `HelmRelease` に変換して実体として保存する。
4. Flux helm-controller が `HelmRelease` を調整し、対応する chart (`packages/apps/<kind>`) をデプロイ。
5. 読み取り時は逆変換 (`HelmRelease` → Application) で status を合成して返す。

つまり Cozystack の API は「Application という薄い宣言を HelmRelease に射影する翻訳層」。

## 内部実装の素材

### 代表操作: `Postgres` (Application) を 1 件 Create する end-to-end

エントリ `cmd/cozystack-api/main.go:27` の `main()` は options を作って起動するだけ:

```go
func main() {
    ctx := genericapiserver.SetupSignalContext()
    options := server.NewCozyServerOptions(os.Stdout, os.Stderr)
    cmd := server.NewCommandStartCozyServer(ctx, options)
    code := cli.Run(cmd)
    os.Exit(code)
}
```

起動時、`cozystack-api` はクラスタ内の ApplicationDefinition CRD を読んで `ResourceConfig` を組み立てる。`pkg/cmd/server/start.go:249` で CRD を回し、各 CRD から `pkg/cmd/server/start.go:310` で `config.Resource` を作る (kind / plural / OpenAPISchema / chartRef / prefix を埋める)。

その config を使い、`pkg/apiserver/apiserver.go:229` のループが kind ごとに REST storage を動的登録する:

```go
appsV1alpha1Storage := map[string]rest.Storage{}
for _, resConfig := range c.ResourceConfig.Resources {
    storage := applicationstorage.NewREST(cli, watchCli, &resConfig)
    appsV1alpha1Storage[resConfig.Application.Plural] = cozyregistry.RESTInPeace(storage)
}
```

`NewREST` は `pkg/registry/apps/application/rest.go:130`。`config.Application.OpenAPISchema` (文字列) を `buildSpecSchema` (`rest.go:106`) で structural schema に変換して defaulting に使う。Go の型は kind ごとに分けず、全 kind が同じ `application.REST` (`rest.go:89`) を共有する。

Create は `pkg/registry/apps/application/rest.go:166`。流れ:

1. 名前バリデーション (`rest.go:174` 形式, `rest.go:179` 長さ, Tenant なら `rest.go:189` namespace 長)。
2. `_` 始まりの予約キー禁止チェック `validateNoInternalKeys` (`rest.go:195`)。
3. admission チェーン `createValidation` を明示呼び出し (`rest.go:210`)。genericregistry.Store と違い集約サーバの自前 REST では手動で呼ぶ必要がある旨がコメントにある。
4. 変換 `r.ConvertApplicationToHelmRelease(app)` (`rest.go:216`)。
5. system ラベル + ユーザラベル (prefix 付与) をマージ、`apps.cozystack.io/application.{kind,group,name}` ラベルを付与 (`rest.go:230`-`232`)。
6. `r.c.Create(ctx, helmRelease, ...)` で HelmRelease を実体として作成 (`rest.go:238`)。
7. 作った HelmRelease を `ConvertHelmReleaseToApplication` で Application に逆変換して返す (`rest.go:245`)。

変換の核は `convertApplicationToHelmRelease` (`pkg/registry/apps/application/rest.go:1537`)。生成される HelmRelease の要点:

- 名前は `r.releaseConfig.Prefix + app.Name` (`rest.go:1570`)。kind ごとに prefix が違う。
- chart は固定の `ChartRef` (`rest.go:1578`)。config 由来で、`packages/apps/<kind>` の OCI artifact を指す。
- `ValuesFrom` に必ず `Secret/cozystack-values` を差し込む (`rest.go:1599`)。プラットフォーム全体で共有する値の注入口。
- そして肝心の `Values: app.Spec` (`rest.go:1605`)。Application の `spec` (生 JSON) がそのまま Helm の values になる。

```go
ValuesFrom: []helmv2.ValuesReference{
    {
        Kind: "Secret",
        Name: "cozystack-values",
    },
},
Values: app.Spec,
```

install/upgrade の timeout・retry・DisableWait は ApplicationDefinition のアノテーションで kind 単位に上書きできる (`rest.go:1553`-`1561`、`rest.go:1621`)。たとえば `Kubernetes` kind は Kamaji の admin-kubeconfig Secret が非同期生成で遅いため `helm-install-timeout` を持つ (`rest.go:1545` のコメント、`pkg/config/config.go:29`)。

### 中核データ構造 (3-5)

- `application.REST` (`pkg/registry/apps/application/rest.go:89`) — 全 Application kind 共通の REST storage。`gvr`/`gvk`/`kindName`/`releaseConfig`/`specSchema` を保持し、Getter/Lister/Updater/Creater/Watcher/Patcher を 1 型で実装 (`rest.go:65`-`72`)。
- `Application` (`pkg/apis/apps/v1alpha1/types.go:75`) — 全 kind を表す唯一の Go 型。中身は `Spec *apiextensionsv1.JSON` (`types.go:81`) という不透明 JSON。kind 固有のスキーマは Go 型でなく config の OpenAPI schema 側に持つ。
- `config.Resource` / `ApplicationConfig` / `ReleaseConfig` (`pkg/config/config.go:126` / `:132` / `:141`) — ApplicationDefinition 1 件を平らにした実行時 config。kind→chart→HelmRelease 生成パラメタの対応表。
- `helmv2.HelmRelease` (Flux 外部型, `github.com/fluxcd/helm-controller/api/v2`) — Application の保存実体。Cozystack は独自 store を持たず Flux のリソースを backing store にする。
- `ApplicationDefinition` CRD (`api/v1alpha1/applicationdefinitions_types.go`) — kind / plural / `OpenAPISchema` / `Release`(prefix/labels/chartRef) を宣言する設定ソース (`:52`, `:67`, `:69`)。

### 非自明な設計判断

「Application 用の Go 型・スキーマ・etcd backing を kind ごとに書かない」。新しいマネージドサービス (例: 新 DB) を増やす作業 = `packages/apps/<kind>` に Helm chart を足し、ApplicationDefinition (`*-rd` chart) を 1 個配るだけ。Go コードの再ビルドは不要。`cozystack-api` は起動時に ApplicationDefinition を読んで集約 API リソースを動的生成し (`apiserver.go:229`)、全 kind を 1 つの汎用 `REST` + 不透明 JSON `Spec` で処理する (`types.go:81`, `rest.go:89`)。さらに保存実体を自前で持たず Flux の `HelmRelease` に射影する (`rest.go:1605`) ことで、調整ループ・履歴・リトライを丸ごと Flux に委譲している。API の見た目は「クラウドの REST API」、実体は「Helm + GitOps」というのが Cozystack のキモ。

## 採用事例の素材

ADOPTERS.md (本文実測、production 利用を自己申告した組織) より、出典付きで列挙できるもの:

- Ænix (<https://aenix.io/>) — @kvaps, 2024-02-14。マネージドサービス提供の主力ツール。
- Mediatech (<https://mediatech.dev/>) — @ugenk, 2024-05-01。k8s ディストリとして利用。
- Bootstack (<https://bootstack.app/>) — @mrkhachaturov, 2024-08-01。
- gohost (<https://gohost.kz/>) — カザフスタンのホスティング事業者, 2024。Bare Metal k8s を Cozystack 管理で提供。
- Urmanac (<https://urmanac.com>) — @kingdonb, 2024-12-04 (現メンテナ)。
- Hidora / Hikube (<https://hikube.cloud>) — @matthieu-robin, 2025-09-17。スイスのソブリンクラウド。メンテナ輩出。
- QOSI (<https://qosi.kz>) — 2025-10-04。カザフスタン/中央アジアの GPU クラウド。
- Cloupard (<https://cloupard.kz/>) — 2025-12-18。カザフスタン/ウズベキスタンのパブリッククラウド。

GitHub シグナル (2026-06-29 GitHub API 実測): star 2,132 / fork 173 / contributors 50+ / open issues 373。地理的に旧 CIS + 欧州のホスティング事業者中心の採用。

## 代替・エコシステム

差別化の軸: 「ベアメタル上で VM・マネージド k8s・DBaaS を 1 プラットフォームで提供する CNCF の PaaS フレームワーク」。

- vs OpenStack — 同じ「自前 IaaS/クラウド構築」だが、OpenStack は独自スタック。Cozystack は Kubernetes/Flux/KubeVirt 等の既存 CNCF 部品の組み合わせで、運用知識が k8s に閉じる。
- vs Harvester (SUSE) — どちらも KubeVirt ベースの HCI。Harvester は VM/HCI 中心。Cozystack はマネージド k8s (Kamaji/Cluster API) と DBaaS まで含む PaaS レイヤを上乗せ。
- vs Kubermatic / Gardener / Rancher — マネージド k8s 提供という点で重なるが、Cozystack は VM + DBaaS + テナント分離 + 課金前提のカタログをまとめて持ち、対象がホスティング事業者寄り。
- vs Crossplane / KubeVela — 「k8s リソースを宣言してクラウド的 API を作る」点は近い。ただし Crossplane/KubeVela は汎用の合成基盤。Cozystack は具体的なクラウド部品 (KubeVirt/CNPG/LINSTOR/Cilium 等) を統合済みの完成プラットフォーム。

統合先 (実測の依存先): Flux (helm-controller を backing store として直結), KubeVirt + CDI, Cluster API + Kamaji, CloudNativePG, LINSTOR/Piraeus + SeaweedFS, Cilium + Kube-OVN, MetalLB, Talos Linux, Keycloak (OIDC), VictoriaMetrics/Grafana。`packages/system/` にこれらの operator/chart が vendor されている。

## インストール / 最小構成

公式 Getting Started (<https://cozystack.io/docs/getting-started/>) の 5 ステップ: (1) Talos Linux 導入 → (2) Talm で k8s ブートストラップ → (3) Cozystack 本体インストール → (4) ユーザ tenant 作成 → (5) アプリ展開。

step 3 の実体: `cozy-system` namespace に `cozystack-config` ConfigMap (bundle 名・Pod/Service CIDR・`root-host` 等) を置き、installer manifest を `kubectl apply` する。installer は `cozystack-operator` (variant: `talos`/`generic`/`hosted`、`packages/core/installer/values.yaml:7` 周辺) を入れ、operator が `platform` package を調整して残りのシステムコンポーネントを Flux 経由で展開する。`root-host`/`bundle-name` は `packages/core/platform/templates/apps.yaml:22`-`23` で参照される。

最小ワーキングセット: ベアメタル (または VM) ノード + Talos + 上記 config。展開後はユーザが tenant namespace で `apps.cozystack.io` のリソース (例: `kubectl apply` で `kind: Postgres`) を作れば DBaaS が立つ。
