# History

## Origin

HolmesGPT was created by Robusta.Dev, a company that sells a Kubernetes monitoring SaaS, with the GitHub repository opened on 2024-05-30 (GitHub `createdAt`). The README states the origin plainly: "Originally created by Robusta.Dev, with major contributions from Microsoft" (README, `MAINTAINERS.md`). The problem it targets is the one an on-call engineer faces at the moment an alert fires: gathering logs, metrics, and resource state from several tools and reasoning about what they add up to. HolmesGPT hands that gathering and reasoning to a language model driving read-only tools, so the investigation runs without a person paging through dashboards.

Microsoft is a co-maintainer, not just a user. `MAINTAINERS.md` lists ten maintainers from Robusta and one from Microsoft (Qingchuan Hao, `mainred`), and the CNCF introduction frames the project as Robusta-founded with Microsoft as a co-maintainer working on agentic troubleshooting for cloud native systems (CNCF blog, 2026-01-07).

## Timeline

| Year | Milestone |
| --- | --- |
| 2024 | GitHub repository created by Robusta.Dev (2024-05-30) |
| 2025 | Accepted to CNCF at the Sandbox level (2025-10-08); application and onboarding tracked in cncf/sandbox #392 and #411 |
| 2026 | CNCF introduction blog (2026-01-07); documented here at `84cb39c`, near release `0.35.0` (2026-07-01) |

## How it evolved

Two shifts stand out. The first is the move into CNCF. The TOC accepted HolmesGPT as a Sandbox project on 2025-10-08, with the application and onboarding tracked in the cncf/sandbox repository (issues #392 and #411; CNCF project page). The CNCF introduction blog that followed positioned the project as agentic troubleshooting built for cloud native operations rather than a single-purpose Kubernetes analyzer (CNCF blog, 2026-01-07).

The second is the repository move. The project relocated from `robusta-dev/holmesgpt` to a dedicated `HolmesGPT/holmesgpt` org, which is the canonical location today: the git remote resolves to `https://github.com/HolmesGPT/holmesgpt.git` and the README header now reads "HolmesGPT, The CNCF SRE Agent" (README). The code moved with it; the home changed to a project-named org that fits its CNCF status.

Beyond governance and naming, the stated direction has widened from an interactive CLI toward an always-on "Operator Mode": the README's opening now leads with a mode that runs continuously, detects problems, posts to Slack, and can open a fix as a GitHub pull request (README). The core investigation loop is the same in either mode; what changes is when it runs and where its output goes.

## Where it stands now

HolmesGPT is an active CNCF Sandbox project. Releases are tagged rather than driven by the `pyproject.toml` version field, which sits at `0.0.0`; the latest release at the documented commit is `0.35.0` (2026-07-01), with a `0.36.0-alpha` tagged the same day, so the pinned commit `84cb39c` (2026-07-06) sits just after the `0.35.0` line. Governance is shared between Robusta and Microsoft through the maintainer set in `MAINTAINERS.md`. The project is built and tested with Poetry (`poetry install`, `make test-without-llm` runs `pytest -m "not llm"`), and it is licensed Apache-2.0 (`LICENSE`, repository metadata).
