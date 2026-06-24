# 歴史

## 起源

Kyverno は Nirmata が作成し、2020 年に CNCF へ寄贈された。名前はギリシャ語で「統治する (to govern)」の意。前提はシンプルで、Kubernetes には既にポリシー言語がある、すなわち自身のリソースモデルだ、というものだった。admission rule を書くのに別言語を学ばせるのではなく、Kyverno は各ポリシーを Kubernetes カスタムリソースにし、クラスタ内の他のすべてと同じツール・RBAC・GitOps パイプラインで管理する ([CNCF graduation announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | Nirmata が作成。2020-11-10 に CNCF Sandbox 受理。 |
| 2022 | 2022-07-13 に CNCF Incubating へ移行。 |
| 2026 | 2026-03-16 に CNCF Graduated。graduation は 2026-03-24 の KubeCon + CloudNativeCon EU (Amsterdam) で発表。 |
| 2026 | リリース 1.18 で SSRF 修正、CEL ベースのポリシー型の前進、旧来 `ClusterPolicy` モデルの段階的縮小。 |

## どう進化したか

最大の転換は CEL への移行だ。初期の Kyverno は `ClusterPolicy` 内で JMESPath と YAML overlay でロジックを表現していた。近年のリリースは CEL ベースのポリシー型 (ValidatingPolicy, MutatingPolicy, ImageVerificationPolicy, GeneratingPolicy) を追加し、Kubernetes 自身がネイティブの ValidatingAdmissionPolicy / MutatingAdmissionPolicy で取った方向と整合させる。Kyverno はこれらをネイティブ admission policy の置換ではなく補完として位置づけ、リリース 1.18 では CEL 経路を優先して旧来 `ClusterPolicy` モデルを縮小し続けている ([Announcing Kyverno 1.18](https://www.cncf.io/blog/2026/05/05/announcing-kyverno-release-1-18/))。

graduation にはサードパーティのセキュリティ監査に加え、CNCF TAG Security & Compliance 主導のセキュリティ評価を通過することが求められた。graduation の TOC sponsor は Karena Angell だった ([CNCF graduation announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/))。

## 現在地

Kyverno は CNCF Graduated プロジェクト。graduation 時点で CNCF は、Nirmata・Chainguard・Cloudflare を含む 6 組織にまたがる maintainer、1,063 組織からの 3,624 名の contributor を報告している ([CNCF graduation announcement](https://www.cncf.io/announcements/2026/03/24/cloud-native-computing-foundation-announces-kyvernos-graduation/))。ドキュメント基準コミット時点の最新リリース系は v1.18.1 (2026-05-18)。ガバナンスと maintainer リストは `kyverno/community` リポジトリにある ([GOVERNANCE.md](https://github.com/kyverno/community/blob/main/GOVERNANCE.md))。表明されている方向性は、移行期の既存 `ClusterPolicy` ユーザーを支えつつ CEL ベースのポリシー型への投資を続けることだ。
