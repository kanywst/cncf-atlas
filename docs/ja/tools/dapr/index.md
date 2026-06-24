# Dapr

> サイドカー型のランタイム。あらゆるアプリに対して、状態管理・pub/sub・サービス呼び出し・シークレット・actor のビルディングブロック API を HTTP または gRPC で提供する。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [dapr/dapr](https://github.com/dapr/dapr)
- **ドキュメント基準コミット**: `9f2dcfd9` (2026-06-19、`v1.18.1` 近傍)

## 何をするものか

Dapr (Distributed Application Runtime) はアプリの隣でサイドカーとして動く。アプリは HTTP または gRPC でローカルのサイドカーに話しかけ、サイドカーが分散システムの仕事を引き受ける。app ID で別サービスを呼ぶ、状態を永続化する、メッセージを publish/subscribe する、シークレットを読む、actor と workflow を動かす、といった処理だ。サイドカーのバイナリは `daprd` で、エントリポイントは `app.Run()` を呼ぶだけになっている (`cmd/daprd/main.go:21`)。

機能はビルディングブロックにまとめられている。各ブロックはインメモリのコンポーネントレジストリのフィールドにそのまま対応する (`pkg/runtime/compstore/compstore.go:42`)。state store、pub/sub、binding、secret store、lock、crypto、workflow、conversation (LLM) コンポーネントなどだ。ビルディングブロックは安定した API を見せ、具体的なバックエンド (Redis、Kafka、クラウドサービス) は設定で差し替える。

単一の `dapr/dapr` リポジトリがデータプレーン (`daprd` サイドカー) とコントロールプレーン (operator、injector、sentry、placement、scheduler) の両方を含む。Kubernetes では injector がアノテーション付き Pod にサイドカーを注入し、セルフホストでは CLI がプロセスと並走させる。

## いつ使うか

- 複数言語でマイクロサービスを組み、バックエンドごと・言語ごとの SDK を揃える代わりに、state・メッセージング・サービス間呼び出しを 1 つの一貫した API で扱いたいとき。
- state store やメッセージブローカの選択をデプロイ時まで遅らせたいとき。Redis をクラウドサービスに差し替えてもアプリコードは変わらない。
- placement と永続化の機構を自前で書かずに、仮想 actor モデルや durable workflow を使いたいとき。
- ネットワーク層での透過的な L7 ルーティングやトラフィック分割だけが目的なら向かない。それはサービスメッシュの領域で、Dapr は扱わない (出典 9)。
- アプリインスタンスごとにプロセスが 1 つ増えるため、レイテンシやフットプリントに極端に敏感な単一言語のモノリスでは恩恵が薄い。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [dapr/dapr](https://github.com/dapr/dapr) (pinned `9f2dcfd95ad44178d9553a08c181b0e6ea46232a`)
2. [dapr/community ADOPTERS.md](https://github.com/dapr/community/blob/master/ADOPTERS.md)
3. [CNCF announces Dapr graduation](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-dapr-graduation/)
4. [Dapr project page (CNCF)](https://www.cncf.io/projects/dapr/)
5. [Dapr joins CNCF Incubator](https://www.cncf.io/blog/2021/11/03/dapr-distributed-application-runtime-joins-cncf-incubator/)
6. [How Dapr has grown since its announcement (Microsoft Open Source Blog)](https://cloudblogs.microsoft.com/opensource/2020/04/29/distributed-application-runtime-dapr-growth-community-update/)
7. [Microsoft's Dapr open-source project hits 1.0 (TechCrunch)](https://techcrunch.com/2021/02/17/microsofts-dapr-open-source-project-hits-1-0/)
8. [How Grafana used Dapr to improve vulnerability scans (CNCF)](https://www.cncf.io/case-studies/grafana/)
9. [Dapr and service meshes (Dapr Docs FAQ)](https://docs.dapr.io/concepts/faq/service-mesh/)
10. [Dapr (Wikipedia)](https://en.wikipedia.org/wiki/Dapr)
11. [Dapr official site / testimonials](https://dapr.io/testimonials/)
12. [2025 State of Dapr Report (CNCF)](https://www.cncf.io/announcements/2025/04/01/cloud-native-computing-foundation-releases-2025-state-of-dapr-report-highlighting-adoption-trends-and-ai-innovations/)
