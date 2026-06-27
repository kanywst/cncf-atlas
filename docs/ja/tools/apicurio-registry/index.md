# Apicurio Registry

> API 定義とイベントスキーマを保存・バージョン管理・検証し、producer と consumer が単一の source of truth を共有できるようにするランタイムサーバ。

- **カテゴリ**: Messaging & Streaming
- **CNCF 成熟度**: Sandbox
- **言語**: Java（source 17 / runtime 21）、Quarkus と Maven でビルド
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [Apicurio/apicurio-registry](https://github.com/Apicurio/apicurio-registry)
- **ドキュメント対象コミット**: `3443acd9`（main, 2026-06-25、タグ `v3.3.0` 付近）

## 概要

Apicurio Registry（ARG）は artifact と、それを記述するスキーマを保存するサーバ。artifact とは Avro スキーマ、Protobuf 定義、JSON Schema、OpenAPI / AsyncAPI 契約、GraphQL スキーマ、WSDL や XSD といったバージョン付きドキュメントを指す。クライアントは REST（Representational State Transfer）API でこれらを出し入れし、ランタイムで参照する。

最も一般的な用途はイベントストリーミングのスキーマ管理。Kafka producer は書き込みに使う Avro スキーマを登録し、registry がグローバル識別子を割り当て、consumer はその識別子でスキーマを取得してメッセージをデシリアライズする。registry は変更のたびにルールを強制するので、互換性のないスキーマは topic に届く前に拒否できる。validity / compatibility / integrity ルールは artifact 単位、group 単位、global 単位で設定できる。

ストレージバックエンドを起動時に選ぶ単一のデプロイ可能 artifact として動く。PostgreSQL が正典のストア、Kafka・Git リポジトリ・Kubernetes ConfigMap が代替。Apicurio は Confluent Schema Registry 互換 API も持つので、既存の Kafka クライアントはコード変更なしで向き先を変えられる。

## 採用が向くケース

- Kafka / NATS / Pulsar を運用していて、Apache 2.0 でセルフホストかつ vendor-neutral なスキーマレジストリが欲しい。
- 複数種類の artifact を保存したい。Avro / Protobuf と OpenAPI / AsyncAPI 定義を並べて置きたい。
- スキーマ変更の出荷前にサーバ側で互換性チェックを強制したい。
- Confluent Community License を避けつつ Confluent 互換 API が欲しい。
- ホスト型・単一クラウドのスキーマレジストリで十分でサーバを運用したくないなら相性は弱い。AWS Glue Schema Registry のようなマネージドの方が簡単。
- Protobuf 専用のサービスが 1 つだけで、ビルドが既にスキーマをソース管理で固定しているなら過剰。

## この deep-dive の構成

- [History](./history): 起源、マイルストーン、存在理由。
- [Architecture](./architecture): コンポーネントとリクエストの流れ。
- [Adoption & Ecosystem](./adoption): 運用者と周辺エコシステム。
- [Internals](./internals): ソースから読んだ重要なコードパス。
- [Getting Started](./getting-started): インストールと最初の動作構成。

## 出典

1. Apicurio Registry README（バージョン/サポートポリシー、ビルド構成、ストレージ種別）: <https://github.com/Apicurio/apicurio-registry>
2. README getting-started と Docker run 手順: <https://github.com/Apicurio/apicurio-registry/blob/main/README.md>
3. GitHub API リポジトリメタ（stars / forks / contributors / 作成日 / SPDX ライセンス）: <https://api.github.com/repos/Apicurio/apicurio-registry>
4. CNCF Sandbox 申請 issue #72（Apicurio Registry, 2023-11）: <https://github.com/cncf/sandbox/issues/72>
5. CNCF Sandbox issue #461（エコシステム統合: Strimzi / CloudEvents / xRegistry, 2026-02）: <https://github.com/cncf/sandbox/issues/461>
6. Apicurio Blog（Studio 起源 2016 / Registry 2019 / Studio 統合 / 3.3.0 GitOps）: <https://www.apicur.io/blog/>
7. Apicurio Registry リリース（1.0.4.Final〜3.3.0）: <https://github.com/Apicurio/apicurio-registry/releases>
8. ADOPTERS.md（Axual / Castor / IBM / Libon / Red Hat / ZenWave 360）: <https://github.com/Apicurio/apicurio-registry/blob/main/ADOPTERS.md>
