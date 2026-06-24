# はじめに

> v1.x 系 (pin したコミット `f75131f`) で検証済み。コマンドは Unix シェルを想定。

## 前提

- macOS または Linux のシェル。
- Homebrew (macOS インストール用) または `curl` (バイナリ直取得用)。

## インストール

```bash
# macOS (Homebrew)
brew install opa

# あるいは static バイナリ直取得 (Linux amd64)
curl -L -o opa https://openpolicyagent.org/downloads/latest/opa_linux_amd64_static
chmod +x opa
```

## 最初の動く構成

実際の判定への最短経路は、ポリシーファイル・input ファイル・`opa eval` 1 回である。

1. ポリシーを書く。`policy.rego` として保存。

   ```text
   package example

   default allow := false

   allow if input.user == "admin"
   ```

2. input を書く。`input.json` として保存。

   ```json
   { "user": "admin" }
   ```

3. ポリシーを input に対して評価する。

   ```bash
   opa eval -d policy.rego -i input.json "data.example.allow"
   ```

   結果セットは `data.example.allow` に `true` を返す。`user` を別の値にすると `false` を返す。

## 動作確認

OPA をサーバとして起動し、同じ問いを HTTP 経由で投げる。

```bash
opa run --server
```

別端末から input を decision path に POST する。

```bash
curl localhost:8181/v1/data/example/allow -d @input.json
```

OPA 1.0 以降、サーバは既定で localhost にバインドする点に注意。外部公開には `--addr` の明示が必要である ([openpolicyagent.org docs](https://www.openpolicyagent.org/docs)、[OPA 1.0 ブログ](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368))。

## 次に読むもの

このページが扱わない本番運用は [公式ドキュメント](https://www.openpolicyagent.org/docs) が網羅する。bundle の HTTP/OCI 配布、decision logging、status プラグイン、署名と検証、Go SDK による OPA の埋め込みなど。
