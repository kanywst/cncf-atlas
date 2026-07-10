# recon: external-secrets (External Secrets Operator / ESO)

調査メモ。出典は sources.md の番号に対応。`file:line` は pin した commit を基準にする。

## 基本情報

- repo: `external-secrets/external-secrets`（git remote で確認済み [1]）
- pinned commit: `e1006131b195afa4138e6cc815e1168f533ce95c`
- 近いタグ: `helm-chart-2.7.0`（`git describe` は `helm-chart-2.7.0-38-ge100613`。リリースタグは Helm チャート命名。最新リリース `helm-chart-2.7.0` は 2026-06-26 公開 [2]）
- 言語 / ビルド: Go（`go 1.26.4`、go.mod）/ `make`。単一バイナリを `main.go` からビルド、controller / webhook / certcontroller のサブコマンド構成（AGENTS.md）。マルチモジュール構成（`apis/`, `runtime/`, `e2e/`, 各 `providers/v1/*/` が独自 go.mod）
- ライセンス: Apache License 2.0（LICENSE, [1]）
- CNCF 成熟度: **Sandbox**（2022-07-26 受理 [3] [6]）。カテゴリ Security & Compliance の Provisioning グループに配置 [7]。※ 2020-11 作成の若い名だが Sandbox 止まり。incubation を申請済みという言及あり [4] だが、CNCF 公式ページの表記は現時点 Sandbox [6]。プロジェクト健全性の懸念が TOC issue #1819 で議論されている [8]（採用判断には影響しないが、write 時に「Sandbox のまま」を正とする）
- カテゴリ (tools.ts CATEGORY_ORDER から): **Security & Compliance**

## 歴史の素材

- **起源: GoDaddy の kubernetes-external-secrets (KES)**。GoDaddy は EKS + AWS Secrets Manager を使っていたが、EKS から Secrets Manager を参照する標準手段がなく、各チームが独自実装していた。これを解消するため KES を社内開発し OSS 化。`ExternalSecret` という CRD を Kubernetes API に足し、外部シークレットを宣言的に Pod へ注入する発想 [5] [9]。KES は JavaScript 実装 [1 (KES repo)] [5]。
- **中立組織への移管**。複数の同目的プロジェクトを統合するため、GoDaddy から company-neutral な `external-secrets` GitHub org へ移管 [5] [9]。README も「複数の人と組織が既存プロジェクトを土台に単一の External Secrets 解を作るために合流」と明記、起源として KES issue #47 と PR #477 を挙げる [1]。
- **Go への書き直し = External Secrets Operator の誕生**。KES(JS) を Go で書き直し、標準化された CRD を採用したのが ESO。理由は Kubernetes の Go 向け一級 SDK サポートと、Kubebuilder / Operator SDK による operator ベストプラクティス追従 [5]。最初のプレリリースは AWS Secrets Manager / AWS Parameter Store / HashiCorp Vault の 3 プロバイダ対応で、external-secrets.io のドキュメントサイトも公開。Moritz Johner, Kellin McAvoy, Jonatas Baldin, Markus Maga, Silas Boyd-Wickizer らの貢献 [5]。KES(JS) は deprecated 化 [1 (KES repo)] [5]。
- **CNCF Sandbox 受理**: 2022-07-26、TAG Security スポンサーで Sandbox 入り [3] [6]。GitHub リポジトリ作成は 2020-11-17 [2]。
- モデル上の重要判断: 「アプリでのシークレット利用」と「バックエンドごとの認証/認可の実装」を分離したオブジェクトモデルに変更（KES では ExternalSecret 1 個に混在していた）[5]。ESO では `SecretStore`/`ClusterSecretStore`（接続・認証）と `ExternalSecret`（何をどこに同期するか）に分離。

## アーキテクチャの素材

トップレベルの構成要素（`pkg/controllers/` の各サブディレクトリが 1 controller）:

- **ExternalSecret controller** (`pkg/controllers/externalsecret/`): 主役。ExternalSecret を reconcile し、プロバイダから読んだ値を Kubernetes Secret に書き込む。
- **SecretStore / ClusterSecretStore controller** (`pkg/controllers/secretstore/`): ストア設定を検証（`Validate()`）し状態を持たせる。`ClusterSecretStore` は cluster-scope で namespace 横断。
- **PushSecret controller** (`pkg/controllers/pushsecret/`): 逆方向。Kubernetes Secret をプロバイダへ書き戻す。
- **ClusterExternalSecret controller** (`pkg/controllers/clusterexternalsecret/`): 複数 namespace へ ExternalSecret を fan-out。
- **ClusterPushSecret / generatorstate / webhookconfig** など補助 controller。
- **Providers** (`providers/v1/<name>/`): 41 個（`ls providers/v1 | wc -l` = 41）。各々が独自 Go モジュールで `esv1.Provider` / `esv1.SecretsClient` を実装。ビルドタグは `pkg/register/<name>.go` 側（AGENTS.md）。
- **Generators** (`generators/v1/<name>/`): 17 個。v1alpha1 のみ、ビルドタグなしで常時コンパイル（AGENTS.md）。password/uuid/ecr/sts など値を生成するタイプ。
- CRD 定義は `apis/externalsecrets/{v1,v1beta1,v1alpha1}` と `apis/generators/v1alpha1`、`apis/meta/v1`。

### 代表操作: ExternalSecret 1 個の reconcile（プロバイダ → Kubernetes Secret）

`file:line` は pin commit 基準。

1. `Reconcile(ctx, req)` 開始。`externalsecret_controller.go:173`。メトリクス開始・deferred で sync duration 記録（`:182`）。
2. ExternalSecret を取得。`r.Get(ctx, req.NamespacedName, externalSecret)` `:188`。NotFound なら metrics 無効化して終了（`:190`）。
3. finalizer 処理: 削除中なら管理下 Secret をクリーンアップして finalizer 除去（`:211`）。存命なら `ExternalSecretFinalizer` を Patch で付与（`:244`。spec の所有権を主張しないよう Update でなく Patch）。
4. スキップ判定: ClusterSecretStore 無効化フラグ（`:254`）、このコントローラの管理外ストア（`:260`）。generic target（Secret 以外のターゲット）は別パス `reconcileGenericTarget` へ（`:272`）。
5. ターゲット Secret 名を決定（未指定なら ES 名）`:296`。partial metadata cache から既存 Secret を取得 `:309-311`（full cache と別で race があり得る旨コメント `:301-308`）。`managed` ラベルが無ければ付与して requeue（`:320-327`）。
6. リフレッシュ要否: `shouldRefresh(externalSecret)` が false かつ `isSecretValid(existingSecret, externalSecret)` が true ならスキップして requeue（`:372`。refreshInterval・generation・data-hash annotation で判定）。
7. **プロバイダから値を取得**: `dataMap, err := r.GetProviderSecretData(ctx, externalSecret)` `:417`。
8. 取得ゼロ件なら `spec.target.deletionPolicy`（Delete / Retain / Merge）に応じて分岐（`:424-457`）。
9. `mutationFunc` を組み立て（annotations/labels/data 初期化、immutable フラグ、template 適用）`:461-`。`createSecret`（`:911`）または `updateSecret`（`:941`）で Kubernetes Secret に反映。
10. 成功なら `markAsDone` + 次回 requeue（`getRequeueResult`, `:721`）。

### `GetProviderSecretData` の中身（プロバイダ解決 → GetSecret）

`pkg/controllers/externalsecret/externalsecret_controller_secret.go:44`。

- `secretstore.NewManager(...)` でクライアントマネージャ生成（`:49`）。GCP 等の制約でプロバイダクライアントの多重生成を避け、reconcile 終了時に一括 Close（`:50-52`）。
- `spec.dataFrom[]` を走査（`:80`）。`find` は `handleFindAllSecrets`（GetAllSecrets 相当）、`extract` は `handleExtractSecrets`（GetSecretMap 相当）、`sourceRef.generatorRef` は `handleGenerateSecrets`（generator）に分岐（`:83-98`）。
- `spec.data[]` を走査し `handleSecretData` を呼ぶ（`:111-112`）。
  - `client, _ := cmgr.Get(ctx, spec.SecretStoreRef, namespace, sourceRef)` でストアからプロバイダクライアントを解決（`:126`）。
  - `secretData, _ := client.GetSecret(ctx, secretRef.RemoteRef)` で単一シークレット取得（`:132`）。
  - `decoding.Decode(...)`（base64 等）`:138`、null-byte ポリシー検証 `:142`、`providerData[secretRef.SecretKey] = secretData` で格納 `:147`。
- `esv1.NoSecretErr` かつ deletionPolicy != Retain のときは「欠損」イベントを出して continue（`:100-103`, `:113-115`）。この sentinel が deletionPolicy 挙動の土台。

### ストア → プロバイダ実装の解決（union discriminator）

`pkg/controllers/secretstore/client_manager.go`:

- `Manager.Get`（`:114`）: sourceRef 優先で storeRef を解決 → `getStore`（`:118`）→ controllerClass / ClusterSecretStore の namespace 条件チェック（`:123`, `:127`）→ `GetFromStore`。
- `Manager.GetFromStore`（`:84`）: `esv1.GetProvider(store)`（`:85`）で実装を引く。同一ストア（Generation/GVK/name/namespace 一致）ならキャッシュ済みクライアント再利用（`getStoredClient`, `:147`）。無ければ `storeProvider.NewClient(ctx, store, m.client, namespace)`（`:98`）で生成しキャッシュ。
- `esv1.GetProvider`（`apis/externalsecrets/v1/provider_schema.go:75`）: `SecretStoreProvider` union を JSON marshal → key が 1 個であることを検証（`getProviderName`, `:104-124`。「バックエンドはちょうど 1 個」を JSON key 数で強制）→ グローバル `builder` map からプロバイダ取得。

## 内部実装の素材

### 主要ディレクトリ

- `apis/externalsecrets/{v1,v1beta1,v1alpha1}`: CRD 型。`v1` が現行。プロバイダごとに `secretstore_<name>_types.go` が並ぶ（AWS/Vault/GCP/Azure/... 40+ ファイル）。`secretstore_types.go` の `SecretStoreProvider` struct が全プロバイダの discriminator union。
- `apis/generators/v1alpha1`: generator 型。`ClusterGenerator` umbrella + `GeneratorSpec` union。
- `apis/meta/v1`: `SecretKeySelector` / `ServiceAccountSelector` など共有セレクタ。
- `pkg/controllers/*`: 各 CRD の reconciler。
- `pkg/register/<name>.go`: ビルドタグ付きの provider/generator 登録（`//go:build <name> || all_providers`）。
- `providers/v1/<name>/`: プロバイダ実装（独自モジュール）。
- `runtime/`: `esutils`（resolvers, CA fetch, key 検証）、`cache`、`statemanager`、`feature`、`decoding` など横断ヘルパ。

### 中核データ構造

- `Provider` interface（`apis/externalsecrets/v1/provider.go:53`）: `NewClient` / `ValidateStore` / `Capabilities` の 3 メソッド。ストア設定 → クライアント生成の工場。
- `SecretsClient` interface（同 `:73`）: 8 メソッド必須。`GetSecret`（`:77`）/ `GetSecretMap`（`:94`）/ `GetAllSecrets`（`:97`）/ `PushSecret` / `DeleteSecret` / `SecretExists` / `Validate` / `Close`。read-only プロバイダでも Push/Delete は実装し sentinel error を返す約束（nil を返してはいけない、AGENTS.md）。
- `NoSecretErr = NoSecretError{}`（同 `:103`）: 「シークレット無し」の番兵。`GetSecret` がこれを返すと deletionPolicy に従って Secret 側エントリを消す。reconciler がこの sentinel に依存する契約が明文化されている（AGENTS.md）。
- `builder map[string]Provider`（`provider_schema.go:26`）: プロバイダ名 → 実装のグローバルレジストリ。`Register` は重複名で panic（`:44-47`）。`init()` 経由で `pkg/register/*` から登録。

### 追う価値のあるパス: fake プロバイダの GetSecret

`providers/v1/fake/fake.go:180`。プロバイダ実装の最小形として読める。

- `p.config[mapKey(ref.Key, ref.Version)]` で該当エントリを引き、無ければ `esv1.NoSecretErr`（`:181-184`）。
- `ref.Property != ""` なら `gjson.Get(data.Value, ref.Property)` で JSON パスを抽出（`:186-193`）。`gjson` が JSON ペイロードに対する `ref.Property` の慣用抽出器（AGENTS.md）。プロパティが無ければ NoSecretErr。
- それ以外は生値を返す（`:195`）。
- `GetSecretMap`（`:198`）は `GetSecret` の結果を JSON として unmarshal し k/v に展開。全プロバイダがこの「単一取得 → JSON 展開」パターンを共有。

### 驚いた点 / 非自明な選択

- **プロバイダ判別が JSON key 数**: `SecretStoreProvider` を marshal して key がちょうど 1 個であることでバックエンドを一意化（`provider_schema.go:104-124`）。型ではなく JSON 構造で discriminator を強制する。
- **partial cache と full cache の二層**: Secret の存在確認は `metav1.PartialObjectMetadata` の partial cache で行い（`externalsecret_controller.go:309`）、`--enable-managed-secrets-caching` 時 full cache は `managed` ラベル付きしか含まないため存在判定に使えない、というコメントが明示（`:301-308`）。
- **クライアントの reconcile スコープ寿命**: プロバイダクライアントは呼び出しごとに Close せず、`secretstore.Manager` が reconcile 終了時に一括 Close（`externalsecret_controller_secret.go:50-52`, client_manager コメント `:81-83`）。GCP クライアントの多重生成制約が理由。
- **generator の state ロールバック**: 複数 generator のうち 1 個でも失敗したら、その iteration で生成した全値を rollback（`externalsecret_controller_secret.go:57-77`）。`statemanager` が `GeneratorState` CR に状態を永続化。
- **finalizer は Update でなく Patch**: refreshInterval など spec フィールドの所有権を主張しないため（`externalsecret_controller.go:231-234`, `:242-245`）。

## 採用事例の素材（出典必須・捏造禁止）

ADOPTERS.md（[10]）に記載の組織のみ列挙。以下は原文にある一部（write では ADOPTERS.md を出典に）:

- Amadeus, Cisco, Codefresh, Container Solutions, Criteo, Elastic, Epidemic Sound, Fivetran, Form3, GoTo, Grafana Labs, Hostinger, Mercedes-Benz Tech Innovation, Mixpanel, OVHcloud, Radio France, Red Hat OpenShift, Roche, SAP, VMware Tanzu ほか（全リストは ADOPTERS.md）。
- GoDaddy: 起源であり、エンジニアリングブログで KES 開発を公表 [9]。Container Solutions: ESO コミュニティ立ち上げをブログ化 [5] [3]。
- GitHub シグナル（`gh` で取得、2026-07-09 時点 [2]）: stars 6,730 / forks 1,357 / 作成 2020-11-17 / 直近 push 2026-07-09。最新リリース `helm-chart-2.7.0`（2026-06-26）。
- CNCF Sandbox プロジェクト [6]。CII Best Practices / OpenSSF Scorecard バッジあり（README [1]）。
- 注意: LinkedIn 等で「ESO のリリースが止まる懸念」という健全性議論あり（TOC #1819 [8]）。採用の裏付けには使わない（一次情報でないため）。write では触れるなら TOC issue を出典に、事実（health レビュー中）だけ。

## 代替・エコシステム

- **HashiCorp Vault Secrets Operator (VSO)**: HashiCorp 公式の Kubernetes operator。Vault 専用（ESO は 40+ プロバイダのマルチバックエンド）。VSO は Vault の VaultStaticSecret/VaultDynamicSecret CRD で dynamic secret / lease renew に強い。
- **Secrets Store CSI Driver**: SIG-Auth。Secret を etcd に作らず、CSI ボリューム経由で Pod に tmpfs マウント（`SecretProviderClass`）。オプションで Kubernetes Secret に同期も可。ESO は「常に Kubernetes Secret を作る」点が対照的（GitOps/既存ワークフロー互換 vs. etcd に置かない）。
- **Sealed Secrets (Bitnami)**: 暗号化した Secret を Git にコミット可能にする controller。外部シークレットストアは不要だが、値は Git に（暗号化して）入る。ESO は外部ストアが真実の源で、Git には参照だけ。
- **統合先**: AWS Secrets Manager / Parameter Store, HashiCorp Vault / OpenBao, GCP Secret Manager, Azure Key Vault, IBM Cloud Secrets Manager, Akeyless, CyberArk Conjur, 1Password, Doppler, Bitwarden, Pulumi ESC ほか（README [1], providers/v1 に 41 実装）。
- **エコシステム上の位置**: Argo CD / Flux などの GitOps と併用が定番（ESO の CR を Git 管理、値は外部ストア）。ClusterExternalSecret でマルチ namespace fan-out。
