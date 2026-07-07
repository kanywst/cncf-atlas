# 採用事例・エコシステム

## 誰が使っているか

`kapp-controller` リポジトリには `ADOPTERS` ファイルが無く、Carvel は確証のある採用組織リストを公開していない。名前を捏造しないため、本ページでは採用組織の表を提示しない。

唯一文書化されている関係は、プロジェクトが VMware Tanzu 内で生まれたことだ。[VMware OSS ブログ](https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/) は、Tanzu 製品の構築と出荷に Carvel ツールが使われていることを述べている。その系譜を超えて、執筆時点で確証ある出典で確認できる第三者の採用企業は得られなかった。

## 採用のシグナル

整備された採用組織リストが無いため、測定可能なシグナルは GitHub のものになる。2026-06-26 に GitHub API で観測した値:

| シグナル | kapp-controller | carvel (umbrella) |
| --- | --- | --- |
| Stars | 315 | 409 |
| Forks | 125 | n/a |
| Open issues | 203 | n/a |
| Contributors | 約 76 (匿名含む) | n/a |
| Created | 2019-11-06 | 2019-04-24 |
| Last push | 2026-06-22 | n/a |

本プロジェクトは CNCF Sandbox プロジェクトで、[CNCF プロジェクトページ](https://www.cncf.io/projects/carvel/) によれば 2022-09-14 に受理された。

## エコシステム

Carvel 自体がツールのエコシステムであり、`kapp-controller` はその接着剤だ。

- **fetch ソース。** `vendir` を通じて、`App` は git・Helm チャート・HTTP アーカイブ・OCI imgpkg バンドルから取り込める。
- **template ツール。** template 段は `ytt`・`kbld`・`helm`・`sops`・`cue` に振り分け、ツールを連結して一方の出力を次に流せる。
- **deploy ツール。** `kapp` はレンダリング済みリソースを 1 つの管理対象アプリケーションとして適用し、ドリフトを検知・是正できる。
- **パッケージング。** `PackageRepository` と `PackageInstall` は、`Package` と `PackageMetadata` を提供する集約 API サーバを背後に持ち、OCI バンドルをインストール可能なバージョン付きパッケージに変える。
- **シークレット。** secretgen-controller がプレースホルダの pull secret を埋め、`App` がプライベートイメージを参照するとき fetch 段はそれを待つ。

## 代替候補

誠実な比較対象は、他の Kubernetes デプロイ・パッケージングツールである。以下の違いはプロジェクトの設計と、外部の [Kubernetes デプロイツール比較](https://nws.netways.de/blog/2024/07/16/comparing-kubernetes-deployment-tools-what-we-got-today) から引いている。

| 代替 | 違い |
| --- | --- |
| Argo CD | UI とアプリケーションダッシュボードを備えた完全な GitOps プラットフォーム。Carvel はクラスタ内調整器を持つが UI を同梱しない、組み合わせ型のツール群。 |
| Flux | git 状態の同期を中心とする GitOps エンジン。Carvel は fetch・template・deploy を別個で差し替え可能な段とツールに分ける。 |
| Helm | パッケージマネージャとテンプレートエンジンを 1 バイナリに収める。Carvel はその関心を `ytt` (templating) と `kapp` (ドリフト検知付き apply) に分け、template 段で Helm チャートも取り込める。 |
| Timoni | Kubernetes 構成を CUE でパッケージ化する。Carvel は template 段がツール非依存で、`cue` は複数の選択肢の 1 つ。 |
| Glasskube | UI とキュレートされたパッケージレジストリを提供し、Flux に依存する。Carvel のパッケージングは自前の `PackageRepository` と `PackageInstall` で駆動する。 |

焦点を絞った組み合わせ可能なツールと、段ごとに明示的な status を持つクラスタ内調整器が欲しいなら Carvel を選ぶ。ダッシュボードと、最初から意見の固まった一気通貫ワークフローが欲しいなら Argo CD のような完全な GitOps プラットフォームを選ぶ。
