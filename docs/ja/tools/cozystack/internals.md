# 内部実装

> コミット `f5c408d` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/cozystack-api/` | 集約 apiserver のエントリポイント (`main.go:27`)。 |
| `pkg/cmd/server/` | サーバの options と起動処理。`ApplicationDefinition` CRD を読んで実行時 `ResourceConfig` を組む。 |
| `pkg/apiserver/` | generic apiserver を配線し、kind ごとに REST storage を 1 つ登録する (`apiserver.go:229`)。 |
| `pkg/registry/apps/application/` | 全 Application kind が共有する単一の汎用 REST storage と、Application から HelmRelease への変換。 |
| `pkg/apis/apps/v1alpha1/` | `Application` の Go 型とその API 登録。 |
| `pkg/config/` | 平らにした実行時 config の型 (`Resource`・`ApplicationConfig`・`ReleaseConfig`)。 |
| `api/v1alpha1/` | kind を定義する `ApplicationDefinition` CRD の型。 |
| `packages/apps/` | テナント向け Helm chart (kind ごと 1 つ)。 |
| `packages/system/`、`packages/core/` | システムコンポーネントとプラットフォームのブートストラップ chart。 |

## 中核データ構造

`Application` (`pkg/apis/apps/v1alpha1/types.go:75`) は、あらゆるテナント向け kind を表す唯一の Go 型だ。中身は不透明で、spec は `Spec *apiextensionsv1.JSON` (`pkg/apis/apps/v1alpha1/types.go:81`)。Go には `PostgresSpec` も `KubernetesSpec` もない。kind 固有のスキーマは型の外側、config が運ぶ OpenAPI スキーマ文字列に持つ。

`REST` (`pkg/registry/apps/application/rest.go:89`) は全 kind が共有する唯一の storage 型だ。1 つの値が `gvr`・`gvk`・`kindName`・`releaseConfig`・`specSchema` を保持し、Getter・Lister・Creater・Updater・Watcher・Patcher を自前で実装する。`Postgres` と `Kafka` のエンドポイントは、config が違うだけで同じ Go 型だ。

`config.Resource`・`ApplicationConfig`・`ReleaseConfig` (`pkg/config/config.go:126`, `:132`, `:141`) は `ApplicationDefinition` 1 件を平らにした実行時形式で、kind から chart・prefix・labels・HelmRelease 生成パラメタへの対応だ。

`ApplicationDefinition` (`api/v1alpha1/applicationdefinitions_types.go`) は kind を宣言する CRD だ。`OpenAPISchema` 文字列 (`:69`)、`Plural` 名 (`:71`)、chart 参照・prefix・labels を持つ `Release` ブロック (`:52`) を運ぶ。これらのリソースが、起動時に `config.Resource` へ変わる設定ソースだ。

永続化されるオブジェクトは Cozystack の型ですらない。Flux の `helmv2.HelmRelease` (`github.com/fluxcd/helm-controller/api/v2` 由来) だ。Cozystack は自前の store を持たず、`HelmRelease` が記録そのものだ。

## 追う価値のあるパス

起こることは 2 つだ。起動時に kind が登録され、その後 create ごとに変換される。

起動時、`pkg/apiserver/apiserver.go:229` は解決済みのリソースを回し、kind ごとに REST storage を登録する:

```go
appsV1alpha1Storage := map[string]rest.Storage{}
for _, resConfig := range c.ResourceConfig.Resources {
    storage := applicationstorage.NewREST(cli, watchCli, &resConfig)
    appsV1alpha1Storage[resConfig.Application.Plural] = cozyregistry.RESTInPeace(storage)
}
```

`c.ResourceConfig.Resources` は前段で `ApplicationDefinition` CRD を読み、各々を `config.Resource` に平らにして作る。`NewREST` (`pkg/registry/apps/application/rest.go:130`) は定義の `OpenAPISchema` 文字列を defaulting 用の structural schema に変える。ただし Go 型は全 kind で同じ汎用 `REST` だ。

create では `REST.Create` (`pkg/registry/apps/application/rest.go:166`) が名前を検証し、`validateNoInternalKeys` で `_` 始まりの予約キーを弾き、admission チェーンを手動で実行する。カスタム REST ハンドラは `genericregistry.Store` のように自動配線されないためだ (`pkg/registry/apps/application/rest.go:210`)。核心は変換だ。`convertApplicationToHelmRelease` は values が Application spec そのままの `HelmRelease` を組む:

```go
ValuesFrom: []helmv2.ValuesReference{
    {
        Kind: "Secret",
        Name: "cozystack-values",
    },
},
Values: app.Spec,
```

この `Values: app.Spec` の行 (`pkg/registry/apps/application/rest.go:1605`) が全部の肝だ。テナントの不透明な spec JSON がそのまま chart の Helm values になる。リリース名は `Prefix + app.Name` (`pkg/registry/apps/application/rest.go:1570`)、kind ごとの固定 `ChartRef` を指し、必ずプラットフォーム共通値の `Secret/cozystack-values` を mount する。その後で `HelmRelease` がクラスタに作成され (`pkg/registry/apps/application/rest.go:238`)、作られたオブジェクトは応答用に `Application` へ逆変換される (`pkg/registry/apps/application/rest.go:245`)。

## 読んで驚いた点

マネージドサービスの追加は Go コードに一切触れない。kind は起動時に読む `ApplicationDefinition` 由来 (`pkg/apiserver/apiserver.go:229`) で、全 kind が不透明 JSON spec 上の 1 つの汎用 `REST` で処理される (`pkg/apis/apps/v1alpha1/types.go:80`) ため、新しいデータベースは `packages/apps/` の Helm chart と、その定義を配る `-rd` chart だけだ。バイナリは変わらない。

kind ごとのタイミングはコードでなくアノテーションにある。install/upgrade のタイムアウト、リトライ間隔、wait 無効化は変換時に `ApplicationDefinition` から読まれる (`pkg/registry/apps/application/rest.go:1553`)。`Kubernetes` kind は install タイムアウトが長い。Kamaji の admin-kubeconfig Secret が非同期生成で現れるのが遅いことがあるため、グローバルにハードコードせず kind ごとに調整している。

テナント kind は自分の名前以上を検証する。`Tenant` では `Create` が、算出されるワークロード namespace が DNS-1123 label 上限に収まるかも確認する。深くネストしたテナントは祖先チェーン全体から namespace を作るため、自身の名前が妥当でも上限を超え得るからだ (`pkg/registry/apps/application/rest.go:189`)。
