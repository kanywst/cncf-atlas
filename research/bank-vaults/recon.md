# recon: bank-vaults

調査メモ。自分用の密度でよい。出典は必ず URL を添える。AI 臭い水増しはしない。

略語は各セクション初出で展開する。CLI (Command Line Interface)、KMS (Key Management Service)、KV (key-value)、HA (High Availability)、CRD (Custom Resource Definition)、HSM (Hardware Security Module)、SSE (Server-Side Encryption)、OTP (One-Time Password)、GC (garbage collection)、CNCF (Cloud Native Computing Foundation)。

## 基本情報

- repo: `bank-vaults/bank-vaults` (旧 `banzaicloud/bank-vaults`、Banzai Cloud → Cisco/Outshift 由来)
- pinned commit: `2248b7b5a8bac4a6a7155c82304a2c1878bb6a46` (2026-06-22)
- 近いタグ: `v1.33.1` (sha `8cd37bc9d17c6bda131c938f36250a9bf1b71fe7`, 2026-05-25 公開)。HEAD はタグの数コミット先
- 言語 / ビルド: Go 1.26.3 (`go.mod:3`) / `make build` = `go build -race -o build/ ./cmd/bank-vaults` (`Makefile:31-33`)
- main エントリポイント: `cmd/bank-vaults/main.go:300` の `func main()` が `flag.Parse()` の後 `execute()` (`main.go:140`) を呼び cobra root を実行
- ライセンス: Apache-2.0。`LICENSE` 冒頭が Apache License 2.0 本文、`NOTICE` に `Copyright © 2018 Banzai Cloud` / `Copyright © 2021 Cisco Systems` (`NOTICE:1-2`)。GitHub API の `license.spdx_id` も `Apache-2.0`
- CNCF 成熟度: Sandbox (2024-06-18 受理)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Security & Compliance

このリポジトリは umbrella プロジェクトの一部で、本体は Vault を init / unseal / configure する CLI。Operator・Webhook・SDK は別リポ (後述)。

## 歴史の素材

- 起源は Banzai Cloud。社内の Kubernetes 基盤 (Pipeline / Hollowtrees) で Vault を使い回すうちにコードが重複したため、Vault 周りのロジックを外出しして独立プロジェクト化したもの。出典: README の Credits と各 blog (<https://outshift.cisco.com/blog/vault-operator/>)、旧リポ <https://github.com/banzaicloud/bank-vaults>。
- 名前の由来は README 冒頭。サーフスポット「Bank Vaults」(Mentawai) に掛けた言葉遊びで、銀行金庫の比喩 (重い扉・解錠の組合せ・守衛) を secret 管理に重ねている (`README.md` 引用ブロック)。
- リポジトリ作成は 2018-03-07 (GitHub API `created_at`)。コミット著作権表記は 2018 Banzai Cloud で始まる (例: `cmd/bank-vaults/main.go:1` は 2020、`unseal.go:1` は 2018)。
- Banzai Cloud は Cisco に買収され、現在の維持母体は Outshift by Cisco。ドキュメントは `banzaicloud.com` から `bank-vaults.dev` へ移設 (<https://bank-vaults.dev/>)。
- CNCF Sandbox 申請は 2023-08-04 に sagikazarmark が起票、Cisco がスポンサー組織。投票通過 (gitvote/passed) でクローズ (<https://github.com/cncf/sandbox/issues/54>)。CNCF 公式の受理日は 2024-06-18 (<https://www.cncf.io/projects/bank-vaults/>)。
- 直近リリースは `v1.33.1` (2026-05-25)。

## アーキテクチャの素材

umbrella プロジェクトの構成 (README の箇条書き):

- 本リポジトリ = `bank-vaults` CLI。Vault の init / unseal / configure を自動化。
- Vault Operator (別リポ `bank-vaults/vault-operator`): Vault を Kubernetes 上で CRD 経由でプロビジョニング・運用。
- Secrets Webhook (別リポ `bank-vaults/secrets-webhook`、旧 `vault-secrets-webhook`): mutating admission webhook で Pod に secret を直接注入。Kubernetes Secret / etcd を経由せず、メモリ上だけに置くのが売り。
- Vault SDK (別リポ `bank-vaults/vault-sdk`): Go から Vault を扱うクライアント。本リポの CLI も `github.com/bank-vaults/vault-sdk/vault` を import してクライアント生成している (`cmd/bank-vaults/init.go:23`, `cmd/bank-vaults/unseal.go:24`)。

CLI 内部のトップレベル構成:

- `cmd/bank-vaults/`: cobra のサブコマンド群。`main.go` (root + 全フラグ定義 + KV backend 定数)、`init.go`、`unseal.go`、`configure.go`、`metrics.go` (Prometheus exporter)、`completion.go`、`gen_docs.go`。
- `internal/vault/`: Vault に対する操作本体。`operator_client.go` が `Vault` interface とその実装 `vault` 構造体。`auth_methods.go` / `secrets_engines.go` / `policies.go` / `audits.go` / `plugins.go` / `identity_groups.go` / `startup_secrets.go` が `configure` の各サブ設定を担当。
- `pkg/kv/`: unseal キー・root token を保管する KV ストアの抽象 (`kv.go`) と各バックエンド実装 (`awskms`, `gckms`, `azurekv`, `alibabakms`/`alibabaoss`, `ocikms`/`oci`, `s3`, `gcs`, `vault`, `k8s`, `hsm`, `file`, `dev`, `multi`)。

設計の骨子: CLI は「KV ストア (どこに鍵を置くか) × Vault API クライアント (どの Vault を操作するか)」の 2 つを組み立て、`internalVault.New` で束ねてから操作する。`cmd/bank-vaults/common.go:81` の `kvStoreForConfig` が `--mode` フラグで分岐し、クラウドごとの KV 実装を返す。

## 内部実装の素材

### 中核データ構造

1. `Vault` interface — `internal/vault/operator_client.go:44`。`Init` / `Unseal` / `Sealed` / `Configure` / `RaftJoin` / `Leader` など、CLI が叩く操作の総和。CLI 側はこの interface 越しにしか Vault を触らない。
2. `vault` 構造体 — `internal/vault/operator_client.go:120`。`keyStore KVService` / `cl *api.Client` (HashiCorp Vault API クライアント) / `config *Config` / `externalConfig *externalConfig` / `rotateCache map[string]bool` を保持。`New` は `operator_client.go:130`、`SecretShares < SecretThreshold` を弾くバリデーション付き。
3. `Config` 構造体 — `internal/vault/operator_client.go:61`。`SecretShares` / `SecretThreshold` (Shamir 分割数と閾値)、`InitRootToken`、`StoreRootToken`、`PreFlightChecks`。
4. `externalConfig` 構造体 — `internal/vault/operator_client.go:89`。`configure` が読む YAML を mapstructure でデコードする受け皿。`Audit` / `Auth` / `Groups` / `Plugins` / `Policies` / `Secrets` / `StartupSecrets` と `PurgeUnmanagedConfig` (`operator_client.go:76` の `purgeUnmanagedConfig`)。
5. `kv.Service` interface — `pkg/kv/kv.go:53`。`Set(ctx, key, value)` と `Get(ctx, key)` の 2 メソッドだけ。全 KV バックエンドの共通契約。コメントに「整合性やセキュリティ特性は実装次第で保証しない」と明記。

### 代表操作を端から端まで: `bank-vaults unseal`

unseal は本プロジェクトの看板機能。Vault は起動直後 sealed (鍵がメモリにない封印状態) で、unseal キーを閾値ぶん投入して解錠する。bank-vaults はそのキーをクラウド KMS で暗号化してオブジェクトストレージに置き、Pod 内で自動再投入する。流れ:

1. `cmd/bank-vaults/unseal.go:50` の `unsealCmd.Run`。`--mode` などのフラグを `unsealCfg` に詰める (`unseal.go:65-72`)。
2. `store, err := kvStoreForConfig(ctx, c)` (`unseal.go:74`) が `cmd/bank-vaults/common.go:81` に降りる。`--mode aws-kms-s3` の場合、S3 backend を `s3.New` で作り、SSE 種別に応じて `awskms.New` で包んで `multi.New(services)` を返す (`common.go:106-185`)。鍵を「S3 に置く層」と「KMS で暗号化する層」に分離している。
3. `cl, err := vault.NewRawClient()` (`unseal.go:80`) で vault-sdk 経由の HashiCorp Vault API クライアントを生成。
4. `v, err := internalVault.New(ctx, store, cl, vaultConfigForConfig(c))` (`unseal.go:86`) で `vault` 構造体を組み立て。
5. メインループ (`unseal.go:137-148`)。`--auto` でなければ毎周 `unseal(ctx, unsealConfig, v)` を呼び、`unsealPeriod` (既定 5 秒, `main.go:297`) スリープして再試行する常駐ループ。
6. `unseal()` (`unseal.go:152`) は `v.Sealed()` で封印状態を確認 (`unseal.go:154`)。sealed でなければ何もしない (`unseal.go:162`)。sealed なら `v.Unseal(ctx)` (`unseal.go:170`)。
7. `(*vault).Sealed` (`operator_client.go:145`) は `v.cl.Sys().SealStatus()` を叩いて `resp.Sealed` を返す。
8. `(*vault).Unseal` (`operator_client.go:197`) が核心。`for i := 0; ; i++` で `keyUnsealForID(i)` (= `"vault-unseal-0"` など, `operator_client.go:687`) を `keyStore.Get` で取得 (`operator_client.go:201`)。KV が awskms 実装なら、ここで S3 から暗号文を引き、KMS の `Decrypt` で復号する (後述)。
9. 取った鍵を `v.cl.Sys().Unseal(string(k))` で Vault に送る (`operator_client.go:207`)。`resp.Sealed == false` になれば return (`operator_client.go:213`)。`resp.Progress == 0` なら鍵不正として error (`operator_client.go:218`)。閾値に達するまで次の鍵を順に投入。
10. 関数冒頭に `defer runtime.GC()` (`operator_client.go:198`)。復号した鍵バイト列をメモリから早めに掃除する意図。

awskms バックエンド側の Get/Decrypt:

- `(*awsKMS).Get` (`pkg/kv/awskms/awskms.go:86`) は内側 store (S3) から暗号文を取り、`a.decrypt` を呼ぶ。
- `(*awsKMS).decrypt` (`pkg/kv/awskms/awskms.go:72`) が `a.kmsService.Decrypt` を `EncryptionContext` 付きで実行し、平文を `TrimSpace` して返す。
- 書き込み側は `Set` (`awskms.go:109`) が `encrypt` (`awskms.go:95`) で KMS `Encrypt` してから S3 に置く。鍵は S3 上では常に暗号文。

### `configure` のデコード安全弁 (非自明な設計判断)

`(*vault).Configure` (`operator_client.go:462`) は YAML を `externalConfig` にデコードするとき、mapstructure decoder に `ErrorUnused: true` を設定している (`operator_client.go:574`)。直前のコメント (`operator_client.go:572-573`) は「purge config が有効なときに設定キーの typo が Vault 上の削除を招くのを防ぐ安全策」と述べる。未知キーを黙って無視せずエラーにする。`purgeUnmanagedConfig` (`operator_client.go:76`) を有効化すると「YAML に書いていない Vault 上の設定」を削除しに行くため、typo が意図しない削除になりうる。それを未然に塞ぐ判断。

### 非自明な設計判断のまとめ

- KV ストアの 2 層化 (envelope encryption)。`awskms` 等の KMS 実装は `kv.Service` を実装しつつ内部に別の `kv.Service` (S3/GCS/OSS/OCI オブジェクトストア) を抱える (`awskms.go:36-43` の `store kv.Service` フィールド)。unseal の経路を変えずにバックエンドを差し替えられ、unseal キーは保管層では常に KMS 暗号文。
- `multi` ストア (`pkg/kv/multi/multi.go`) で複数リージョンの S3 に同じ鍵を多重化できる (`common.go:185` の `multi.New(services)`)。
- root token 不在運用。`StoreRootToken=false` のとき `Configure` は generate-root フローを毎回起こし、unseal/recovery キーで一時 root token を組み立て、OTP と XOR して復元し (`operator_client.go:500-557`)、使用後に `defer v.cl.SetToken("")` と `defer func(){ rootToken = nil }()` と `defer runtime.GC()` で消す (`operator_client.go:560-562`)。root token をどこにも永続化しない選択肢を持つ。
- HSM 対応 (`--mode hsm` / `hsm-k8s`)。PKCS#11 デバイスで鍵を扱える (`common.go:279-315`)。

## 採用事例の素材

`ADOPTERS.md` に本番採用組織が明記 (出典: リポジトリ内 `ADOPTERS.md`, 参照 2026-06-26)。捏造なし、ファイル記載のみ:

- Aspect (Aspect Via Cloud Contact Centre)
- Outshift (by Cisco)
- Mintel
- PhishLabs
- Postman (K8s 上の HA vault 管理)
- PITS Global Data Recovery Services
- Pulselive
- Samarkand Global
- SHE BASH LLC (米国防総省環境向け)
- Thought Machine (次世代コアバンキングエンジン Vault)
- Tinkoff (Vault Secrets Webhook)
- TripleLift
- Vase.ai
- ViaBill
- Vonage (AWS KMS/S3/DynamoDB、raft 移行予定)
- Wildlife Studios (十数クラスタで Webhook + vault-env / vault-agent)

GitHub シグナル (GitHub API, 参照 2026-06-26): stars 2,257 / forks 485 / open issues 13 / contributors エントリ 213 (匿名含めると 245)。作成 2018-03-07、最終 push 2026-06-22。

maintainer は 7 名 + alumni 3 名 (`MAINTAINERS.md`)。Outshift (Cisco) 所属が中心だが、OpenMeter・hipages・Jenkins X・個人など複数組織に分散。lead は Mark Sagi-Kazar (sagikazarmark)。

## 代替・エコシステム

- 依存: HashiCorp Vault が前提 (CLI は Vault API を叩くだけ)。CNCF プロジェクトには直接依存しない (CNCF 申請 issue の記述)。
- 隣接 / 代替:
  - External Secrets Operator (ESO): 外部 secret store を Kubernetes Secret に同期する。bank-vaults の Webhook は Kubernetes Secret を経由せず Pod メモリに直接注入する点が本質的に違う (出典: <https://bank-vaults.dev/docs/mutating-webhook/>、ESO とのアプローチ差は CNCF 申請 issue でも言及)。
  - HashiCorp 公式 Vault Agent Injector / Vault Secrets Operator: Vault 公式の Pod 注入・同期手段。bank-vaults はそれより広いスコープ (Vault 自体の operator + unseal 自動化 + CLI) を持つ。両 webhook の比較は <https://bank-vaults.dev/docs/mutating-webhook/webhooks-comparision/>。
- 統合先: AWS KMS+S3 / Google Cloud KMS+GCS / Azure Key Vault / Alibaba KMS+OSS / Oracle KMS / Kubernetes Secret / HSM / 別 Vault / ローカルファイル (`cmd/bank-vaults/main.go:39-52` の mode 定数)。Velero でのバックアップ、Prometheus でのメトリクス公開 (`cmd/bank-vaults/metrics.go`) も対応。
- tagline 案 (EN): Automates initializing, unsealing, and configuring HashiCorp Vault, keeping unseal keys encrypted with cloud KMS for Kubernetes.
- tagline 案 (JA): HashiCorp Vault の初期化・unseal・設定を自動化し、unseal キーをクラウド KMS で暗号化して保管する Kubernetes 向けツール群。

## 最小セットアップ (getting-started 素材)

ローカルでビルドして dev モードの Vault を unseal/init する最短手順。出典: `README.md` の Development 節、`Makefile:31-33`、`cmd/bank-vaults/main.go` の mode 定義。

1. ビルド (Go 1.26+ が必要):

    ```bash
    cd research/bank-vaults/src
    make build
    ```

2. 別端末で開発用 Vault を起動 (HashiCorp Vault バイナリが必要):

    ```bash
    vault server -dev -dev-root-token-id=root
    ```

3. file モードで init (鍵を平文ファイルに置く。開発用途のみ):

    ```bash
    export VAULT_ADDR=http://127.0.0.1:8200
    ./build/bank-vaults init --mode file --file-path ./vault-keys
    ```

`--mode k8s` が CLI 既定 (`main.go:196` の既定値) なので、ローカルでは `--mode file` か `--mode dev` を明示する。本番は `--mode aws-kms-s3` などクラウド KMS モードを使う。
