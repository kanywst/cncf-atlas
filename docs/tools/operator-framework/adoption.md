# Adoption & Ecosystem

## Who uses it

The `operator-sdk` repository ships no `ADOPTERS.md` or `USERS.md` file, so this deep-dive does not name individual adopter organisations; that would be fabrication.

The clearest citable adoption signal is Red Hat. Operator Framework originated at CoreOS and Red Hat, and OLM ships as part of OpenShift, so the framework is the productised basis for Operator distribution there.

| Organisation | Use case | Source |
| --- | --- | --- |
| Red Hat / OpenShift | Originated the framework; ships OLM as the Operator install and upgrade layer in OpenShift | <https://www.redhat.com/en/blog/introducing-operator-framework-building-apps-kubernetes> |

## Adoption signals

Measured with `gh` on 2026-06-24 against `operator-framework/operator-sdk`:

- Stars: 7,658.
- Forks: 1,775.
- Contributors: 326.
- Latest release: v1.42.2 (2026-03-19).

Across the organisation, `operator-lifecycle-manager` has 1,859 stars and `java-operator-sdk` has 931 stars. CNCF lists Operator Framework as an Incubating project, accepted 2020-07-09.

## Ecosystem

The framework is a family of projects rather than one repository:

- OLM v0 (`operator-lifecycle-manager`): the original install and upgrade runtime, now in maintenance mode.
- OLM v1 (`operator-controller`): the in-progress redesign of the lifecycle runtime.
- `operator-registry`: File-Based Catalog tooling and `opm`, the bundle and catalog libraries the SDK depends on (`operator-registry v1.59.0`, `go.mod:20`).
- OperatorHub.io: the public catalog where Operator bundles are published.
- `java-operator-sdk`: the Java authoring path that joined the framework in 2023.

Upstream, the SDK builds directly on kubebuilder, which provides the Go scaffolding engine. The SDK is effectively a superset that adds OLM integration plus Ansible and Helm support.

## Alternatives

| Alternative | Differs by |
| --- | --- |
| Kubebuilder | The scaffolding engine the SDK embeds; use it directly when you need a Go controller with no OLM, Ansible, or Helm support. |
| KUDO | Declarative Operator definitions instead of compiled Go controllers. |
| Metacontroller | Lets you write controllers as webhooks in any language, without the Operator packaging layer. |
| Crossplane | CRD-driven, but aimed at provisioning and composing infrastructure rather than packaging an application Operator. |
| kopf | A Python framework for writing Operators, without the OLM bundling and distribution layer. |

Pick the Operator SDK when you want one CLI across Go, Ansible, and Helm and a single path from code to scorecard validation, bundle packaging, and OLM install. Pick kubebuilder alone when you only need controller generation.

## Sources

1. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
2. Operator Framework project page, CNCF: <https://www.cncf.io/projects/operator-framework/>
3. Introducing the Operator Framework, Red Hat / CoreOS: <https://www.redhat.com/en/blog/introducing-operator-framework-building-apps-kubernetes>
4. Java Operator SDK is joining Operator Framework: <https://www.cncf.io/blog/2023/04/18/java-operator-sdk-is-joining-operator-framework/>
5. operator-framework/operator-lifecycle-manager: <https://github.com/operator-framework/operator-lifecycle-manager>
6. operator-framework/operator-controller: <https://github.com/operator-framework/operator-controller>
