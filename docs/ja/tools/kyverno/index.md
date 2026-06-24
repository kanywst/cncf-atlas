# Kyverno

> ポリシーそのものが Kubernetes リソースである admission エンジン。別言語ではなく YAML としてポリシーを書き、レビューできる。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [kyverno/kyverno](https://github.com/kyverno/kyverno)
- **ドキュメント基準コミット**: `989e001` (v1.18.1 系, 2026-06-20)

## 何をするものか

Kyverno は Kubernetes 向けのポリシーエンジン。リソースの作成・更新・削除のたびに API server が呼ぶ admission webhook として動く。各ポリシーは Kubernetes のカスタムリソースなので、ワークロードを管理するのと同じ `kubectl apply` と RBAC で、それらを統治するルールも管理できる。

1 つの rule は次の 4 つのいずれかを行う。リソースを validate して受理/拒否する、フィールドを patch して mutate する、新しい namespace にデフォルトの NetworkPolicy を入れるような付随リソースを generate する、コンテナイメージの署名を verify する。validate と mutate は admission リクエストの中でインラインに走る。generate と既存リソースの mutate は background controller を通じて非同期に走る。

近年のリリースは Common Expression Language (CEL) へ寄せている。CEL は Kubernetes ネイティブの ValidatingAdmissionPolicy が使うのと同じ言語だ。Kyverno は旧来の `ClusterPolicy` モデルと並んで CEL ベースのポリシー型を提供し、Kubernetes ネイティブの admission policy を置換せず bind できる。プロジェクトは複数バイナリで動く。admission controller、background controller、cleanup controller、reports controller、そして `kubectl-kyverno` CLI だ。

## いつ使うか

- Kubernetes リソースを enforce / mutate / generate したく、別のポリシー言語より Kubernetes YAML で書くポリシーを好む。
- イメージ署名検証や付随リソースの自動生成を、後付けでなく同じエンジンで扱いたい。
- Pod 向けに書いた 1 つの rule で、Deployment / DaemonSet / StatefulSet / Job / CronJob まで、controller ごとにコピーせず網羅したい。
- ポリシーロジックの大半が Kubernetes admission の外にある場合、または非 Kubernetes システム全体で汎用ポリシー言語に既に標準化済みの場合は、向かない。

## このディープダイブの構成

- [歴史](./history): Nirmata での起源、CNCF への寄贈、graduation。
- [アーキテクチャ](./architecture): 各 controller と、1 本の admission リクエストがどう流れるか。
- [採用事例・エコシステム](./adoption): 出典付きの採用組織、GitHub のシグナル、周辺ツール。
- [内部実装](./internals): rule と response のデータ構造をソースから読む。
- [はじめに](./getting-started): Helm でインストールし、非準拠 Pod をブロックする。

## 出典

1. [kyverno/kyverno on GitHub](https://github.com/kyverno/kyverno) (2026-06-22)
2. [CNCF Announces Kyverno's Graduation](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/) (2026-06-22)
3. [Kyverno - CNCF project](https://www.cncf.io/projects/kyverno/) (2026-06-22)
4. [Announcing Kyverno release 1.18](https://www.cncf.io/blog/2026/05/05/announcing-kyverno-release-1-18/) (2026-06-22)
5. [Kubernetes Policy Comparison: Kyverno vs OPA/Gatekeeper, Nirmata](https://nirmata.com/2025/02/07/kubernetes-policy-comparison-kyverno-vs-opa-gatekeeper/) (2026-06-22)
6. [OPA/Gatekeeper vs Kyverno, policyascode.dev](https://policyascode.dev/blog/opa-gatekeeper-vs-kyverno/) (2026-06-22)
7. [Kyverno Introduction / Quick Start](https://kyverno.io/docs/introduction/) (2026-06-22)
8. [Kyverno ADOPTERS.md](https://github.com/kyverno/kyverno/blob/main/ADOPTERS.md) (2026-06-22)
9. [Kyverno GOVERNANCE.md](https://github.com/kyverno/community/blob/main/GOVERNANCE.md) (2026-06-22)
10. [GitHub REST API repos/kyverno/kyverno](https://api.github.com/repos/kyverno/kyverno) (2026-06-22)
