# History

## Origin

cert-manager grew out of Jetstack's earlier tool kube-lego, which fetched TLS certificates from Let's Encrypt over ACME and wired them into Kubernetes Ingress. cert-manager was written as its replacement. To ease migration it kept honoring the `kubernetes.io/tls-acme` annotation that kube-lego used ([source 2](https://cert-manager.io/docs/tutorials/acme/migrating-from-kube-lego/), [source 8](https://vadosware.io/post/switching-from-kube-lego-to-cert-manager/)).

The design pivot was moving from Ingress annotations to custom resources and a controller. cert-manager made `Certificate` and `Issuer` first-class API objects reconciled by a controller, the operator pattern, instead of reacting to annotations on Ingress objects ([source 2](https://cert-manager.io/docs/tutorials/acme/migrating-from-kube-lego/), [source 8](https://vadosware.io/post/switching-from-kube-lego-to-cert-manager/)). The repository was created on 2017-05-24 and the project dates to 2017 ([source 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2017 | Project started at Jetstack as the successor to kube-lego ([source 2](https://cert-manager.io/docs/tutorials/acme/migrating-from-kube-lego/), [source 8](https://vadosware.io/post/switching-from-kube-lego-to-cert-manager/)) |
| 2020 | Jetstack acquired by Venafi ([source 6](https://www.cyberark.com/products/certificate-manager-for-kubernetes/)) |
| 2020-11 | Accepted into the CNCF Sandbox ([source 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/)) |
| 2022 | Promoted to CNCF Incubating ([source 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/)) |
| 2024-11-12 | Graduated within CNCF, announced at KubeCon NA in Salt Lake City ([source 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/), [source 4](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/)) |

## How it evolved

The project changed organizational hands more than once. Jetstack was acquired by Venafi in 2020, and Venafi later became part of CyberArk. The commercial edition, originally Venafi TLS Protect for Kubernetes, was renamed CyberArk Certificate Manager for Kubernetes ([source 6](https://www.cyberark.com/products/certificate-manager-for-kubernetes/)).

The codebase also changed identity. The original Go import path was `github.com/jetstack/cert-manager`; before v1.8 it migrated to `github.com/cert-manager/cert-manager` under the project's own org ([source 1](https://github.com/cert-manager/cert-manager), [source 7](https://pkg.go.dev/github.com/jetstack/cert-manager)).

## Where it stands now

cert-manager is a CNCF Graduated project ([source 4](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/)). At graduation the project reported over 200 releases and 450+ contributors, a sign of a steady, well-established release cadence ([source 3](https://www.cncf.io/announcements/2024/11/12/cloud-native-computing-foundation-announces-cert-manager-graduation/), [source 4](https://cert-manager.io/announcements/2024/11/12/cert-manager-graduation/)). Development continues on the `cert-manager/cert-manager` repository; the master branch at commit `dbc027ee` documented here sits just past the `v1.21.0-alpha.1` tag ([source 1](https://github.com/cert-manager/cert-manager)).
