# History

## Origin

Easegress was built by MegaEase, a company that made cloud-native infrastructure software. Its predecessor was called Ease Gateway, later renamed to Easegress (MegaEase product page). The motivation was that existing gateways were designed before the cloud-native era: monitoring and service discovery were weak, and the common Nginx plus C plus Lua stack was hard to extend, since C is difficult and Lua lacks expressiveness. MegaEase set out to build a next-generation gateway in Go (MegaEase "The Next Generation Service Gateway").

The GitHub repository was created on 2021-05-28, and the first release, v1.0.0, shipped on 2021-06-02 (GitHub API). The project was originally published under `megaease/easegress` and later moved to an independent org, `easegress-io`. The Go module path still reads `github.com/megaease/easegress/v2`, a trace of that origin (`go.mod:1`).

## Timeline

| Year | Milestone |
| --- | --- |
| 2021 | Repository created (2021-05-28); first release v1.0.0 (2021-06-02) |
| 2022 | v2.0.0: protocol-independent pipeline and reworked traffic orchestration |
| 2023 | Accepted into the CNCF Sandbox (2023-12-19) |
| 2026 | Active v2.11.x line; documented here at `3bdb192`, near tag `v2.11.0` |

## How it evolved

The clear turning point is v2.0.0, the second major release, around August 2022. It reworked traffic orchestration and introduced a protocol-independent pipeline (MegaEase v2.0 announcement). The announcement also names a design mistake the maintainers corrected: in v1.x, resilience features (circuit breaker, timeout, retry) were separate filters, which mixed control logic with business logic. v2.0 moved resilience into the Proxy filter instead. That decision is visible in the code today: the Proxy implements `InjectResiliencePolicy` and distributes policies to its pools (`pkg/filters/proxies/httpproxy/proxy.go:362`), rather than resilience living as standalone hops in the pipeline.

The other shift is governance. Easegress was accepted into the CNCF Sandbox on 2023-12-19, in the same batch as projects such as Copa, KCL, and Kuasar (CNCF project page; cncf/sandbox #193). Around that period the repository moved from MegaEase's namespace to the vendor-neutral `easegress-io` org, though the internal module path was left unchanged.

Recent development has pushed toward AI and LLM gateway features. The tree carries `pkg/filters/aigatewayproxy` and `pkg/object/aigatewaycontroller`, which proxy requests to providers such as OpenAI and Anthropic and translate between the Anthropic and OpenAI request shapes.

## Where it stands now

Easegress is an active CNCF Sandbox project. The documented commit `3bdb192` is on `main`, just past tag `v2.11.0` (2026-03-17), and the codebase targets Go 1.26 (`go.mod:3`). The repository lives under the `easegress-io` org after the move out of MegaEase's namespace. Because the source clone used for this deep-dive is a shallow (depth 1) clone, commit-level history such as `git blame` was not available, so the milestones above are anchored to releases, blog posts, and the CNCF record rather than to individual commits.
