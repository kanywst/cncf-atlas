# Istio

> すべてのワークロードの隣にプログラマブルなプロキシを置くサービスメッシュ。トラフィック管理・mTLS・テレメトリをアプリのコード外に出す。

- **カテゴリ**: Service Mesh & Networking
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [istio/istio](https://github.com/istio/istio)
- **ドキュメント基準コミット**: `58e9892` (2026-06-20, master)

## 何をするものか

Istio はサービスメッシュである。Go で書かれた制御プレーン `istiod` と、リクエスト経路に座るプロキシ群のデータプレーンから成る。制御プレーンは Kubernetes と Istio の設定を監視し、プロキシごとの設定を計算し、Envoy が話す gRPC ディスカバリプロトコル xDS でプロキシへ配信する。

従来のデータプレーンは各 Pod に注入される Envoy サイドカーである。新しい ambient モードは Pod ごとのサイドカーを廃する。ztunnel という per-node の Rust プロキシが L4 の mTLS とルーティングを担い、L7 機能が要るときだけ namespace または service 単位で waypoint Envoy を立てる。どちらのモードも同じ `istiod` が xDS で駆動する。

メッシュの狙いは関心事をアプリのコードから外に出すこと。サービス間の相互 TLS、リクエストルーティング、リトライ、トラフィックミラーリング、テレメトリを宣言的に設定し、プロキシが施行する。アプリは素の呼び出しを続けるだけでよい。

## いつ使うか

- Kubernetes 上に多数のサービスがあり、アプリのコードを変えずにサービス間 mTLS が欲しいとき。
- L7 トラフィック制御が要るとき: ヘッダベースのルーティング、カナリア分割、フォールトインジェクション、ミラーリング。
- 異なる言語のサービス横断で、統一されたメトリクス・トレース・アクセスログが欲しいとき。
- ワークロード ID モデル (SPIFFE) と短命証明書を発行する CA が欲しいとき。

向かない場面:

- mTLS や細かいルーティングが不要な少数のサービス。制御プレーンとプロキシのオーバーヘッドに見合わない。
- L4 接続性と、CNI がカーネルで既に施行できるポリシーしか要らないとき。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [istio/istio ソース, commit 58e9892](https://github.com/istio/istio)
2. [How the Istio Service Mesh Became Critical Infrastructure (Tetrate)](https://tetrate.io/blog/how-the-istio-service-mesh-became-critical-infrastructure-for-cloud-native-applications)
3. [CNCF reaffirms Istio maturity with project graduation](https://www.cncf.io/announcements/2023/07/12/cloud-native-computing-foundation-reaffirms-istio-maturity-with-project-graduation/)
4. [Istio sails into the CNCF (Incubating)](https://www.cncf.io/blog/2022/09/28/istio-sails-into-the-cloud-native-computing-foundation/)
5. [Istio graduates (TechCrunch)](https://techcrunch.com/2023/07/12/istio-graduates/)
6. [Istio: The Highest-Performance Solution for Network Security (ambient GA)](https://istio.io/latest/blog/2025/ambient-performance/)
7. [Ambient vs Cilium benchmark](https://istio.io/latest/blog/2024/ambient-vs-cilium/)
8. [Happy 7th Birthday, Istio!](https://istio.io/latest/blog/2024/happy-7th-birthday/)
9. [Istio case studies](https://istio.io/latest/about/case-studies/)
10. [eBay case study](https://istio.io/latest/about/case-studies/ebay/)
11. [Airbnb case study](https://istio.io/latest/about/case-studies/airbnb/)
12. [Salesforce case study](https://istio.io/latest/about/case-studies/salesforce/)
13. [T-Mobile case study](https://istio.io/latest/about/case-studies/t-mobile/)
14. [Istio getting started](https://istio.io/latest/docs/setup/getting-started/)
15. [Linkerd vs Istio (Solo.io)](https://www.solo.io/topics/istio/linkerd-vs-istio)
