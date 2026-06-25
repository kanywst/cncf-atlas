# Contour

> Contour は Envoy をデータプレーンとして駆動する Kubernetes Ingress コントローラで、Ingress・独自の HTTPProxy CRD・Gateway API を xDS 経由で動く Envoy 設定へ変換する。

- **カテゴリ**: API Gateway
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [projectcontour/contour](https://github.com/projectcontour/contour)
- **ドキュメント基準コミット**: `8f970f0` (2026-06-24, `main`, `v1.33.5` より先行)

## 何をするものか

Contour は Envoy の制御プレーンである。Kubernetes API のルーティングオブジェクトを監視し、内部の有向非循環グラフ (DAG) にコンパイルし、その結果を gRPC の xDS プロトコルで 1 台以上の Envoy へ配信する。HTTP/HTTPS トラフィックの実際のプロキシは Envoy が行い、Contour は Envoy の設定がどうあるべきかを決める。

設定の入口は 3 系統ある。標準の Kubernetes `Ingress`、Contour 独自の `HTTPProxy` カスタムリソース、そして Gateway API である。`HTTPProxy` は、標準の Ingress オブジェクトがベンダー固有のアノテーションなしには TLS 委譲・マルチチームでの安全な inclusion・リッチなルーティングを表現できなかったために生まれた。

Contour は Deployment として動き、Envoy はその隣で (一般には DaemonSet として) `LoadBalancer` Service の背後で動く。設定は xDS 経由で動的に push されるため、ルートやクラスタの変更で Envoy の再起動や reload は不要である。

## いつ使うか

- 動的設定の Envoy ベース Ingress が欲しく、ルート変更で reload も再起動もさせたくない場合。
- 名前空間がルートを安全に委譲するマルチチーム Ingress が必要で、`HTTPProxy` の inclusion がそれを提供する場合。
- フルのサービスメッシュではなく、Ingress に特化したコントローラが欲しい場合。
- 単一チームの基本的な Ingress だけで足り既に `ingress-nginx` を運用している場合、あるいは Istio のような広範な L7 機能とメッシュ統合が必要な場合は、相性は弱い。

## このディープダイブの構成

- [歴史](./history): Heptio での起源、VMware への移行、CNCF への寄贈。
- [アーキテクチャ](./architecture): DAG、xDS キャッシュ、変更が Envoy に届くまで。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. projectcontour/contour リポジトリ: <https://github.com/projectcontour/contour>
2. 基準コミット `8f970f0`: <https://github.com/projectcontour/contour/commit/8f970f082e645bf0be5119c376ac4f4d40a19acd>
3. Contour 公式サイト: <https://projectcontour.io/>
4. Getting Started: <https://projectcontour.io/getting-started/>
5. Contour Adopters: <https://projectcontour.io/resources/adopters/>
6. TOC accepts Contour as Incubating project (CNCF): <https://www.cncf.io/blog/2020/07/07/toc-accepts-contour-as-incubating-project/>
7. Donate Contour to CNCF (cncf/toc PR #330): <https://github.com/cncf/toc/pull/330>
8. cncf/foundation project-maintainers.csv: <https://github.com/cncf/foundation/blob/main/project-maintainers.csv>
9. ドキュメント (Ingress / HTTPProxy / Gateway API): <https://projectcontour.io/docs/main/>
