# Bank-Vaults

> Bank-Vaults は HashiCorp Vault の初期化・unseal・設定を自動化し、unseal キーをクラウド Key Management Service (KMS) で暗号化して保管する Kubernetes 向けツール群である。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [bank-vaults/bank-vaults](https://github.com/bank-vaults/bank-vaults)
- **ドキュメント基準コミット**: `2248b7b` (タグ v1.33.1 近傍, 2026-06-22)

## 何をするものか

Bank-Vaults は Cloud Native な secret 管理を担う umbrella プロジェクトの中心にある Command Line Interface (CLI) である。HashiCorp Vault は起動直後に sealed (封印) 状態で、暗号鍵がメモリになく、十分な unseal キーを投入するまで secret を一切返さない。Bank-Vaults はこの手作業をなくす。unseal キーと root token をクラウド KMS で暗号化して保管し、Vault が sealed になるたびにキーを再投入する sidecar または job として動く。

CLI は Vault サーバーに対して 3 つの仕事をする。`init` は最初の unseal キーと root token を作り、`unseal` は sealed な Vault にキーを返し、`configure` は YAML から宣言的な Vault 設定を適用する。各仕事は 2 つの部品から組み立てられる。鍵の保管先を決める key-value (KV) ストアと、操作対象の Vault を決める Vault Application Programming Interface (API) クライアントである。

ここで扱うリポジトリは CLI 部分だけである。より広いプロジェクトには、Custom Resource Definition (CRD) 経由で Kubernetes 上に Vault をプロビジョニングする [Vault Operator](https://github.com/bank-vaults/vault-operator)、secret を Pod のメモリへ直接注入する [Secrets Webhook](https://github.com/bank-vaults/secrets-webhook)、CLI 自身が import する [Vault SDK](https://github.com/bank-vaults/vault-sdk) も含まれる。

## いつ使うか

- HashiCorp Vault を Kubernetes 上で運用し、Pod 再起動後に運用者がキーを打ち込まなくても自動で unseal させたいとき。
- unseal キーと root token を、AWS KMS / Google Cloud KMS / Azure Key Vault / Alibaba KMS / Oracle KMS / Hardware Security Module (HSM) で暗号化した暗号文としてオブジェクトストレージに置きたいとき。
- Vault のポリシー・auth メソッド・secret エンジン・audit デバイスを YAML で宣言的に定義し、1 コマンドで適用したいとき。
- HashiCorp Vault をそもそも使わないなら向かない。Bank-Vaults は Vault を駆動するもので、Vault の代替ではない。
- 単に secret を Kubernetes Secret オブジェクトへ同期したいだけなら向かない。その用途は External Secrets 系の同期の方が近い。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. bank-vaults/bank-vaults リポジトリ: <https://github.com/bank-vaults/bank-vaults>
2. CNCF プロジェクトページ (Bank-Vaults): <https://www.cncf.io/projects/bank-vaults/>
3. CNCF Sandbox 申請 issue (cncf/sandbox#54): <https://github.com/cncf/sandbox/issues/54>
4. Bank-Vaults 公式ドキュメント: <https://bank-vaults.dev/>
5. Secret injection webhook ドキュメント: <https://bank-vaults.dev/docs/mutating-webhook/>
6. Banzai Cloud と HashiCorp の webhook 比較: <https://bank-vaults.dev/docs/mutating-webhook/webhooks-comparision/>
7. 旧リポジトリ banzaicloud/bank-vaults: <https://github.com/banzaicloud/bank-vaults>
8. Vault Operator ブログ記事 (Outshift by Cisco): <https://outshift.cisco.com/blog/vault-operator/>
9. ADOPTERS.md: <https://github.com/bank-vaults/bank-vaults/blob/main/ADOPTERS.md>
10. MAINTAINERS.md: <https://github.com/bank-vaults/bank-vaults/blob/main/MAINTAINERS.md>
