# 採用事例・エコシステム

## 誰が使っているか

リポジトリに専用の ADOPTERS ファイルはなく、利用者の収集は [issue #105](https://github.com/aeraki-mesh/aeraki/issues/105) で行われています (`README.md:169`)。以下の組織はいずれも引用可能な出典があります。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Tencent Music | Istio + Aeraki を本番運用し、IstioCon 2022 で発表 | [IstioCon 2022 session](https://events.istio.io/istiocon-2022/sessions/tencent-music-aeraki/) |
| Tencent | メンテナ `Xunzhuo` が Tencent 所属。tRPC・qza・videoPacket が対応 MetaProtocol プロトコルとして列挙 | `MAINTAINERS.md`、`README.md:92-94` |

README は対応 MetaProtocol プロトコルとして Alauda と bRPC (Baidu がオープンソース化) も挙げています (`README.md:91,95`)。これは利用のシグナルではありますが、直接の採用表明ではありません。これ以外の named adopter は裏付けソースがないため、ここでは主張しません。

## 採用のシグナル

GitHub API から 2026-06-26 時点で計測:

- スター: 761
- フォーク: 141
- コントリビュータ: 約 34 (非匿名)
- open issue: 21
- 最終 push: 2025-12-05
- archived: いいえ
- ライセンス: Apache-2.0
- 作成: 2020-11-05

## エコシステム

Aeraki は同じ組織配下の一連の姉妹プロジェクトの 1 つです。

- `meta-protocol-proxy`: Aeraki と対になる C++ 製 Envoy filter データプレーン。
- `api` と `client-go`: 共有 API 型と生成 client。どちらも Aeraki の依存 (`go.mod`)。
- `meta-protocol-control-plane-api`: コントロールプレーン API 定義。
- `aerakictl`: デバッグ用コマンドラインツール。
- `website`: プロジェクトのドキュメントサイト。

Aeraki は Istio (必須、`internal/controller/istio/controller.go` 経由の MCP over xDS) と Envoy (生成された `EnvoyFilter` 経由) に統合します。バージョン互換は厳密で、[install docs](https://www.aeraki.net/docs/v1.x/install/) によれば Aeraki 1.4.x は Istio 1.18.x と MetaProtocol Proxy 1.4.x を対象とします。

## 代替候補

| 代替 | 違い |
| --- | --- |
| 素の Istio + 手書き `EnvoyFilter` | 可能だが、プロトコルごとに filter とルーティングを自前実装する。Aeraki は作業を MetaProtocol codec に縮小する (`README.md:72`)。 |
| Istio ネイティブの Dubbo/Thrift/MySQL/MongoDB/Redis フィルタ | インラインルートのみで、ルート変更時に接続が切れる。動的 RDS がない (`README.md:50`)。Aeraki は MetaProtocol 向けの動的 RDS を持つ。 |
| Cilium / Linkerd | L7 対応は HTTP/gRPC 中心で、Dubbo・Thrift・独自 RPC の宣言的ルーティングは守備範囲外。Aeraki の差は、codec を書くだけで任意の request/response 型 L7 プロトコルを足せる点。 |
