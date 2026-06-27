# Agones

> 専用マルチプレイヤゲームサーバを、カスタムリソースとコントローラで Kubernetes 上にホスト・実行・スケールする。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Sandbox
- **言語**: Go (`go.mod:3`, `go 1.26`)
- **ライセンス**: Apache-2.0 (`LICENSE:1`)
- **リポジトリ**: [agones-dev/agones](https://github.com/agones-dev/agones)
- **ドキュメント基準コミット**: `19f82f4f` (次期 `1.59.0-dev` 開発線, 2026-06-25)

## 何をするものか

Agones は専用ゲームサーバを動かすための Kubernetes 拡張である。専用ゲームサーバ (dedicated game server) とは、接続中のプレイヤ向けに 1 つの試合やセッションをホストする権威サーバプロセスを指す。Agones は CRD (Custom Resource Definition、Kubernetes の API を独自リソース型で拡張する仕組み) 群を定義し、その中心が `GameServer` である。コントローラ群がそれらのリソースを稼働中のゲームサーバ Pod へと変換する。ゲームサーバは `kubectl` で作成・監視・削除できる通常の Kubernetes オブジェクトになる。

各ゲームサーバは専用の Pod の中で動き、ゲームバイナリの隣に Agones のサイドカーコンテナが同居する。ゲームバイナリは SDK (Software Development Kit) を通じて、そのローカルサイドカーとだけ gRPC (Google の Remote Procedure Call フレームワーク) で話す。サイドカーがバイナリに代わって Kubernetes リソースを更新するため、ゲームコードが Kubernetes の API (Application Programming Interface) を直接叩くことはない。上位リソース (`Fleet`, `GameServerSet`, `FleetAutoscaler`, `GameServerAllocation`) は、単一ゲームサーバの上にグループ管理・ロールアウト・オートスケール・アロケーションを積み上げる。

対象は、すでに Kubernetes を運用している (あるいは運用する意思がある) スタジオで、専有的でクラウドにロックインされたスケーリングシステムの代わりに、ゲームサーバ群を 1 つの宣言的コントロールプレーンで扱いたいチームである。Agones はまさにそうした自前ツールを置き換えるべく、Google と Ubisoft の共同プロジェクトとして始まった。

## いつ使うか

- ステートフルでセッション単位の専用サーバが必要なマルチプレイヤゲームを運用し、標準の Kubernetes ツールでスケジュールしてスケールしたい。
- ベンダロックインを避けたい。Agones は OSS で、準拠したクラスタ (GKE / EKS / AKS / オンプレ) ならどこでも動く。
- マッチメイカ (例: Open Match) をアロケーションと組み合わせる。マッチメイカは CRD か gRPC 呼び出しで Ready なサーバを確保し、そのアドレスをプレイヤに渡す。
- Kubernetes を運用しておらず、必要なサーバが数台だけの場合は不向き。マネージドサービスのほうが運用負荷が小さいことがある。
- `Deployment` + `Service` で十分なステートレス HTTP バックエンドにも不向き。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [agones-dev/agones リポジトリ](https://github.com/agones-dev/agones) (コミット `19f82f4f`)
2. [CNCF: Agones Moves to the CNCF](https://www.cncf.io/blog/2026/03/23/agones-moves-to-the-cncf-a-new-era-for-open-source-multiplayer-game-infrastructure/)
3. [CNCF projects: Agones](https://www.cncf.io/projects/agones/)
4. [Google Cloud: Introducing Agones](https://cloud.google.com/blog/products/containers-kubernetes/introducing-agones-open-source-multiplayer-dedicated-game-server-hosting-built-on-kubernetes)
5. [Agones ドキュメントサイト](https://agones.dev/site/)
6. [issue #4421: Moving Agones to CNCF](https://github.com/agones-dev/agones/issues/4421)
