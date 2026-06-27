# BFE

> BFE (Beyond Front End) は Baidu 発の Go 製レイヤ 7 ロードバランサ兼リバースプロキシで、人間が読める条件記述言語を使ってリクエスト内容ごとにトラフィックをルーティングする。

- **カテゴリ**: API Gateway
- **CNCF 成熟度**: Sandbox (2020-06-25 受理)
- **言語**: Go (`go.mod` は `go 1.22`)
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [bfenetworks/bfe](https://github.com/bfenetworks/bfe)
- **ドキュメント基準コミット**: `d8d6dcb` (v1.8.2, 2026-05-08)

## 何をするものか

BFE はより大きな BFE システムのデータプレーン側の転送エンジンである。クライアント接続を終端し、リクエストの内容 (ホスト、パス、ヘッダ、cookie、クライアント IP) を基にどのバックエンドが処理すべきかを決め、そのバックエンドへリクエストをプロキシする。L7 とは OSI モデルのレイヤ 7、つまりアプリケーション層を指し、BFE は TCP パケットではなく HTTP リクエストのレベルで動作する。

このエンジンは Baidu 社内のトラフィックプラットフォームから生まれた。プラットフォーム自体は 2012 年頃から本番トラフィックを転送してきた。転送エンジンは 2019 年に OSS 化され、2020 年に CNCF (Cloud Native Computing Foundation) Sandbox に受理された。本リポジトリはサーバ本体のみである。設定管理はコントロールプレーンを構成する別リポジトリ (API-Server, Conf-Agent, Dashboard) にある。

BFE を他のプロキシと分ける特徴は 2 つある。メモリ安全な言語である Go で書かれており、ランタイム panic からはプロセスをクラッシュさせず recover する。ルーティングルールは `req_host_in("example.org") && req_path_prefix_in("/api", false)` のような小さなドメイン特化言語 (DSL、専用の設定構文) で記述し、ロード時にオブジェクト木へパースする。

## いつ使うか

- ホストとパスのプレフィックスだけでなく、リクエストに対する条件としてルールを書く内容ベースの HTTP ルーティングが必要なとき。
- 二段階のロードバランス (まず sub-cluster 間、次に sub-cluster 内の backend 間) がプロキシに組み込まれていてほしいとき。
- 組み込み Lua スクリプトよりコンパイル済み Go モジュールでプロキシを拡張したいとき。
- 1 つのフリート背後で多数のテナントを動かし、host から product そして cluster というルーティング階層が欲しいとき。

大規模なサードパーティエコシステムや動的な xDS (Discovery Service 系のアプリケーションプログラミングインタフェース) 設定が必要なら、より定着している Envoy の方が向く。単純な静的リバースプロキシだけで足りるなら、運用が簡単な NGINX の方が向く。

## このディープダイブの構成

- [歴史](./history): Baidu での起源、OSS 化、CNCF 入り。
- [アーキテクチャ](./architecture): データプレーンのコンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 出典付きの採用組織、GitHub シグナル、代替。
- [内部実装](./internals): ソースから読んだ中核の型とリクエストパス。
- [はじめに](./getting-started): ソースからビルドして同梱設定で起動する。

## 出典

1. CNCF の BFE プロジェクトページ (成熟度 Sandbox、2020-06-25 受理): <https://www.cncf.io/projects/bfe/>
2. bfenetworks/bfe README (概要・機能・コンポーネント): <https://github.com/bfenetworks/bfe>
3. bfenetworks/bfe の GitHub API (stars、forks、作成日、リリース): <https://api.github.com/repos/bfenetworks/bfe>
4. baidu/bfe-book, In-depth Understanding of BFE: <https://github.com/baidu/bfe-book>
5. Four Service Proxy Projects From CNCF (Cloud Native Now): <https://cloudnativenow.com/features/4-service-proxy-projects-from-cncf/>
6. bfenetworks/bfe ADOPTERS.md: <https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md>
7. bfenetworks 組織 (api-server, conf-agent, dashboard, ingress-bfe): <https://github.com/bfenetworks>
8. BFE overview ドキュメント (データプレーンとコントロールプレーン): <https://github.com/bfenetworks/bfe/blob/develop/docs/en_us/introduction/overview.md>
