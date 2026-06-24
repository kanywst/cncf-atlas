# Argo CD

> Git に保存したマニフェストとクラスタの状態を継続的に突き合わせる Kubernetes コントローラ。pull 型 GitOps モデル。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Graduated
- **言語**: Go (UI は React/TypeScript)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [argoproj/argo-cd](https://github.com/argoproj/argo-cd)
- **ドキュメント基準コミット**: `8f6d4e1` (master, 2026-06-22; `VERSION` は `3.6.0`)

## 何をするものか

Argo CD は Argo プロジェクトの GitOps エンジンであり、Argo は Workflows / Rollouts / Events も束ねる CNCF の傘プロジェクトである。Argo CD は Kubernetes クラスタ内で動き、Git リポジトリをデプロイ対象の真実 (source of truth) として扱う。`Application` カスタムリソースがリポジトリのパス (素のマニフェスト、Helm、Kustomize、OCI) とターゲットのクラスタ/namespace を指し、コントローラが実クラスタをその状態に合わせ込む。

モデルは pull 型である。外部から何かがマニフェストをクラスタに push するのではない。コントローラが Git と実クラスタの両方を watch し、差分を計算してドリフトを報告するか適用する。これは Intuit が、金融のコンプライアンス要件のもとで多数のクラスタを管理するために採用した GitOps アプローチである。

Argo CD は web UI、SSO、RBAC、マルチクラスタの可視化を 1 つの製品に内包するので、別々の部品を組み立てずに導入できる。application-centric であり、扱う単位は `Application` で、UI は各 Application のリソースツリーと同期状態を描画する。

## いつ使うか

- 1 つ以上の Kubernetes クラスタへ、UI と監査証跡付きの宣言的な Git 駆動デリバリをしたい場合。
- 多数のクラスタや namespace を管理し、望ましい状態と実状態を 1 箇所で見たい場合。
- マルチテナンシーが必要な場合: `AppProject` 境界でチームごとに source/destination/RBAC を制限できる。
- クラスタ横断やモノレポ向けに Application を量産したい場合 (ApplicationSet)。

Kubernetes を使わない場合や、UI を内包しないコンポーザブルなコントローラ群を好む場合は向かない。後者には Flux CD のほうが合う。

## このディープダイブの構成

- [歴史](./history): Applatix と Intuit での起源、CNCF への寄贈、卒業。
- [アーキテクチャ](./architecture): マルチコンポーネント構成と reconcile から sync への流れ。
- [採用事例・エコシステム](./adoption): 出典付きの採用組織、GitHub シグナル、代替。
- [内部実装](./internals): 比較レベルの ladder と効くコードパス。
- [はじめに](./getting-started): クラスタへのインストールと最初の Application 同期。

## 出典

1. [The CNCF Announces Argo has Graduated](https://www.cncf.io/announcements/2022/12/06/the-cloud-native-computing-foundation-announces-argo-has-graduated/)
2. [Argo Project Journey Report (CNCF)](https://www.cncf.io/reports/argo-project-journey-report/)
3. [argoproj/argo-cd on GitHub](https://github.com/argoproj/argo-cd)
4. [Why We Created the Argo Project (Akuity)](https://akuity.io/blog/why-we-created-the-argo-project)
5. [Four lessons that took Argo from first commit to GitOps darling (CNCF)](https://www.cncf.io/blog/2022/09/21/four-lessons-that-took-argo-from-first-commit-to-gitops-darling/)
6. [Argo 101: What Is Argo? (Akuity)](https://akuity.io/blog/argo-101-what-is-argo)
7. [argoproj/argo-cd USERS.md](https://github.com/argoproj/argo-cd/blob/master/USERS.md)
8. [Argo CD Getting Started (official docs)](https://argo-cd.readthedocs.io/en/stable/getting_started/)
