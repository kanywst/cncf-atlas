# はじめに

> 公式の quick start に基づく。コマンドは Docker とインターネット接続のある端末を想定。

## 前提

- Docker。または公式パッケージのローカル Envoy バイナリ。
- プロキシ用 (10000) と admin インターフェース用 (9901) に空きポートが 1 つずつ。

## インストール

公式の配布形態はコンテナイメージだ ([run Envoy quick start](https://www.envoyproxy.io/docs/envoy/latest/start/quick-start/run-envoy))。

```bash
docker pull envoyproxy/envoy:v1.38-latest
```

## 最初の動く構成

リポジトリの `configs/envoy-demo.yaml` に同梱されたデモ設定を使う。ポート 10000 の listener がアップストリームへ TLS でプロキシし、9901 で admin インターフェースを公開する。

1. 設定を `envoy-demo.yaml` として保存する。

   ```yaml
   admin:
     address:
       socket_address: { address: 0.0.0.0, port_value: 9901 }
   static_resources:
     listeners:
     - name: listener_0
       address:
         socket_address: { address: 0.0.0.0, port_value: 10000 }
       filter_chains:
       - filters:
         - name: envoy.filters.network.http_connection_manager
           typed_config:
             "@type": type.googleapis.com/envoy.extensions.filters.network.http_connection_manager.v3.HttpConnectionManager
             stat_prefix: ingress_http
             http_filters:
             - name: envoy.filters.http.router
               typed_config:
                 "@type": type.googleapis.com/envoy.extensions.filters.http.router.v3.Router
             route_config:
               name: local_route
               virtual_hosts:
               - name: local_service
                 domains: ["*"]
                 routes:
                 - match: { prefix: "/" }
                   route:
                     host_rewrite_literal: www.envoyproxy.io
                     cluster: service_envoyproxy_io
     clusters:
     - name: service_envoyproxy_io
       type: LOGICAL_DNS
       dns_lookup_family: V4_ONLY
       lb_policy: ROUND_ROBIN
       load_assignment:
         cluster_name: service_envoyproxy_io
         endpoints:
         - lb_endpoints:
           - endpoint:
               address:
                 socket_address: { address: www.envoyproxy.io, port_value: 443 }
       transport_socket:
         name: envoy.transport_sockets.tls
         typed_config:
           "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.UpstreamTlsContext
           sni: www.envoyproxy.io
   ```

2. その設定をコンテナにマウントして Envoy を起動する。

   ```bash
   docker run --rm -it \
     -v "$(pwd)/envoy-demo.yaml:/etc/envoy/envoy.yaml" \
     -p 10000:10000 -p 9901:9901 \
     envoyproxy/envoy:v1.38-latest
   ```

3. プロキシ経由でリクエストを送る。

   ```bash
   curl -s http://localhost:10000/ -o /dev/null -w "%{http_code}\n"
   ```

   プロキシが正常なら、アップストリームからの HTTP ステータス (`200`) が返る。

## 動作確認

admin インターフェースを見る。server info と stats のエンドポイントでプロセスの生存を確認できる。

```bash
curl -s http://localhost:9901/server_info | head
curl -s http://localhost:9901/stats | grep ingress_http
```

`server_info` の出力は、Envoy が初期化を終えると `state: LIVE` を報告する。

## 次に読むもの

本番運用の関心事 (コントロールプレーンからの xDS 動的設定、TLS 終端、可観測性、ホットリスタート) は [Envoy 公式ドキュメント](https://www.envoyproxy.io/) を参照。Envoy を単体プロキシではなくメッシュのデータプレーンとして動かすには、Istio のようなコントロールプレーンが xDS で設定する ([Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/))。
