# Microcks

> 仕様駆動のモック兼コントラクトテストサーバ。API アーティファクトを読み込ませると、ライブのモックを配信し、同じコントラクトで実装側のテストも行う。

- **カテゴリ**: Developer Tools
- **CNCF 成熟度**: Incubating
- **言語**: Java (Spring Boot コア / Quarkus 非同期エンジン / Angular UI)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [microcks/microcks](https://github.com/microcks/microcks)
- **ドキュメント基準コミット**: `24db054` (タグ `1.15.0-rc1` の直前、2026-06-22)

## 何をするものか

Microcks は API コントラクトを動くモックに変える。OpenAPI、AsyncAPI、Postman コレクション、SoapUI プロジェクト、gRPC、GraphQL、HAR といったアーティファクトを取り込むと、その中の example を読み取り、ライブのモックエンドポイントとして公開する。スタブコードを手で書くことはなく、仕様の中の example がそのままモックの応答になる。

取り込んだ同じアセットがコントラクトテストも駆動する。記録されたリクエスト/応答ペアを実装に対してリプレイし、実装がコントラクトに合致し続けているかを判定できる。1 つのサーバで REST、SOAP、GraphQL、gRPC、そしてイベント駆動 (AsyncAPI) の API をカバーする。

ライブラリではなく自己ホスト型のサービスである。コアは Spring Boot で動き、MongoDB に永続化し、Keycloak で認証する。別建ての Quarkus 製「async minion」がイベント駆動プロトコルを担い、Kafka、MQTT、AMQP、NATS、Google Pub/Sub、Amazon SNS、Amazon SQS といったブローカーへ AsyncAPI メッセージを publish する。

## いつ使うか

- 手書きのスタブが仕様からずれていくのを避け、仕様と同期したモックが欲しいとき。
- 複数プロトコル (例: REST と Kafka イベント) を扱い、それらを 1 つのツールで済ませたいとき。
- 同じアセットで CI のモックとコントラクトテストの両方を回したいとき。
- デスクトップ専用ではなく、チームで共有でき Kubernetes にデプロイできるモックサービスが必要なとき。

ノート PC で使い捨ての単一 REST スタブが欲しいだけなら重い選択になり、コード駆動やデスクトップ型のほうが軽い。また MongoDB と Keycloak を前提とするため、依存ゼロの単一バイナリではない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとモックリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. microcks/microcks GitHub リポジトリと API メタデータ: [github.com/microcks/microcks](https://github.com/microcks/microcks)
2. Microcks becomes a CNCF incubating project (CNCF ブログ, 2026-05-07): [cncf.io](https://www.cncf.io/blog/2026/05/07/microcks-becomes-a-cncf-incubating-project/)
3. Microcks プロジェクトページ (CNCF): [cncf.io/projects/microcks](https://www.cncf.io/projects/microcks/)
4. Microcks Incubation Application (cncf/toc issue #1552): [github.com/cncf/toc/issues/1552](https://github.com/cncf/toc/issues/1552)
5. ADOPTERS.md (microcks/microcks): [ADOPTERS.md](https://github.com/microcks/microcks/blob/main/ADOPTERS.md)
6. Microcks 1.0.0 release (Laurent Broudoux, Medium): [medium.com/microcksio](https://medium.com/microcksio/microcks-1-0-0-release-5a5d0dbaf212)
7. API Mocking Tools Compared (ASOasis): [asoasis.tech](https://asoasis.tech/articles/2026-04-05-0252-api-mocking-tools-comparison/)
8. Testing APIs: WireMock, Prism, Mountebank, MockServer 比較 (Medium/Strategio): [medium.com/strategio](https://medium.com/strategio/testing-apis-comparison-of-wiremock-spotlight-prism-mountebank-mockserver-and-broadcom-devtest-5f8084a03032)
9. Getting started with Docker Compose (install/docker-compose/README.md): [README.md](https://github.com/microcks/microcks/blob/main/install/docker-compose/README.md)
