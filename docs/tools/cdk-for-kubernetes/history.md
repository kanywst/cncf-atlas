# History

## Origin

CDK8s was announced by Amazon Web Services (AWS) in May 2020. The lead author is Elad Ben-Israel, who also created AWS CDK, jsii, and projen. The motivation was to bring the Construct Programming Model (CPM) that AWS CDK uses for CloudFormation to Kubernetes manifests, so teams could define workloads in a real programming language with types, loops, and reusable abstractions instead of hand written YAML or Go templates ([AWS containers blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/)).

The same year, a higher level intent based API called `cdk8s+` (cdk8s-plus) entered beta, giving typed classes such as Pod and Deployment on top of the raw resource layer. In November 2020 the project was accepted into the CNCF (Cloud Native Computing Foundation) at the Sandbox maturity level ([CNCF project page](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2020 | AWS announces cdk8s; `cdk8s+` high level API enters beta ([AWS blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/)) |
| 2020 | Accepted into CNCF at the Sandbox level on 2020-11-10 ([CNCF](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/)) |
| 2021 | General Availability declared; Go support added; project moved to the dedicated `cdk8s-team` org ([AWS What's New](https://aws.amazon.com/about-aws/whats-new/2021/10/cdk-kubernetes-cdk8s-available/)) |

## How it evolved

The defining idea is the Construct Programming Model. The same construct abstraction describes AWS CDK (which targets CloudFormation), CDKTF (which targets Terraform), and cdk8s (which targets Kubernetes). Multi language packaging is handled by jsii, which compiles the TypeScript source into packages for Python, Java, Go, and .NET ([AWS containers blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/)).

At General Availability in October 2021, the project added Go as a supported target language and moved out of the AWS Labs organization into a dedicated `cdk8s-team` GitHub organization, signalling that it was a standalone CNCF project rather than an AWS product ([AWS What's New](https://aws.amazon.com/about-aws/whats-new/2021/10/cdk-kubernetes-cdk8s-available/)).

The codebase is also split across that organization rather than living in one repository. The umbrella `cdk8s-team/cdk8s` repository holds the website, cross cutting issues, and documentation, while the synthesis engine lives in `cdk8s-team/cdk8s-core` and is published to npm under the name `cdk8s`. The command line tool (`cdk8s-cli`) and the high level API (`cdk8s-plus`) are separate repositories.

## Where it stands now

CDK8s remains a CNCF Sandbox project ([CNCF](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/)). The `cdk8s-core` engine releases frequently; the latest release at the time of writing is `v2.70.80`, published 2026-06-23 (GitHub Releases). This deep-dive pins commit `558f788` from 2026-06-25.

The build uses projen and jsii. The `npm run build` target runs `projen build`, and dedicated `package:python`, `package:java`, `package:dotnet`, and `package:go` targets emit the per language distributions (`package.json` of `cdk8s-core`). The runtime depends on `constructs ^10` as a peer dependency and bundles `yaml`, `fast-json-patch`, and `follow-redirects`.
