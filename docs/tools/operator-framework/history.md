# History

## Origin

The Operator pattern was published by CoreOS in 2016: encode the operational knowledge of running a stateful application into a Kubernetes controller that watches custom resources and drives them toward a desired state. The CNCF TAG App Delivery Operator White Paper describes this lineage.

Operator Framework itself launched in May 2018, announced by CoreOS and Red Hat in "Introducing the Operator Framework: Building Apps on Kubernetes". The framework bundled the Operator SDK for authoring Operators with the Operator Lifecycle Manager for installing and upgrading them. The `operator-sdk` repository was created on 2018-02-07.

## Timeline

| Year | Milestone |
| --- | --- |
| 2016 | CoreOS publishes the Operator pattern. |
| 2018 | CoreOS and Red Hat announce the Operator Framework; the `operator-sdk` repository is created. |
| 2020 | CNCF TOC accepts Operator Framework as an Incubating project (2020-07-09). |
| 2023 | Java Operator SDK joins Operator Framework. |
| 2026 | Operator SDK release v1.42.2 (2026-03-19); OLM v0 in maintenance mode, OLM v1 in development as operator-controller. |

## How it evolved

The framework started with two pillars: the SDK and OLM. The SDK's own scaffolding history is significant. Rather than maintain a separate code generator, the SDK adopted kubebuilder as its scaffolding engine, so a Go Operator's `init` and `create api` commands are kubebuilder commands underneath. The SDK ties its releases to specific kubebuilder and ansible-operator-plugins versions.

Language support widened over time. Go, Ansible, and Helm Operators are all driven from the one CLI. In April 2023 the Java Operator SDK joined the framework, and the organisation now hosts `java-operator-sdk` as a sibling project.

OLM is undergoing a redesign. The v0 line, `operator-lifecycle-manager`, has entered maintenance mode, while a v1 design is being built in `operator-controller`.

## Where it stands now

The SDK ships regular tagged releases; v1.42.2 dates from 2026-03-19, and the documented commit `c7f6cde` is on master after that tag. Governance lives in the `operator-framework/community` repository, with working groups and maintainers, and contributions follow a two-maintainer LGTM model under Apache-2.0. The project's stated direction places OLM's future in the v1 operator-controller redesign while the SDK remains the authoring and packaging front end.

## Sources

1. Operator Framework project page, CNCF: <https://www.cncf.io/projects/operator-framework/>
2. TOC approves Operator Framework as Incubating Project: <https://www.cncf.io/blog/2020/07/09/toc-approves-operator-framework-as-incubating-project/>
3. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
4. Introducing the Operator Framework, Red Hat / CoreOS: <https://www.redhat.com/en/blog/introducing-operator-framework-building-apps-kubernetes>
5. Java Operator SDK is joining Operator Framework: <https://www.cncf.io/blog/2023/04/18/java-operator-sdk-is-joining-operator-framework/>
6. operator-framework/community governance: <https://github.com/operator-framework/community>
7. CNCF TAG App Delivery Operator White Paper: <https://tag-app-delivery.cncf.io/whitepapers/operator/>
8. operator-framework/operator-lifecycle-manager: <https://github.com/operator-framework/operator-lifecycle-manager>
9. operator-framework/operator-controller: <https://github.com/operator-framework/operator-controller>
10. operator-sdk CONTRIBUTING: <https://github.com/operator-framework/operator-sdk/blob/master/CONTRIBUTING.MD>
