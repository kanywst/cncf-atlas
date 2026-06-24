# 採用事例・エコシステム

## 誰が使っているか

リポジトリに `ADOPTERS.md` は存在しない。出典を示せる採用事例のみを挙げる。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Lyft | 起源であり本番運用元。全エッジ/サービス間トラフィックを Envoy 経由で流す。 | [How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f) |
| Google・Apple・Microsoft・eBay | OSS 公開直後に各社のエンジニアが採用に動いた。 | [5 years of Envoy OSS](https://mattklein123.dev/2021/09/14/5-years-envoy-oss/) |
| Istio | Envoy をデータプレーンに採用。istiod が各 Envoy を xDS (LDS/RDS/CDS/EDS/SDS) で設定する。 | [Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/) |

## 採用のシグナル

2026-06-22 時点でリポジトリは GitHub スター 28,455、フォーク 5,442 を示す (`gh api repos/envoyproxy/envoy`)。CNCF プロジェクトページはコントリビュータ 8,444、health score 84 を表示する ([CNCF プロジェクトページ](https://www.cncf.io/projects/envoy/)、2026-06-22)。Envoy は 2018-11-28 に CNCF を graduated した 3 番目のプロジェクトだ。

## エコシステム

Envoy は多様な上位システムの共通プロキシコアだ。Istio は sidecar と ambient の両データプレーンで使う。Envoy Gateway は Kubernetes Gateway API を Envoy 上に実装し、Contour と Emissary-ingress は Ingress データプレーンとして使う。AWS App Mesh や gRPC とも相互運用する。拡張は C++ で書けるほか、リクエスト時には WebAssembly (proxy-wasm) と Lua でも書ける。

## 代替候補

Envoy の差別化はユニバーサルデータプレーン API (xDS v3) だ。プロキシをコントロールプレーンが駆動する汎用部品にする。だから多くのメッシュや Ingress プロジェクトが再利用する。

| 代替 | 違い |
| --- | --- |
| NGINX / HAProxy | 高速だが設定は基本的に静的で reload 前提。Envoy は動的な xDS 設定とホットリスタートが核。 |
| Traefik | Go 製で Kubernetes ネイティブ、導入は容易。Envoy は L7 機能がより深く xDS エコシステムが広い。 |
| linkerd2-proxy | Linkerd 専用の軽量 Rust サイドカー。Envoy は特定メッシュに依存しない汎用データプレーン。 |
