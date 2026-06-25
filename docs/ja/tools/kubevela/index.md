# KubeVela

> 1 つの OAM `Application` から、組み立て可能な CUE モジュール経由でマルチクラスタの Kubernetes リソースを配信する、アプリ中心の control plane。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [kubevela/kubevela](https://github.com/kubevela/kubevela)
- **ドキュメント基準コミット**: `a10dba6` (master, 2026-06-10)

## 何をするものか

KubeVela は Open Application Model (OAM) の上に構築された Kubernetes コントローラだ。ユーザはコンポーネント・ポリシー・ワークフローを並べた `Application` カスタムリソースを 1 つ書き、コントローラがそれをワークロードを動かす実際の Kubernetes オブジェクトへ展開する。抽象層は Go コードではなく CUE template で実装されているため、プラットフォームチームはコントローラを再ビルドせず CUE 定義を追加するだけで新しいコンポーネント型・トレイト型を足せる。

OAM はアプリケーションを、ワークロードをモデル化する Component と、コンポーネントに運用能力を付与する Trait に分割する (出典: [CNCF blog 2023-03-31](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/))。KubeVela は OAM の最初の実装で、2020 年に Alibaba Cloud と Microsoft Azure が提唱した。生の Kubernetes マニフェストや Helm より上位に位置し、Helm chart・Terraform module・素のワークロードを配信したうえで、適用したものをすべて台帳化して GC できる。

プロジェクトは 3 つのエントリポイントを提供する: controller-manager、`vela` CLI、kubectl プラグイン。コントローラが `Application` を reconcile する本体で、CLI はターミナルから配信を駆動する運用者向けだ。

## いつ使うか

- 社内開発者プラットフォームを作っていて、生の Deployment / Service / Ingress を露出する代わりに 1 つのセルフサービスなアプリ API を提供したい。
- 同じアプリを複数クラスタへ、単一の control plane から配置ポリシー付きで配信したい。
- プラットフォームエンジニアに、コントローラをフォーク・再ビルドせずに再利用可能なコンポーネント / トレイト抽象を CUE で定義させたい。
- すでに Helm chart や Terraform module を標準化しており、それらを上位の workflow 駆動な配信モデルでラップしたい。

向かない場合: Git から生マニフェストを同期するだけなら素の GitOps シンクラの方がシンプル。チームに CUE を学ぶ余力がなければ、抽象層の学習コストがプラットフォーム側にのしかかる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [kubevela/kubevela リポジトリ, commit a10dba6](https://github.com/kubevela/kubevela)
2. [kubevela/community ADOPTERS.md](https://github.com/kubevela/community/blob/main/ADOPTERS.md)
3. [kubevela/community GOVERNANCE.md](https://github.com/kubevela/community/blob/main/GOVERNANCE.md)
4. [CNCF: KubeVela brings software delivery control plane capabilities to CNCF Incubator (2023-02-27)](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/)
5. [CNCF: KubeVela, the road to cloud native application and platform engineering (2023-03-31)](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/)
6. [CNCF project page: KubeVela](https://www.cncf.io/projects/kubevela/)
7. [KubeVela Documentation: Introduction](https://kubevela.io/docs/)
