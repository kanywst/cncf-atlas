# Adoption & Ecosystem

## Who uses it

Neither the `cdk8s-core` repository nor the umbrella `cdk8s-team/cdk8s` repository ships an ADOPTERS file, and no public case study, talk, or engineering blog naming a specific production user was found during this research. Rather than invent adopters, this page reports measurable signals only.

What can be stated with a citation is the origin and governance: cdk8s came out of AWS, which has continued to publish about it on its official blogs ([AWS containers blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/)), and it is a CNCF Sandbox project ([CNCF project page](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/)).

## Adoption signals

Measured 2026-06-26 via the GitHub API. Note that stars accrue to the umbrella repository, while contributions land on the implementation repository.

| Repository | Stars | Forks | Notes |
| --- | --- | --- | --- |
| [cdk8s-team/cdk8s](https://github.com/cdk8s-team/cdk8s) (umbrella) | 4830 | 313 | website, docs, cross cutting issues |
| [cdk8s-team/cdk8s-core](https://github.com/cdk8s-team/cdk8s-core) (engine) | 86 | 33 | ~59 contributors (including anonymous) |

Release cadence is high: the engine reached `v2.70.80` by 2026-06-23, indicating frequent automated releases. The package is distributed on npm as `cdk8s` ([npm](https://www.npmjs.com/package/cdk8s)) and, through jsii (JavaScript Interop Interface), on PyPI, Maven Central, NuGet, and as a Go module.

## Ecosystem

The project is split into several repositories under the `cdk8s-team` organization:

- **`cdk8s-plus`**: a higher level intent based API with typed classes such as Pod and Deployment built on top of the raw `ApiObject` layer.
- **`cdk8s-cli`**: the command line tool providing `cdk8s init` (scaffold a project), `cdk8s import` (generate typed constructs from CRDs or the Kubernetes API), and `cdk8s synth`.
- **`cdk8s-cdktf-resolver`**: integration that lets cdk8s reference CDKTF (CDK for Terraform) outputs.
- **`cdk8s-operator`**: runs cdk8s code as a Kubernetes operator.

CDK8s also integrates with Helm: `src/helm.ts` in the core engine can pull a Helm chart into the construct tree. Because cdk8s sits on the same `constructs` library as AWS CDK and CDKTF, abstractions and patterns carry across those tools.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Helm | Renders YAML from Go templates over a values file. cdk8s uses a real programming language with types and control flow instead of template strings. |
| Kustomize | Overlays patches onto existing base YAML. cdk8s synthesizes YAML from scratch in code. |
| jsonnet / ytt (Carvel) | Purpose built data templating languages. cdk8s uses general purpose languages (TypeScript, Python, Java, Go, C#). |
| Pulumi | Also defines infrastructure in general purpose languages, but applies changes to the cluster itself. cdk8s only synthesizes manifests and leaves apply to `kubectl` or a GitOps controller. |

Pick cdk8s when you want typed, testable, composable manifests in a language your team already uses and you are happy to apply the output separately. Pick Helm or Kustomize when you want a packaging or overlay format with no programming language build step. Pick Pulumi when you want one tool that both defines and applies cluster state.
