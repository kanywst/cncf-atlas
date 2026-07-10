# Higress

> Higress は、Kubernetes Ingress と nginx 風アノテーションを、フォークした Istio Pilot を内蔵することで Envoy 設定へ翻訳する API ゲートウェイであり、トラフィック・マイクロサービス・AI 向けの Wasm プラグイン層を上乗せする。

- **カテゴリ**: API Gateway
- **CNCF 成熟度**: Sandbox (2026-03-25 公表)
- **言語**: Go (コントロールプレーン、`go 1.24.4`)、データプレーンは Envoy、Wasm プラグインは Go・Rust・JS
- **ライセンス**: Apache-2.0
- **リポジトリ**: [higress-group/higress](https://github.com/higress-group/higress) (Go モジュールパスは今も `github.com/alibaba/higress/v2`)
- **ドキュメント基準コミット**: `bd9c4c5` (main, 2026-07-07, タグ `v2.2.3` の近傍)

## 何をするものか

Higress は既存の 2 プロジェクトから組み立てた API ゲートウェイである。コントロールプレーンに Istio、データプレーンに Envoy を使う。多くの Ingress コントローラは Kubernetes Ingress オブジェクトを読み、プロキシを直接プログラムする。Higress はそうしない。Istio の Pilot コントロールプレーンをフォークし、リポジトリの `istio/` 配下に取り込み、自前の翻訳層を config ソースとして差し込む。その層は Kubernetes Ingress と一連の nginx 互換アノテーションを読み、Istio 設定 (VirtualService・Gateway・DestinationRule など) に翻訳する。内蔵の Pilot がその設定を Envoy の xDS API に compile し、Envoy データプレーンへ push する。

実際の効果は、経路変更がプロキシプロセスの reload なしに反映される点にある。nginx ベースの Ingress コントローラは変更のたびに設定を reload し、これが long-lived な接続を切る。Higress は代わりに xDS 経由で Envoy を更新するので、経路が変わってもデータプレーンは動き続ける。README は Sealos の移行記事を引き、その負荷条件で経路反映が nginx Ingress の約 10 倍速いと主張する。

ルーティングの上に、Higress は Wasm プラグイン層を持つ。WebAssembly にコンパイルされたプラグインが Envoy の HTTP フィルタチェーン内で動き、認証・レート制限・多数の LLM プロバイダ API を OpenAI 互換の形に正規化する AI プロキシといった機能を実装する。基準コミットではリポジトリに 59 個の Go Wasm 拡張が同梱される。Higress はこれを、北南トラフィック・東西マイクロサービス (Nacos・Consul・Eureka・ZooKeeper からのサービスディスカバリ付き)・AI の 3 つのゲートウェイ役を単一コントロールプレーンで担う構成として位置づける。

## いつ使うか

- nginx アノテーション付きの Kubernetes Ingress を運用しており、ルーティング設定を書き換えずに nginx Ingress から移りたい場合。Higress は約 25 種の nginx アノテーション群を再実装しており、同じオブジェクトがそのまま動く。
- long-lived な接続 (gRPC・WebSocket・ストリーミング) を切らずに経路変更を反映したい場合。nginx の reload が痛い箇所。
- LLM プロバイダ群の前段に AI ゲートウェイを置きたい場合。`ai-proxy` プラグインが多数のプロバイダを 1 つの OpenAI 互換 API の裏に並べ、キャッシュなど AI 特化プラグインも揃う。
- Nacos・Consul・Eureka・ZooKeeper に登録したマイクロサービスを、Kubernetes サービスと並べて 1 つのゲートウェイでルーティングしたい場合。
- Istio も Envoy も使っておらず、小さな単一バイナリのプロキシが欲しいなら不向き。Higress はフォークした Istio Pilot と Envoy を抱え、単体ゲートウェイより重い。
- Gateway API の上流準拠を第一のインターフェースとして求めるなら不向き。Higress は Gateway API に対応するが、Ingress + アノテーションと Wasm・AI 機能を前面に出す。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が運用し、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [higress-group/higress (LICENSE, go.mod, tags)](https://github.com/higress-group/higress) (参照 2026-07-09)
2. [Higress README](https://github.com/higress-group/higress/blob/main/README.md) (参照 2026-07-09)
3. [Higress Joins CNCF: Delivering an enterprise-grade AI gateway (CNCF ブログ, 2026-03-25)](https://www.cncf.io/blog/2026/03/25/higress-joins-cncf-delivering-an-enterprise-grade-ai-gateway-and-a-seamless-path-from-nginx-ingress/) (参照 2026-07-09)
4. [Higress ADOPTERS.md](https://github.com/higress-group/higress/blob/main/ADOPTERS.md) (参照 2026-07-09)
5. [CNCF Sandbox Projects listing](https://www.cncf.io/sandbox-projects/) (参照 2026-07-09)
6. [Higress developer architecture docs](https://higress.cn/en/docs/latest/dev/architecture/) (参照 2026-07-09)
7. [Sealos: Envoy vs Nginx for 2000 tenants (nginx-ingress から Higress への移行)](https://sealos.io/blog/sealos-envoy-vs-nginx-2000-tenants) (参照 2026-07-09)
8. [higress-group/higress のリポジトリシグナル (stars, forks, contributors)](https://github.com/higress-group/higress) (参照 2026-07-09)
