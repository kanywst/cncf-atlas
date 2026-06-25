# 内部実装

> コミット `dbc027ee` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

リポジトリはマルチモジュールである。ルートモジュールは `github.com/cert-manager/cert-manager` (`go.mod:1`、`go 1.26.0` は `go.mod:3`)、`cmd/*` 配下のいくつかのバイナリは独自の `go.mod` を持つ。controller バイナリは実体に至るまでに別モジュール `controller-binary/app` を経由する (`cmd/controller/main.go:26`)。

| パス | 責務 |
| --- | --- |
| `pkg/apis/` | API 型定義: certmanager・acme・config・meta・experimental。`zz_generated.deepcopy.go` は生成物 |
| `pkg/controller/` | 全リコンサイラ。`register.go` がプラグイン登録、`context.go` が共有依存を束ねる |
| `pkg/controller/certificates/` | micro-controller 群: trigger・keymanager・requestmanager・issuing・readiness・revisionmanager |
| `pkg/controller/certificaterequests/` | issuer 別の signer: acme・ca・selfsigned・vault・venafi、加えて approver と checks |
| `pkg/controller/acmeorders`, `pkg/controller/acmechallenges` | ACME Order / Challenge のリコンサイラ |
| `pkg/issuer/`, `pkg/acme/` | issuer 抽象と ACME クライアントラッパ |
| `pkg/controller/cainjector/` | CA バンドル注入のリコンサイラ (補助コードは `internal/cainjector` 配下) |
| `cmd/` | バイナリ入口。各々が独立モジュール |

## 中核データ構造

システム全体は数個の型を中心に回る:

- `CertificateSpec` (`pkg/apis/certmanager/v1/types_certificate.go:133`) と `CertificateStatus` (`:646`)。status は conditions・revision・renewalTime・`nextPrivateKeySecretName` を保持し、micro-controller が読み書きする調停面になる。
- `CertificateRequestSpec` (`pkg/apis/certmanager/v1/types_certificaterequest.go:111`)。CSR (Certificate Signing Request) PEM を `Request` に持ち、`IssuerRef`・`Duration`・`IsCA` を伴う。発行の issuer 非依存な中間表現である。
- `IssuerSpec` (`pkg/apis/certmanager/v1/types_issuer.go:100`) が包む `IssuerConfig` (`:106`)。`ACME`・`CA`・`Vault`・`SelfSigned`・`Venafi` の union。
- `Order` (`pkg/apis/acme/v1/types_order.go:39`、spec は `:58`) と `Challenge` (`pkg/apis/acme/v1/types_challenge.go:39`、spec は `:58`)。ACME プロトコル状態を CRD として永続化する。

## 追う価値のあるパス

CertificateRequest が CSR になり作成されるまでを追う。`requestmanager_controller.go` の `ProcessItem` (`:140`) は `Issuing` condition がある時だけ進み (`:156`)、next-private-key Secret から秘密鍵をデコードし (`:180`)、`createNewCertificateRequest` (`:236`) に落ちる。その関数は鍵から CSR を構築し (`:381`)、PEM 化してから (`:387`) API create する (`:435`)。

```text
ProcessItem (requestmanager_controller.go:140)
  -> CertificateHasCondition Issuing (:156)
  -> DecodePrivateKeyBytes (:180)
  -> createNewCertificateRequest (:236 -> :367)
       -> pki.EncodeCSR (:381)
       -> pem.Encode CERTIFICATE REQUEST (:387)
       -> CertmanagerV1().CertificateRequests().Create (:435)
```

## 読んで驚いた点

状態が意図的にリソース間に散る。単一のコントローラが発行を所有しない。trigger が `Issuing=True` にして止まり、その後 keymanager・requestmanager・signer・issuing が status condition と命名規約から次のステップを拾う。コントローラ単位では読みやすいが、ライフサイクル全体は複数を合わせて読まないと見えない。

決定論的命名には文書化された鋭い角がある。`StableCertificateRequestName` feature gate が有効な時、CertificateRequest 名は 253 文字制限に収めるため証明書名の暗号学的ハッシュから導出される (`requestmanager_controller.go:417`-`:432`)。一方 ACME signer 側には、ハッシュがリクエストの公開鍵を考慮しないため 2 つのリクエストが名前衝突しうるという TODO が残る (`acme.go:186`-)。

ACME の失敗は原因で仕分けられる。Order の create 失敗はネットワーク起因とみなしてバックオフ・リトライする (`acme.go:158`-`:160`)、一方デコードできない CSR や SAN (Subject Alternative Name) にない CommonName は `reporter.Failed` を呼んでリトライせず返す (`acme.go:122`-`:142`)。この分離が一時的障害を恒久的失敗にせず、ユーザのミスを無限ループにしない。
