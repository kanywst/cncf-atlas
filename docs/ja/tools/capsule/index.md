# Capsule

> Capsule は、複数の Namespace を Tenant カスタムリソースの下に束ね、admission webhook で分離を強制することで、単一の Kubernetes クラスタをマルチテナント基盤に変える。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [projectcapsule/capsule](https://github.com/projectcapsule/capsule)
- **ドキュメント基準コミット**: `8d89d68` (タグ v0.13.7 付近、2026-06-24)

## 何をするものか

Capsule はソフトマルチテナンシー向けの Kubernetes オペレータである。ソフトマルチテナンシーとは、多数のチームが 1 つの API サーバと 1 つのコントロールプレーンを共有し、境界をクラスタ分割や仮想コントロールプレーンではなく admission control と Role-Based Access Control (ロールベースアクセス制御、RBAC) で引く方式を指す。Capsule はクラスタスコープの `Tenant` Custom Resource Definition (カスタムリソース定義、CRD) を追加し、Namespace の集合・その所有者・適用ポリシーを 1 つにまとめる。

素の Kubernetes Namespace はフラットである。「これら 10 個の Namespace は 1 チームに属し quota を共有する」と表す native なオブジェクトは存在しない。チームはチームごとにクラスタを分けて回避しがちで、これがクラスタ乱立 (cluster sprawl) とその運用コストを生む。Capsule は単一クラスタ内でこの隙間を埋める。テナントオーナーは新しい Namespace をセルフサービスで作れ、Capsule は各 Namespace をテナントに定義された上限・NetworkPolicy・RoleBinding の枠内に保つ。

Capsule は 2 つの役割を持つ単一のコントローラバイナリとして動く。1 つはテナントのポリシーをメンバー Namespace へ同期する controller-runtime ベースの reconciler 群、もう 1 つは Namespace・Pod・Ingress などのリクエストを永続化前に横取りする admission webhook 群である。両者は `cmd/controller/main.go:115` で 1 つの Manager に登録される。

## いつ使うか

- API サーバを共有できる程度に相互信頼のある内部チームで 1 クラスタを共有し、各チームに quota の枠内で Namespace をセルフサービスさせたいとき。
- チームごとのクラスタを 1 クラスタ + 論理的なテナント境界へ集約し、クラスタ乱立を避けたいとき。
- Namespace 群へのポリシー (共有 quota、デフォルトの NetworkPolicy、RoleBinding、許可する storage / priority class) を、GitOps に乗る単一の宣言的オブジェクトとして表したいとき。
- 向かないのは、テナントが相互に非信頼であるか、テナント自身のクラスタスコープ資源や CRD を必要とする場合。そこは vCluster や Kamaji のような仮想/専用コントロールプレーンが適する。

## このディープダイブの構成

- [歴史](./history): Clastix での起源、中立な CNCF org への移管、マイルストーン。
- [アーキテクチャ](./architecture): controller 側と webhook 側の二面構成、および Namespace 作成の流れ。
- [採用事例・エコシステム](./adoption): 出典のある採用組織、GitHub シグナル、代替。
- [内部実装](./internals): 所有権モデル、中核の型、追跡した 1 つのコードパス。
- [はじめに](./getting-started): Helm でのインストールと最初のテナント作成。

## 出典

1. projectcapsule/capsule (GitHub): <https://github.com/projectcapsule/capsule>
2. Capsule プロジェクトページ (CNCF): <https://www.cncf.io/projects/capsule/>
3. Sandbox Inclusion Results from December 13, 2022: <https://lists.cncf.io/g/cncf-toc/message/7743>
4. CNCF Sandbox project onboarding (umbrella issue #812): <https://github.com/projectcapsule/capsule/issues/812>
5. Project Capsule ドキュメント: <https://projectcapsule.dev/>
6. Capsule インストールガイド: <https://projectcapsule.dev/docs/operating/setup/installation/>
7. Capsule adopters: <https://projectcapsule.dev/adopters/>
8. Capsule (clastix ミラーサイト): <https://capsule.clastix.io/>
9. Dario Tranchitella の Capsule 公開告知スレッド: <https://threadreaderapp.com/thread/1293084561908400128.html>
10. Comparing Multi-tenancy Options in Kubernetes (vCluster): <https://www.vcluster.com/blog/comparing-multi-tenancy-options-in-kubernetes>
11. Building a Multi-Tenancy Platform with Capsule and vCluster (SREKubeCraft): <https://srekubecraft.io/posts/k8s-multi-tenancy/>
12. ADOPTERS.md @ commit 8d89d68: <https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md>
13. MAINTAINERS.md @ commit 8d89d68: <https://github.com/projectcapsule/capsule/blob/main/MAINTAINERS.md>
14. GitHub REST API repos/projectcapsule/capsule: <https://api.github.com/repos/projectcapsule/capsule>
