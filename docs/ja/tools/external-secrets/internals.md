# 内部実装

> コミット `e100613` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `apis/externalsecrets/{v1,v1beta1,v1alpha1}` | CRD 型。`v1` が現行。`SecretStoreProvider` は全バックエンドの discriminator union |
| `apis/generators/v1alpha1` | Generator 型 (`ClusterGenerator` umbrella と `GeneratorSpec` union) |
| `apis/meta/v1` | `SecretKeySelector`・`ServiceAccountSelector` などの共有セレクタ |
| `pkg/controllers/externalsecret/` | 主要な reconcile ループとプロバイダ取得 |
| `pkg/controllers/secretstore/` | ストア検証とクライアントマネージャ |
| `pkg/controllers/{pushsecret,clusterexternalsecret,clusterpushsecret,generatorstate,webhookconfig}/` | その他の reconciler |
| `pkg/register/*.go` | ビルドタグ付きの provider/generator 登録 (backend ごとに 1 ファイル) |
| `providers/v1/*/` | プロバイダ実装。各々が独自の Go モジュール |
| `runtime/` | 横断ヘルパ: `esutils` (resolver・CA 取得・key 検証)・`cache`・`statemanager`・`feature`・`decoding` |

## 中核データ構造

`Provider` (`apis/externalsecrets/v1/provider.go:53`) は工場インタフェースで、`NewClient`・`ValidateStore`・`Capabilities` を持つ。ストア設定を `SecretsClient` に変える。

`SecretsClient` (`apis/externalsecrets/v1/provider.go:73`) はバックエンドごとの契約で、8 メソッドを持つ: `GetSecret`・`PushSecret`・`DeleteSecret`・`SecretExists`・`Validate`・`GetSecretMap`・`GetAllSecrets`・`Close`。read-only なプロバイダも `PushSecret` と `DeleteSecret` を実装する。慣例として `nil` ではなく sentinel error を返し、呼び出し側が「未対応」と「成功」を区別できるようにする。

`NoSecretErr = NoSecretError{}` (`apis/externalsecrets/v1/provider.go:103`) は、シークレットが存在しないときにプロバイダが返す番兵である。インタフェースのコメントは、`GetSecret` がこのエラーを返すと該当エントリが `deletionPolicy` に従って削除される、と明記する。削除の挙動全体がこの 1 つの値にぶら下がっている。

`builder map[string]Provider` (`apis/externalsecrets/v1/provider_schema.go:26`) は、プロバイダ名から実装へのグローバルレジストリである。`Register` は重複名を拒否し (`provider_schema.go:44`)、`pkg/register/` 配下の `init()` がビルドタグに応じて起動時にこれを埋める。

## 追う価値のあるパス

面白いのは、ストア設定が具体的なバックエンドに解決される仕組みである。ESO はこれを型フィールドではなく JSON の形で行う。`GetProvider` (`apis/externalsecrets/v1/provider_schema.go:75`) は `getProviderName` を呼び、これが `SecretStoreProvider` union を JSON に marshal し、map に unmarshal し、ちょうど 1 つのキーを要求する。

```text
GetProvider(store)
  getProviderName(spec)
    json.Marshal(spec) -> map
    len(map) != 1  -> error "must only have exactly one backend specified"
    return the single key           // 例: "aws", "vault", "gcpsm"
  builder[name]  -> 登録された Provider
```

このコードが `provider_schema.go:104-124` である。プロバイダブロックが 2 つ設定された、あるいは 1 つも設定されていないストアは、プロバイダ内ではなくここで失敗する。ここからクライアントマネージャが引き継ぐ。`Manager.GetFromStore` (`pkg/controllers/secretstore/client_manager.go:84`) は `GetProvider` を呼び (`:85`)、同一ストアのクライアントが既にあれば再利用し (`getStoredClient`, `:147`)、なければ `storeProvider.NewClient(...)` で生成する (`:98`)。

参照形として読むのに最も単純なプロバイダは fake である。`GetSecret` は `p.config[mapKey(ref.Key, ref.Version)]` を引き、無ければ `NoSecretErr` を返す (`providers/v1/fake/fake.go:180`)。`ref.Property` が設定されていれば `gjson` で JSON パスを抽出し、そうでなければ生値を返す。`GetSecretMap` (`providers/v1/fake/fake.go:198`) は `GetSecret` の結果を JSON として k/v に unmarshal する。全プロバイダが「単一の値を取得し、必要なら JSON として展開する」という同じパターンに従う。

## 読んで驚いた点

バックエンドは JSON のキー数で識別される。discriminator フィールドの代わりに、`getProviderName` はプロバイダ union を marshal し、`len(storeMap) != 1` をエラーとする (`provider_schema.go:116-118`)。設定の構造そのものが型タグになっている。

存在確認は full cache ではなく partial cache を使う。`--enable-managed-secrets-caching` が有効なとき、full cache は `managed` ラベル付きの Secret しか持たないため「この Secret がまだ存在するか」に答えられない。ESO はその確認に別の partial cache から `metav1.PartialObjectMetadata` を読み、コントローラのコメントが回避する race を説明している (`pkg/controllers/externalsecret/externalsecret_controller.go:301-309`)。

プロバイダクライアントは意図的に個々の呼び出しより長く生きる。`secretstore.Manager` は reconcile 全体を通してクライアントを開いたままにし、終了時にまとめて Close する。一部のプロバイダ (GCP) が呼び出しごとにクライアントを安価に再生成できないためである (`pkg/controllers/externalsecret/externalsecret_controller_secret.go:49-52`)。

finalizer は Update ではなく Patch で付与される。Update を使うとコントローラが `refreshInterval` のような spec フィールドの共同所有者になってしまう。Patch なら残りの spec の所有権を主張せず finalizer だけを足せる (`pkg/controllers/externalsecret/externalsecret_controller.go:231-234`)。
