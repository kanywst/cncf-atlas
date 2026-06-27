# 採用事例・エコシステム

## 誰が使っているか

基準コミット時点でリポジトリに `ADOPTERS` ファイルは存在しないため、公開された出典付きの採用リストは短い。Ubisoft はプロジェクトの共同創設者であり、CNCF のアナウンスによればライブのマルチプレイヤゲームの本番で Agones を運用している (出典 2)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Ubisoft | 本番のマルチプレイヤゲームサーバ。プロジェクトの共同創設者 | [CNCF blog](https://www.cncf.io/blog/2026/03/23/agones-moves-to-the-cncf-a-new-era-for-open-source-multiplayer-game-infrastructure/) |

Ubisoft 以外には、基準コミット時点で信頼できる一次出典に帰属できる組織が確認できなかったため、ここには挙げない。さらなる採用企業は、カンファレンストークやベンダのケーススタディを当たるとよい。

## 採用のシグナル

- GitHub スター: 約 6.9k (約 6,879)、フォーク約 925。観測日 2026-06-26 (出典 1 / 6)。
- コントリビュータ: CNCF アナウンスは 250 名超と記載 (出典 2)。
- リリース頻度: マイナーリリースが頻繁。基準コミットは `1.59.0-dev` 線上 (`install/helm/agones/Chart.yaml:18`)。
- ガバナンス: 2025-12-21 に CNCF Sandbox へ受理 (出典 3)。リポジトリはベンダ中立な `agones-dev` org へ移管され、2026-03-23 にコミュニティガバナンスへの移行を告知 (出典 2)。

## エコシステム

- **Kubernetes ディストリビューション**: マネージドの GKE / EKS / AKS やオンプレを含む準拠クラスタならどこでも動く。
- **マッチメイキング**: Open Match との組み合わせが定番。マッチメイカは `GameServerAllocation` CRD か Allocator gRPC API で Ready なサーバを確保する (`pkg/apis/allocation/v1/gameserverallocation.go:52`)。
- **オートスケール**: `FleetAutoscaler` が `Fleet` をスケールし、クラスタの Cluster Autoscaler がその下で Node を増減する。
- **ゲームエンジン**: `sdks/` 配下の Go / C++ / C# / Rust / Node.js SDK。Unity や Unreal から `Ready` / `Allocate` / `Health` / `Shutdown` を呼ぶ。

## 代替候補

主要な代替はクラウド専有のマネージドゲームサーバサービスである。Agones の違いは、Kubernetes ネイティブ・クラウド非依存・OSS であり、ゲームサーバを標準の Kubernetes ツールで扱う宣言的カスタムリソースにする点だ。トレードオフは、Kubernetes クラスタを自分で運用する必要があること。

| 代替 | 違い |
| --- | --- |
| Amazon GameLift | AWS のマネージドサービス。運用するインフラは少ないが、ポータブルな Kubernetes リソースではなく AWS に縛られる。 |
| Microsoft PlayFab Multiplayer Servers | PlayFab のバックエンド機能と束ねた Azure のマネージドサービス。Kubernetes ネイティブではない。 |
| Edgegap | ゲームサーバ向けのマネージドなエッジオーケストレーション。Agones で運用するクラスタを抽象化する。 |
| 素の Kubernetes (`Deployment` + `Service`) | ゲームサーバのライフサイクルも SDK readiness もアロケーションもサーバ単位の HostPort モデルもない。自前で作り直すことになる。 |
