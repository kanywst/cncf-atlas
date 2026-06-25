# Volcano-Kthena

> Kubernetes-native LLM inference orchestration that pairs Volcano gang scheduling with KV-cache-aware, prefill-decode routing.

- **Category**: Orchestration & Scheduling
- **CNCF maturity**: Incubating
- **Language**: Go
- **License**: Apache-2.0
- **Repository**: [volcano-sh/kthena](https://github.com/volcano-sh/kthena)
- **Documented at commit**: `affd5be` (2026-06-24, `main` HEAD)

## What it is

Kthena is a subproject of [Volcano](https://www.cncf.io/projects/volcano/) that orchestrates large language model inference on Kubernetes. Volcano started as a batch scheduler for AI training; Kthena extends the same scheduling machinery to the serving side of the AI lifecycle. The Volcano community announced it on 2026-01-28.

It splits into two parts. A control plane (`kthena-controller-manager`) reconciles custom resources to deploy, scale, and upgrade inference replicas, and delegates gang scheduling to the Volcano scheduler. A data plane (`kthena-router`) is the entry point for inference traffic: it classifies each OpenAI-compatible request, applies rate limiting and traffic policy, scores candidate pods, and proxies to the chosen inference instance. The two planes can be deployed independently.

Kthena does not replace the inference engine. It sits above engines such as vLLM and SGLang and treats them as backends, adding multi-node placement, prefill-decode disaggregation, and KV-cache-aware routing on top.

## When to use it

- You run LLM inference on Kubernetes and already use, or are willing to adopt, the Volcano scheduler for gang scheduling.
- You need prefill-decode disaggregation across multiple pods and want the router to keep prefill and decode endpoints paired.
- You want KV-cache and prefix-cache locality decided at an L7 routing layer rather than inside each engine.
- You serve many LoRA adapters and need adapter-aware routing without restarting inference.

It fits less well when you want a Gateway API Inference Extension native stack (see [llm-d](https://kubernetes.io/blog/2025/06/05/introducing-gateway-api-inference-extension/)), or when you do not want a Volcano dependency. The router itself is documented as a reference implementation under active iteration.

## In this deep-dive

- [History](./history): origin, milestones, and why it exists.
- [Architecture](./architecture): components and how requests flow.
- [Adoption & Ecosystem](./adoption): who runs it and what surrounds it.
- [Internals](./internals): the code paths that matter, read from source.
- [Getting Started](./getting-started): install and a first working setup.

## Sources

1. [volcano-sh/kthena (GitHub)](https://github.com/volcano-sh/kthena)
2. [Introducing Kthena: LLM inference for the cloud native era (CNCF)](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/)
3. [Cloud Native Batch System Volcano moves to the CNCF Incubator](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/)
4. [Volcano (CNCF project page)](https://www.cncf.io/projects/volcano/)
5. [Beyond Batch: Volcano Evolves into the AI-Native Unified Scheduling Platform](https://www.cncf.io/blog/2026/03/23/beyond-batch-volcano-evolves-into-the-ai-native-unified-scheduling-platform/)
6. [How to choose the inference orchestration solution? AIBrix or Kthena or Dynamo? (pacoxu)](https://pacoxu.wordpress.com/2025/12/03/how-to-choose-the-inference-orchestration-solution-aibrix-or-kthena-or-dynamo/)
7. [Kthena integration (vLLM docs)](https://docs.vllm.ai/en/stable/deployment/integrations/kthena/)
8. [Using Volcano Kthena (vllm-ascend)](https://docs.vllm.ai/projects/ascend/en/main/user_guide/deployment_guide/using_volcano_kthena.html)
9. [Introducing Gateway API Inference Extension (Kubernetes)](https://kubernetes.io/blog/2025/06/05/introducing-gateway-api-inference-extension/)
10. [Cloud-Native AI Inference using KServe and llm-d](https://kserve.github.io/website/blog/cloud-native-ai-inference-kserve-llm-d)
11. [AIBrix: Towards Scalable, Cost-Effective LLM Inference Infrastructure (arXiv)](https://arxiv.org/html/2504.03648v1)
12. [Kthena quick-start guide](https://github.com/volcano-sh/kthena/blob/main/docs/kthena/docs/getting-started/quick-start.md)
