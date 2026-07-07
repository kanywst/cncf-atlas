# Getting Started

> Verified against v0.60.3. Commands assume a working Kubernetes cluster and a configured `kubectl`.

## Prerequisites

- A Kubernetes cluster you can reach with cluster-admin rights (a local `kind` or `minikube` cluster is fine).
- `kubectl` configured to point at that cluster.

## Install

Install kapp-controller by applying its release manifest:

```bash
kubectl apply -f https://github.com/carvel-dev/kapp-controller/releases/latest/download/release.yml
```

This creates the `kapp-controller` deployment, its custom resource definitions (`App`, `PackageInstall`, `PackageRepository`), and the aggregated API service.

## A first working setup

The core job is to declare an `App` and let the controller fetch, template, and deploy it. The example below uses a public Carvel sample repository.

1. Wait for the controller to become ready:

    ```bash
    kubectl rollout status deployment/kapp-controller -n kapp-controller
    ```

2. Create a service account and namespaced RBAC the `App` will deploy under. Save this as `rbac.yml`:

    ```yaml
    apiVersion: v1
    kind: ServiceAccount
    metadata:
      name: default-ns-sa
      namespace: default
    ---
    kind: Role
    apiVersion: rbac.authorization.k8s.io/v1
    metadata:
      name: default-ns-role
      namespace: default
    rules:
    - apiGroups: ["*"]
      resources: ["*"]
      verbs: ["*"]
    ---
    kind: RoleBinding
    apiVersion: rbac.authorization.k8s.io/v1
    metadata:
      name: default-ns-role-binding
      namespace: default
    subjects:
    - kind: ServiceAccount
      name: default-ns-sa
      namespace: default
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: Role
      name: default-ns-role
    ```

    Apply it:

    ```bash
    kubectl apply -f rbac.yml
    ```

3. Declare an `App` that fetches from git, templates with `ytt`, and deploys with `kapp`. Save this as `app.yml`:

    ```yaml
    apiVersion: kappctrl.k14s.io/v1alpha1
    kind: App
    metadata:
      name: simple-app
      namespace: default
    spec:
      serviceAccountName: default-ns-sa
      fetch:
      - git:
          url: https://github.com/k14s/k8s-simple-app-example
          ref: origin/develop
          subPath: config-step-2-template
      template:
      - ytt: {}
      deploy:
      - kapp: {}
    ```

    Apply it:

    ```bash
    kubectl apply -f app.yml
    ```

## Verify it works

Check the `App` status. The `DESCRIPTION` column reports each reconcile result:

```bash
kubectl get app simple-app -n default
```

A healthy result shows `Reconcile succeeded`. To see the per-stage detail (fetch, template, deploy output and exit codes) recorded in the status:

```bash
kubectl get app simple-app -n default -o yaml
```

The resources rendered by the sample (a Deployment and Service) should now exist in the `default` namespace:

```bash
kubectl get deployment,service -n default
```

## Where to go next

- The [kapp-controller documentation](https://carvel.dev/kapp-controller/) covers packaging (`PackageRepository` and `PackageInstall`), private registry authentication, and air-gapped installs.
- For production concerns such as restricting the deploy service account, scoping namespaces with the `--namespace` flag, and the sidecar security model, start from the same docs and the [main repository](https://github.com/carvel-dev/kapp-controller).
