# Getting Started

> Verified against the `v1.8.0` release line. Commands assume a Linux host with `tar` and `curl`, and a shell where you can run `blade` with the privileges the chosen fault needs (CPU load needs none special; some network or disk faults need root).

## Prerequisites

- A Linux x86-64 host (the release ships per-OS, per-arch toolkits).
- `curl` and `tar` to fetch and unpack a release.
- For Kubernetes faults: a reachable cluster, `kubectl`, and `helm`.

## Install

Download a release toolkit from the GitHub releases page and unpack it. The tarball contains the `blade` binary plus the `bin/` executors and the versioned YAML specs.

```bash
curl -sSL -o chaosblade.tar.gz \
  https://github.com/chaosblade-io/chaosblade/releases/download/v1.8.0/chaosblade-1.8.0-linux-amd64.tar.gz
tar -xzf chaosblade.tar.gz
cd chaosblade-1.8.0
```

## A first working setup

The shortest end-to-end run is a CPU load experiment: create it, confirm it, then destroy it. The uid printed by `create` is what you pass to `status` and `destroy`.

1. Inject 60% CPU load. The command prints a JSON response whose `result` field is the experiment uid.

   ```bash
   ./blade create cpu load --cpu-percent 60
   ```

2. Query the experiment by the uid returned above.

   ```bash
   ./blade status <experiment-uid>
   ```

3. Stop the experiment and recover the host.

   ```bash
   ./blade destroy <experiment-uid>
   ```

To avoid a forgotten experiment, add `--timeout` so `blade` schedules its own destroy. This run recovers automatically after 30 seconds:

```bash
./blade create cpu load --cpu-percent 60 --timeout 30
```

For Kubernetes, install the operator with Helm, then create a pod fault. The operator exposes experiments as a Custom Resource Definition (CRD).

```bash
helm install chaosblade-operator chaosblade-operator-1.8.0.tgz \
  --namespace chaosblade --create-namespace
./blade create k8s pod-cpu fullload --cpu-percent 80 \
  --kubeconfig ~/.kube/config --names <pod-name> --namespace default
```

## Verify it works

`create` returns a JSON object with `"code": 200` and a `"result"` holding the uid on success. Run `./blade status <experiment-uid>` and check that the experiment shows as `Success`. While a CPU load experiment is active, `top` on the host should show elevated CPU usage; after `destroy` (or after the `--timeout` elapses) it returns to baseline. State is recorded in the local `chaosblade.dat` SQLite file next to the binary.

## Where to go next

- Official docs cover the full scenario catalogue (network, disk, process, JVM, container): <https://chaosblade.io/en/docs/>
- The Kubernetes operator and its CRD reference: <https://github.com/chaosblade-io/chaosblade-operator>
- The `chaosblade-box` platform adds a UI, Prometheus integration, and multi-cluster management: <https://chaosblade.io/en/blog/2022/06/24/ChaosBlade-Box-a-New-Version-of-the-Chaos-Engineering-Platform-Has-Released/>
