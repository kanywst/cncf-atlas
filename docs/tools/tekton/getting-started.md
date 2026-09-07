# Getting Started

> Commands follow the install instructions in `docs/install.md` at commit `9dec5e4b`. They assume a running Kubernetes cluster and a `kubectl` that can reach it with cluster-admin rights.

## Prerequisites

- A Kubernetes cluster. Tekton `v0.61.x` and later require Kubernetes 1.28 or newer (`README.md`). A local kind or minikube cluster is enough for this page.
- `kubectl`, configured against that cluster with permission to create custom resource definitions and cluster roles.
- Outbound access to the registries your steps pull images from.

## Install

```bash
kubectl apply --filename https://infra.tekton.dev/tekton-releases/pipeline/latest/release.yaml
```

This creates the `tekton-pipelines` namespace, the eight custom resource definitions, and the controller and webhook deployments. To pin a version instead of tracking latest, replace `latest` with `previous/<version>`, for example `previous/v1.16.0`.

Wait until both deployments report ready:

```bash
kubectl get pods --namespace tekton-pipelines --watch
```

You are looking for `tekton-pipelines-controller` and `tekton-pipelines-webhook` in `Running` with all containers ready. Do not create a run before the webhook is ready: it performs defaulting and validation, so runs submitted before it comes up will be rejected.

## A first working setup

The smallest thing that exercises the whole path is a `TaskRun` with an inline task. It needs no `Task` object, no pipeline, and no workspace.

1. Create a `TaskRun` with two steps, so you can watch the ordering mechanism from [Internals](./internals) actually work.

```bash
cat <<'EOF' | kubectl create -f -
apiVersion: tekton.dev/v1
kind: TaskRun
metadata:
  generateName: hello-
spec:
  taskSpec:
    steps:
      - name: first
        image: docker.io/library/busybox
        command: ["echo"]
        args: ["step one"]
      - name: second
        image: docker.io/library/busybox
        script: |
          echo "step two, running after step one"
EOF
```

`kubectl create` rather than `apply`, because `generateName` needs the server to assign the name.

1. Watch it run. The controller creates one pod for this `TaskRun`.

```bash
kubectl get taskrun --watch
```

1. Read the logs. Each step is a container in that pod, named `step-first` and `step-second`.

```bash
POD=$(kubectl get taskrun -o jsonpath='{.items[-1:].status.podName}')
kubectl logs "$POD" --container step-first
kubectl logs "$POD" --container step-second
```

## Verify it works

The `TaskRun` should reach `SUCCEEDED=True`:

```bash
kubectl get taskrun -o custom-columns=NAME:.metadata.name,SUCCEEDED:.status.conditions[0].status,REASON:.status.conditions[0].reason
```

To see the machinery described in [Internals](./internals) rather than just the result, inspect the pod Tekton built:

```bash
kubectl get pod "$POD" -o jsonpath='{range .spec.containers[*]}{.name}{"\t"}{.command}{"\n"}{end}'
```

Every step container's command is `/tekton/bin/entrypoint`, and the original command sits in the arguments after `-entrypoint` and `--`. The init container named `prepare` is the one that copied that binary into the shared volume.

If a `TaskRun` stays pending, the usual causes are the webhook not being ready, the image being unpullable, or the pod being unschedulable. `kubectl describe taskrun` surfaces the first, `kubectl describe pod "$POD"` the other two.

## Where to go next

This page installs the engine and nothing else. For anything real you will also want Triggers to create runs from events, and Chains if you care about signing what the pipeline produces; both are separate installs from the same project. Workspaces, which are how data crosses a task boundary, matter as soon as you have more than one task. Production concerns such as high availability, the `enable-api-fields` setting, per-namespace defaults, and remote resolution configuration are covered in the [official documentation](https://tekton.dev/docs/).
