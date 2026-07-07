# 内部実装

> コミット `be1faef` (v0.60.3) のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/controller` | プロセスのエントリポイント、フラグ解析、調整器の配線、サイドカーモード。 |
| `pkg/app` | `App` 調整器と fetch/template/deploy パイプライン。 |
| `pkg/fetch`、`pkg/template`、`pkg/deploy` | Carvel コマンドラインツールをラップする各段の実装。 |
| `pkg/sidecarexec` | 外部ツールを実行するサイドカー RPC (遠隔手続き呼び出し) のサーバとクライアント。 |
| `pkg/apiserver` | `Package` と `PackageMetadata` を提供する集約 API サーバ。 |
| `pkg/packageinstall`、`pkg/pkgrepository` | `PackageInstall` と `PackageRepository` の調整器。 |
| `pkg/apis` | カスタムリソースの型定義。 |

## 中核データ構造

- **`App` / `AppSpec`** (`pkg/apis/kappctrl/v1alpha1/types.go:24` と `pkg/apis/kappctrl/v1alpha1/types.go:48`)。spec は 3 つのパイプライン段、`Fetch` (`pkg/apis/kappctrl/v1alpha1/types.go:58`)・`Template` (`pkg/apis/kappctrl/v1alpha1/types.go:60`)・`Deploy` (`pkg/apis/kappctrl/v1alpha1/types.go:62`) を運ぶ。`ServiceAccountName` (`pkg/apis/kappctrl/v1alpha1/types.go:52`) はデプロイに使う権限を絞る。
- **`PackageInstall` / `PackageInstallSpec`** (`pkg/apis/packaging/v1alpha1/package_install.go:24` と `pkg/apis/packaging/v1alpha1/package_install.go:47`)。`PackageRef` フィールド (`pkg/apis/packaging/v1alpha1/package_install.go:57`) はパッケージを名前で指し、その `VersionSelection` がセマンティックバージョンの制約を運ぶ (`pkg/apis/packaging/v1alpha1/package_install.go:89`)。`PackageInstall` は生成された `App` に解決される高レベルの抽象である。
- **`PackageRepository` / `PackageRepositorySpec`** (`pkg/apis/packaging/v1alpha1/package_repository.go:20` と `pkg/apis/packaging/v1alpha1/package_repository.go:41`)。その `Fetch` フィールド (`pkg/apis/packaging/v1alpha1/package_repository.go:50`) は、中身がパッケージとして利用可能になる imgpkg バンドルを指定する。
- **`Package` / `PackageMetadata`** (`pkg/apiserver/apis/datapackaging/types.go:30` と `pkg/apiserver/apis/datapackaging/types.go:16`)。これらは CRD ではなく、集約 API サーバが提供する読み取り向きのビューである。

## 追う価値のあるパス

興味深い問いは、外部ツールが実際にどう実行されるかだ。答えは「コントローラが `exec` を呼ぶ」ではないからである。deploy 段から始めよう。`App.deploy` は deploy エントリがちょうど 1 件であることを要求し、`kapp.Deploy` を呼ぶ (`pkg/app/app_deploy.go:38`)。`Kapp.Deploy` は引数リストを組み立て (`pkg/deploy/kapp.go:66`)、コマンドを構築し (`pkg/deploy/kapp.go:73`)、`cmdRunner` を通して実行する (`pkg/deploy/kapp.go:79`)。

```text
goexec.Command("kapp", args...)
...
err = a.cmdRunner.RunWithCancel(cmd, a.cancelCh)
```

この `cmdRunner` は素の実行器ではない。`Run` 内でコントローラはサイドカークライアントを構築し (`cmd/controller/run.go:153`)、その `CmdExec()` を app factory に渡す (`cmd/controller/run.go:158`)。したがってすべてのツール呼び出しは `CmdExecClient` を通る。その `Run` メソッドはコマンド名を調べ、`kapp` のときだけ RPC ではなくローカルで実行する (`pkg/sidecarexec/cmd_exec_client.go:38`)。

```text
if cmdName == "kapp" {
    return r.local.Run(cmd)
}
```

deploy パスが使う `RunWithCancel` も同じ特例を持つ。`kapp` はローカルで動き、それ以外は panic する。キャンセル可能な実行が RPC チャネルでは提供されないからだ (`pkg/sidecarexec/cmd_exec_client.go:81`)。fetch と template のツールは代わりに RPC パスを取る。サーバ側では、要求された各コマンドは実行前に allowlist と照合される (`pkg/sidecarexec/cmd_exec.go:40`)。

```text
if _, found := r.allowedCmdNames[input.Command]; !found {
    return fmt.Errorf("Command '%s' is not allowed", input.Command)
}
```

allowlist はサイドカー起動時に投入される (`cmd/controller/sidecarexec.go:20`)。

```text
AllowedCmdNames: []string{
    // Fetch (calls impgkg and others internally)
    "vendir",
    // Template
    "ytt", "kbld", "sops", "helm", "cue",
},
```

`vendir` が fetch を、`ytt`・`kbld`・`sops`・`helm`・`cue` が template をカバーする。サーバはそのスライスを `NewServer` で set に変える (`pkg/sidecarexec/server.go:35`)。欠けているものに注目したい。`kapp` は allowlist に無く、これはデプロイツールがサイドカー経由ではなくローカルで動くことと整合する。

## 読んで驚いた点

- **`kapp` は意図的にサイドカーパターンを破る。** パッケージのドキュメントはサイドカーをバイナリ実行を隔離するセキュリティ境界として位置づけている (`pkg/sidecarexec/client.go:4`) が、デプロイツールは本体プロセスで動く (`pkg/sidecarexec/cmd_exec_client.go:38`)。理由は機構的だ。`kapp` は長時間実行されるキャンセル可能なコマンドであり、RPC 越しの `RunWithCancel` は設計上 panic する (`pkg/sidecarexec/cmd_exec_client.go:85`)。fetch と template は短く、リクエスト/レスポンス型の RPC に収まるが、deploy は収まらない。
- **fetch はプライベートレジストリ向けに静かにリトライする。** fetch が失敗し、`App` がイメージまたは imgpkg バンドルを参照しているとき、`vendir` は 2 秒スリープを挟んで最大 3 回リトライされる。secretgen-controller がプレースホルダの pull secret を埋める時間を稼ぐためだ (`pkg/app/app_fetch.go:54`)。これはリソース spec からは見えず、コード上でのみ明らかになる。
- **allowlist のコメントにタイポが出荷されている。** fetch のコメントは "calls impgkg and others internally" と読める (`cmd/controller/sidecarexec.go:21`)。"imgpkg" の文字入れ替わりである。無害だが、ここのスニペットがソースからの逐語であることの裏付けにはなる。
- **初回 config reconcile は意図的に同期。** ほとんどの調整器はマネージャに配線されて非同期に動くが、config 調整器は起動中に直接 1 回も呼ばれる (`cmd/controller/run.go:184`)。いずれかのツールが実行される前に、proxy と認証局 (CA) の設定がサイドカーに届くようにするためだ。
