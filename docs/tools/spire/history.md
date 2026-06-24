# History

## Origin

SPIFFE started as a design document with no code. Joe Beda wrote the original design about ten years ago and presented it at GlueCon ([10 Years of SPIFFE](https://joe.dev/posts/10-years-of-spiffe/)). The reference implementation came later: Sunil James founded Scytale, brought the idea to the CNCF, and Scytale wrote SPIRE ([The New Stack interview](https://thenewstack.io/sunil-james-ceo-of-scytale-explains-spiffe/)).

The problem it set out to solve is bootstrapping trust between services without distributing long-lived shared secrets. SPIFFE defines the identity format and the Workload API; SPIRE is the runtime that attests workloads and issues those identities.

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Public launch of SPIFFE/SPIRE; first public presentation at KubeCon NA 2017 (Evan Gilman, 2017-12-15) ([Scytale](https://scytale.io/opensource-spiffe/)) |
| 2018 | Accepted into the CNCF as a Sandbox project (2018-03-29) ([Scytale](https://scytale.io/opensource-spiffe/)) |
| 2019 | HPE acquires Scytale; the team joins as founding contributors ([HPE Developer](https://developer.hpe.com/blog/spiffe-spire-graduates-enabling-greater-security-solutions/)) |
| 2020 | Moved to CNCF Incubating (2020-06-22) |
| 2022 | SPIRE reaches CNCF Graduated (2022-08-22); announced 2022-09-20 ([CNCF](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)) |

## How it evolved

SPIFFE and SPIRE are two related projects with a clear split: the SPIFFE specification lives in a separate repository (`spiffe/spiffe`), and SPIRE implements it. SPIRE's architecture turned every major function into a plugin loaded through a common catalog, so node attestation, key management, upstream authorities, and workload attestation are all swappable. This is why the same binary covers Kubernetes, AWS, GCP, TPM-based hardware, and join-token bootstrap.

The HPE acquisition of Scytale in 2019 kept the original authors working on the project as founding contributors, which preserved continuity through the move from Sandbox to Graduated ([HPE Developer](https://developer.hpe.com/blog/spiffe-spire-graduates-enabling-greater-security-solutions/)).

Graduation required passing a third-party security audit by Cure53 and a CNCF TAG Security review, along with meeting committer-process, license, and CII Best Practices Badge requirements ([CNCF announcement](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)).

## Where it stands now

SPIRE is a CNCF Graduated project. The repository was created on 2017-08-11; the most recent release at the documented commit is `v1.15.1` (2026-05-28). Maintainers are tracked in `MAINTAINERS.md` and review ownership is defined by `CODEOWNERS`. The CNCF announcement cited Anthem, GitHub, Netflix, Niantic, Pinterest, and Uber as production end users at graduation ([CNCF](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)).
