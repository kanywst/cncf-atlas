# 内部実装

> コミット `39a0c02` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cli/main.go` | プロセスのエントリ。`CmdInit()` の後 cobra `Execute()` を呼ぶ |
| `cli/cmd/cmd.go` | 静的なトップレベルコマンドを登録 |
| `cli/cmd/create.go` | `create` コマンド、実行クロージャ、同期/非同期パス、自動回復 |
| `cli/cmd/exp.go` | spec 駆動のコマンドツリー、executor レジストリ、フラグ束縛 |
| `cli/cmd/command.go` | レコード構築、uid 採番、SQLite 挿入 |
| `exec/os/` | `chaos_os` バイナリへ shell out する OS executor |
| `data/` | SQLite ベースの実験・準備ストア |
| `version/` | バージョン情報 (`scripts/version.sh` が生成) |

## 中核データ構造

`data.ExperimentModel` (`data/experiment.go:30`) は永続化される実験レコードである。フィールドは `Uid`・`Command`・`SubCommand`・`Flag`・`Status`・`Error`・`CreateTime`・`UpdateTime`。

```go
type ExperimentModel struct {
    Uid        string
    Command    string
    SubCommand string
    Flag       string
    Status     string
    Error      string
    CreateTime string
    UpdateTime string
}
```

対応するテーブルはインラインの `expTableDDL` (`data/experiment.go:71`) として宣言され、`uid` は `UNIQUE` 制約を持つ。

```go
const expTableDDL = `CREATE TABLE IF NOT EXISTS experiment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uid VARCHAR(32) UNIQUE,
    command VARCHAR NOT NULL,
    sub_command VARCHAR,
    flag VARCHAR,
    status VARCHAR,
    error VARCHAR,
    create_time VARCHAR,
    update_time VARCHAR
)`
```

ストアのインターフェースは `SourceI` (`data/source.go:36`) で、`ExperimentSource` (`data/experiment.go:41`) と `PreparationSource` を合成する。具象 `Source` は `*sql.DB` を保持する (`data/source.go:41`)。

実行時の実験表現は `spec.ExpModel` (`chaosblade-spec-go` SDK 由来) で、`cli/cmd/exp.go:435` で `Target`・`Scope`・`ActionName` と `ActionFlags` マップを持って生成される。レジストリを保持するコマンドサービスは `baseExpCommandService` (`cli/cmd/exp.go:91`)。executor キーは `createExecutorKey` (`cli/cmd/exp.go:452`) で導出される。

## 追う価値のあるパス

`blade create cpu load --cpu-percent 60` をフラグ解釈から障害注入まで追う。

leaf コマンドの `RunE` は `actionRunEFunc` (`cli/cmd/create.go:104`) である。まず cobra フラグを `spec.ExpModel` に変換する。

```go
expModel := createExpModel(target, scope, actionCommandSpec.Name(), cmd)
```

`createExpModel` (`cli/cmd/exp.go:435`) は false 以外の全フラグをマップにコピーする。

```go
cmd.Flags().VisitAll(func(flag *pflag.Flag) {
    if flag.Value.String() == "false" {
        return
    }
    expModel.ActionFlags[flag.Name] = flag.Value.String()
})
```

次にレコードを永続化する。`recordExpModel` (`cli/cmd/command.go:76`) は uid が与えられていなければ採番し (`cli/cmd/command.go:82`、採番器の宣言は `cli/cmd/command.go:122`)、`data.ExperimentModel` を組み (`cli/cmd/command.go:96`)、挿入する (`cli/cmd/command.go:106`)。

同期分岐では executor をインラインで実行する。

```go
executor := actionCommandSpec.Executor()
executor.SetChannel(channel.NewLocalChannel())
ctx := context.WithValue(context.Background(), spec.Uid, model.Uid)
response := executor.Exec(model.Uid, ctx, expModel)
```

このブロックは `cli/cmd/create.go:180` から `cli/cmd/create.go:183` にある。OS executor の `Exec` (`exec/os/executor.go:42`) は `spec.IsDestroy(ctx)` で create か destroy かを判定し、`argsArray` を組み立て、外部バイナリを解決する。

```go
chaosOsBin := path.Join(util.GetProgramPath(), "bin", spec.ChaosOsBin)
command := os_exec.CommandContext(ctx, chaosOsBin, argsArray...)
```

hang 型の障害は `command.Start()` (`exec/os/executor.go:71`) の後に子プロセスの PID を返す。それ以外は `command.CombinedOutput()` (`exec/os/executor.go:78`) を実行し、`spec.Decode(outMsg, nil)` (`exec/os/executor.go:84`) でデコードする。`create.go` に戻り、成功した実行は `GetDS().UpdateExperimentModelByUid(model.Uid, Success, response.Err)` (`cli/cmd/create.go:222`) でレコードを更新する。実装は `data/experiment.go:164`。

## 読んで驚いた点

CLI はそれ自身では障害を注入しない。一行の CPU 負荷ですら別プロセス `chaos_os` へ出ていき (`exec/os/executor.go:66` と `exec/os/executor.go:67`)、シナリオ文法はコンパイル時ではなく実行時に YAML からロードされる (`cli/cmd/exp.go:140`)。ビルドを読むと理由が分かる。`Makefile:341` が `chaosblade-exec-os` を clone し、その `make` を実行してそのバイナリと YAML を生成する。

自動回復は cobra の `PostRunE` で結線される。`actionPostRunEFunc` (`cli/cmd/create.go:252`) は `timeout` フラグを読み、設定されていれば切り離された回復処理をスケジュールする。

```go
args := fmt.Sprintf("nohup /bin/sh -c 'sleep %d; %s destroy %s' > /dev/null 2>&1 &",
    timeout, script, actionCommand.uid)
```

このスニペットは `cli/cmd/create.go:275` にある。container と pod のスコープでは timeout を 60 秒上乗せする (`cli/cmd/create.go:271`)。`timeout` フラグはユーザーが付け忘れる類のものではなく、`addTimeoutFlag` (`cli/cmd/exp.go:405`) が全 action に自動付与する。

もう 1 点。SQLite ドライバは cgo 不要の `github.com/glebarez/sqlite` (`data/source.go:28`) なので、`blade` は外部 DB もビルド時の C ツールチェインも持たない静的 Go バイナリとして配布される。
