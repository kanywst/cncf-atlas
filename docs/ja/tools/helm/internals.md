# 内部実装

> コミット `74fa4fce` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/helm/helm.go` | 薄い `main`: managed-fields 名を設定しルートコマンドを実行。 |
| `pkg/cmd` | cobra コマンド層。フラグ解釈とチャート/値の解決。 |
| `pkg/action` | サブコマンドごとのビジネスロジックと共有 `Configuration`。 |
| `pkg/engine` | Go `text/template` ベースのチャートレンダラ。 |
| `pkg/chart` | チャートのデータモデル (v2) と `internal/chart/v3`。 |
| `pkg/storage`、`pkg/storage/driver` | リリース永続化。secret/configmap/memory/sql driver。 |
| `pkg/kube` | Kubernetes クライアントラッパ (build / create / update / wait)。 |
| `pkg/registry`、`pkg/getter`、`pkg/downloader`、`pkg/repo`、`pkg/pusher` | OCI を含むチャート取得と公開。 |
| `pkg/provenance` | OpenPGP 署名と検証。 |

## 中核データ構造

`Release` はチャートのデプロイ 1 回分 (`pkg/release/v1/release.go:30`)。`Name`・`Info`・`Chart`・`Config` (上書き値)・`Manifest` (描画済み YAML)・`Hooks`・`Version` (revision)・`Namespace`・`ApplyMethod` (`"ssa"` か `"csa"`) を持つ。ロールバックはこの revision を辿る。

`Chart` はパッケージモデル (`pkg/chart/v2/chart.go:38`): `Metadata` (Chart.yaml 由来)・`Lock`・`Templates`・`Values` (デフォルト値)・`Schema` (任意の JSON Schema)・`Files`。非公開の `parent` と `dependencies` フィールドがサブチャートを木構造にする。

`Driver` はリリースの保存先を抽象化する (`pkg/storage/driver/driver.go:99`)。`Creator`・`Updator`・`Deletor`・`Queryor`・`Name()` を合成し、secret / configmap / memory / sql の各バックエンドが実装する。

`Configuration` は action 層の共有コンテキスト (`pkg/action/action.go`): `KubeClient`・`Releases` storage・`Capabilities`・`RESTClientGetter`・`CustomTemplateFuncs`。`getStorage` が `HELM_DRIVER` を読んで driver を組む (`pkg/action/action.go:675`)。

`renderable` はエンジン内部の単位 (`pkg/engine/engine.go:137`): テンプレート文字列 `tpl`・その `vals`・namespace prefix の `basePath`。

## 追う価値のあるパス

`helm install` は `Install.RunWithContext` を通る (`pkg/action/install.go:284`)。面白いのは順序で、何かを書き込む前に Helm は描画・オブジェクト構築・衝突チェックを行い、クラスタを触る前にリリースを storage へ保存する。

```text
runInstall (pkg/cmd/install.go:159)
  -> Install.RunWithContext (pkg/action/install.go:284)
       IsReachable                      install.go:296
       availableName                    install.go:308
       ProcessDependencies              install.go:313
       getCapabilities                  install.go:352
       ToRenderValuesWithSchemaValidation install.go:366
       createRelease (Revision=1)       install.go:375
       renderResources                  install.go:378 -> action.go:279
       KubeClient.Build                 install.go:394
       existingResourceConflict         install.go:415
       (dry-run はここで return)        install.go:423
       Releases.Create                  install.go:465
       performInstallCtx                install.go:472
```

`renderResources` はチャートの `KubeVersion` 制約をクラスタと突き合わせてから描画する。実クラスタと話す場合は `engine.New(restConfig)` でエンジンを組み、そうでなければ素の `engine.Engine` を使う (`pkg/action/action.go:300`、`pkg/action/action.go:305`、`pkg/action/action.go:311`)。どちらも `e.RenderWithContext(ctx, ch, values)` を呼ぶ (`pkg/action/action.go:309`、`pkg/action/action.go:315`)。描画後、`NOTES.txt` をファイルマップから別バッファへ抜き出し、manifest として扱わないようにする (`pkg/action/action.go:329`)。

## 読んで驚いた点

エンジンはクローンしたテンプレートごとに `missingkey` オプションを再注入し、strict モードでは `missingkey=error`、それ以外では `missingkey=zero` を選ぶ (`pkg/engine/engine.go:189`)。コメントは [golang/go#43022](https://github.com/golang/go/issues/43022) を指す。`text/template` のオプションフィールドは非公開なので、クローンすると設定が失われ、手で再設定する必要がある。

install は upgrade にはない存在チェックを行う。何かを作る前に `existingResourceConflict` を呼び、描画されたリソースが既に存在すれば中断する。`--take-ownership` を付けると `requireAdoption` に切り替わる (`pkg/action/install.go:412`、`pkg/action/install.go:415`)。理由はコード内にある。既存リソースを新しいリリースに取り込むと、そのリリースをアンインストールしたとき Helm が作っていないリソースまで消してしまうからだ。

リリース状態は素の YAML では保存されない。`encodeRelease` はリリースを JSON マーシャルし、`gzip.BestCompression` で gzip し、base64 エンコードする (`pkg/storage/driver/util.go:38`)。これが `helm.sh/release.v1` 型の Secret に入る (`pkg/storage/driver/secrets.go:284`)。
