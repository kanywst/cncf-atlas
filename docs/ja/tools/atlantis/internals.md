# 内部実装

> コミット `b7cea53` のソースから読んだ。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `server/controllers/events` | webhook エンドポイントとホストの振り分け。`events_controller.go` が入口。 |
| `server/events` | コマンドのオーケストレーション。解釈・権限確認・プロジェクト単位コマンドの構築・実行。`command_runner.go` がハブ。 |
| `server/events/vcs` | VCS ホストごとに 1 つずつのクライアント。コメント・commit status・変更ファイルを扱う。 |
| `server/core/runtime` | ワークフローのステップごとに 1 つの `*_step_runner.go` (init / plan / apply / policy_check / run / env / multienv / import / state_rm)。 |
| `server/core/terraform` | Terraform / OpenTofu バイナリのダウンロードと実行。 |
| `server/core/locking`, `server/core/db` | ロックの永続化。BoltDB が組み込みデフォルト、Redis はオプション。 |
| `server/core/config/valid` | `atlantis.yaml` を検証済み構造体 (`RepoCfg`, `Project`, `Workflow`, `Stage`, `Step`) にパースする。 |

## 中核データ構造

`command.ProjectContext` は 1 プロジェクト 1 操作のコンテキストである (`server/events/command/project_context.go:24`)。`CommandName`・`ApplyCmd`・`PlanRequirements`・`AutoplanEnabled`・`AutoplanWhenModified`・`EscapedCommentArgs` などを持つ大型の構造体だ。`EscapedCommentArgs` フィールドは実際のインジェクション防御を記録している。追加引数をバックスラッシュでエスケープし、`sh -c` の中で安全に渡せるようにする (`server/events/command/project_context.go:57-61`)。コメントは防ぐ攻撃を具体的に名指ししている:

```go
    // EscapedCommentArgs are the extra arguments that were added to the atlantis
    // command, ex. atlantis plan -- -target=resource. We then escape them
    // by adding a \ before each character so that they can be used within
    // sh -c safely, i.e. sh -c "terraform plan $(touch bad)".
    EscapedCommentArgs []string
```

`models.ProjectLock` はロックのレコードで、`Project`・`Pull`・`User`・`Workspace`・`Time` を持つ (`server/events/models/models.go:271`)。`models.Project` は Terraform プロジェクトを `ProjectName`・`RepoFullName`・`Path` で同定する。`Path` はリポルート相対で、`.` はルートを意味する (`server/events/models/models.go:290`)。`Path` には残された TODO があり、`RepoRelDir` にリネームしない理由を説明している。それをやると BoltDB が既に書いたオンディスク形式が壊れるからだ (`server/events/models/models.go:298-301`)。

`valid.Workflow` と `valid.Step` はパース済みのカスタムワークフローを保持する。`Workflow` は `Apply`・`Plan`・`PolicyCheck`・`Import`・`StateRm` の 5 つの stage (`server/core/config/valid/repo_cfg.go:252`)、`Step` は `StepName`・`ExtraArgs`・`RunCommand`・`RunShell` を持つ (`server/core/config/valid/repo_cfg.go:231`)。

## たどる価値のあるパス

`doPlan` を追う。これは plan 対象のプロジェクトを実際の Terraform 実行へと変える関数だ (`server/events/project_command_runner.go:666`)。ロックを取り、clone し、ステップを実行し、`PlanSuccess` を返す。

まず、この repo / dir / workspace に対する永続的な Atlantis ロックを取得する (`server/events/project_command_runner.go:668`):

```go
    // Acquire Atlantis lock for this repo/dir/workspace.
    lockAttempt, err := p.Locker.TryLock(ctx.Log, ctx.Pull, ctx.User, ctx.Workspace, models.NewProject(ctx.Pull.BaseRepo.FullName, ctx.RepoRelDir, ctx.ProjectName), ctx.RepoLocksMode == valid.RepoLocksOnPlanMode)
```

次に、これから操作するディレクトリ用に別のプロセス内ロックを取得し (`server/events/project_command_runner.go:678`)、リポジトリを clone し (`server/events/project_command_runner.go:685`)、ワークフローのステップを実行する (`server/events/project_command_runner.go:710`)。成功時にはロック URL・Terraform 出力・再 plan / apply コマンドを持つ `PlanSuccess` を返す (`server/events/project_command_runner.go:719-725`)。

ステップは `runSteps` で実行される。これは `step.StepName` で分岐するディスパッチャだ (`server/events/project_command_runner.go:902`)。反復前に、実行全体に対して Git read lock を保持し、clone・reset・merge がステップの足元でディレクトリを動かせないようにする (`server/events/project_command_runner.go:906`):

```go
    // Hold a read lock for the whole step run so clone/reset/merge cannot run in this dir until we're done.
    unlock := p.WorkingDir.GitReadLock(ctx.Pull.BaseRepo, ctx.Pull, ctx.Workspace)
    defer unlock()
```

switch は各ステップ名を runner にマッピングする (`server/events/project_command_runner.go:913-940`)。plan の case は `p.PlanStepRunner.Run` を呼ぶ (`server/events/project_command_runner.go:917`)。その runner は Terraform の distribution とバージョンを解決し (`server/core/runtime/plan_step_runner.go:51-58`)、plan ファイル名を決め (`:60`)、最後に `TerraformExecutor.RunCommandWithVersion` でバイナリを実行する (`:62`)。出力が Terraform Enterprise (TFE) の remote operation のように見えると、`remotePlan` にフォールバックする (`server/core/runtime/plan_step_runner.go:63-66`)。

## 驚いた点

ロック設計は 1 つではなく 2 つのシステムである。永続ロックは `Locker.TryLock` を通じて DB に存在し (`server/events/project_command_runner.go:668`)、異なる Pull Request をまたいで同一の repo / dir / workspace を直列化する。プロセス内の `WorkingDirLocker.TryLock` (`server/events/project_command_runner.go:678`) は別の関心事だ。同じ作業ディレクトリ上でディスク上の 2 操作が競合するのを止める。さらにその上で、`runSteps` 内の Git read lock (`:906`) がステップ実行中に clone・reset・merge を締め出す。Pull Request 間の論理的排他とプロセス内のファイルシステム排他を、意図的に別レイヤとして持っている。

ロックキーはパスであり、正規表現で逆パースされる。キー形式は `{repoFullName}/{path}/{workspace}/{projectName}` で、`keyRegex` が逆変換する (`server/core/locking/locking.go:49-50`):

```go
// keyRegex matches and captures {repoFullName}/{path}/{workspace}/{projectName} where path can have multiple /'s in it.
var keyRegex = regexp.MustCompile(`^(.*?\/.*?)\/(.*)\/(.*)\/(.*)$`)
```

`Locker` インターフェース自体は小さい。`TryLock`・`Unlock`・`List`・`UnlockByPull`・`GetLock` (`server/core/locking/locking.go:34-40`)。`TryLock` は `TryLockResponse` を返し、その `LockAcquired` フィールドがこの呼び出しでロックを取れたかを呼び出し側に伝える (`server/core/locking/locking.go:18-25`)。

webhook ハンドラは処理が走る前に返る。`RunCommentCommand` はコントローラから goroutine で起動されるため (`server/controllers/events/events_controller.go:742`)、HTTP レスポンスは即時で、結果はすべて非同期に Pull Request コメントとして返る。graceful shutdown は drainer が扱い、draining 開始後は新規操作を拒否する (`server/events/command_runner.go:293`)。
