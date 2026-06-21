# OpenFGA

> Google Zanzibar を手本にしたきめ細かい認可エンジン。関係タプルと宣言的モデルから「このユーザはこのオブジェクトに対してこれをできるか」を判定する。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [openfga/openfga](https://github.com/openfga/openfga)
- **ドキュメント基準コミット**: `9a556d8` (2026-06-18、`v1.18.0` の 1 コミット後)

## 何をするものか

OpenFGA は認可の問い合わせに答えるサービスである。モデル (ドメインが持つ関係の型を小さな DSL で記述したもの) と関係タプル (`document:1 # viewer @ user:alice` のような事実) を与えると、`Check` (許可されるか)、`ListObjects`、`ListUsers`、`Expand` といったクエリに答える。Google の Zanzibar 論文に基づく関係ベースアクセス制御 (ReBAC) を実装し、さらに condition による属性ベースのチェック (ABAC) も扱えるよう拡張している。

エンジンはステートレスである。認可データそのものは保持せず、タプルとモデルは差し替え可能なデータストア (インメモリ、PostgreSQL、MySQL、SQLite) に置かれる。この分離によって、ロードバランサの背後で多数の OpenFGA インスタンスを動かして水平スケールできる。これは Zanzibar 系システムが本来想定する運用形態である。

OpenFGA は Auth0 (のちに Okta が買収) の内部で生まれ、2022 年に OSS 化された。商用の Auth0/Okta FGA も同じエンジン上に構築されており、セルフホスト版とマネージド製品は実装を共有している。

## いつ使うか

- ロール単位ではなくオブジェクト単位の権限 (「Alice はこの 1 つのドキュメントを編集できる」) が必要で、関係を継承させたい (フォルダへの付与がその中のドキュメントに波及する) 場合。
- 各コードベースでチェックを再実装するのではなく、サービス横断で認可判定を集約したい場合。
- 明快なモデル DSL、Playground、CLI、SDK を備えた認可サービスをセルフホストしたく、将来マネージドへ移行する余地も残したい場合。

向かない場合:

- 静的なロールが数個だけの純粋な RBAC は自前 DB で管理する方が単純で、専用の認可サービスはネットワークホップと運用面を増やす。
- ポリシーが主にリクエストコンテキスト上の属性やルール式 (関係グラフではない) なら、OPA/Rego のような policy-as-code エンジンや Cedar のようなポリシー言語の方が素直に対応できる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [openfga/openfga (GitHub)](https://github.com/openfga/openfga)
2. [Announcing OpenFGA, Auth0's Open Source Fine Grained Authorization System](https://auth0.com/blog/auth0s-openfga-open-source-fine-grained-authorization-system/)
3. [OpenFGA Becomes a CNCF Incubating Project](https://www.cncf.io/blog/2025/11/11/openfga-becomes-a-cncf-incubating-project/)
4. [OpenFGA project page (CNCF)](https://www.cncf.io/projects/openfga/)
5. [LEVEL CHANGE: OpenFGA to Incubation (cncf/toc #1949)](https://github.com/cncf/toc/issues/1949)
6. [OpenFGA documentation](https://openfga.dev/)
7. [Top 5 Google Zanzibar open-source implementations (WorkOS)](https://workos.com/blog/top-5-google-zanzibar-open-source-implementations-in-2024)
