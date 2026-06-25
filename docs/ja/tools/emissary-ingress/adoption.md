# 採用事例・エコシステム

## 誰が使っているか

リポジトリには `ADOPTERS.md` が無いため、下記の固有名は維持された採用リストではなく公開報道に基づく。The New Stack は Ticketmaster・Chick-fil-A・AppDirect を本番利用者として報じ、Ambassador Labs 由来の数値としてピーク 500,000 req/s、ユーザ数が 10 分弱で 500 万から 1500 万へ跳ねた事例を挙げている ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/))。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Ticketmaster | 本番の API ゲートウェイ / Ingress | [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/) |
| Chick-fil-A | 本番の API ゲートウェイ / Ingress | [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/) |
| AppDirect | 本番の API ゲートウェイ / Ingress | [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/) |

## 採用のシグナル

2026-06-24 時点の GitHub REST API (`gh api repos/emissary-ingress/emissary`): スター 4,509、フォーク 707、オープン issue 427。`contributors` API はページングで 192 件の非匿名 login を返す。本プロジェクトは CNCF Incubating である ([CNCF projects](https://www.cncf.io/projects/emissary-ingress/))。最新リリースは 2026-05-19 の `v4.1.0` ([GitHub](https://github.com/emissary-ingress/emissary))。

## エコシステム

- **Envoy Proxy** が Emissary の基盤となるデータプレーン。
- **可観測性** は Prometheus・Grafana・Datadog と連携し、トレーシングは `IRTracing` 設定経由で Zipkin/Jaeger 系バックエンドに接続する。
- **サービスメッシュ**: Linkerd・Istio・Consul の前段に置ける。
- **Knative** サーバレスと **Gateway API** をサポートし、Gateway API オブジェクトは snapshot に載る (`pkg/snapshot/v1/types.go:84-87`)。
- **Ambassador Edge Stack** は同じコアに ACME/OIDC と開発者ポータルを足した商用上位版 ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/))。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Contour | 同じく Envoy ベースの CNCF プロジェクトだが、単一の `HTTPProxy` CRD と 1 つの Go バイナリでよりシンプル。Emissary は独自の Mapping/Host/Listener CRD と Python 設定エンジンで API ゲートウェイ機能が厚い ([The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)) |
| Istio ingress gateway | フルのサービスメッシュを前提とし重い。Emissary はメッシュ非依存の edge ゲートウェイとして単独で立つ |
| ingress-nginx | 枯れた NGINX ベースだが、Envoy の動的な xDS 更新や Emissary が公開する細かい L7 制御は持たない |
| Ambassador Edge Stack | 同じコアに商用の ACME/OIDC/開発者ポータル機能を加えたもの |
