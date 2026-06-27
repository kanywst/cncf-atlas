# History

## Origin

Cartography began inside Lyft's security team. The `lyft/cartography` repository was created on 2019-02-27 ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography)). The problem it was built for was concrete: cloud Identity and Access Management (IAM) permissions are hard to reason about, and the team wanted to find the shortest path an attacker could take to reach administrator access. Modeling assets and their relationships as a graph turned that question into a query, and the team later found the same model useful for defenders ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2019 | `lyft/cartography` repository created on 2019-02-27 ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography)). |
| 2023 | Lyft applies to donate Cartography to the CNCF ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7)). |
| 2024 | The Cloud Native Computing Foundation (CNCF) accepts Cartography at the Sandbox level on 2024-08-23 ([CNCF project page](https://www.cncf.io/projects/cartography/)). |
| 2026 | Release `0.138.1` published on 2026-06-19 ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography)). |

## How it evolved

The largest shift was governance, not code. Lyft applied to donate the project to the CNCF in 2023, and the CNCF accepted it at the Sandbox level on 2024-08-23 ([CNCF project page](https://www.cncf.io/projects/cartography/)). The donation was tracked as a CNCF Sandbox application ([cncf/sandbox issue 58](https://github.com/cncf/sandbox/issues/58)). The practical changes from the move were that the Slack host moved from Lyft to the CNCF and the GitHub location moved to `cartography-cncf/cartography` ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7)).

Beyond governance, the project grew by adding connectors. The README now lists 30+ supported platforms (README.md:81-99), each implemented as an intel module under `cartography/intel`. The maintainer roster is recorded in MAINTAINERS.md.

## Where it stands now

The project releases frequently. The most recent release at the time of writing is `0.138.1` (2026-06-19), and this deep-dive is pinned to master commit `cdf66e2` from 2026-06-25, six commits ahead of that tag ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography)). It remains a CNCF Sandbox project. Governance is documented in GOVERNANCE.md and the maintainer list in MAINTAINERS.md.
