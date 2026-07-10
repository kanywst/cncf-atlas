# 採用事例・エコシステム

## 誰が使っているか

devfile は仕様なので、採用の重心は 1 リポジトリの利用者ではなく、それを実装するツール側にある。`devfile/api` に `ADOPTERS` ファイルはない。以下の実装者にはそれぞれ出典を付ける。仕様の一部だけを実装するプロジェクトはその旨を注記する。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Amazon (CodeCatalyst) | Dev Environment を devfile で構成。CodeCatalyst は新規受付を終了し、既存利用は AWS 告知に従い継続 | [AWS CodeCatalyst devfile ドキュメント](https://docs.aws.amazon.com/codecatalyst/latest/userguide/devenvironment-devfile.html) |
| Red Hat (OpenShift Dev Spaces / Eclipse Che) | 開発環境を devfile フォーマットで定義。DevWorkspace オペレータが Che のランタイム | [OpenShift Dev Spaces 概要](https://developers.redhat.com/products/openshift-dev-spaces/overview) |
| Red Hat (odo) | ワークフローが devfile で駆動される CLI | [devfile.io ドキュメント](https://devfile.io/docs/2.3.0/what-is-a-devfile) |
| JetBrains (Space Cloud Dev) | Git リポジトリに紐づくリモート開発環境を devfile からセットアップ | [devfile.io ドキュメント](https://devfile.io/docs/2.3.0/what-is-a-devfile) |

devfile.io サイトは貢献組織として AWS・IBM・JetBrains・Red Hat を挙げており、`MAINTAINERS.md` のメンテナ所属も Red Hat と AWS である。

## 採用のシグナル

devfile は仕様なので、`devfile/api` の star 数は到達範囲を過小評価する。重みは 1 リポジトリの人気ではなく実装側 (Che・Dev Spaces・CodeCatalyst・odo) にある。2026-07-08 時点 (GitHub REST API) で `devfile/api` は star 340、fork 77、open issue 26、ページネートした contributors 一覧で数えると約 30 名。CNCF プロジェクトページは貢献組織 46 と表記し、同観測日で前年比 30% 減であった。リリースはおおむね年次で、`v2.3.0` (2024-06) がツリー現行のスキーマバージョンである (`schemas/latest/jsonSchemaVersion.txt`)。

## エコシステム

devfile のエコシステムは `devfile` GitHub org に分散しており、関心事ごとに 1 リポジトリである。

- `devfile/library`: `devfile.yaml` を読み、`parent` を解決し、レジストリから取得する Go パーサ。`devfile/api` が意図的に含まないのがこれ。
- `devfile/registry` と `devfile/registry-support`: 再利用可能な devfile スタックとサンプルを公開するレジストリ。
- `devfile/devworkspace-operator`: `DevWorkspace` を実行中の環境へ reconcile する Kubernetes コントローラ。Eclipse Che の下回り。
- `devfile/alizer`: プロジェクトの言語とフレームワークを検出し devfile を提案するソース解析。
- `@devfile/api`: JSON スキーマから生成される npm の TypeScript モデル。JavaScript / TypeScript ツール向け。

## 代替候補

devfile が対象とするのは、Kubernetes ネイティブなリソースとして定義するリモート/クラウド開発ワークスペースである。主要な代替は重なりつつも出発点が異なる。

| 代替 | 違い |
| --- | --- |
| Development Containers (`devcontainer.json`) | VS Code と GitHub Codespaces の事実上の標準。サーバ上で reconcile される Kubernetes の `DevWorkspace` ではなく、ローカルや Codespaces で開くコンテナを記述する |
| Gitpod `.gitpod.yml` | Gitpod 独自のワークスペース定義。ツール中立な CRD ではなく Gitpod に紐づく |
| DevPod (Loft) | `devcontainer.json` からプロバイダ非依存で環境を立てる。devfile ではなく devcontainer フォーマットが基盤 |
| Nix / devbox / flox | パッケージ/シェル層の宣言的環境。ツールチェーンを再現するが、クラスタ上の IDE ワークスペースはオーケストレーションしない |
