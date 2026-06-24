# Envoy

> ポリグロットなマイクロサービスに一貫したネットワーキング・可観測性・動的設定を与える、アウトオブプロセスの L4/L7 プロキシかつユニバーサルデータプレーン。

- **カテゴリ**: Service Mesh & Networking
- **CNCF 成熟度**: Graduated
- **言語**: C++ (C++17/20 主体。ツール群に Go・Python・Rust・Starlark)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [envoyproxy/envoy](https://github.com/envoyproxy/envoy)
- **ドキュメント基準コミット**: `6a45c7d` (タグ `v1.38.2` 近傍)

## 何をするものか

Envoy はアプリケーションサービスの傍ら、または前段で動き、そのネットワークトラフィックを捌くプロキシである。L4 (TCP/UDP) でコネクションを終端・転送し、L7 (HTTP/1.1・HTTP/2・HTTP/3・gRPC) でアプリケーションプロトコルをパースして、その途中でルーティング・ロードバランシング・リトライ・レートリミット・認可を適用する。サービスのネットワーク処理を言語ごとにライブラリで再実装するのではなく、アプリケーションの外側の一箇所に置くために作られた。

プロセスは固定数の worker スレッドを持つ単一の静的バイナリだ。メインスレッドが設定とライフサイクルを所有し、各 worker は自前のイベントループを回してロックを共有せずコネクションを処理する。設定は静的ファイルでも、xDS API 経由でランタイムにストリームされる形でもよい。これが、コントロールプレーンが多数の Envoy を再起動なしで再構成できる仕組みの核心である。

Envoy は多くの上位システムが土台にするデータプレーンでもある。Istio・Envoy Gateway・Contour・Emissary-ingress はいずれも自前のプロキシを書かず、xDS 経由で Envoy を駆動する。エントリポイントは `source/exe/main.cc:16` で、そこから `Envoy::MainCommon::main` に渡る。

## いつ使うか

- ポリグロットなマイクロサービスを運用し、言語ごとのライブラリではなく一貫したネットワーキング・リトライ・可観測性レイヤを 1 つ持ちたいとき。
- コントロールプレーンが xDS でプロキシを再起動なしに動的再構成できるデータプレーンが必要なとき。
- サービスメッシュや API ゲートウェイを作っており、プロキシのコアを自作せず実績ある実装を使いたいとき。
- エッジやサービス間で深い L7 機能 (HTTP/2・HTTP/3、gRPC、ヘッダベースのルーティング、outlier detection) が必要なとき。

静的な NGINX/HAProxy 設定で要件が足りる場合や、小さな依存 1 つで済ませたい場合には向かない。Envoy は大きな C++ バイナリで、設定モデルの学習コストがある。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [envoyproxy/envoy](https://github.com/envoyproxy/envoy)、コミット `6a45c7d9fee960d6457c44205faf6307157efc24` に固定 (2026-06-22)。
2. [CNCF プロジェクトページ: Envoy](https://www.cncf.io/projects/envoy/) (2026-06-22)。
3. [Envoy joins the CNCF (Matt Klein, Lyft Eng)](https://eng.lyft.com/envoy-joins-the-cncf-dc18baefbc22) (2026-06-22)。
4. [5 years of Envoy OSS (Matt Klein)](https://mattklein123.dev/2021/09/14/5-years-envoy-oss/) (2026-06-22)。
5. [How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f) (2026-06-22)。
6. [Istio architecture](https://istio.io/latest/docs/ops/deployment/architecture/) (2026-06-22)。
7. [Envoy GOVERNANCE.md](https://github.com/envoyproxy/envoy/blob/main/GOVERNANCE.md) (2026-06-22)。
8. [Envoy quick start: run Envoy](https://www.envoyproxy.io/docs/envoy/latest/start/quick-start/run-envoy) (2026-06-22)。
9. [Envoy 公式ドキュメント](https://www.envoyproxy.io/) (2026-06-22)。
