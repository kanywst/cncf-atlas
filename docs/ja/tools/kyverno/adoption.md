# 採用事例・エコシステム

## 誰が使っているか

以下の組織はプロジェクトの `ADOPTERS.md` か CNCF graduation announcement に名前が挙がっている。出典のある採用組織のみを記載する。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| LinkedIn | on-prem Kubernetes クラスタでのポリシー enforcement。230+ クラスタ / 500K+ ノード、ストレス下で 20K admission req/min を劣化なく処理と報告。 | [CNCF announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/), [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Coinbase | mutation、手書き webhook の置換、多数の類似 namespace への共通オブジェクト generation。 | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Bloomberg | 内製 Kubernetes プラットフォームでのカスタム validation/mutation webhook の置換。 | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Mandiant | 全クラスタとオンボーディングでのポリシー enforcement。新 namespace に必要なリソースとシークレットを投入。 | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Giant Swarm | リソース (主に cluster-api) の defaulting ロジックと、制限を enforce する PSP の置換。 | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |
| Vodafone Group | 内製 Kubernetes サービス提供でのポリシー enforcement と自動化。 | [ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) |

`ADOPTERS.md` には他に Deutsche Telekom、T-Systems、Red Hat (RHACM 連携)、Saxo Bank、Wayfair、Yahoo、Velux、Groww、Ohio Supercomputer Center、Arrikto (Kubeflow)、VSHN/APPUiO なども記載されている。

## 採用のシグナル

- GitHub: 2026-06-22 に [GitHub REST API](https://api.github.com/repos/kyverno/kyverno) で観測したスター 7,859 / fork 1,402。
- コントリビュータ: CNCF graduation announcement は 1,063 組織からの 3,624 名の contributor、Nirmata・Chainguard・Cloudflare を含む 6 組織にまたがる maintainer を報告している ([CNCF announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/))。
- リリース頻度: ドキュメント基準コミット時点の最新リリース系は v1.18.1 (2026-05-18) で、1.18 系に続く ([Announcing Kyverno 1.18](https://www.cncf.io/blog/2026/05/05/announcing-kyverno-release-1-18/))。
- 成熟度: 2026-03-16 時点で CNCF Graduated ([CNCF project page](https://www.cncf.io/projects/kyverno/))。

## エコシステム

- **kyverno/policies**: Pod Security Standards を含む既製ポリシーのライブラリ。
- **kubectl-kyverno**: `cmd/cli` 以下の CLI。クラスタ外でポリシーをテスト・適用する。
- **Policy Reporter**: Kyverno が emit する `PolicyReport` CRD を可視化する。
- **GitOps**: ポリシーは普通の Kubernetes リソースなので、Argo CD や Flux で他のマニフェストと同様に配布できる。
- **イメージ検証**: 署名チェックで Sigstore/cosign と連携する。
- **Red Hat RHACM**: ポリシー管理に Kyverno を統合する。

## 代替候補

主要な代替は OPA Gatekeeper。本質的な差は言語だ。Gatekeeper は Rego を使い、Kyverno のポリシーは Kubernetes YAML リソースである。Gatekeeper は ConstraintTemplate と Constraint の 2 段モデルを使い、Kyverno は単一 CRD を使う。Gatekeeper は validation と mutation が中心で、Kyverno はリソース generation とイメージ検証もネイティブに提供する ([Nirmata comparison](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/), [policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/))。

隣接する選択肢は Kubernetes ネイティブの ValidatingAdmissionPolicy と MutatingAdmissionPolicy だ。どちらも CEL ベースで API server に組み込まれている。Kyverno は CEL ポリシー型でこれらと整合し、置換ではなく bind できる。

| 代替 | 違い |
| --- | --- |
| OPA Gatekeeper | Rego 言語と ConstraintTemplate + Constraint の組。validation/mutation 中心で、generation とイメージ検証はネイティブ非対応。 |
| ネイティブ ValidatingAdmissionPolicy / MutatingAdmissionPolicy | Kubernetes API server に組み込み、CEL のみ、generation なし。Kyverno は置換せず補完する。 |

ある公開比較は、フットプリントを Gatekeeper (controller + audit) でおよそ 270MB、Kyverno で 4 つの controller を合わせておよそ 600MB と計測している ([policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/))。これはブログ著者の計測値であり、公式の数値ではない。
