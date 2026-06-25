# はじめに

> `main` 開発線 (`v2.0.0-alpha.1`、`internal/version/version.go:18`) で検証。コマンドは Unix シェルと push 可能な OCI レジストリを想定。

## 前提

- ソースからビルドするなら Go `>= 1.24` ([source 12](https://github.com/notaryproject/notation/blob/main/building.md))。
- Referrers API か Referrers tag schema に対応したレジストリに push できる OCI アーティファクト。
- `git` と `make`。

## インストール

ソースからビルドしてインストールする。`make install` はバイナリを `~/bin/notation` に置く ([source 12](https://github.com/notaryproject/notation/blob/main/building.md)):

```bash
git clone https://github.com/notaryproject/notation.git
cd notation
make install
```

その後 `notation` が見つからなければ `~/bin` を `PATH` に追加する:

```bash
export PATH="$HOME/bin:$PATH"
```

## 最初の動く構成

ローカルのアーティファクトに自前のテスト鍵で署名し、検証する。

1. バイナリが動くか確認する。

    ```bash
    notation version
    ```

1. 署名鍵と自己署名証明書を生成し trust store に登録する。署名前に署名鍵の設定が必要だ (`cmd/notation/sign.go:68`)。

    ```bash
    notation cert generate-test --default "wabbit-networks.io"
    ```

1. アーティファクトにダイジェストで署名する。署名はダイジェストに固定され、タグ参照には可変性の警告が出る (`cmd/notation/sign.go:167`)。参照は自分のものに置き換える。

    ```bash
    notation sign $REGISTRY/$REPO@$DIGEST
    ```

    成功時の出力 (`cmd/notation/sign.go:186-187`):

    ```text
    Successfully signed <registry>/<repo>@sha256:...
    Pushed the signature to <registry>/<repo>@sha256:...
    ```

1. trust policy を追加する。検証には trust store の証明書と trust policy が必要だ (`cmd/notation/verify.go:51`)。失効と expiry を強制するため検証レベルは `strict` にする ([source 4](https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md)、[source 9](https://github.com/notaryproject/specifications/security/advisories/GHSA-57wx-m636-g3g8))。

    ```bash
    notation policy import ./trustpolicy.json
    ```

1. 署名を検証する。

    ```bash
    notation verify $REGISTRY/$REPO@$DIGEST
    ```

## 動作確認

`notation verify` が成功すると exit 0 で検証済みアーティファクトを報告する。失敗時は検証エラーをまとめて出力し非ゼロを返す (`cmd/notation/verify.go:147-153`)。アーティファクトに紐づく署名は `notation list <reference>` で一覧できる。

## 次に読むもの

- 検証レベルを含む trust store / trust policy リファレンス ([source 4](https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md))。
- `permissive` が危険で、短い expiry と `strict` が推奨される理由を示す rollback 攻撃の advisory ([source 9](https://github.com/notaryproject/specifications/security/advisories/GHSA-57wx-m636-g3g8))。
- プラグインによる KMS / HSM 鍵での署名、RFC 3161 TSA によるタイムスタンプ ([source 1](https://github.com/notaryproject/notation))。
