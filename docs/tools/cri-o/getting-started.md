# Getting Started

> Verified against the `1.37.0` development line at commit `68f2617`. Commands assume a Linux host with root access.

## Prerequisites

- An OCI runtime: runc or crun (`README.md:113-119`).
- conmon, the container monitor (`README.md:113-119`).
- CNI plugins for pod networking (`README.md:113-119`).
- Go `1.26.3` or newer, only if you build from source (`go.mod:1`).

## Install

CRI-O publishes packages and bundle tarballs. The OBS repositories and the bundle approach are documented in the project's [install.md](https://github.com/cri-o/cri-o/blob/main/install.md); follow it for your distribution, since the package names and repository URLs are version specific.

To build the daemon from source instead, the Makefile produces `bin/crio` (`Makefile:183,212-213`):

```bash
git clone https://github.com/cri-o/cri-o
cd cri-o
make binaries
```

## A first working setup

CRI-O is a daemon the kubelet drives; there is no end-user CLI. The shortest real path is to run the daemon and point a Kubernetes node at its socket.

1. Start the `crio` daemon (as root). It listens on a Unix socket, by default at the path `unix:///var/run/crio/crio.sock`.

```bash
sudo crio
```

1. Point the kubelet at that socket with its CRI endpoint flag:

```bash
kubelet --container-runtime-endpoint=unix:///var/run/crio/crio.sock
```

For a full cluster bootstrap, the repository ships tutorials: `tutorials/kubeadm.md` for kubeadm and `tutorials/crio-in-kind.md` for kind.

## Verify it works

Use `crictl`, the CRI client, to talk to the running socket. The repository's `tutorials/crictl.md` covers it. A version call confirms the daemon answers CRI:

```bash
crictl --runtime-endpoint unix:///var/run/crio/crio.sock version
```

A healthy daemon returns its runtime name and version. `crictl info` and `crictl pods` then show runtime status and any running sandboxes.

## Where to go next

For production concerns including the `crio.conf` model, runtime handlers, CNI setup, and version alignment with Kubernetes, see the official docs linked from the [repository](https://github.com/cri-o/cri-o) and [install.md](https://github.com/cri-o/cri-o/blob/main/install.md). Keep the CRI-O minor version matched to your Kubernetes minor version.
