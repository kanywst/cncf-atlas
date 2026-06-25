# 内部実装

> コミット `2df3b8c` (v0.40.7) のソースから読んだ。ここでの主張はすべてファイルと行を指す。

## コードマップ

`main` の入口は小さい。`main.go:15` が `cmd.NewPackCommand` で cobra ルートを組み (`main.go:19`)、`SoftError` なら exit 2、それ以外は exit 1 で終わる (`main.go:27`)。本体は 3 層に分かれる。

| パス | 責務 |
| --- | --- |
| `cmd/` | cobra ルートコマンドの組み立て。 |
| `internal/commands/` | サブコマンドごとのフラグ定義と入力検証。 |
| `pkg/client/` | 公開 API。`Client.Build` (`pkg/client/build.go:308`) がビルドをオーケストレートする。 |
| `internal/build/` | フェーズをコンテナとして走らせる lifecycle 実行エンジン。 |
| `pkg/dist/` | buildpack と builder のディスク上メタデータ型。 |
| `internal/builder/` | builder イメージのインメモリ表現。 |

## 中核データ構造

`BuildOptions` (`pkg/client/build.go:85`) は `pack build` の全入力を運ぶ。`Image` と `Builder` (どちらも必須)、`AppPath`、`Buildpacks`、`Extensions`、`Publish`、`PullPolicy`、`TrustBuilder` クロージャ、キャッシュ設定。CLI 層と client 層の契約だ。

`LifecycleOptions` (`internal/build/lifecycle_executor.go:72`) は lifecycle 実行の全パラメータを持つ。`UseCreator` と `UseCreatorWithExtensions` (trust 分岐)、`LifecycleImage`、`Cache`、`Network`、uid/gid、`CreationTime`。`BuildOptions` から `pkg/client/build.go:637` で組まれる。

`LifecycleExecution` (`internal/build/lifecycle_execution.go:35`) は 1 回のビルド実行の状態だ。ネゴシエートされた `platformAPI`、ランダム名の layers / app ボリューム、マウントパス、オプション、tmp ディレクトリ。フェーズメソッドのレシーバになる。

`dist.Order` (`pkg/dist/dist.go:41`) は buildpack の検出順序だ。`Order` は `OrderEntry` のスライスで (`pkg/dist/dist.go:43`)、各エントリは `ModuleRef` の `Group` を持ち (`pkg/dist/dist.go:57`)、`ModuleRef` は `ModuleInfo` に `Optional` フラグを足したものだ。detect フェーズがこの順序を解決し、適用する buildpack を選ぶ。

`builder.Builder` (`internal/builder/builder.go:71`) は builder イメージのインメモリ表現だ。`order` と `orderExtensions`、lifecycle ディスクリプタ、追加 buildpack / extension、uid/gid、stack id を持つ。`pack` が ephemeral builder を作るときは、保存前にここへ buildpack を足す。

## 追う価値のあるパス

`Run` の分岐がもっとも影響の大きいコードだ。キャッシュを解決し bridge ネットワークを作った後、`UseCreator` で分かれる。

```go
if !l.opts.UseCreator {
    if l.platformAPI.LessThan("0.7") {
        // DETECT then ANALYZE
    } else {
        // ANALYZE then DETECT
    }
    // ... restore, build (or extend), export in separate containers
}
return l.Create(ctx, buildCache, launchCache, phaseFactory)
```

untrusted パス (`internal/build/lifecycle_execution.go:240`) は各フェーズを個別のコンテナで走らせ、root が要るフェーズだけを信頼コンテナで実行し、それ以外は CNB ユーザに降格する。trusted パスは `l.Create` (`internal/build/lifecycle_execution.go:349`) に落ち、すべてを単一コンテナで実行する。

`Detect` (`internal/build/lifecycle_execution.go:482`) はフェーズコンテナの組み立て方を示す。`NewPhaseConfigProvider` には、コンテナ前に走る操作 (`EnsureVolumeAccess`、続いて builder の uid/gid で app をボリュームへコピーする `CopyDir`) が渡され、extension があるときは `analyzed.toml` と `generated/` を `CopyOutToMaybe` で吸い出す post-container 操作が渡される (`internal/build/lifecycle_execution.go:504`)。フェーズは `phaseFactory.New(configProvider).Run(ctx)` で走る。

## 驚いた点

`pack` は「ビルドツール」ではなく「プラットフォーム」だ。ビルドロジックは別の `lifecycle` バイナリにあり、`pack` は builder と lifecycle イメージをコンテナとして orchestrate するだけだ。`github.com/buildpacks/lifecycle/api` の import (`internal/build/lifecycle_executor.go:9`) は、自分でビルドするためではなく、Platform API 契約とファイルフォーマットを共有するためにある。

ビルドごとに `pack.local-network-<rand>` という使い捨ての bridge ネットワークと、使い捨ての layers / app ボリュームを作る (`internal/build/lifecycle_execution.go:217`)。クリーンアップは defer + リトライで行う。

trusted builder の警告は security-sensitive だ。untrusted builder とボリュームマウントの組み合わせは、機微データ露出について明示的な警告を出す (`internal/commands/build.go:136`)。そして trust の判定が、root フェーズを他のビルドと同じコンテナで走らせるかどうかを決める。

## 出典

1. [buildpacks/pack リポジトリ](https://github.com/buildpacks/pack)
2. [buildpacks/lifecycle リポジトリ](https://github.com/buildpacks/lifecycle)
