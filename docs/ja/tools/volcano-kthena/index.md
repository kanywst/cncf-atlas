# Volcano-Kthena

> Volcano の gang scheduling と KV キャッシュ対応の prefill-decode ルーティングを組み合わせた、Kubernetes ネイティブな LLM 推論オーケストレータ。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [volcano-sh/kthena](https://github.com/volcano-sh/kthena)
- **ドキュメント基準コミット**: `affd5be` (2026-06-24, `main` HEAD)

## 何をするものか

Kthena は [Volcano](https://www.cncf.io/projects/volcano/) のサブプロジェクトで、Kubernetes 上で大規模言語モデル (LLM) の推論をオーケストレーションする。Volcano はもともと AI 学習向けのバッチスケジューラとして始まったが、Kthena は同じスケジューリング機構を推論 (サービング) 側に広げ、AI ライフサイクル全体を扱えるようにする。Volcano コミュニティが 2026-01-28 に正式発表した。

構成は 2 つに分かれる。コントロールプレーン (`kthena-controller-manager`) はカスタムリソースを reconcile して推論レプリカの deploy / scale / upgrade を回し、gang scheduling は Volcano スケジューラに委譲する。データプレーン (`kthena-router`) は推論トラフィックの入口で、OpenAI 互換リクエストを分類し、レート制限とトラフィックポリシーを当て、候補 pod を採点して選んだ推論インスタンスへプロキシする。2 つのプレーンは独立してデプロイできる。

Kthena は推論エンジンを置き換えない。vLLM や SGLang などのエンジンの上に乗り、それらをバックエンドとして扱い、マルチノード配置・prefill-decode 分離・KV キャッシュ対応ルーティングを足す。

## いつ使うか

- Kubernetes 上で LLM 推論を動かしていて、gang scheduling のために Volcano スケジューラを既に使っている、または導入してよい。
- 複数 pod にまたがる prefill-decode 分離が必要で、prefill と decode のエンドポイントをルータ側で対応付けたい。
- KV キャッシュ・prefix キャッシュの局所性を、各エンジン内ではなく L7 ルーティング層で判断したい。
- 多数の LoRA アダプタを提供しており、推論を止めずにアダプタ対応ルーティングが必要。

向かないのは、Gateway API Inference Extension にネイティブなスタックが欲しい場合 ([llm-d](https://kubernetes.io/blog/2025/06/05/introducing-gateway-api-inference-extension/) 参照) や、Volcano 依存を持ちたくない場合。ルータ自体は活発に反復中の参照実装と明記されている。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

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
