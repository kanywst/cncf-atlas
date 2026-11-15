# Getting Started

> Based on the official quick start and the repository's `solutions/setup-dev-environment/local-up.sh` at commit `b4e4b23`. The commands below were not run while writing this page. They assume a local machine with Docker available for `kind`.

## Prerequisites

- [kind](https://kind.sigs.k8s.io/), creating Kubernetes 1.25 or newer (`solutions/setup-dev-environment/README.md`).
- [kubectl](https://kubernetes.io/docs/tasks/tools/).
- [clusteradm](https://github.com/open-cluster-management-io/clusteradm), the OCM CLI that installs the hub and joins clusters.

## Install

Install `clusteradm` with the project's install script ([Quick Start](https://open-cluster-management.io/docs/getting-started/quick-start/)):

```bash
curl -L https://raw.githubusercontent.com/open-cluster-management-io/clusteradm/main/install.sh | bash
```

The quick start then runs `local-up.sh`, which creates three kind clusters (`hub`, `cluster1`, `cluster2`), installs the hub, joins all three as managed clusters, and accepts them. The hub joins itself as `local-cluster`.

```bash
curl -L https://raw.githubusercontent.com/open-cluster-management-io/OCM/main/solutions/setup-dev-environment/local-up.sh | bash
```

To see what the script does, here are its steps for one managed cluster (`local-up.sh:17-69`):

```bash
kind create cluster --name hub
kind create cluster --name cluster1

# Install the Cluster Manager on the hub
clusteradm init --wait --context kind-hub

# Print a join command with a bootstrap token
clusteradm get token --context kind-hub

# Run the printed "clusteradm join ..." against cluster1, with
#   --cluster-name cluster1 --force-internal-endpoint-lookup --wait --context kind-cluster1

# Accept the cluster on the hub (the hub admin's half of the handshake)
clusteradm accept --clusters cluster1 --wait --context kind-hub
```

`clusteradm join` installs the klusterlet on the managed cluster with the bootstrap credential. `clusteradm accept` approves the CSR and sets `hubAcceptsClient` to true on the ManagedCluster ([clusteradm `accept`](https://github.com/open-cluster-management-io/clusteradm/blob/f02a8843627b968be48b0feb2f8c8004424d090b/pkg/cmd/accept/exec.go#L99-L118)), the two hub-side steps described in [Architecture](./architecture).

## A first working setup

Send an nginx Deployment to `cluster1` with a ManifestWork. Create it in the `cluster1` namespace on the hub:

```yaml
apiVersion: work.open-cluster-management.io/v1
kind: ManifestWork
metadata:
  name: nginx
  namespace: cluster1
spec:
  workload:
    manifests:
      - apiVersion: apps/v1
        kind: Deployment
        metadata:
          name: nginx-deployment
          namespace: default
        spec:
          replicas: 2
          selector:
            matchLabels:
              app: nginx
          template:
            metadata:
              labels:
                app: nginx
            spec:
              containers:
                - name: nginx
                  image: nginx:1.14.2
                  ports:
                    - containerPort: 80
```

```bash
kubectl --context kind-hub apply -f nginx-work.yaml
```

The repository's own example does the same through the CLI, using `solutions/deploy-manifests/manifests/nginx.yaml` (`solutions/deploy-manifests/README.md`):

```bash
clusteradm create work nginx -f manifests/nginx.yaml --cluster cluster1
```

## Verify it works

On the hub, list the managed clusters. The script ends with this command, and its README shows the expected shape:

```bash
kubectl --context kind-hub get managedclusters
```

```text
NAME            HUB ACCEPTED   MANAGED CLUSTER URLS      JOINED   AVAILABLE   AGE
cluster1        true           https://127.0.0.1:45325   True     True        116s
cluster2        true           https://127.0.0.1:45325   True     True        98s
local-cluster   true           https://127.0.0.1:45325   True     True        78s
```

Check that the work agent applied the ManifestWork. The `Applied` condition turns `True` once every manifest in it applied (`pkg/work/spoke/controllers/manifestcontroller/manifestwork_reconciler.go:196-226`):

```bash
kubectl --context kind-hub get manifestwork nginx -n cluster1 \
  -o jsonpath='{.status.conditions[?(@.type=="Applied")].status}'
kubectl --context kind-cluster1 get deployment nginx-deployment -n default
```

## Where to go next

- To pick clusters by label or score, create a `ManagedClusterSet`, bind it to a namespace with a `ManagedClusterSetBinding`, and write a `Placement` there. The fields are in [Internals](./internals).
- To roll one ManifestWork out to every cluster a Placement selects, use `ManifestWorkReplicaSet`.
- The `solutions/` directory at the documented commit has worked examples for Argo CD pull delivery, Cluster API, Helm charts, Kueue admission checks, multiple hubs, and migrating from KubeFed.
- Production install, upgrade, and add-on documentation is on the [project site](https://open-cluster-management.io/docs/).
