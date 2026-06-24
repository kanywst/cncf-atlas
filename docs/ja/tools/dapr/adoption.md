# 採用事例・エコシステム

## 誰が使っているか

公式の採用企業リストは `dapr/community` リポジトリの `ADOPTERS.md` で、production / テスト段階の組織が記載される (出典 2)。名前が挙がっているものには、Residential IoT Services GmbH (Bosch Group)、Zeiss、Alibaba Cloud、Tencent、DingTalk、AutoNavi、Man Group、Microsoft Azure、FUJITSU CLOUD TECHNOLOGIES LIMITED、Schwarz IT KG、IBM Research、United Wholesale Mortgage、XiaoHongShu (RED)、星野リゾート、3-shake Inc.、NTT DATA、Proximus、Nexi Group などがある。うち 2 社は使い方の詳細を含む CNCF ケーススタディを公開している。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| ZEISS | actor フレームワークでグローバル受注処理のライフサイクルを管理 | [ZEISS case study area](https://www.cncf.io/projects/dapr/) (出典 4) |
| Grafana | AWS EKS 上のイベント駆動な脆弱性スキャン。resiliency で取りこぼしを防ぎ、state store で冪等性チェック | [Grafana case study](https://www.cncf.io/case-studies/grafana/) (出典 8) |
| その他 | IoT・クラウド・金融・小売にまたがる production / テスト採用 | [ADOPTERS.md](https://github.com/dapr/community/blob/master/ADOPTERS.md) (出典 2) |

## 採用のシグナル

`dapr/dapr` リポジトリに対し、2026-06-22 に GitHub API で測定 (出典 1)。

- スター: 25,852、fork: 2,089、watcher: 399、open issue: 410。
- コントリビュータ: 約 335 人 (GitHub API のコントリビュータページネーション、anon 込み)。
- 最新ランタイムリリース: v1.18.1、2026-06-16。

CNCF は 2024-10-30 に本プロジェクトを Graduated とした (出典 3)。2025 State of Dapr Report は採用トレンドと AI 関連の利用を扱う (出典 12)。

## エコシステム

- **コンポーネント**: `dapr/components-contrib` リポジトリが具体的な state・pub/sub・binding 実装を保持する (Redis、Kafka、AWS、Azure、GCP ほか)。
- **CLI**: `dapr/cli` が init と run に使う `dapr` コマンドを提供する。
- **SDK**: Go、Java、.NET、Python、JavaScript、Rust、C++、PHP の公式 SDK が HTTP / gRPC API をラップする。
- **マネージド提供**: Diagrid が商用マネージド製品 (Catalyst、Conductor) を提供する。
- **AI 方向**: Dapr Agents と Dapr Workflow が AI エージェントワークロード方向にプロジェクトを広げる (出典 12)。

## 代替候補

Dapr はアプリケーション層に位置し、ビルディングブロック (state、pub/sub、actor、workflow) を見せる。サービスメッシュはネットワーク層に位置し、トラフィックを透過的に動かす。Dapr docs は両者が補完的で併用でき、トラフィックルーティングと分割は Dapr のスコープ外だと述べている (出典 9)。

| 代替 | 違い |
| --- | --- |
| Istio / Linkerd / Cilium (サービスメッシュ) | インフラ層・透過的・ネットワーク中心。Dapr が扱わない L7 ルーティングとトラフィック分割を担う (出典 9)。Dapr とは補完的 |
| Spring Cloud | 主に Java に縛られるアプリ内フレームワーク。Dapr は HTTP/gRPC でどの言語からも呼べ、Spring Boot 統合も提供する |
| Apache Dubbo | 独自エコシステムに紐づく RPC フレームワーク。Dapr は state・メッセージング・呼び出しを言語非依存の API の背後に抽象化する |
