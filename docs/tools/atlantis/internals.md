# Internals

> Read from the source at commit `b7cea53`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `server/controllers/events` | Webhook endpoint and host routing. `events_controller.go` is the entry. |
| `server/events` | Command orchestration: parse, permission-check, build per-project commands, run them. `command_runner.go` is the hub. |
| `server/events/vcs` | One client per VCS host for comments, commit status, and changed files. |
| `server/core/runtime` | One `*_step_runner.go` per workflow step (init, plan, apply, policy_check, run, env, multienv, import, state_rm). |
| `server/core/terraform` | Download and execute the Terraform or OpenTofu binary. |
| `server/core/locking`, `server/core/db` | Lock persistence; BoltDB embedded by default, Redis optional. |
| `server/core/config/valid` | Parse `atlantis.yaml` into validated structs (`RepoCfg`, `Project`, `Workflow`, `Stage`, `Step`). |

## Core data structures

`command.ProjectContext` is the context for one project and one operation (`server/events/command/project_context.go:24`). It is a large struct carrying `CommandName`, `ApplyCmd`, `PlanRequirements`, `AutoplanEnabled`, `AutoplanWhenModified`, and `EscapedCommentArgs`, among others. The `EscapedCommentArgs` field documents a real injection defence: extra arguments are backslash-escaped so they can be passed inside `sh -c` safely (`server/events/command/project_context.go:57-61`). The comment names the exact attack it blocks:

```go
    // EscapedCommentArgs are the extra arguments that were added to the atlantis
    // command, ex. atlantis plan -- -target=resource. We then escape them
    // by adding a \ before each character so that they can be used within
    // sh -c safely, i.e. sh -c "terraform plan $(touch bad)".
    EscapedCommentArgs []string
```

`models.ProjectLock` is the lock record: `Project`, `Pull`, `User`, `Workspace`, and `Time` (`server/events/models/models.go:271`). `models.Project` identifies a Terraform project by `ProjectName`, `RepoFullName`, and `Path`, where `Path` is relative to the repo root and `.` means the root (`server/events/models/models.go:290`). A standing TODO on `Path` explains why it was not renamed to `RepoRelDir`: doing so would break the on-disk format BoltDB already wrote (`server/events/models/models.go:298-301`).

`valid.Workflow` and `valid.Step` hold a parsed custom workflow. `Workflow` is five stages, `Apply`, `Plan`, `PolicyCheck`, `Import`, and `StateRm` (`server/core/config/valid/repo_cfg.go:252`); `Step` carries `StepName`, `ExtraArgs`, `RunCommand`, and `RunShell` (`server/core/config/valid/repo_cfg.go:231`).

## A path worth tracing

Follow `doPlan`, the function that turns a planned project into an actual Terraform run (`server/events/project_command_runner.go:666`). It takes locks, clones, runs steps, and returns a `PlanSuccess`.

First it acquires the persistent Atlantis lock for this repo, directory, and workspace (`server/events/project_command_runner.go:668`):

```go
    // Acquire Atlantis lock for this repo/dir/workspace.
    lockAttempt, err := p.Locker.TryLock(ctx.Log, ctx.Pull, ctx.User, ctx.Workspace, models.NewProject(ctx.Pull.BaseRepo.FullName, ctx.RepoRelDir, ctx.ProjectName), ctx.RepoLocksMode == valid.RepoLocksOnPlanMode)
```

Then it takes a separate in-process lock for the directory it is about to operate in (`server/events/project_command_runner.go:678`), clones the repository (`server/events/project_command_runner.go:685`), and runs the workflow steps (`server/events/project_command_runner.go:710`). On success it returns a `PlanSuccess` carrying the lock URL, the Terraform output, and the re-plan and apply commands (`server/events/project_command_runner.go:719-725`).

The steps run in `runSteps`, a dispatcher that switches on `step.StepName` (`server/events/project_command_runner.go:902`). Before iterating it holds a Git read lock for the whole run so a clone, reset, or merge cannot move the directory underneath a step (`server/events/project_command_runner.go:906`):

```go
    // Hold a read lock for the whole step run so clone/reset/merge cannot run in this dir until we're done.
    unlock := p.WorkingDir.GitReadLock(ctx.Pull.BaseRepo, ctx.Pull, ctx.Workspace)
    defer unlock()
```

The switch maps each step name to its runner (`server/events/project_command_runner.go:913-940`); the plan case calls `p.PlanStepRunner.Run` (`server/events/project_command_runner.go:917`). That runner resolves the Terraform distribution and version (`server/core/runtime/plan_step_runner.go:51-58`), builds the plan file name (`:60`), and finally executes the binary through `TerraformExecutor.RunCommandWithVersion` (`:62`). If the output looks like a Terraform Enterprise (TFE) remote operation, it falls back to `remotePlan` (`server/core/runtime/plan_step_runner.go:63-66`).

## Things that surprised me

The lock design is two systems, not one. The persistent lock lives in the database through `Locker.TryLock` (`server/events/project_command_runner.go:668`) and serialises the same repo, directory, and workspace across different pull requests. The in-process `WorkingDirLocker.TryLock` (`server/events/project_command_runner.go:678`) is a different concern: it stops two operations from racing on the same working directory on disk. On top of both, the Git read lock inside `runSteps` (`:906`) keeps clone, reset, and merge out while a step runs. Logical exclusion across pull requests and filesystem exclusion within the process are deliberately separate layers.

The lock key is a path, and it is parsed back with a regular expression. The key format is `{repoFullName}/{path}/{workspace}/{projectName}`, reversed by `keyRegex` (`server/core/locking/locking.go:49-50`):

```go
// keyRegex matches and captures {repoFullName}/{path}/{workspace}/{projectName} where path can have multiple /'s in it.
var keyRegex = regexp.MustCompile(`^(.*?\/.*?)\/(.*)\/(.*)\/(.*)$`)
```

The `Locker` interface itself is small: `TryLock`, `Unlock`, `List`, `UnlockByPull`, and `GetLock` (`server/core/locking/locking.go:34-40`), and `TryLock` returns a `TryLockResponse` whose `LockAcquired` field tells the caller whether this call won the lock (`server/core/locking/locking.go:18-25`).

The webhook handler returns before the work runs. `RunCommentCommand` is launched in a goroutine from the controller (`server/controllers/events/events_controller.go:742`), so the HTTP response is immediate and every result comes back asynchronously as a pull request comment. Graceful shutdown is handled by the drainer, which refuses new operations once draining starts (`server/events/command_runner.go:293`).
