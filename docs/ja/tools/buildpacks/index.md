# Buildpacks

> Dockerfile を書かずに、アプリのソースコードを本番向け OCI イメージへ変換する。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [buildpacks/pack](https://github.com/buildpacks/pack)
- **ドキュメント基準コミット**: `2df3b8c` (v0.40.7)

## これは何か

Cloud Native Buildpacks (CNB) は、ソースコードを実行可能な OCI コンテナイメージへ変換する仕様とツール群である。CLI をアプリのディレクトリに向けると、言語を検出し、依存を取得し、イメージを生成する。Dockerfile は不要だ。

エコシステムは 3 層に分かれる。本リポジトリの `pack` CLI は開発者向けのプラットフォーム実装である。自分でイメージをビルドはしない。builder イメージと `lifecycle` バイナリ群をコンテナとして起動し、detect / analyze / restore / build / export の各フェーズを駆動する。実際のビルドロジックは言語ごとの buildpack にあり、参照ビルドエンジンは別リポジトリ `buildpacks/lifecycle` にある。

CNB は、Heroku・Cloud Foundry・Google App Engine などで分裂していた buildpack エコシステムを再統一するために存在する。この標準は OCI イメージフォーマットの上にベンダ中立な platform-to-buildpack 契約を定義し、同じ buildpack をどこでも動かせるようにし、レイヤ rebase でベースイメージを差し替えられるようにする。

## いつ使うか

- Dockerfile をサービスごとに保守せず、ソースから再現性あるコンテナイメージを得たいとき。
- 複数言語のサービスを多数運用し、単一の builder でまかないたいとき。
- run イメージを rebase することで、全アプリを再ビルドせずに OS レイヤをまとめてパッチしたいとき。
- 全レイヤを細かく制御したいときは不向きで、BuildKit で手書きの Dockerfile を使う方が直接的だ。
- Jib (JVM) や ko (Go) のような特化ツールで十分な単一言語の現場には不向き。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとビルドの流れ。
- [採用とエコシステム](./adoption): 誰が動かし、周辺に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動作セットアップ。

## 出典

1. [TOC Approves Cloud Native Buildpacks from Sandbox to Incubation (CNCF)](https://www.cncf.io/blog/2020/11/18/toc-approves-cloud-native-buildpacks-from-sandbox-to-incubation/)
2. [Cloud Native Buildpacks サイト](https://buildpacks.io/)
3. [Buildpacks Go Cloud Native, Turning Source Code into Docker Images (Heroku)](https://www.heroku.com/blog/buildpacks-go-cloud-native/)
4. [Standardizing Heroku Buildpacks with CNCF (Salesforce Engineering)](https://engineering.salesforce.com/standardizing-heroku-buildpacks-with-cncf-a43525f6c441/)
5. [Planting New Platform Roots in Cloud Native with Fir (Heroku)](https://www.heroku.com/blog/planting-new-platform-roots-cloud-native-fir/)
6. [How Maintaining Cloud Native Buildpacks Powers Platforms Like Heroku](https://www.heroku.com/blog/how-maintaining-cloud-native-buildpacks-powers-platforms-like-heroku/)
7. [App Platform Buildpack References (DigitalOcean)](https://docs.digitalocean.com/products/app-platform/reference/buildpacks/)
8. [Getting Started / How to Use Paketo Builders (Paketo Buildpacks)](https://paketo.io/docs/howto/builders/)
9. [buildpacks/pack リポジトリ](https://github.com/buildpacks/pack)
10. [buildpacks/lifecycle リポジトリ](https://github.com/buildpacks/lifecycle)
11. [buildpacks/spec リポジトリ](https://github.com/buildpacks/spec)
12. [Basic App チュートリアル (buildpacks.io docs)](https://buildpacks.io/docs/for-app-developers/tutorials/basic-app/)
13. [buildpacks/rfcs リポジトリ](https://github.com/buildpacks/rfcs)
