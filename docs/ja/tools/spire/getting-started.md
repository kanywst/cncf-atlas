# はじめに

> コミット `73215a39` (タグ `v1.15.1` の近傍) のソースに基づく。コマンドは Go とシェルを備えた Linux または macOS ホストを想定。下の join トークン方式はサーバと agent を 1 台で動かす。

## 前提

- Go (モジュールは `go 1.26.4` を対象、`go.mod:3`)、またはビルド済みのリリース tarball。
- サーバと agent が agent socket 用ディレクトリを共有できる POSIX ホスト。

## インストール

ソースから 2 つのバイナリをビルドする。

```bash
make build
```

これで `bin/spire-server` と `bin/spire-agent` が生成される (`Makefile:256`、`build: tidy $(addprefix bin/,$(binaries))`)。代わりに [releases ページ](https://github.com/spiffe/spire/releases) からリリース tarball を取得してもよい。

## 最初の動く構成

1. サンプル設定でサーバを起動する。`conf/server/server.conf` は `trust_domain`・`data_dir` と `DataStore`・`KeyManager`・`NodeAttestor` プラグインを設定する。`conf/server/server_full.conf` に全項目の例がある。

```bash
bin/spire-server run -config conf/server/server.conf
```

1. agent 用の join トークンを生成する。このトークンが agent のノード attestation のブートストラップクレデンシャルになる。

```bash
bin/spire-server token generate -spiffeID spiffe://example.org/myagent
```

1. そのトークンと、サンプルの agent 設定 `conf/agent/agent.conf` で agent を起動する。

```bash
bin/spire-agent run -config conf/agent/agent.conf -joinToken <token>
```

1. 登録エントリを作る。「agent の SPIFFE ID の下で uid 1000 で動くワークロードに `spiffe://example.org/myworkload` を発行する」という宣言だ。

```bash
bin/spire-server entry create \
  -parentID spiffe://example.org/myagent \
  -spiffeID spiffe://example.org/myworkload \
  -selector unix:uid:1000
```

## 動作確認

該当する uid で Workload API を呼んで SVID を取得する。`-socketPath` には agent が設定した socket を指定する (サンプル設定では temp ディレクトリ配下のパス)。

```bash
bin/spire-agent api fetch x509 -socketPath <agent-socket-path>
```

正常なら SPIFFE ID・SVID 証明書・その bundle が表示される。呼び出しにクレデンシャルは提示しない。agent が socket の peer credential から呼び出し元の uid を読む。

## 次に読むもの

実際のノード attestor の選択 (Kubernetes・AWS・GCP・TPM)、永続 datastore、HA、信頼ドメイン間 federation などの本番運用は、[SPIFFE Kubernetes クイックスタート](https://spiffe.io/docs/latest/try/getting-started-k8s/) とリポジトリの `doc/` ディレクトリを参照。このページはローカルの join トークン方式だけを扱う。
