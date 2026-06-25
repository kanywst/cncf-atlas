# Operator Framework

> Kubernetes Operator を Go / Ansible / Helm で作り、bundle 化して Operator Lifecycle Manager 経由でインストール・更新まで通すツールキット。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [operator-framework/operator-sdk](https://github.com/operator-framework/operator-sdk)
- **ドキュメント基準コミット**: `c7f6cde` (2026-05-26, master, タグ v1.42.2 の少し後)

## 何をするものか

Operator Framework は Kubernetes Operator を作るためのプロジェクト群。Operator とは、アプリケーションを運用する知識を Kubernetes のカスタムリソースとして表現するコントローラのことだ。中心は 2 本柱で、Operator を書くための Operator SDK と、クラスタへインストール・更新する Operator Lifecycle Manager (OLM) からなる。

このディープダイブは開発者向けフラッグシップである `operator-framework/operator-sdk` をピン留めして読む。SDK はコマンドラインツールだ。独自のスキャフォルディングエンジンは持たず、kubebuilder v4 のプラグインベース CLI をそのまま取り込み、その上に OLM 連携と Ansible / Helm の言語サポートを載せている。SDK 固有の価値は配布・ライフサイクル層、つまり scorecard 検証・bundle 化・OLM 経由のデプロイにある。

対象はアプリケーションを Operator としてパッケージし、コード生成・検証・bundle 化・クラスタへのインストールを 1 つのツールで済ませたいエンジニアだ。OLM 本体 (v0 は `operator-lifecycle-manager`、v1 は `operator-controller`) はその下で、SDK が作ったリソースを reconcile するランタイムとして動く。

## いつ使うか

- Go / Ansible / Helm で Kubernetes Operator を作っており、3 言語を 1 つの CLI で扱いたいとき。
- Operator を OLM bundle としてパッケージし、カタログ経由でインストール・更新まで管理したいとき。
- OperatorHub.io などのカタログへ公開する前に、Operator bundle を scorecard で検証したいとき。
- OLM を使わない素の Go コントローラだけが欲しいなら不要。kubebuilder 単体で足りる。
- カスタムリソースで composition によりクラウドインフラをプロビジョニングしたいなら別。Crossplane がその課題向け。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. Operator Framework project page, CNCF: <https://www.cncf.io/projects/operator-framework/>
2. TOC approves Operator Framework as Incubating Project: <https://www.cncf.io/blog/2020/07/09/toc-approves-operator-framework-as-incubating-project/>
3. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
4. Operator SDK documentation site: <https://sdk.operatorframework.io/>
5. Introducing the Operator Framework, Red Hat / CoreOS: <https://www.redhat.com/en/blog/introducing-operator-framework-building-apps-kubernetes>
6. Java Operator SDK is joining Operator Framework: <https://www.cncf.io/blog/2023/04/18/java-operator-sdk-is-joining-operator-framework/>
