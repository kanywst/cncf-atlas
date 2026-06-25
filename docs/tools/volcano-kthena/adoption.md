# Adoption & Ecosystem

## Who uses it

No named production adopter of Kthena could be confirmed at the pinned commit. The project is new, announced publicly in January 2026, and no ADOPTERS file was found. Kthena is developed and led by Huawei Cloud as Volcano's originator ([CNCF blog](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/)); that is its developer, not an adopter.

Do not confuse Kthena with its parent. The organisations named in the CNCF Volcano Incubator article (Amazon, HP, Google, Oracle, and others) are Volcano contributors and adopters, not Kthena adopters ([CNCF blog](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/)).

## Adoption signals

Observed via `gh repo view` on 2026-06-25:

- Stars: 381
- Forks: 138
- Contributors: 62
- Latest release: v0.4.0 (2026-04-21)
- Release cadence: four releases (v0.1.0 to v0.4.0) over roughly six months

For a project published in early 2026, the contributor count and release frequency are getting off the ground.

## Ecosystem

- **Inference engines**: Kthena orchestrates on top of vLLM, SGLang, and Triton (TGI) rather than replacing them. `ModelBackend.Type` supports vLLM and vLLMDisaggregated. vLLM publishes a Kthena integration page ([vLLM docs](https://docs.vllm.ai/en/stable/deployment/integrations/kthena/)), and there is an Ascend NPU variant ([vllm-ascend](https://docs.vllm.ai/projects/ascend/en/main/user_guide/deployment_guide/using_volcano_kthena.html)).
- **KV-transfer connectors**: NIXL, MoonCake, and SGLang (`pkg/kthena-router/connectors`).
- **Scheduler**: the Volcano scheduler provides gang and network-topology-aware scheduling.
- **Autoscaling**: examples for KEDA and Prometheus-based autoscaling ship in the repo (`examples/keda-autoscaling`, `examples/prometheus-autoscaler`).
- **Gateway API**: the router can sit behind a standard API gateway and understands HTTPRoute and InferencePool.

## Alternatives

The broad trend is to push load balancing and KV-cache management out of the engine and up into the cluster orchestration layer, with the Gateway API Inference Extension as one focal point. Kthena enters that space with a different bet: Volcano gang scheduling. Pick Kthena when you want Volcano gang scheduling and a single `ServingGroup` model for PD disaggregation; pick a Gateway-API-native option when standards alignment matters more than the Volcano dependency.

| Alternative | Differs by |
| --- | --- |
| [llm-d](https://kubernetes.io/blog/2025/06/05/introducing-gateway-api-inference-extension/) | Red Hat led; natively coupled to the Gateway API Inference Extension; PD disaggregation via dual-LWS; pairs with KServe |
| [AIBrix](https://arxiv.org/html/2504.03648v1) | From the vLLM project; co-design focus, high-density LoRA, LLM-specific autoscaler, VTC fair queuing, StormService/RoleSet for PD; aimed at very large multi-tenant scale |
| [KServe](https://kserve.github.io/website/blog/cloud-native-ai-inference-kserve-llm-d) | A model-serving control plane for lifecycle and governance; not an LLM-specific scheduler; complements llm-d in layers |
| NVIDIA Dynamo | A peer inference-orchestration candidate raised in the same comparison ([pacoxu](https://pacoxu.wordpress.com/2025/12/03/how-to-choose-the-inference-orchestration-solution-aibrix-or-kthena-or-dynamo/)) |
