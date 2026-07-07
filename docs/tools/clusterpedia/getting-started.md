# Getting Started

> Verified against `v0.9.1`. Commands assume a running Kubernetes cluster, `kubectl` pointed at it, plus `helm` v3 and `git` on your machine.

## Prerequisites

- A Kubernetes cluster you can reach with `kubectl` (the host that will run Clusterpedia).
- `helm` v3, `git`, and `kubectl` installed locally.
- Credentials (a kubeconfig, or an apiserver URL plus a token or client certificate) for at least one member cluster you want to import.

## Install

The official install path uses the Helm chart, which depends on the Bitnami PostgreSQL subchart. Clone the chart and resolve its dependencies first.

```bash
git clone https://github.com/clusterpedia-io/clusterpedia-helm.git
helm dependency build ./clusterpedia-helm
```

## A first working setup

1. Install Clusterpedia with the default PostgreSQL storage. Set `installCRDs=true` so the `PediaCluster` CRD is created, and pin the database to a node so its PersistentVolume binds.

    ```bash
    helm install clusterpedia ./clusterpedia-helm \
      --namespace clusterpedia-system \
      --create-namespace \
      --set installCRDs=true \
      --set persistenceMatchNode=<your-node-name>
    ```

2. Wait for the components to come up. You should see the apiserver, the clustersynchro-manager, the controller-manager, and the PostgreSQL pod.

    ```bash
    kubectl -n clusterpedia-system get pods
    ```

3. Describe a member cluster as a `PediaCluster`. Save this as `pediacluster.yaml`, filling in the apiserver address and credentials for the cluster you are importing.

    ```yaml
    apiVersion: cluster.clusterpedia.io/v1alpha2
    kind: PediaCluster
    metadata:
      name: cluster-example
    spec:
      apiserver: "https://10.30.43.43:6443"
      caData:
      tokenData:
      syncResources:
        - group: apps
          resources:
            - deployments
        - group: ""
          resources:
            - pods
    ```

4. Apply it to register the cluster and start synchronization.

    ```bash
    kubectl apply -f pediacluster.yaml
    ```

5. Confirm the cluster is being synced. The `STATUS` column should report the synchro running.

    ```bash
    kubectl get pediaclusters
    ```

## Verify it works

Clusterpedia registers as an Aggregated API, so you can query it through your existing kubeconfig. List the resource API groups it serves:

```bash
kubectl get --raw "/apis/clusterpedia.io/v1beta1/resources/apis/apps" | jq
```

To search Deployments across every imported cluster, query the Clusterpedia resource endpoint and read the items it returns:

```bash
kubectl get --raw "/apis/clusterpedia.io/v1beta1/resources/apis/apps/v1/deployments" | jq '.items | length'
```

## Where to go next

- [Installation](https://clusterpedia.io/docs/installation/) for production storage choices and high availability.
- [Import Clusters](https://clusterpedia.io/docs/usage/import-clusters/) for authentication options and automatic import from platforms such as Karmada.
- [Sync Cluster Resources](https://clusterpedia.io/docs/usage/sync-resources/) for selecting which resources to collect, including `syncAllCustomResources`.
