# Internals

> Read from the source at commit `5beeae1`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `backend/src/apiserver/` | REST/gRPC control plane: runs, pipelines, experiments, recurring runs |
| `backend/src/agent/persistence/` | watches Argo Workflow status and reports it back to the API server |
| `backend/src/crd/controller/scheduledworkflow/` | SWF CRD controller that creates Workflow CRs on a cron schedule |
| `backend/src/v2/driver/` | per-task driver: input resolution, cache decision, MLMD execution |
| `backend/src/v2/cmd/launcher-v2/` | runs the user container and publishes artifacts to MLMD and object store |
| `backend/src/cache/` | step-result cache server |
| `backend/src/common/util/` | engine-neutral abstractions such as `ExecutionSpec` |
| `api/v2alpha1/` | protobuf IR (PipelineSpec) shared by SDK and backend |
| `sdk/python/` | the Python `kfp` authoring SDK |

## Core data structures

- **`model.Run`** (`backend/src/apiserver/model/run.go`): the run record the API server persists. It bundles `PipelineSpec`, run details (state, conditions, manifests), and `RecurringRunId`. `ResourceManager.CreateRun` (`backend/src/apiserver/resource/resource_manager.go:651`) assembles and persists it.
- **`ExecutionSpec`** (`backend/src/common/util/execution_spec.go:77`): the engine-neutral Workflow abstraction returned by `RunWorkflow`. The concrete value wraps an Argo Workflow, but callers see only the interface (`SetServiceAccount`, `OverrideParameters`, `ExecutionStatus`, `ToStringForStore`, `GenerateRetryExecution`).
- **`Template` interface and `TemplateType`** (`backend/src/apiserver/template/template.go:118`, `:40`): the strategy that converts a stored pipeline spec into an `ExecutionSpec`. The `V1` path consumes legacy Argo YAML; the `V2` path compiles the IR. `tmpl.GetTemplateType()` drives the branch at `backend/src/apiserver/resource/resource_manager.go:713`.
- **`driver.Execution`** (`backend/src/v2/driver/driver.go:152`): the result of a per-task driver run. It carries `ExecutorInput`, `Condition` (trigger decision), `Cached`, `PodSpecPatch`, and `IterationCount`, the unit of v2 orchestration.
- **`pipelinespec.PipelineSpec` IR** (`api/v2alpha1/pipeline_spec.proto:50`): the protobuf the SDK compiles a Python DSL into. It is the contract between backend and SDK.

## A path worth tracing

Run creation, from gRPC handler to persisted record:

```text
RunServer.CreateRun                        run_server.go:514
  -> ResourceManager.CreateRun             resource_manager.go:651
       fetchTemplateFromPipelineSpec       resource_manager.go:665
       tmpl.RunWorkflow -> ExecutionSpec   resource_manager.go:696
       executionSpec.Validate              resource_manager.go:700
       OnBeforeRunCreation (plugin hook)   resource_manager.go:750
       workflowClient.Create (Argo CR)     resource_manager.go:769
       runStore.CreateRun (DB)             resource_manager.go:799
```

`ResourceManager.CreateRun` first loads the Template and renders it into an `ExecutionSpec`:

```go
tmpl, manifest, err := r.fetchTemplateFromPipelineSpec(&run.PipelineSpec)
executionSpec, err := tmpl.RunWorkflow(run, runWorkflowOptions)
err = executionSpec.Validate(false, false)
```

It then creates the Argo Workflow custom resource and persists the run:

```go
newExecSpec, err := r.getWorkflowClient(k8sNamespace).Create(ctx, executionSpec, v1.CreateOptions{})
newRun, err := r.runStore.CreateRun(run)
```

The run is recorded in `Pending`; status converges later when the persistence agent reports Workflow progress with `ReportWorkflow` (`backend/src/agent/persistence/worker/workflow_saver.go:72`).

## Things that surprised me

- **The umbrella repo has no implementation code.** `kubeflow/kubeflow` is a gateway; the real code is spread across subprojects (Pipelines, Katib, Trainer, Spark Operator). One CNCF logo does not map to one codebase here.
- **v2 moved orchestration logic from a central controller into task containers.** Instead of a controller interpreting the DAG, v2 injects a driver (init) and launcher into each Argo Workflow step. The orchestration smarts are embedded in the Workflow CR itself.
- **Caching skips the launcher entirely.** The driver decides cache hits in MLMD before the user container runs (`backend/src/v2/driver/container.go:173`, `:216`). On a hit it republishes prior outputs as `Execution_CACHED` (`:234`) and never starts the user container.
- **Recurring-run deduplication is a deterministic UUID.** `NewDeterministicUUID(recurringRunId + "/" + displayName)` (`backend/src/apiserver/resource/resource_manager.go:682`) means concurrent SWF replicas collide on the same primary key, so the duplicate insert is resolved idempotently in the store.
- **Kubernetes-platform ops have no launcher.** For dummy-image tasks (`isKubernetesPlatformOp`, `backend/src/v2/driver/container.go:103`, `:136`), the driver itself performs MLMD publication and caching, a special case for K8s-resource-only steps.
