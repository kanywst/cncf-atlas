# Internals

> Read from the source at commit `9dec5e4b`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `pkg/apis/pipeline/v1/` | The `v1` API types: `Task`, `TaskRun`, `Pipeline`, `PipelineRun`, plus validation, defaulting, and conversion |
| `pkg/apis/config/` | Cluster-wide feature flags and defaults read from ConfigMaps |
| `pkg/reconciler/taskrun/` | The `TaskRun` control loop, from resolution to pod creation to status |
| `pkg/reconciler/pipelinerun/` | The `PipelineRun` control loop, DAG evaluation, and child object creation |
| `pkg/reconciler/pipeline/dag/` | The dependency graph: build, cycle detection, candidate selection |
| `pkg/pod/` | Turning a `TaskSpec` into a pod: containers, volumes, entrypoint rewriting, status extraction |
| `pkg/entrypoint/` | The binary injected into every step container |
| `pkg/termination/` | Writing and size-checking the pod termination message |
| `pkg/resolution/resolver/` | Remote resolution backends: `git`, `bundle`, `cluster`, `hub`, `http` |
| `cmd/` | The eight binaries, including `controller`, `webhook`, `resolvers`, and `entrypoint` |

Roughly 116,000 lines of non-test Go across 1,001 files, excluding vendored code.

## Core data structures

`Step` (`pkg/apis/pipeline/v1/container_types.go:24`) is a container spec plus the fields Tekton adds on top: `Script` (`:115`), an executable file written for you instead of a command, `Timeout` (`:120`), `OnError` (`:135`), and `Results` (`:150`). A `Task` is an ordered `[]Step`, and the whole execution path is about turning that list into containers that run one after another. Ordering itself is not stored anywhere as data; it is encoded in the arguments Tekton passes to the entrypoint binary, which is the subject of the next section.

`RunResult` (`pkg/result/result.go:49`) is what a step hands back. Everything the entrypoint collects is one of these, including Tekton's own bookkeeping entries such as `StartedAt` and `ExitCode`, and all of them are serialised into a single string written to the pod's termination message (`pkg/entrypoint/entrypointer.go:203-207`).

`Node` and `Graph` (`pkg/reconciler/pipeline/dag/dag.go:41`, `:51`) hold the pipeline's dependency structure, and they are as plain as they look: a node is a key with `Prev` and `Next` slices, a graph is a map from pipeline task name to node. They are rebuilt on each reconcile pass rather than cached, which is what makes a `PipelineRun` reconcile a function of current status alone.

## A path worth tracing

Kubernetes starts every container in a pod at the same time. Tekton's steps must run one after another. This is the central conflict in the codebase, and the solution is to take over the entrypoint of every step container and chain them together with files.

`orderContainers` (`pkg/pod/entrypoint.go:127`) does the rewriting. Its own doc comment states the intent: the steps are "modified so that they are executed in order by overriding the entrypoint binary."

```text
pod/entrypoint.go:127  orderContainers(steps)
  step i > 0   -> -wait_file /tekton/run/<i-1>/out        (:144)
  every step   -> -post_file /tekton/run/<i>/out          (:148)
  step 0       -> -wait_file /tekton/downward/ready       (:139)
                  -wait_file_content
  all steps    -> Command = ["/tekton/bin/entrypoint"]    (:206)
                  original command moves behind -entrypoint and --  (:198-204)
```

Every step waits for a file that the previous step writes when it finishes, and writes its own when it is done. The files live under `/tekton/run` (`RunDir`, `pkg/pod/entrypoint.go:51`), an `emptyDir` shared by all containers in the pod.

The first step is special: it waits on `/tekton/downward/ready` and, because of `-wait_file_content` (`:140`), on that file having content, not merely existing. The file is a Downward API projection of the pod annotation `tekton.dev/ready` (`:57`, `:96-108`). The controller patches that annotation when the pod is ready to proceed, at `UpdateReady` (`:321`). Cancellation works the same way through the annotation `tekton.dev/cancel` projected to `/tekton/downward/cancel` (`:63-65`, `:88-93`).

Rewriting the command means the entrypoint binary has to exist inside images Tekton does not control. It gets there by copying itself. `entrypointInitContainer` (`pkg/pod/pod.go:630`) builds an init container whose command is `["/ko-app/entrypoint", "init", "/ko-app/entrypoint", "/tekton/bin/entrypoint", <step names...>]`. The binary copies itself into an `emptyDir` mounted at `/tekton/bin` (`pkg/pod/entrypoint.go:79-82`), which every step container also mounts. When the user's step does not specify a `command`, Tekton needs the image's original `ENTRYPOINT` in order to put it back after the rewrite, so it reads the image config from the registry (`pkg/pod/entrypoint_lookup.go`).

Inside the step container, `Entrypointer.Go` (`pkg/entrypoint/entrypointer.go:201`) runs the actual sequence:

```text
entrypoint/entrypointer.go:201  Go()
  :215  wait on each -wait_file
        on failure, still write the post file so later steps bail too  (:221)
  :267  goroutine watching /tekton/downward/cancel                     (:517)
  :272  allowExec(): when expressions decide whether this step runs
  :278  Runner.Run(command...)   <- the user's actual command
  :288  branch on outcome: cancelled, timed out, onError=continue, ok
  :328  read results from /tekton/results
  :204  deferred: write everything to the termination message
```

Two details are worth pausing on. Writing the post file even on failure (`:221`) is what makes the whole chain collapse quickly instead of leaving later steps blocked until timeout. And a step skipped by a `when` expression writes its post file and exits zero (`:279-284`), so a skipped step is indistinguishable from a fast successful one as far as the chain is concerned.

## Things that surprised me

**The result size limit is a Kubernetes limit, not a Tekton one.** Results come back through the pod's termination message, and `MaxContainerTerminationMessageLength` is `1024 * 4` (`pkg/termination/write.go:33-35`), checked at `:103`. Four kilobytes for everything a task returns, including Tekton's own internal entries. The escape hatch is a second mechanism entirely: a sidecar that reads results off disk and prints them to its log, built by `createResultsSidecar` (`pkg/pod/pod.go:663`) and run by `cmd/sidecarlogresults`. The name of the default method, `ResultExtractionMethodTerminationMessage` (`pkg/entrypoint/entrypointer.go:55`), exists precisely because there is more than one.

**The maintainers consider the mechanism provisional.** A comment sits next to the Downward API volume definition: `TODO(#1605): Signal sidecar readiness by injecting entrypoint, remove dependency on Downward API` (`pkg/pod/entrypoint.go:94-95`). Coordination through pod annotations projected into files is not the design anyone would draw on a whiteboard, and the code says so.

**Pipelines can contain pipelines, which is why cycle detection appears twice.** `createChildPipelineRuns` (`pkg/reconciler/pipelinerun/pipelinerun.go:1134`) creates a nested `PipelineRun` when a pipeline task references another pipeline. That reference graph is separate from the task DAG, so it gets its own check at `detectPipelineRefCycle` (`:1282`), alongside `findCyclesInDependencies` (`pkg/reconciler/pipeline/dag/dag.go:135`) for tasks within one pipeline.

**Nothing named "PipelineResource" survives in the `v1` API**, though the string still appears in `pipelinerun_types.go` in vestigial status fields. The concept the README still advertises (`README.md:22-28`) was removed in 2023, covered in [History](./history).
