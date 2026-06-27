# recon: Capsule

調査メモ。出典は URL を添える。path:line は `research/capsule/src` の pinned commit を指す。

## 基本情報

- repo: `projectcapsule/capsule` (旧 `clastix/capsule` から CNCF 中立 org へ移管)
- pinned commit: `8d89d6865df6f41c7faa22fc9e807a57b01bfd0e` (2026-06-24) / 近いタグ: `v0.13.7`
- 言語 / ビルド: Go (go.mod `go 1.26.4`) / `make manager` = `go build -o bin/manager`、`Makefile:64-65`
- 主要依存: `sigs.k8s.io/controller-runtime v0.23.3` (go.mod)
- main entrypoint: `cmd/controller/main.go` (`func main()` は `cmd/controller/main.go:115`)、単一バイナリ controller
- ライセンス: Apache-2.0。`LICENSE:1` が `Apache License Version 2.0`、各 Go ファイル先頭 `SPDX-License-Identifier: Apache-2.0` (例 `api/v1beta2/tenant_types.go:2`)。GitHub API も `spdx_id: Apache-2.0` を返す
- CNCF 成熟度: Sandbox (2022-12-13 採択)。<https://www.cncf.io/projects/capsule/>
- カテゴリ: Identity & Policy

CRD (Custom Resource Definition) の API グループは2つ存在する。`api/v1beta1` と `api/v1beta2`。storage version は v1beta2 (`api/v1beta2/tenant_types.go:141` の `+kubebuilder:storageversion`)。

## 用語

- テナント (Tenant): 複数の Kubernetes Namespace を束ねる上位抽象。Cluster スコープの CRD。`Tenant` 型は `api/v1beta2/tenant_types.go:152`
- ソフトマルチテナンシー: 単一 API サーバ / 単一コントロールプレーンを共有し、admission webhook と RBAC で論理分離する方式。仮想クラスタや専用コントロールプレーン (ハードマルチテナンシー) と対比される
- テナントオーナー (Tenant Owner): テナント内で Namespace を自由に作成・管理できる User / Group / ServiceAccount。`TenantSpec.Owners` (`api/v1beta2/tenant_types.go:40`)
- admission webhook: API サーバが永続化前にリクエストを外部 HTTP エンドポイントへ転送して検証 (validating) または改変 (mutating) する仕組み

## 歴史の素材

- Clastix (イタリアの Kubernetes コンサル企業) が2020年に OSS として公開。GitHub repo の created_at は `2020-06-29`。最初期リリースは `v0.0.1`。作者 Dario Tranchitella の公開告知 (Apache 2.0 / CNCF compatible を明記): <https://threadreaderapp.com/thread/1293084561908400128.html>
- 解決する課題: Kubernetes の Namespace はフラット構造で、同一チームの複数 Namespace 間でリソース共有や上限管理ができない。結果としてチーム毎にクラスタを分けてしまい「クラスタ乱立 (cluster sprawl)」が運用負担になる。Capsule は単一クラスタ内で Namespace 群を Tenant に集約してこれを回避する。<https://capsule.clastix.io/>
- 2022-12-13 に CNCF Sandbox に採択。Sandbox Inclusion Results: <https://lists.cncf.io/g/cncf-toc/message/7743>。CNCF プロジェクトページ: <https://www.cncf.io/projects/capsule/>
- Sandbox onboarding の umbrella issue #812 で中立 org `projectcapsule` への移管、ドキュメントの MkDocs 化、DCO/CLA、CoC 明記などを実施。<https://github.com/projectcapsule/capsule/issues/812>
- ドメインも `capsule.clastix.io` から `projectcapsule.dev` へ移行 (チャート README が後者を参照: `charts/capsule/README.md:5`)

## アーキテクチャの素材

Capsule は2つの責務を1バイナリで持つ。(1) controller-runtime ベースの reconciler 群 (`internal/controllers/`)、(2) admission webhook 群 (`internal/webhook/`)。両方とも `cmd/controller/main.go` の Manager に登録される (webhook パッケージの import 群は `cmd/controller/main.go:62-83`)。

トップレベル構成:

- `api/v1beta1`, `api/v1beta2`: CRD 型定義。Tenant, CapsuleConfiguration, ResourcePool, GlobalResourcePool, TenantResource, CustomResourceQuota など
- `internal/controllers/`: reconciler。`tenant`, `resourcepools`, `rbac`, `pv`, `servicelabels`, `tls` (webhook 証明書の自己管理), `cfg` ほか
- `internal/webhook/`: admission ハンドラ。`namespace` (mutation/validation), `tenant`, `pod`, `ingress`, `pvc`, `service`, `owners`, `node`, `gateway`, `dra`, `resourcepool` ほか
- `pkg/`: 再利用ロジック。`tenant` (オーナー解決・所有権), `api` (rbac/rules/quota の型), `ruleengine`, `template`, `runtime` (indexers/cert/admission/events 等)

リクエストの流れ (テナントオーナーが Namespace を作る代表ケース、後述の end-to-end 参照): API サーバ -> Capsule の mutating webhook (Tenant への割り当てとラベル付与) -> validating webhook (quota / prefix / metadata 検査) -> 永続化 -> Tenant controller の reconcile が Namespace へ ResourceQuota / NetworkPolicy / LimitRange / RoleBinding を同期。

設計の中核: Namespace の所属は **ラベルではなく Kubernetes OwnerReference** で表現する。Namespace は所属 Tenant を ownerReference に持ち、controller はフィールドインデックス `.metadata.ownerReferences[*].capsule` (`pkg/runtime/indexers/namespace/const.go:7`) で逆引きする。これにより Tenant 削除時の cascading delete を Kubernetes の GC (Garbage Collection) に委ねつつ、controller は所属 Namespace を効率的に列挙できる。インデックス関数は ownerReference を走査し Tenant 種別のものだけ拾う (`pkg/runtime/indexers/namespace/namespaces.go:25-42`、判定は `IsTenantOwnerReference`)。

## 内部実装の素材

### 代表オペレーションの end-to-end: 「テナントオーナーが Namespace を作る」

1. mutating webhook `ownerReferenceHandler.OnCreate` (`internal/webhook/namespace/mutation/assignment.go:37`)。`utils.GetNamespaceTenant` でリクエストユーザとラベルから所属テナントを決定 (`assignment.go:46`)。テナント未解決かつ管理者なら素通し (`assignment.go:53`)、それ以外で未解決なら `capsule.clastix.io/tenant` ラベルを使えという deny (`assignment.go:57-63`)。解決できたらテナント名ラベルを付け (`assignment.go:66-68`)、`assignToTenant` が `controllerutil.SetOwnerReference(tnt, ns, ...)` で Namespace に Tenant の ownerReference を打つ (`assignment.go:182`)。成功時は `ReasonTenantAssigned` の Event を発行 (`assignment.go:196-206`)。
2. validating webhook の集約ハンドラ `handler.OnCreate` (`internal/webhook/namespace/validation/handler.go:35`)。`tenant.ResolveNamespaceTenant` で所属テナントを再解決 (`handler.go:53`)。非管理者かつ非 Capsule ユーザがテナント所有 Namespace を作ろうとすると deny (`handler.go:58-60`)。テナントが nil なら無関係として nil 返し (`handler.go:62-64`)。削除中テナントへの新規 Namespace は `rejectOnTermination` で拒否 (`handler.go:66-73`, 実装 `handler.go:208-238`)。その後サブハンドラ群を順に実行 (`handler.go:75-79`)。
3. quota サブハンドラ `quotaHandler.handle` (`internal/webhook/namespace/validation/quota.go:71`)。`tnt.IsFull()` が真なら (`quota.go:79`)、既存 Namespace の再適用でない限り `NewNamespaceQuotaExceededError` で deny し `ReasonOverprovision` Event を出す (`quota.go:88-100`)。`IsFull` は `Status.Namespaces` の数を `Spec.NamespaceOptions.Quota` と比較する (`api/v1beta2/tenant_func.go:41-48`)。
4. prefix サブハンドラ `prefixHandler.OnCreate` (`internal/webhook/namespace/validation/prefix.go:33`)。`ProtectedNamespaceRegexp` に一致する名前を拒否 (`prefix.go:43-50`)。`ForceTenantPrefix` (グローバル設定をテナント側 `Spec.ForceTenantPrefix` で上書き可、`prefix.go:52-55`) が有効なら `<tenant名>-` 接頭辞を強制 (`prefix.go:61-79`)。
5. 永続化後、Tenant controller `Manager.Reconcile` (`internal/controllers/tenant/manager.go:237`) が走る。`reconcile` (`manager.go:308`) が RBAC 収集、Namespace 同期 (`manager.go:319` の `reconcileNamespaces`)、metadata、ResourceQuota、NetworkPolicy、LimitRange、RoleBinding 同期を順に呼ぶ (`manager.go:312-363`)。
6. `reconcileActiveTenantNamespaces` (`internal/controllers/tenant/namespaces.go:153`) が前述のフィールドインデックスで所属 Namespace を列挙 (`namespaces.go:159` の `client.MatchingFields{".metadata.ownerReferences[*].capsule": tnt.GetName()}`)。`errgroup` で並列上限8の reconcile (`namespaces.go:168-169`)。各 Namespace は `reconcileNamespace` (`namespaces.go:237`) で status condition 更新と `reconcileNamespaceMetadata` (`namespaces.go:370`) による管理ラベル/アノテーション適用を受ける。最後に `tnt.AssignNamespaces(list.Items)` で status を確定 (`namespaces.go:232`)。

### 中核データ構造

- `TenantSpec` (`api/v1beta2/tenant_types.go:21`): テナントの desired state。`Owners`, `NamespaceOptions` (quota 含む), `ResourceQuota`, `AdditionalRoleBindings`, `StorageClasses`/`PriorityClasses`/`RuntimeClasses` などの allowed list, `NodeSelector`, `ForceTenantPrefix` を保持。多数の旧フィールド (`NetworkPolicies`, `LimitRanges`, `ContainerRegistries`) は Deprecated 化され Replications / Enforcement へ移行中 (`tenant_types.go:93-111`)
- `Tenant` (`api/v1beta2/tenant_types.go:152`): `scope=Cluster`, `shortName=tnt`, storage version。kubectl 表示列に namespace quota / count / Ready 条件を出す (`tenant_types.go:144-150`)
- `TenantStatus` (`api/v1beta2/tenant_status.go:24`): `Owners`, `Promotions`, `State` (Active/Cordoned/Terminating), `Size`, 旧 `Namespaces []string` (Deprecated, `tenant_status.go:42`), 新 `Spaces []*TenantStatusNamespaceItem` (`tenant_status.go:44`), `Conditions`
- `CapsuleConfigurationSpec` (`api/v1beta2/capsuleconfiguration_types.go:16`): クラスタ全体設定。`Users` (Capsule 構成に含めるエンティティ), `ForceTenantPrefix`, `ProtectedNamespaceRegexpString`, `AllowServiceAccountPromotion`, webhook secret 等の名前上書き
- `ResourcePoolSpec` (`api/v1beta2/resourcepool_types.go:14`): 複数 Namespace を NamespaceSelector で束ね、共有の `corev1.ResourceQuotaSpec` を claim ベースで配分する新しいリソース管理 (`resourcepool_types.go:14-27`)。claim はキュー方式で割当

### 非自明な設計判断

quota 超過時、対象 Namespace が既に存在する場合は deny せず nil を返す (`internal/webhook/namespace/validation/quota.go:84-86`)。理由はソース内コメント通り、既存リソースの再適用なら API サーバ側の `AlreadyExists` に委ねてネイティブな Kubernetes 体験に寄せるため。webhook が先に独自エラーを返すとユーザ体験が崩れる、という配慮。

もう1つ: テナント所属は ownerReference を一次情報源とし、ラベルは補助。`reconcileActiveTenantNamespaces` は label ではなく ownerReference のフィールドインデックスで列挙する (`namespaces.go:159`)。`IsTenantOwnerReference` は Kind と API グループの両方を検証してから採用する (`pkg/tenant/owner_reference.go:18-35`)。これにより GC による cascading delete と整合する所有権モデルになる。

## 採用事例の素材

ADOPTERS.md (`ADOPTERS.md`) に記載 (出典あり、ロゴ付き自己申告):

- Bedag Informatik AG (`ADOPTERS.md:9`)
- Department of Defense (米国国防総省) (`ADOPTERS.md:12`)
- Enreach, Fastweb, Klarrio, KubeRocketCI, ODC-Noord, PITS Global Data Recovery Services, Politecnico di Torino, Reevo, Seeweb など
- maintainer の所属に Wargaming, Peak Scale, Proximus, ODC-Noord が現れる (`MAINTAINERS.md`)

公開ページ: <https://projectcapsule.dev/adopters/>。ADOPTERS は self-reported なので「使用規模」は不明、組織名のみ信頼する。

GitHub シグナル (2026-06-26 時点, GitHub API): stars 2,112 / forks 210 / contributors 75 (paginate 実数) / open issues 26。最新リリース `v0.13.7` (2026-06-24)。

## 代替・エコシステム

ソフトマルチテナンシー (共有コントロールプレーン) との差別化:

- Hierarchical Namespace Controller (HNC, Kubernetes SIG): Namespace を親子で入れ子にし継承させる。ClusterRole/ClusterRoleBinding/PV (PersistentVolume) などクラスタスコープ資源は依然全クラスタ共有で、quota も階層に整合しない。構造化ツールであり Namespace 以上の分離は提供しない
- kiosk (Loft Labs): Account/Space 抽象でセルフサービス Namespace 提供。現在は vCluster に統合されほぼ非推奨
- Capsule の差別化: Tenant CRD が Namespace 群の上位抽象になり、テナント越えの RoleBinding 参照を禁止し、デフォルトでテナント間 NetworkPolicy を適用し、テナント管理者に ClusterRole/ClusterRoleBinding 作成を許さない。追加バイナリやカスタム API サーバ不要のネイティブ体験

ハードマルチテナンシー (専用/仮想コントロールプレーン) との位置づけ:

- vCluster (Loft): Namespace 内に仮想 API サーバを立て、各テナントが事実上 cluster-admin。CRD 等クラスタスコープ資源を自律管理できるが資源コスト高 (control plane あたり ~1GB RAM)
- Kamaji (同じく Clastix): Control Plane as a Service。テナント毎に専用コントロールプレーン。KaaS (Kubernetes as a Service) プロバイダ向け

使い分け: 内部チームで相互信頼があるなら Capsule のソフト分離で十分、外部の非信頼テナントには vCluster 等のハード分離。多数の軽量テナントは Capsule + ポリシーが管理しやすい。出典: <https://www.vcluster.com/blog/comparing-multi-tenancy-options-in-kubernetes>、<https://srekubecraft.io/posts/k8s-multi-tenancy/>。

エコシステム / 周辺:

- Capsule Proxy: クラスタスコープ資源 (Namespace 一覧等) をテナント単位でフィルタする API プロキシ。Capsule 本体だけでは見えないクラスタスコープ資源の自己発見を補う
- GitOps 連携: 宣言的かつ GitOps ready。Flux 連携の参照実装 `clastix/flux2-capsule-multi-tenancy`、AKS 上の参照アーキ `clastix/coaks-baseline-architecture`
- Helm が公式デプロイ手段。チャートは CRD ライフサイクルも管理 (`charts/capsule/README.md` の 0.7.x 以降の記述)

## インストール / 最小動作

前提: Helm 3、Kubernetes v1.16+、`MutatingAdmissionWebhook` / `ValidatingAdmissionWebhook` / `ResourceQuota` / `LimitRanger` admission plugin 有効。出典: <https://projectcapsule.dev/docs/operating/setup/installation/> (2026-06-26 参照)。

OCI (Open Container Initiative) レジストリからの導入:

```bash
helm install capsule oci://ghcr.io/projectcapsule/charts/capsule \
  --version 0.12.4 -n capsule-system --create-namespace
```

HTTP チャートリポジトリ経由も可:

```bash
helm repo add projectcapsule https://projectcapsule.github.io/charts
helm install capsule projectcapsule/capsule \
  --version 0.12.4 -n capsule-system --create-namespace
```

導入後の最小テナント例:

```yaml
apiVersion: capsule.clastix.io/v1beta2
kind: Tenant
metadata:
  name: oil
spec:
  owners:
    - name: alice
      kind: User
```

`alice` は自分のテナント `oil` 配下で Namespace を自由に作れるが、mutating webhook が ownerReference を打ち、validating webhook が quota / prefix / metadata を検査する。
