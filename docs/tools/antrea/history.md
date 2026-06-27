# History

## Origin

Antrea started at VMware. It was announced as "Project Antrea" at KubeCon North
America in San Diego on 2019-11-18 as an open source CNI plugin that uses Open
vSwitch (OVS) as its data plane ([source 2](https://blogs.vmware.com/opensource/2019/11/18/announcing-project-antrea/)).
The repository was created on 2019-10-25 and originally lived under VMware's
Tanzu GitHub organization.

The motivation for building on OVS, stated in the announcement, was concrete.
OVS keeps performance steady as the number of rules grows, where iptables slows
down. OVS runs on both Linux and Windows. It integrates with existing network
tooling through IPFIX, NetFlow, and sFlow. Its programmability lets the project
add features quickly ([source 2](https://blogs.vmware.com/opensource/2019/11/18/announcing-project-antrea/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | Repository created (2019-10-25); Project Antrea announced at KubeCon NA (2019-11-18) ([source 2](https://blogs.vmware.com/opensource/2019/11/18/announcing-project-antrea/)) |
| 2021 | Project Antrea 1.0 released (2021-04-15) ([source 3](https://blogs.vmware.com/opensource/2021/04/15/its-here-project-antrea-1-0/)) |
| 2021 | Accepted to CNCF at the Sandbox maturity level (2021-04-28) ([source 4](https://www.cncf.io/projects/antrea/)) |
| 2026 | v2.6.2 released (2026-06-13) ([source 10](https://github.com/antrea-io/antrea/releases/tag/v2.6.2)) |

## How it evolved

Antrea 1.0 shipped on 2021-04-15 ([source 3](https://blogs.vmware.com/opensource/2021/04/15/its-here-project-antrea-1-0/)).
Soon after, on 2021-04-28, the project was accepted into the CNCF at the Sandbox
maturity level, using the official wording "Antrea was accepted to CNCF on April
28, 2021 at the Sandbox maturity level" ([source 4](https://www.cncf.io/projects/antrea/));
the project's own announcement followed on 2021-05-05 ([source 5](https://antrea.io/posts/2021-05-05-antrea-joins-cncf-sandbox/)).

After the donation, the project moved out of VMware's Tanzu org into its own
`antrea-io` GitHub organization, which is the canonical repository today. The Go
module reflects the version-2 line: it is declared as `antrea.io/antrea/v2`
(`go.mod:1`), and the toolchain is pinned to Go 1.26.0 (`go.mod:3`).

## Where it stands now

The project is on the v2 line. The pinned commit for this deep-dive,
`65be43d`, sits on `main` after the v2.6.2 release tag (2026-06-13). The
checked-in `VERSION` file reads `v2.7.0-dev`, the in-progress next minor.
Antrea is a CNCF Sandbox project and is the default CNI of VMware vSphere
Kubernetes Service (VKS) ([source 6](https://thenewstack.io/vmwares-antrea-brings-programmable-networks-to-kubernetes/)).
