# Easegress

> Easegress は Go 製のトラフィックゲートウェイであり、リクエストを filter の pipeline に通し、設定を埋め込み etcd クラスタで共有して高可用性を実現する。

- **カテゴリ**: API Gateway
- **CNCF 成熟度**: Sandbox (2023-12-19 採択)
- **言語**: Go (`go 1.26`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [easegress-io/easegress](https://github.com/easegress-io/easegress)
- **ドキュメント基準コミット**: `3bdb192` (main, タグ `v2.11.0` の近傍, 2026-03-17)

## 何をするものか

Easegress はレイヤ 7 のトラフィックゲートウェイである。バックエンドサービスの前段に立ち、受信リクエストを処理する。ルーティング、負荷分散、レート制限、認証、リクエスト/レスポンスの変換、そしてサーキットブレーカやリトライといった resilience を担う。HTTP・gRPC・MQTT を話し、サービスメッシュのサイドカーとしても動作する。

中核のモデルは filter の pipeline だ。トラフィックゲート (たとえば HTTP サーバ) がリクエストを受け、ルートに突き合わせ、pipeline に渡す。pipeline はリクエストを順序付きの filter 列に通し、各 filter は短い result 文字列を返す。この result が jump テーブルを引く。つまり pipeline は小さな有向グラフである。`invalid` を返す validator はリクエストを fallback filter へ飛ばせるし、result が空文字なら次の filter へ進む。これによりトラフィック処理は宣言的かつプロトコル非依存になる。

設定は Easegress が自分のバイナリに埋め込んだ etcd クラスタに置かれる。別建ての etcd プロセスを動かす必要はない。各サーバノードは `embed.Etcd` を内包し、Raft でリーダーを選出し、同じオブジェクトをクラスタ全体で共有する。1 つのバイナリがデータプレーンとコントロールプレーンを兼ねる。運用面が小さく収まる代わりに、etcd をプロセス内に抱え込む。

## いつ使うか

- HTTP・gRPC・MQTT のトラフィックを 1 つのゲートウェイで、共通の filter とルーティングモデルで扱いたい。プロトコルごとに別ツールを継ぎ合わせたくない場合。
- リクエスト処理を filter の result で分岐させる宣言的なトラフィックオーケストレーション (検証 → レート制限 → プロキシ、fallback 付き) を設定として書きたい場合。
- 外部の設定ストアを立てずに自己完結した HA クラスタが欲しく、ゲートウェイのバイナリ内に etcd が入ることを許容できる場合。
- 組み込みの resilience (サーキットブレーカ・リトライ・タイムリミッタ) を、独立したホップとしてではなくプロキシに紐づけて使いたい場合。
- すでに外部コントロールプレーン (Istio) 付きの Envoy を運用し、データプレーンを xDS で設定したいなら不向き。Easegress は xDS 駆動ではなく自己設定型である。
- 確立されたプラグインマーケットの広さが欲しいなら不向き。Easegress は大規模なサードパーティプラグインではなく、Go の filter と WebAssembly で拡張する。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [easegress-io/easegress (GitHub リポジトリ)](https://github.com/easegress-io/easegress) (参照 2026-07-08)
2. [Filter インタフェース (`pkg/filters/filters.go`)](https://github.com/easegress-io/easegress/blob/main/pkg/filters/filters.go) (参照 2026-07-08)
3. [Pipeline / FlowNode (`pkg/object/pipeline/pipeline.go`)](https://github.com/easegress-io/easegress/blob/main/pkg/object/pipeline/pipeline.go) (参照 2026-07-08)
4. [go.mod (モジュールパス, Go バージョン)](https://github.com/easegress-io/easegress/blob/main/go.mod) (参照 2026-07-08)
5. [README (機能・ユースケース・インストール)](https://github.com/easegress-io/easegress/blob/main/README.md) (参照 2026-07-08)
6. [Easegress プロジェクトページ (CNCF, Sandbox, 2023-12-19 採択)](https://www.cncf.io/projects/easegress/) (参照 2026-07-08)
7. [\[SANDBOX PROJECT ONBOARDING\] easegress (cncf/sandbox #193)](https://github.com/cncf/sandbox/issues/193) (参照 2026-07-08)
8. [Easegress (MegaEase 公式製品ページ)](https://megaease.com/easegress/) (参照 2026-07-08)
9. [Releases (v1.0.0 = 2021-06-02)](https://github.com/easegress-io/easegress/releases) (参照 2026-07-08)
10. [The Next Generation Service Gateway (MegaEase, CodeX)](https://medium.com/codex/the-next-generation-service-gateway-7cf4bd50c9bd) (参照 2026-07-08)
11. [The New Version of Easegress (v2.0 発表, MegaEase)](https://megaease.com/blog/2022/08/09/the-new-version-of-easegress/) (参照 2026-07-08)
12. [Easegress (Open Policy Agent Ecosystem)](https://www.openpolicyagent.org/ecosystem/entry/easegress) (参照 2026-07-08)
