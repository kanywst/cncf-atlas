# History

## Origin

Envoy started at Lyft. Matt Klein joined from Twitter in May 2015, while Lyft was moving from a monolith to more than 30 microservices. The team could not see what the network was doing: ELB and CloudWatch did not surface P50 or P99 latency, so failures were hard to diagnose. Network observability was the main motivation for a new proxy ([How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f)).

NGINX and HAProxy were fast but offered little beyond L4/L7 routing, and a Finagle-style per-language library did not fit a polyglot service fleet. Lyft chose an out-of-process proxy written in modern C++ for performance. Development began in May 2015 and an MVP was deployed in early September 2015 ([How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f)).

## Timeline

| Year | Milestone |
| --- | --- |
| 2015 | Development starts at Lyft (May); MVP deployed in production (early September). |
| 2016 | All Lyft services run behind Envoy with client-side load balancing (early 2016); open-sourced on 2016-09-14. |
| 2017 | Donated to the CNCF on 2017-09-13 as its 11th hosted project. |
| 2018 | Graduated from the CNCF on 2018-11-28, the 3rd project to do so after Kubernetes and Prometheus. |

## How it evolved

By early 2016 every Lyft service ran behind Envoy using client-side load balancing, and by that summer it covered both edge and service-to-service traffic across hundreds of services at millions of requests per second ([How Lyft Invented Envoy](https://medium.com/@yashbatra11111/how-lyft-invented-envoy-and-rewired-the-microservice-world-f00756fa5d4f)).

After the 2016-09-14 open-source release, engineers from Google, Apple, Microsoft, and eBay reached out, and adoption ran ahead of expectations ([5 years of Envoy OSS](https://mattklein123.dev/2021/09/14/5-years-envoy-oss/)). That external interest fed the xDS configuration APIs, which turned Envoy into a data plane that other control planes could drive.

Envoy joined the CNCF on 2017-09-13 as its 11th hosted project ([Envoy joins the CNCF](https://eng.lyft.com/envoy-joins-the-cncf-dc18baefbc22)) and graduated on 2018-11-28, following Kubernetes and Prometheus ([CNCF project page](https://www.cncf.io/projects/envoy/)).

## Where it stands now

The repository pins API version `3.0.0` (`API_VERSION.txt`) and carries `1.39.0-dev` in `VERSION.txt`, with `v1.38.2` released on 2026-06-10 as the nearest tag. Governance is documented in [GOVERNANCE.md](https://github.com/envoyproxy/envoy/blob/main/GOVERNANCE.md), which defines maintainer tiers and a voting process. The CNCF project page reports a graduated project with thousands of contributors ([CNCF project page](https://www.cncf.io/projects/envoy/)).
