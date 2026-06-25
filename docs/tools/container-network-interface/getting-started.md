# Getting Started

> Verified against `v1.3.0` plus the documented main commit `7c27007`. Commands assume Linux with Go installed and root for namespace operations.

## Prerequisites

- Linux, since CNI configures Linux network namespaces.
- Go 1.21 or newer (`go.mod:3`).
- Root or `CAP_NET_ADMIN`, because creating interfaces and namespaces is privileged.

CNI is a spec, not a prebuilt binary bundle. A minimal working setup needs three things: a driver (`cnitool` here, or a real runtime), one or more plugin binaries, and a conflist describing the chain.

## Install

```bash
go install github.com/containernetworking/cni/cnitool@latest
```

`cnitool` exposes the subcommands `add`, `check`, `del`, `gc`, and `status` (`cnitool/main.go`, `cnitool/cmd/*.go`). You also need real plugin binaries from the reference repository:

```bash
git clone https://github.com/containernetworking/plugins
cd plugins
./build_linux.sh
```

The built binaries land in `./bin`. Point `CNI_PATH` at that directory.

## A first working setup

Build a `bridge` plus `host-local` IPAM chain and attach a fresh network namespace to it.

1. Write a conflist. A conflist is JSON, written to `/etc/cni/net.d/10-mynet.conflist`. The `name` field is required; `validateConfig` rejects an empty name (`pkg/skel/skel.go:216-229`).

   ```json
   {
     "name": "mynet",
     "cniVersion": "1.0.0",
     "plugins": [
       {
         "type": "bridge",
         "bridge": "cni0",
         "isGateway": true,
         "ipMasq": true,
         "ipam": {
           "type": "host-local",
           "subnet": "10.22.0.0/16",
           "routes": [
             { "dst": "0.0.0.0/0" }
           ]
         }
       }
     ]
   }
   ```

2. Create a network namespace for the test.

   ```bash
   sudo ip netns add testing
   ```

3. Run the ADD. `cnitool` reads the conflist named `mynet` from `/etc/cni/net.d` and executes the chain against the namespace.

   ```bash
   sudo CNI_PATH=./bin NETCONFPATH=/etc/cni/net.d \
     cnitool add mynet /var/run/netns/testing
   ```

The command prints the result JSON, including the assigned interface and IP from the 10.22.0.0/16 range.

## Verify it works

Check the attachment with the same tool, or inspect the namespace directly.

```bash
sudo CNI_PATH=./bin NETCONFPATH=/etc/cni/net.d \
  cnitool check mynet /var/run/netns/testing
sudo ip netns exec testing ip addr
```

You should see an `eth0` inside the namespace with an address in the configured subnet. The library also writes the cached result to `/var/lib/cni/results/`, which DEL and GC later reuse (`libcni/api.go:252-257`).

## Where to go next

Read the spec for the full command and result contract ([SPEC.md](https://github.com/containernetworking/cni/blob/main/SPEC.md)) and the tool guide for more examples ([cnitool docs](https://github.com/containernetworking/cni/blob/main/Documentation/cnitool.md)). For production networking, choose a real data plane such as Calico or Cilium rather than the reference plugins, and let your runtime (kubelet, containerd, CRI-O) drive CNI instead of `cnitool`.
