# はじめに

> ドキュメント基準コミット `991bacf` (リリース系列 `v4.11.2`) で検証済み。コマンドは Rust ツールチェーン (ワークスペースは `Cargo.toml:62` で最小サポート Rust バージョン 1.89 を設定) を想定。

## 前提

- Rust と Cargo (`rustup` 推奨)、Rust 1.89 以上。
- Git。CLI のウォークスルーでリポジトリを clone するため。

## インストール

Rust アプリケーションから Cedar を使うには SDK クレートを追加する (README:37):

```bash
cargo add cedar-policy
```

`cedar` コマンドラインツールを得るには CLI クレートをインストールする:

```bash
cargo install cedar-policy-cli
```

これで `cedar` バイナリがビルドされる。下のウォークスルーは代わりに clone から直接 CLI を実行し、グローバルインストールを避ける。これはリポジトリ自身のクイックスタートに一致する。

## 最初の動く構成

README のクイックスタート (README:51-128) を再現する。1 つのポリシーと小さなエンティティ集合に対してリクエストを認可する。

1. リポジトリを clone して入る。

   ```bash
   git clone https://github.com/cedar-policy/cedar.git
   cd cedar
   ```

2. permit ルールを 1 つ持つ `policy.cedar` を作る。

   ```cedar
   permit (
     principal == User::"alice",
     action == Action::"view",
     resource in Album::"jane_vacation"
   );
   ```

3. ユーザと写真を記述する `entities.json` を作る。

   ```json
   [
       {
           "uid": { "type": "User", "id": "alice"} ,
           "attrs": {"age": 18},
           "parents": []
       },
       {
           "uid": { "type": "Photo", "id": "VacationPhoto94.jpg"},
           "attrs": {},
           "parents": [{ "type": "Album", "id": "jane_vacation" }]
       },
       {
           "uid": { "type": "Photo", "id": "SecretPhoto94.jpg"},
           "attrs": {},
           "parents": [{ "type": "Album", "id": "jane_secrets" }]
       }
   ]
   ```

4. 許可されるべき認可リクエストを実行する。

   ```bash
   cargo run --bin cedar authorize \
       --policies policy.cedar \
       --entities entities.json \
       --principal 'User::"alice"' \
       --action 'Action::"view"' \
       --resource 'Photo::"VacationPhoto94.jpg"'
   ```

   期待される出力:

   ```text
   ALLOW
   ```

## 動作確認

別アルバムの写真に対して同じコマンドを実行する。拒否されるはずである (README:113-128):

```bash
cargo run --bin cedar authorize \
    --policies policy.cedar \
    --entities entities.json \
    --principal 'User::"alice"' \
    --action 'Action::"view"' \
    --resource 'Photo::"SecretPhoto94.jpg"'
```

期待される出力:

```text
DENY
```

最初のリクエストが許可されるのは、`VacationPhoto94.jpg` がポリシーの許す `Album::"jane_vacation"` の子だからである。2 つ目が拒否されるのは、`SecretPhoto94.jpg` が `Album::"jane_secrets"` に属し、どのポリシーも許可しないため既定の deny が適用されるからである。

## 次に読むもの

- Cedar Policy Language Reference Guide はポリシー構文・スキーマ・検証の全体を扱う: [`docs.cedarpolicy.com`](https://docs.cedarpolicy.com/) (src 7)。
- `cedar-examples` リポジトリ (TinyTodo アプリを含む) は、実際の Rust サービスに組み込まれた Cedar を示す (README:132)。
- ポリシーの静的解析については、[内部実装](./internals) で扱う記号コンパイラクレート `cedar-policy-symcc` を参照。
