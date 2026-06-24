# recon: cert-manager

調査メモ。自分用の密度。出典は `sources.md` の番号と対応。`file:line` は pinned commit 基準。

## 基本情報

- repo: `cert-manager/cert-manager` (旧 `jetstack/cert-manager`、v1.8 より前の import path は `github.com/jetstack/cert-manager`) (出典 1, 7)
- pinned commit: `dbc027ee2a7ded1fa109ed63e631ba35cd83b6cf` (master, 2026-06-19) / 近いタグ: `v1.21.0-alpha.1` (2026-06-05、HEAD はこれより後の未タグ master)
- 言語 / ビルド: Go (`go 1.26.0`、`go.mod` 1 行目 `module github.com/cert-manager/cert-manager`) / `make` ベース (`make/` 配下に分割 makefile、Prow CI)
- ライセンス: Apache-2.0 (リポジトリ `LICENSE` 冒頭で確認、`gh repo view` も `apache-2.0`)
- CNCF 成熟度: Graduated (2024-11-12 発表) (出典 3, 4)
- カテゴリ (tools.ts CATEGORY_ORDER): Security & Compliance
- 規模: vendor 除く Go ファイル 911 個 (`find . -name '*.go' -not -path './vendor/*' | wc -l`)
- マルチモジュール: ルート module に加え `cmd/controller`・`cmd/webhook` などが独立 `go.mod` を持つ (各 `cmd/*/go.mod`)

## 歴史の素材

- 前身は Jetstack の `kube-lego` (Let's Encrypt / ACME から TLS 証明書を取得)。cert-manager はその置き換えとして書かれた。互換のため `kubernetes.io/tls-acme` アノテーションを引き継いだ (出典 2, 8)
- 設計上の転換点は CRD + カスタムコントローラ (Operator パターン) の採用。kube-lego の Ingress アノテーション駆動から、`Certificate`/`Issuer` を一級リソースにした (出典 2, 8)
- repo 作成は 2017-05-24 (`gh repo view ... createdAt`)、プロジェクト発足も 2017 とされる (出典 3)
- CNCF タイムライン: Sandbox 受理 2020-11、Incubating 昇格 2022、Graduated 2024-11-12 (KubeCon NA 2024、Salt Lake City で発表) (出典 3, 4)
- Jetstack は 2020 に Venafi が買収、Venafi は CyberArk 傘下 (商用版 TLS Protect for Kubernetes は CyberArk Certificate Manager for Kubernetes に改称) (出典 6)

## アーキテクチャの素材

3 つの常駐コンポーネント + 補助バイナリ。`cmd/` に 5 つ: `controller`・`webhook`・`cainjector`・`acmesolver`・`startupapicheck`。

- controller: 全リコンサイルループの集合。`cmd/controller/main.go:30` の `app.NewServerCommand(ctx)` が入口で、実体は別モジュール `controller-binary/app` を import。コントローラは `pkg/controller/register.go:48` の `Register(name, fn)` でグローバル map `known` に自己登録するプラグイン方式
- webhook: validating/mutating admission + conversion webhook (`pkg/webhook`、`pkg/apis/.../validation`)
- cainjector: CA 証明書を webhook/APIService の `caBundle` 等へ注入 (`pkg/controller/cainjector`、`internal/cainjector`)
- acmesolver: ACME HTTP-01 チャレンジに応答する一時 Pod (`cmd/acmesolver`)

API グループは 2 系統。`certmanager` (Certificate / CertificateRequest / Issuer / ClusterIssuer、`pkg/apis/certmanager/v1`) と `acme` (Order / Challenge、`pkg/apis/acme/v1`)。

### 代表オペレーションの end-to-end トレース (Certificate 発行)

非自明な核心: `Certificate` のリコンサイルは 1 つの巨大ループではなく、同じ `Certificate` を watch する複数の小コントローラに分割され、各々が status condition と Secret だけを介して協調する。`pkg/controller/certificates/` 配下に `trigger`・`keymanager`・`requestmanager`・`issuing`・`readiness`・`revisionmanager` が並ぶ。

1. trigger: `pkg/controller/certificates/trigger/trigger_controller.go:160` `ProcessItem`。重複 Secret 所有チェック (`:188` `CertificateOwnsSecret`)、失敗バックオフ (`:210`)、`shouldReissue` ポリシー評価 (`:225`) を経て、再発行が必要なら `Issuing` condition を True にして status 更新 (`:243` `SetCertificateCondition` -> `:244` `updateOrApplyStatus`)。ここでは CertificateRequest を作らない
2. keymanager: `Issuing=True` を見て次のリビジョン用秘密鍵 Secret を生成し `status.nextPrivateKeySecretName` を設定 (`pkg/controller/certificates/keymanager`)
3. requestmanager: `pkg/controller/certificates/requestmanager/requestmanager_controller.go:140` `ProcessItem`。`Issuing=True` 確認 (`:156`)、`nextPrivateKeySecretName` の Secret から鍵をデコード (`:180`)、既存の所有 CertificateRequest を revision/spec/失敗状態で掃除 (`:197`-`:228`)、不足していれば `:236` `createNewCertificateRequest` -> `:435` `c.client.CertmanagerV1().CertificateRequests(...).Create(...)`。CSR は秘密鍵から生成して PEM 化 (`:381` `EncodeCSR` / `:387` `pem.Encode`)、revision アノテーションを付与 (`:393`)
4. CertificateRequest signer: `IssuerRef` に応じた signer が処理。ACME の場合 `pkg/controller/certificaterequests/acme/acme.go:118` `Sign`。CSR をデコード (`:122`)、CommonName が SAN に含まれるか検証 (`:133`)、`buildOrder` で期待 Order を構築 (`:145`)、未存在なら `:160` で `Order` リソースを Create して CertificateRequest を Pending に
5. acmeorders / acmechallenges: `pkg/controller/acmeorders`・`pkg/controller/acmechallenges` が Order を ACME サーバへ発注し Challenge (HTTP-01/DNS-01) を解く。acmesolver Pod が HTTP-01 に応答。完了で発行済み証明書を CertificateRequest の status に書き戻す
6. issuing: 署名済み証明書を本番 Secret に書き込み、`Issuing` condition を外す (`pkg/controller/certificates/issuing`)。readiness が `Ready` condition を更新

other signer: `ca`・`selfsigned`・`vault`・`venafi` (`pkg/controller/certificaterequests/`)。外部 issuer は CertificateRequest を介して別プロセスが署名できる (approver/checks 含む)。

## 内部実装の素材

重要ディレクトリ:

- `pkg/apis/` API 型定義 (certmanager / acme / config / meta / experimental)、`zz_generated.deepcopy.go` は生成物
- `pkg/controller/` 全リコンサイラ。`register.go` でプラグイン登録、`context.go` に共有依存を束ねる `Context`
- `pkg/issuer/` issuer 抽象、`pkg/acme/` ACME クライアントラッパ
- `internal/` 外部非公開ロジック (controller・cainjector・cmd・pem・kube・informers)
- `cmd/` バイナリ入口 (各々独立 module)

中核データ構造:

- `CertificateSpec` `pkg/apis/certmanager/v1/types_certificate.go:133` / `CertificateStatus` `:646` (conditions・revision・renewalTime・nextPrivateKeySecretName を保持し micro-controller 間の調停面になる)
- `CertificateRequestSpec` `pkg/apis/certmanager/v1/types_certificaterequest.go:111` (CSR PEM = `Request`、`IssuerRef`、`Duration`、`IsCA`)。発行の中間表現で issuer 横断の共通契約
- `IssuerConfig` `pkg/apis/certmanager/v1/types_issuer.go:106` (`ACME`/`CA`/`Vault`/`SelfSigned`/`Venafi` の oneof 的 union、`:100` `IssuerSpec`)
- `Order` `pkg/apis/acme/v1/types_order.go:39` (`OrderSpec` `:58`) と `Challenge` `pkg/apis/acme/v1/types_challenge.go:39` (`ChallengeSpec` `:58`)。ACME プロトコル状態を CRD として永続化

非自明だった点:

- micro-controller 分割。各コントローラは 1 つの状態遷移だけを担い、`Certificate` の status condition (`Issuing`/`Ready`) と命名規約 (`nextPrivateKeySecretName`、revision アノテーション) で疎結合に協調する。1 リコンサイラに詰め込むより観測・テストしやすい代わりに、状態がリソース間に散る
- 決定論的命名のリスクをコード自身がコメントしている。`StableCertificateRequestName` feature gate 時は CR 名をハッシュで決定論化 (`requestmanager_controller.go:417`-`:432`)、一方 ACME signer 側 (`acme.go:186`-) には「ハッシュが公開鍵を考慮しないため名前衝突しうる」旨の TODO が残る
- ACME signer はネットワーク起因の失敗を hard fail させず Pending + バックオフにする一方、CSR デコード不能や CommonName 不整合は hard fail にして無限リトライを避ける (`acme.go:122`-`:142`)
- マルチモジュール構成。`cmd/controller` 等が独立 `go.mod` を持ち、controller 実体は `controller-binary/app` という別 module 経由

## 採用事例の素材 (出典付きのみ)

- Giant Swarm: CNCF graduation 発表で名指し。「cert-manager is an essential component in our Cluster API-based Kubernetes platform」 (出典 3)
- 集計値 (発表時、2024-11-12): 月間 5 億ダウンロード、新規本番クラスタの 86% が標準導入、450+ コントリビュータ、200+ リリース (出典 3, 4)
- GitHub stars: 13,873 / fork 2,383 (`gh repo view cert-manager/cert-manager`、2026-06-22 取得)

注: repo に `ADOPTERS` ファイルは無し (`find -iname adopters*` ヒット 0)。名指し採用は CNCF 発表の Giant Swarm のみ確実。これ以上は未確認なので捏造しない。

## 代替・エコシステム

- 補完 (代替ではない): trust-manager (CA バンドル配布、同じ cert-manager org)、external-secrets (外部シークレット同期)。併用が普通 (出典 5)
- 統合先 issuer: Let's Encrypt (ACME)、HashiCorp Vault PKI、Venafi/CyberArk、CyberArk Certificate Manager、EJBCA、自己署名 / 社内 CA。Ingress / Gateway API と連携 (出典 1, 5)
- 商用上位: CyberArk Certificate Manager for Kubernetes (旧 Venafi TLS Protect、cert-manager の上に discovery・ポリシー・FIPS・商用サポートを足す)、Keyfactor (cert-manager issuer 経由で k8s 対応) (出典 5, 6)
- 真の代替: HashiCorp Vault PKI は短命証明書を API でオンデマンド発行する別哲学だが、k8s では Vault + cert-manager の併用が定番。エンタープライズ CLM (Venafi/Keyfactor) は per-identity 課金が ephemeral な k8s でスケールしにくい点が cert-manager の OSS 優位 (出典 5)
- 立ち位置: in-cluster Kubernetes 証明書自動化の事実上の標準 (出典 5)

## インストールと最小構成

- Helm: `helm repo add jetstack https://charts.jetstack.io` -> `helm install cert-manager jetstack/cert-manager --namespace cert-manager --create-namespace --set crds.enabled=true`。または `kubectl apply -f` で静的マニフェスト (出典 1)
- 最小動作確認: `selfsigned` または `ca` Issuer を 1 つ作り、`Certificate` を 1 つ apply して Secret が生成されることを見るのが外部依存なしで速い。ACME は到達可能な DNS とドメイン所有が要る (出典 1)
