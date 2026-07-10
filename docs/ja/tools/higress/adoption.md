# 採用事例・エコシステム

## 誰が使っているか

出典として引ける本番採用者は 2 つのソースにある。リポジトリの `ADOPTERS.md` と CNCF 公表ブログだ。表は少なくとも一方に現れる組織を記録する。CNCF ブログは、cloud-native なトラフィックルーティングに加え AI ゲートウェイ / MCP サービス用途として、他の本番利用者 (Alibaba Group、Ant Group、BOSS Zhipin、Cathay Insurance、DJI) も列挙する。

| 組織 | 用途 | 出典 |
| --- | --- | --- |
| Ant Digital (antdigital) | Ingress・マイクロサービス・LLM・MCP ゲートウェイ (本番) | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md) |
| Kuaishou | LLM ゲートウェイ (本番) | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md), [CNCF ブログ](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) |
| Trip.com (Ctrip) | LLM・MCP ゲートウェイ (本番) | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md), [CNCF ブログ](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) |
| Vipshop | LLM・MCP・推論ゲートウェイ (本番) | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md), [CNCF ブログ](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) |
| Sealos (labring) | Ingress ゲートウェイ。nginx Ingress から移行 | [ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md), [Sealos ブログ](https://sealos.io/blog/sealos-envoy-vs-nginx-2000-tenants) |
| Alibaba | 社内 AI アプリを支える。Alibaba Cloud が Higress 基盤の商用ゲートウェイを提供 | [Higress README](https://github.com/higress-group/higress/blob/main/README.md), [CNCF ブログ](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) |

Sealos は約 2,000 テナントにまたがる数万の ingress ルールを nginx Ingress から Higress へ移した事例を記録している (Sealos ブログ)。Alibaba Cloud は商用 API ゲートウェイ製品を Higress の上に構築し、通義百煉の model studio や PAI プラットフォームの裏で社内利用する (README)。

## 採用のシグナル

2026-07-09 時点でリポジトリは約 8,816 stars、1,186 forks、約 182 contributors を示し、作成は 2022-10-27 (リポジトリシグナル)。リリース系列はアクティブで、`v2.2.3` は 2026-06-25 にタグ付けされ、基準コミット `bd9c4c5` はその数コミット先の `main` にある。CNCF Sandbox 参加は 2026-03-25 に公表された (CNCF ブログ)。contributor 数は単一ベンダーのプロジェクトより広いが、主たる推進役は依然として Alibaba だ。

## エコシステム

Higress は Envoy (データプレーン) とフォークした Istio Pilot (コントロールプレーン) の上に構築されるので、この 2 つは統合先というより基盤である。入力側では Kubernetes Ingress、nginx 互換アノテーション、Gateway API を受ける。サービスディスカバリでは Nacos・Consul・Eureka・ZooKeeper と統合し (`registry/`)、これは Alibaba のマイクロサービス (Dubbo) の系譜を映す。Wasm Plugin Hub が同梱の 59 個の Go 拡張と、higress-group Go SDK で書かれたサードパーティプラグインを配布する。AI では `openapi-to-mcpserver` (higress-group) が OpenAPI spec をゲートウェイがホストできる MCP サーバに変える。CNCF ブログは Higress の上に構築された OSS として HiMarket と HiClaw に触れる。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Istio ingress gateway | Higress はフォークした Istio Pilot を内蔵するので近縁。違いは、Higress が Ingress + nginx アノテーションと Gateway API を第一級に扱い、その上に Wasm プラグインと AI ゲートウェイ機能を重ね、Istio の CRD を隠す点 |
| Envoy Gateway | 同じく Envoy データプレーン + Gateway API。Envoy Gateway は Gateway API 準拠を前面に出すが、Higress は nginx-Ingress 移行と AI/MCP 機能を前面に出す |
| Apache APISIX | nginx/OpenResty + Lua プラグインで構築。Higress は Envoy/Wasm ベースで、`hmac-auth-apisix` プラグインなど一部の互換も持つ |
| Kong | nginx/OpenResty + Lua プラグインでエンタープライズ寄り。Higress の差別化は AI ゲートウェイ (多数の LLM プロバイダを 1 つの API の裏に) と MCP サーバホスティング |
