# はじめに

> 手順は公式の Knative Quickstart に従う。コマンドはローカル Kubernetes クラスタと動作する `kubectl` を想定。

## 前提

- `kind` または `minikube` によるローカル Kubernetes クラスタ。
- そのクラスタ向けに設定された `kubectl`。
- [Knative ドキュメント](https://knative.dev/docs/) の `kn` CLI とその `quickstart` プラグイン。
- ローカルクラスタ用のコンテナランタイム (Docker または Podman)。

## インストール

quickstart プラグインは、Serving・ネットワーキング層・DNS まで配線済みのローカルクラスタをプロビジョニングする。

```bash
kn quickstart kind
```

既存クラスタへ手動インストールする場合は、[Knative インストールドキュメント](https://knative.dev/docs/) の順序で Serving の CRD、core、ネットワーキング層を順に apply する。順序は CRD、core、Kourier などのネットワーキング層、DNS である。

## 最初の動く構成

1. Serving の Pod が動いていることを確認する。

   ```bash
   kubectl get pods -n knative-serving
   ```

1. コンテナイメージからサービスをデプロイする。

   ```bash
   kn service create hello \
     --image ghcr.io/knative/helloworld-go:latest \
     --port 8080 \
     --env TARGET=World
   ```

1. Knative が Configuration・immutable な Revision・Route を作成し、Revision が Ready になるとサービス URL を表示する。

## 動作確認

`kn service create` が表示した URL を curl する。アイドル後の最初のリクエストは activator を通り cold start が発生する。返る値は設定した `TARGET` と一致するはず。

```bash
curl http://hello.default.<your-domain>
```

`<your-domain>` はコマンド出力に出たホストに置き換える。トラフィックが無いまま `ScaleToZeroGracePeriod` の 30 秒 (`pkg/autoscaler/config/config.go:58`) が過ぎると Revision はゼロに縮退し、`kubectl get pods` で観察できる。次のリクエストで再び cold start して立ち上がる。

## 次に読むもの

[Knative ドキュメント](https://knative.dev/docs/) は本ページが扱わない本番運用を網羅する: ネットワーキング層の選定と強化、オートスケーリングのターゲットと並行数の設定、Revision 間のトラフィック分割、cert-manager による TLS、コントロールプレーンの高可用性設定。
