# Aeraki Mesh

> Dubbo・Thrift・Kafka など HTTP 以外の L7 (Layer-7) プロトコルをサービスメッシュで扱えるよう、Istio を拡張するコントロールプレーン。

- **カテゴリ**: Service Mesh & Networking
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [aeraki-mesh/aeraki](https://github.com/aeraki-mesh/aeraki)
- **ドキュメント基準コミット**: `56e4de0` (master, 2025-05-12)

## 何をするものか

Aeraki Mesh は、既存の Istio メッシュに L7 (Layer-7。Dubbo・Thrift・Kafka などのプロトコルが属する OSI アプリケーション層) のトラフィック管理を足すコントロールプレーンです。Istio をはじめ多くのメッシュは HTTP と gRPC はよく扱えますが、それ以外の L7 プロトコルへの対応は非常に限定的で、Dubbo や Thrift の呼び出しはプロトコル対応のルーティングを受けられません (`README.md:49`)。Aeraki は Istio や Envoy をフォークせずにこの隙間を埋めます。

Aeraki は自前のデータプレーンを持ちません。Istiod の隣で動き、Istio の設定を MCP over xDS (Mesh Configuration Protocol over xDS。Istiod が設定リソースを配信する xDS ベースのストリーム) で監視し、宣言的なルールを Istio の `EnvoyFilter` リソースへ翻訳して Envoy サイドカーを再設定します (`README.md:71`)。併設の MetaProtocol Proxy 上に構築されたプロトコルに対しては、RDS (Route Discovery Service) サーバとしても振る舞い、接続を切らずに実行時のルート変更を可能にします。

想定利用者は、すでに Istio を運用していて、Istio がネイティブにルーティングできない RPC (remote procedure call)・メッセージング・データベースのプロトコルを使っており、かつプロトコルごとに `EnvoyFilter` パッチを手書きしたくないチームです。

## いつ使うか

- Istio を運用していて、Dubbo・Thrift・Kafka・Redis・Zookeeper や独自 RPC プロトコルのプロトコル対応ルーティングが必要なとき。
- 非 HTTP プロトコルで、稼働中の接続を切らずに動的なルート更新をしたいとき。Istio のインラインルートではこれができない (`README.md:50`)。
- 独自プロトコルがあり、Envoy filter とコントロールプレーンをフルに書く代わりに MetaProtocol codec を実装できるとき。
- トラフィックが HTTP と gRPC だけなら不要。素の Istio で足りる。
- Istio を使っていないなら不要。Aeraki は Istiod と Envoy に依存する。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [aeraki-mesh/aeraki リポジトリと README](https://github.com/aeraki-mesh/aeraki)
2. [CNCF プロジェクトページ: Aeraki Mesh](https://www.cncf.io/projects/aeraki-mesh/)
3. [Aeraki Mesh が CNCF Sandbox 入り (作者ブログ, 2022-06-17)](https://www.zhaohuabing.com/post/2022-06-17-aeraki-mesh-cncf-sandbox/)
4. [Aeraki 紹介 (作者ブログ, 2021-09-27)](https://www.zhaohuabing.com/post/2021-09-27-aeraki/)
5. [IstioCon 2022: Tencent Music の Istio + Aeraki 実践](https://events.istio.io/istiocon-2022/sessions/tencent-music-aeraki/)
6. [IstioCon 2022 と Tencent Music (作者ブログ, 2022-04-26)](https://www.zhaohuabing.com/post/2022-04-26-aeraki-tencent-music-istiocon2022/)
7. [Aeraki Mesh インストールガイド (v1.x)](https://www.aeraki.net/docs/v1.x/install/)
8. [Aeraki Mesh クイックスタート (v1.x)](https://www.aeraki.net/docs/v1.x/quickstart/)
9. [データプレーン: aeraki-mesh/meta-protocol-proxy](https://github.com/aeraki-mesh/meta-protocol-proxy)
10. [採用事例収集 issue #105](https://github.com/aeraki-mesh/aeraki/issues/105)
11. [Aeraki Mesh プロジェクトサイト](https://www.aeraki.net/)
12. [CNCF Landscape: Aeraki Mesh](https://landscape.cncf.io/?selected=aeraki-mesh)
