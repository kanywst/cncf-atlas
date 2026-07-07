# Adoption & Ecosystem

## Who uses it

The repository has no `ADOPTERS` file (checked at the documented commit). The named organizations below all come from the AWS Open Source Blog post announcing Cedar's move into the CNCF Sandbox, which lists current adopters and maintainers (src 3).

| Organisation | Use case | Source |
| --- | --- | --- |
| Amazon Web Services | Engine behind Amazon Verified Permissions and AWS Verified Access; also used in Amazon Bedrock AgentCore Policy and AWS Systems Manager | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/using-open-source-cedar-to-write-and-enforce-custom-authorization-policies/) (src 5), [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| Cloudflare | Adopter named in the CNCF Sandbox announcement | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| MongoDB | Adopter named in the CNCF Sandbox announcement | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| StrongDM | Adopter named in the CNCF Sandbox announcement | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| Cloudinary | Adopter named in the CNCF Sandbox announcement | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| Linux Foundation Janssen Project | Integration named in the CNCF Sandbox announcement | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |

## Adoption signals

As observed via the GitHub API on 2026-06-27, `cedar-policy/cedar` had 1,571 stars, 160 forks, and 61 non-anonymous contributors (src 1). Releases are frequent: `v4.11.2` shipped on 2026-06-22 (src 8). Cedar was accepted into the CNCF Sandbox on 2025-10-08 (src 2). These are early-stage signals; Cedar is a Sandbox project, not Incubating or Graduated.

## Ecosystem

The surrounding ecosystem includes Amazon Verified Permissions, the managed service built on Cedar (src 5); the `cedar-examples` repository, including the TinyTodo demo app whose HTTP requests are authorized by Cedar (README:132); the `cedar-language-server` for editor completion and diagnostics (README:45); the `cedar-wasm` binding for JavaScript and TypeScript (README:46); the Linux Foundation Janssen Project integration (src 3); and a community Kubernetes integration, Kubernetes-Cedar-Authorizer, noted in the CNCF Sandbox announcement (src 3). The CNCF blog frames Cedar as a new approach to Kubernetes policy management for admission and authorization (src 6).

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Open Policy Agent (OPA) / Rego | General-purpose policy engine. Cedar's language is restricted to permit a sound, complete, decidable encoding, so it can be analyzed with the symbolic compiler; OPA covers a wider range of policy logic but does not offer that automated proof (src 3) |
| OpenFGA | Relationship-based access control in the Zanzibar tradition, centered on a graph of relations. Cedar expresses RBAC, ABAC, and ReBAC in one policy language (src 6) |
| SpiceDB | Zanzibar-style ReBAC served as a database. Cedar is an embeddable engine (crate, wasm, CLI) returning per-request decisions rather than a relationship store (src 6) |

Pick Cedar when you want fine-grained authorization in a small embeddable engine and you value static analysis of policies. Pick OPA when you need a general rule engine for logic beyond what Cedar's language allows. Pick OpenFGA or SpiceDB when your model is dominated by large, evolving relationship graphs that you want stored and queried as data.
