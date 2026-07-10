# External Secrets Operator

> External Secrets Operator (ESO) は、AWS Secrets Manager・HashiCorp Vault・GCP Secret Manager といった外部のシークレットストアから値を読み、ネイティブな Kubernetes Secret に同期する。真実の源はクラスタ外に置いたまま、アプリは通常どおり Secret を利用できる。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Sandbox (2022-07-26 受理)
- **言語**: Go (`go 1.26.4`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [external-secrets/external-secrets](https://github.com/external-secrets/external-secrets)
- **ドキュメント基準コミット**: `e100613` (チャートタグ `helm-chart-2.7.0` 近傍, 2026-06-26)

## 何をするものか

External Secrets Operator は、外部のシークレットマネージャが持つ値とネイティブな `Secret` オブジェクトを同期させ続ける Kubernetes コントローラである。ストア名と取得したいキーを指定した `ExternalSecret` を宣言すると、オペレータがその値を取得し、Pod が通常どおりマウント・参照する Kubernetes `Secret` を書き込む。真実の源は外部ストアのままで、クラスタは一定間隔でリフレッシュされる同期コピーを保持する。

この設計は、素朴なやり方だと混ざってしまう 2 つの関心事を分離する。`SecretStore` (または `ClusterSecretStore`) が 1 つのバックエンドへの接続と認証を持つ。`ExternalSecret` が何をどこへ同期するかを記述する。この分離により、1 つのストア定義が多数の `ExternalSecret` を支え、バックエンドへ到達するための認証情報がシークレットごとに繰り返されず 1 箇所に収まる (`README.md`, `apis/externalsecrets/v1/secretstore_types.go`)。

オペレータはプロバイダインタフェースを通して多数のバックエンドに対応する。`providers/v1/` 配下に 41 個のプロバイダがツリー内で同梱され、AWS Secrets Manager と Parameter Store、HashiCorp Vault と OpenBao、GCP Secret Manager、Azure Key Vault、IBM Cloud、Akeyless、CyberArk Conjur、1Password、Doppler、Bitwarden などをカバーする。逆方向にも動く。`PushSecret` は Kubernetes Secret をプロバイダへ書き戻す。

## いつ使うか

- 外部のマネージャ (AWS・Vault・GCP・Azure ほか) にシークレットを置いており、各アプリをバックエンドの SDK に配線せず Kubernetes Secret として利用したい。
- Argo CD や Flux で GitOps を運用しており、実際の値は外部ストアに残したまま `ExternalSecret` の参照を Git にコミットしたい。
- シークレットを多数の namespace へ展開したい (`ClusterExternalSecret`)、あるいはクラスタで生成した値をプロバイダへ書き戻したい (`PushSecret`)。
- 1 つのストア定義とバックエンド認証情報の 1 組で、クラスタ全体の多数のシークレットを賄いたい。
- シークレット素材を etcd にそもそも置きたくないという要件が主目的なら不向き。ESO は常に Kubernetes `Secret` を実体化する。Secrets Store CSI Driver は Secret を作らず Pod に値をマウントするため、その制約にはより合う。
- シークレットマネージャそのものではない。ESO は外部バックエンドを読み書きするが、原本を保管しない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと同期の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く同期。

## 出典

1. [external-secrets/external-secrets (GitHub)](https://github.com/external-secrets/external-secrets) (参照 2026-07-09)
2. [External Secrets Operator ソース (固定コミット e100613)](https://github.com/external-secrets/external-secrets/tree/e1006131b195afa4138e6cc815e1168f533ce95c) (参照 2026-07-09)
3. [CNCF プロジェクトページ: External Secrets](https://www.cncf.io/projects/external-secrets/) (参照 2026-07-09)
4. [External Secrets Operator Accepted into the CNCF Sandbox (Container Solutions)](https://blog.container-solutions.com/external-secrets-operator-accepted-into-the-cncf-sandbox) (参照 2026-07-09)
5. [The Birth of the External Secrets Community (Container Solutions)](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community) (参照 2026-07-09)
6. [Kubernetes External Secrets (GoDaddy engineering)](https://www.godaddy.com/resources/news/kubernetes-external-secrets) (参照 2026-07-09)
7. [ADOPTERS.md](https://github.com/external-secrets/external-secrets/blob/main/ADOPTERS.md) (参照 2026-07-09)
8. [[HEALTH]: External Secrets Operator (CNCF TOC #1819)](https://github.com/cncf/toc/issues/1819) (参照 2026-07-09)
9. [External Secrets Operator ドキュメント (external-secrets.io)](https://external-secrets.io) (参照 2026-07-09)
