# Devfile

> Devfile はクラウド開発ワークスペースを宣言する YAML 標準である。仕様は `devfile/api` リポジトリの Go 型として定義され、他の成果物 (CRD・JSON スキーマ・TypeScript モデル) はすべてそこから生成される。

- **カテゴリ**: Developer Tools
- **CNCF 成熟度**: Sandbox (2022-01-11 受理)
- **言語**: Go (`go 1.24`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [devfile/api](https://github.com/devfile/api)
- **ドキュメント基準コミット**: `368ea4e` (タグ `v2.3.0` 近傍。`git describe` = `v2.3.0-17-g368ea4e`)

## 何をするものか

devfile とは、開発環境を記述する 1 つの YAML ファイルである。開発者が作業するコンテナ、ソースの取得元、そしてコードをビルド・実行・デバッグするコマンドを書く。フォーマットを理解するツールがこのファイルを読み、そこから再現可能なワークスペースを立ち上げる。狙いは、環境定義をコードのそばに置き、プロジェクトを開いた誰もが同じ構成を得られるようにすることである。

`devfile/api` リポジトリは仕様そのものであって、開発者が直接実行するツールではない。フォーマットは `pkg/apis/workspaces/v1alpha2/` 以下の Go 型として定義されており、README はこの Go ソースこそが起点であり、Kubernetes の CRD・JSON スキーマ・npm の TypeScript モデルはすべてそこから生成されると明言している (`README.md:11-24`)。devfile 2.x フォーマットは、このリポジトリが同時に定義する `DevWorkspace` という Kubernetes API のサブセットであり、ファイルフォーマットとクラスタリソースは 1 組の型を共有している。

型定義の隣に、`devfile/api` は小さなランタイムライブラリを同梱している。親 devfile や plugin を override として適用し、継承した内容をマージし、discriminated union を正規化し、devfile 内部の参照を検証するユーティリティである。パーサ本体は含まない。`devfile.yaml` を読み、`parent` を解決し、レジストリからスタックを取得する処理は別リポジトリ `devfile/library` にある。このページと以降のページは `devfile/api` のコミット `368ea4e` を読んでいる。

## いつ使うか

- クラウド/リモート開発プラットフォーム (Eclipse Che、OpenShift Dev Spaces、あるいは odo のような CLI が動かすもの) を運用しており、プロジェクトがワークスペースを宣言するための標準的でツール中立な方法が欲しいとき。
- ワークスペース定義をリポジトリ内にコードとして置き、オンボーディングを wiki ページやローカルのセットアップスクリプトに依存させたくないとき。
- ツールを作っており、フォーマットを Go から (API 型と override/merge/validate ヘルパ) あるいは TypeScript から (スキーマから生成される `@devfile/api` npm パッケージ) 消費したいとき。
- ローカルのコンテナをエディタで開きたいだけなら、あまり向かない。その用途は Development Containers (`devcontainer.json`) が対象で、VS Code と GitHub Codespaces が読むのはこちらである。
- パッケージやシェル環境の管理ツールではない。Nix・devbox・flox はツールチェーンを別の層で再現するもので、クラスタ上の IDE ワークスペースをオーケストレーションはしない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと override の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): devfile を書き、override ライブラリを動かす。

## 出典

1. [devfile/api README](https://github.com/devfile/api/blob/main/README.md) (参照 2026-07-08)
2. [devfile/api ソース (pinned commit 368ea4e)](https://github.com/devfile/api/tree/368ea4e93a4c9b772240eefc80b2ac24e42c5ee2) (参照 2026-07-08)
3. [Devfile プロジェクトページ (CNCF)](https://www.cncf.io/projects/devfile/) (参照 2026-07-08)
4. [devfile.io ドキュメント](https://devfile.io/docs/2.3.0/what-is-a-devfile) (参照 2026-07-08)
5. [Kubernetes union types KEP](https://github.com/kubernetes/enhancements/blob/master/keps/sig-api-machinery/20190325-unions.md) (参照 2026-07-08)
6. [Amazon CodeCatalyst devfile ドキュメント](https://docs.aws.amazon.com/codecatalyst/latest/userguide/devenvironment-devfile.html) (参照 2026-07-08)
7. [Red Hat OpenShift Dev Spaces](https://developers.redhat.com/products/openshift-dev-spaces/overview) (参照 2026-07-08)
8. [GitHub REST API repos/devfile/api](https://api.github.com/repos/devfile/api) (参照 2026-07-08)
