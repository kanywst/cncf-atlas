# はじめに

> タグ v1.33.1 (コミット `2248b7b`) で検証済み。コマンドは Go と HashiCorp Vault バイナリが入った Unix シェルを想定。

## 前提

- Go 1.26 以降 (`go.mod:3` が `go 1.26.3` を指定)。
- HashiCorp Vault バイナリが `PATH` 上にあること (dev サーバー用)。
- リポジトリのチェックアウト。以下の手順はそのルートで実行する。

## インストール

CLI をソースからビルドする。`make build` は `go build -race -o build/ ./cmd/bank-vaults` を実行する (`Makefile:31`)。

```bash
git clone https://github.com/bank-vaults/bank-vaults.git
cd bank-vaults
make build
```

バイナリは `./build/bank-vaults` に出力される。

## 最初の動く構成

dev Vault を起動し、キーを平文ファイルに置く `--mode file` を使う。ローカル検証専用で、本番では `aws-kms-s3` などのクラウド KMS モードを使う。

1. 1 つ目の端末で dev Vault サーバーを起動する。

    ```bash
    vault server -dev -dev-root-token-id=root
    ```

2. 2 つ目の端末で CLI をそのサーバーに向け、file モードで初期化する。

    ```bash
    export VAULT_ADDR=http://127.0.0.1:8200
    ./build/bank-vaults init --mode file --file-path ./vault-keys
    ```

    これで unseal キーと root token が生成され、`./vault-keys` プレフィックスの下に書き込まれる。既定の mode は `k8s` なので (`cmd/bank-vaults/main.go:196`)、クラスタ外で動かすときは `--mode file` を明示する必要がある。

3. 同じサーバーに対して unseal ループを実行する。

    ```bash
    ./build/bank-vaults unseal --mode file --file-path ./vault-keys
    ```

    dev Vault は unseal 済みで起動するため、ループは Vault が sealed でないとログに出して待機する。非 dev の Vault では各 `vault-unseal-N` キーをファイルから読んで投入する。

## 動作確認

Vault CLI で seal 状態を直接確認する:

```bash
VAULT_ADDR=http://127.0.0.1:8200 vault status
```

`Sealed false` なら unseal 済みである。Bank-Vaults のログでは `vault is not sealed` (sealed なインスタンスなら `successfully unsealed vault`) の行がループの正常動作を示す (`cmd/bank-vaults/unseal.go:163`、`cmd/bank-vaults/unseal.go:176`)。

## 次に読むもの

クラウド KMS モード・raft による HA・Vault Operator の CRD・Secrets Webhook などの本番運用は公式ドキュメント <https://bank-vaults.dev/> を参照。webhook の挙動と HashiCorp の injector との比較は <https://bank-vaults.dev/docs/mutating-webhook/> にある。
