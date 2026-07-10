# はじめに

> リリース `v1.14.4` 基準。ソースからのビルドは Go 1.25.0 以上の動くツールチェインを前提とする。

## 前提

- Go 1.25.0 以上。`src/go.mod:5` がこの最低要件を pin している (`src/README.md:60`)。
- `make` と `git`。
- bind するポート。CoreDNS はデフォルトでポート 53 を listen するが、通常は特権が要る。以下の例ではそれを避けるため高めのポートを使う。

## インストール

ソースからバイナリをビルドする (`src/README.md:62-68`):

```bash
git clone https://github.com/coredns/coredns
cd coredns
make
```

これでリポジトリ直下に `coredns` バイナリができる。

## 最初の動く構成

目標は、すべてのクエリを公開上流に転送し、何をしたかをログに出すリゾルバ。

1. Corefile を書く。`.:1053` ブロックは root zone をポート 1053 で提供し、`8.8.8.8` に転送し、ログとエラー報告を有効にする。

   ```text
   .:1053 {
       forward . 8.8.8.8
       log
       errors
   }
   ```

1. その Corefile で CoreDNS を起動する。

   ```bash
   ./coredns -conf Corefile
   ```

1. 別のターミナルから問い合わせる。任意の DNS クライアントで良い。ここでは `dig` を使う。

   ```bash
   dig @127.0.0.1 -p 1053 example.com
   ```

`example.com` の answer セクションが返り、CoreDNS のターミナルに そのクエリの `log` 行が出るはずだ。

## 動作確認

- `log` プラグインはクエリ 1 件ごとに 1 行出すので、`dig` が成功すると CoreDNS の出力に対応するログが現れる。
- ブロックに `prometheus` プラグインを足すとメトリクスを公開できる。メトリクスエンドポイントが応答するか確認する。アドレスは Corefile で設定する (デフォルトは `localhost:9153`)。
- 起動時に非ゼロ終了する場合は、たいてい Corefile の parse エラーか、ポートがすでに使われているかだ。

## 次に読むもの

- プラグインリファレンスと設定構文: [coredns.io/plugins](https://coredns.io/plugins)。
- out-of-tree プラグイン: [coredns.io/explugins](https://coredns.io/explugins)。
- Kubernetes では CoreDNS はクラスタ DNS add-on として (Helm またはクラスタ manifest で) デプロイされ、`kubernetes` プラグインが `cluster.local` を解決する。スケーリング・autoscaling・セキュリティ強化など本番運用は Kubernetes と CoreDNS の公式ドキュメントを参照。
