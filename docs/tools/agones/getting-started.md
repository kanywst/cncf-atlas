# Getting Started

> Based on the Agones install quickstart (source 5). Commands assume a running Kubernetes cluster with `kubectl` and `helm` already configured.

## Prerequisites

- A running Kubernetes cluster you can reach with `kubectl`.
- `helm` v3 installed and on your `PATH`.
- Nodes that allow inbound traffic on the HostPort range Agones uses (game clients connect to Node host ports directly).

## Install

```bash
helm repo add agones https://agones.dev/chart/stable
helm repo update
```

## A first working setup

The shortest path to a running game server is: install the Agones controller, then apply the sample `GameServer` and watch it reach `Ready`.

1. Install Agones into the `agones-system` namespace.

    ```bash
    helm install my-release --namespace agones-system --create-namespace agones/agones
    ```

2. Wait for the controller Pods to come up.

    ```bash
    kubectl get pods --namespace agones-system
    ```

3. Apply the sample `GameServer` from the repository.

    ```bash
    kubectl apply -f https://raw.githubusercontent.com/agones-dev/agones/main/examples/simple-game-server/gameserver.yaml
    ```

4. Watch the game server move through its states to `Ready`.

    ```bash
    kubectl get gameservers
    ```

## Verify it works

The `kubectl get gameservers` output should show the game server reach `STATE` `Ready` with an `ADDRESS` and `PORT` populated. The controller writes that address during the `Scheduled` and `Ready` transitions (`pkg/gameservers/controller.go:947`, `pkg/gameservers/controller.go:1014`). You can also confirm the controller is healthy with `kubectl get pods --namespace agones-system`, where the controller Pod should be `Running`.

## Where to go next

- Group management and rollouts: define a `Fleet` (`pkg/apis/agones/v1/fleet.go:41`) instead of standalone game servers; see `examples/fleet.yaml` in the repository.
- Allocation: claim a ready server with `GameServerAllocation` (`pkg/apis/allocation/v1/gameserverallocation.go:52`); see `examples/gameserverallocation.yaml`.
- Autoscaling: add a `FleetAutoscaler`; see `examples/fleetautoscaler.yaml`.
- Production concerns such as high availability, security hardening, and scaling are covered in the official documentation (source 5).
