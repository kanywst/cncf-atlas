# Adoption & Ecosystem

## Who uses it

The repository's `ADOPTERS.md` only links to the project testimonials page ([source 7](https://www.fluentd.org/testimonials)) and lists no specific names. The CNCF graduation announcement of 2019-04-11 names the organizations below ([source 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/)).

| Organisation | Use case | Source |
| --- | --- | --- |
| Atlassian | Log collection at scale | [CNCF graduation announcement](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| Amazon Web Services | Log collection at scale | [CNCF graduation announcement](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| Change.org | Log collection at scale | [CNCF graduation announcement](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| CyberAgent | Log collection at scale | [CNCF graduation announcement](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| LINE Corp | Log collection at scale | [CNCF graduation announcement](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| Nintendo | Log collection at scale | [CNCF graduation announcement](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| Microsoft | Log collection at scale | [CNCF graduation announcement](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |

## Adoption signals

At graduation in 2019 the project reported more than 5,000 community users ([source 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/)). GitHub signals on 2026-06-22 ([source 8](https://api.github.com/repos/fluent/fluentd)):

- Stars: 13,546
- Forks: 1,392
- Open issues: 136
- Contributors: roughly 285 (GitHub contributors API, includes anonymous)

## Ecosystem

Fluentd's main asset is its plugin catalog, with more than 500 community-built input, output, filter, parser, formatter, and buffer plugins managed through `fluent-gem` ([source 1](https://github.com/fluent/fluentd)). Around the core are `fluent-operator` (a Kubernetes operator), Helm charts, and the C-based sister project Fluent Bit, all under the `fluent` GitHub organization ([source 1](https://github.com/fluent/fluentd)).

## Alternatives

Fluentd's real differentiation is the largest plugin ecosystem, vendor-neutral CNCF governance, and tag-based routing with a buffering abstraction. Its weakness is footprint: the Ruby core is heavier on memory and CPU than the C and Rust alternatives ([source 6](https://www.cncf.io/blog/2022/02/10/logstash-fluentd-fluent-bit-or-vector-how-to-choose-the-right-open-source-log-collector/)).

| Alternative | Differs by |
| --- | --- |
| Fluent Bit | C implementation, sub-megabyte footprint, aimed at edge and Kubernetes sidecars; same authors |
| Logstash | JVM-based, strong grok/dissect transforms and ELK integration, the heaviest footprint |
| Vector | Rust, high throughput with the VRL transform language, a middling footprint |
