# status: kserve

- [x] recon 完了 @ commit `58d137d8c69cc08bf3d53eaa594af1e483a9e80b`
- [x] sources 整理
- [ ] write: en 6 セクション
- [ ] write: ja 6 セクション
- [ ] tools.ts に登録
- [ ] `npm run docs:build` グリーン
- [ ] markdownlint clean

## メモ

- repo 確定: `kserve/kserve` (Apache-2.0, Go control plane + Python data plane)。pinned は v0.19.0 リリース後の master 先端 (HEAD)。write 段でリリース版を引くなら `v0.19.0` タグを使う。
- カテゴリは指定どおり `Orchestration & Scheduling` を verbatim で使う。
- tagline (en): Kubernetes-native, multi-framework inference platform that turns a model into an autoscaling InferenceService for both predictive and generative AI.
- tagline (ja): モデルを autoscaling な InferenceService CRD に変える、Kubernetes ネイティブでマルチフレームワークの推論基盤。予測 AI と生成 AI を 1 つのプラットフォームで扱う。
- 採用組織は CNCF blog 由来の citable なものだけ (Bloomberg/Red Hat/Cloudera/CyberAgent/Nutanix/SAP/NVIDIA)。リポに `ADOPTERS.md` は無い。捏造しない。
- write 段の確認事項: quickstart の install スクリプト名/URL は KServe リリースごとに変わる (例で見たのは v0.18.0 の `kserve-standard-mode-full-install-with-manifests.sh`)。最新リリースのアセット名を再確認してから載せる。
- 数値はアクセス日 2026-06-24 の gh API 値。write でも参照日を明記する。
