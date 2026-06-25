# 採用事例・エコシステム

## 誰が使っているか

pin 時点で、引用できる Kthena の本番採用組織は確認できなかった。プロジェクトは新しく、公開は 2026 年 1 月、ADOPTERS ファイルも見当たらない。Kthena を開発・主導するのは Volcano の起案元である Huawei Cloud だが ([CNCF blog](https://www.cncf.io/blog/2026/01/28/introducing-kthena-llm-inference-for-the-cloud-native-era/))、これは開発元であって採用組織ではない。

親 Volcano と混同しないこと。CNCF の Volcano Incubator 記事が挙げる Amazon / HP / Google / Oracle 等は Volcano のコントリビュータ・採用組織であり、Kthena の採用組織ではない ([CNCF blog](https://www.cncf.io/blog/2022/04/07/cloud-native-batch-system-volcano-moves-to-the-cncf-incubator/))。

## 採用のシグナル

`gh repo view` で 2026-06-25 に観測:

- スター: 381
- フォーク: 138
- コントリビュータ: 62
- 最新リリース: v0.4.0 (2026-04-21)
- リリース頻度: v0.1.0 から v0.4.0 まで約半年で 4 リリース

2026 年初頭公開のプロジェクトとしては、コントリビュータ数とリリース頻度は立ち上がっている。

## エコシステム

- **推論エンジン**: Kthena は vLLM / SGLang / Triton (TGI) を置き換えず、その上でオーケストレーションする。`ModelBackend.Type` は vLLM と vLLMDisaggregated をサポート。vLLM 公式に Kthena 連携ページがあり ([vLLM docs](https://docs.vllm.ai/en/stable/deployment/integrations/kthena/))、Ascend NPU 版もある ([vllm-ascend](https://docs.vllm.ai/projects/ascend/en/main/user_guide/deployment_guide/using_volcano_kthena.html))。
- **KV 転送 connector**: NIXL / MoonCake / SGLang (`pkg/kthena-router/connectors`)。
- **スケジューラ**: Volcano スケジューラが gang / network-topology-aware なスケジューリングを提供する。
- **オートスケーリング**: KEDA と Prometheus ベースの例がリポにある (`examples/keda-autoscaling`, `examples/prometheus-autoscaler`)。
- **Gateway API**: router は標準 API gateway の後段に置け、HTTPRoute / InferencePool を解釈する。

## 代替候補

大きなトレンドは、ロードバランスと KV キャッシュ管理をエンジン内からクラスタオーケストレーション層へ押し上げることで、その結節点の 1 つが Gateway API Inference Extension だ。Kthena は別の賭け、すなわち Volcano gang scheduling でそこに参入する。Volcano gang scheduling と単一 `ServingGroup` モデルでの PD 分離が欲しければ Kthena を、Volcano 依存より標準準拠が重要なら Gateway API ネイティブ系を選ぶ。

| 代替 | 違い |
| --- | --- |
| [llm-d](https://kubernetes.io/blog/2025/06/05/introducing-gateway-api-inference-extension/) | Red Hat 主導。Gateway API Inference Extension にネイティブ密結合。PD 分離は dual-LWS。KServe と層で組む |
| [AIBrix](https://arxiv.org/html/2504.03648v1) | vLLM プロジェクト発。co-design 志向、高密度 LoRA、LLM 特化オートスケーラ、VTC fair queuing、PD 分離は StormService/RoleSet。超大規模・多テナント寄り |
| [KServe](https://kserve.github.io/website/blog/cloud-native-ai-inference-kserve-llm-d) | ライフサイクル・ガバナンス向けのモデルサービング コントロールプレーン。LLM 特化スケジューラではなく、llm-d と層で補完 |
| NVIDIA Dynamo | 同じ比較記事で挙がる同種の推論オーケストレーション候補 ([pacoxu](https://pacoxu.wordpress.com/2025/12/03/how-to-choose-the-inference-orchestration-solution-aibrix-or-kthena-or-dynamo/)) |
