# History

## Origin

bpfman began as **bpfd**, a project from Red Hat's Emerging Technologies group. Its first commit landed in 2021, and the GitHub repository was created on 2021-12-02 (source: [bpfman/bpfman](https://github.com/bpfman/bpfman) and [Red Hat Emerging Technologies](https://next.redhat.com/project/bpfman/)). The problem it set out to solve: loading eBPF programs normally requires elevated privilege and gives each application sole ownership of a kernel hook. bpfd proposed a single managed point that could load programs on behalf of many applications and let them coexist.

The README still records the former name (`README.md:37`):

```text
_Formerly know as `bpfd`_
```

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | First commit as bpfd; GitHub repo created 2021-12-02 |
| 2023 | Renamed bpfd to bpfman; CNCF Sandbox application filed (cncf/sandbox issue #76, 2023-12-20) |
| 2024 | Accepted into CNCF Sandbox (2024-06-19); daemonless architecture lands |
| 2026 | v0.6.0 released (2026-03-31) with load and attach as separate operations |

## How it evolved

Two shifts matter. The first was the rename. In late 2023 the project moved from bpfd to bpfman, framed as the same project under a new name, and applied to CNCF Sandbox at the same time (sources: [eBPF wrapped 2023](https://www.redhat.com/en/blog/ebpf-wrapped-2023), [bpfman blog](https://bpfman.io/main/blog/)). The Sandbox application argued for a safe way to load eBPF without privileged pods and was accepted on 2024-06-19 (source: [cncf/sandbox issue #76](https://github.com/cncf/sandbox/issues/76)).

The second shift was technical: bpfman became **daemonless**. The earlier design assumed a long-running system daemon that clients talked to over gRPC (gRPC Remote Procedure Call). The current design has the command-line interface (CLI) call the core library in its own process and persist state to an embedded database, so no daemon is required for local use (source: [eBPF wrapped 2023](https://www.redhat.com/en/blog/ebpf-wrapped-2023)). A gRPC server still exists for cases that need privilege separation, but it is optional. Older write-ups that describe bpfman as a system daemon predate this change.

A further consequence of v0.6.0: loading and attaching are now separate operations. `load` places a program in the kernel; `attach` binds it to a hook later, returning the program id from one step to the next.

## Where it stands now

bpfman is a CNCF Sandbox project. The latest release at the documented commit is v0.6.0 (2026-03-31). All listed maintainers are from Red Hat (`MAINTAINERS.md`: Dave Tucker, Andrew McDermott, Andre Fredette, Billy McFall, with Andrew Stoycos emeritus), so it is effectively a single-vendor Sandbox project. There is an ongoing proposal to make bpfman the default eBPF program manager in Fedora (source: [Introduction to BPF Manager / Fedora 40](https://www.ebpf.top/en/post/bpfman_fedora_40/)).
