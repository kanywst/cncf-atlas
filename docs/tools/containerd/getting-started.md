# Getting Started

> Verified against the 2.x series (pinned commit `e96fd14b8`). Commands assume a Linux host with root and that you install runc and CNI plugins alongside containerd.

## Prerequisites

- A Linux host with root or sudo.
- runc on `PATH` (the default OCI runtime containerd execs).
- CNI plugins installed if you want container networking.

## Install

Install the official release binaries, runc, and CNI plugins from the GitHub releases. The daemon binary is `containerd`, the debug CLI is `ctr`, and the runc shim is `containerd-shim-runc-v2`.

```bash
# Download and extract containerd (replace VERSION with the release you want)
tar Cxzvf /usr/local containerd-VERSION-linux-amd64.tar.gz

# runc
install -m 755 runc.amd64 /usr/local/sbin/runc

# CNI plugins
mkdir -p /opt/cni/bin
tar Cxzvf /opt/cni/bin cni-plugins-linux-amd64-VERSION.tgz
```

## A first working setup

The shortest path to a running container is to generate the default config, start the daemon, then pull and run an image with `ctr`.

1. Generate the default configuration.

   ```bash
   mkdir -p /etc/containerd
   containerd config default > /etc/containerd/config.toml
   ```

2. Start the daemon (use the bundled systemd unit in production; this runs it in the foreground for a first look).

   ```bash
   containerd
   ```

3. In another shell, pull an image and run it.

   ```bash
   ctr image pull docker.io/library/hello-world:latest
   ctr run docker.io/library/hello-world:latest test
   ```

You should see the `hello-world` banner printed, ending with a line that begins `Hello from Docker!`.

## Verify it works

Confirm the daemon answers on its socket and lists what it knows:

```bash
ctr version
ctr namespace list
ctr container list
```

`ctr version` prints matching client and server versions when the daemon is reachable on `/run/containerd/containerd.sock`. For Go programs, connect with `client.New("/run/containerd/containerd.sock")`.

## Where to go next

For Kubernetes, the kubelet uses containerd through the CRI socket at `/run/containerd/containerd.sock`; configure the CRI plugin in `config.toml`. For production concerns such as systemd integration, registry authentication, snapshotter selection, and isolation runtimes, see the [official site](https://containerd.io/) and the [runtime-v2 README](https://github.com/containerd/containerd/blob/main/core/runtime/v2/README.md).
