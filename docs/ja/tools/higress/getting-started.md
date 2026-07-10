# はじめに

> コミット `bd9c4c5` (タグ `v2.2.3` の近傍) の README に対して検証。quickstart は Docker で Higress を単体起動し、Kubernetes パスは Helm を使う。

## 前提

- Docker (単体 all-in-one quickstart 用)。
- Kubernetes パスを取るなら代わりにクラスタと Helm 3。
- Higress 自身のイメージレジストリ (`higress-registry.*.cr.aliyuncs.com`) へのネットワークアクセス。README はこれらのイメージが Docker Hub でなく Higress のレジストリにあるため Docker Hub のレート制限を受けないと述べる。地域に最も近いミラー (`cn-hangzhou`・`us-west-1`・`ap-southeast-7`) を選ぶ。

## インストール

Higress を動かす最速の方法は all-in-one Docker イメージだ。コントロールプレーン・Envoy データプレーン・コンソールを同梱する。設定をマウントした作業ディレクトリに書くので、クラスタは要らない (README)。

```bash
mkdir higress; cd higress
docker run -d --rm --name higress-ai -v ${PWD}:/data \
  -p 8001:8001 -p 8080:8080 -p 8443:8443 \
  higress-registry.cn-hangzhou.cr.aliyuncs.com/higress/all-in-one:latest
```

3 つのポートはコンソール (8001)、ゲートウェイ HTTP 入口 (8080)、ゲートウェイ HTTPS 入口 (8443) だ (README)。

Kubernetes デプロイでは Helm でインストールし、`global.hub` を最寄りのミラーに向ける (README)。

```bash
helm install higress -n higress-system higress.io/higress \
  --set global.hub=higress-registry.us-west-1.cr.aliyuncs.com \
  --create-namespace
```

## 最初の動く構成

上の単体 Docker インストールを使う。

1. Install セクションの `docker run` コマンドで all-in-one コンテナを起動する。設定ファイルはカレントディレクトリに書かれる。
1. コンソールを開き、コントロールプレーンが立っていることを確認する。

   ```bash
   open http://localhost:8001
   ```

1. ゲートウェイの HTTP 入口へリクエストを送る。ルート未設定でもゲートウェイはポート 8080 で応答し、Envoy データプレーンが提供中であることを確認できる。

   ```bash
   curl -i http://localhost:8080/
   ```

コンソールからルート (ドメインと上流サービス) を追加すれば、ゲートウェイを再起動せずに反映されるのを見られる。これは [アーキテクチャ](./architecture) ページが xDS を通じて追う挙動だ。

## 動作確認

- コンテナが動いている: `docker ps` に `higress-ai` が出る。
- コンソールが `http://localhost:8001` で応答する。
- ゲートウェイのデータプレーンがポート 8080 で応答する (ルート未作成でも `curl` に HTTP ステータスが返れば、たとえ 404 でも Envoy は立っている)。

## 次に読むもの

Kubernetes での Helm values・高可用性・本番ハードニングは、公式の [Quick Start ドキュメント](https://higress.ai/en/docs/latest/user/quickstart/) を参照。AI ゲートウェイでは `ai-proxy` プラグインとそのプロバイダ一覧が `plugins/wasm-go/extensions/ai-proxy/` 配下にあり、MCP サーバホスティングは [MCP quickstart](https://higress.cn/en/ai/mcp-quick-start/) が扱う。[内部実装](./internals) ページは、Ingress が Envoy config になる過程を読むための翻訳パスを地図にしている。
