# 歴史

## 起源

DevSpace は Loft Labs から生まれた。Loft Labs は 2019 年設立で Kubernetes 開発者ツールを作る会社であり、vcluster (仮想クラスタ) の作者でもある。GitHub リポジトリの作成は会社より前の 2018-08-17 で、最初の公開リリース `v1.0.2` は 2018-09-17 に出た (GitHub リポジトリのメタデータと Releases)。当初から狙いは、クラスタをローカルで近似するのではなく、開発者が Kubernetes に対して直接開発できるようにすることだった。README の売り文句は一貫している。ビルド・デプロイ・開発のワークフローを `devspace.yaml` に一度宣言してチームで git 共有し、双方向ファイル同期で、イメージを再ビルドもコンテナを再起動もせずに動作中コンテナをホットリロードする。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2018 | GitHub リポジトリ作成 (2018-08-17)、最初のリリース `v1.0.2` (2018-09-17) |
| 2019 | 商用のステュワードとして Loft Labs 設立 |
| 2022 | v6 リライトで Pipelines と config バージョン `v2beta1` を導入、CNCF Sandbox へ寄贈 (2022-12-13 採択) |
| 2026 | `v6.4.x` ラインが現行、本稿は `8ff6260` (タグ `v6.4.0-rc.1` 近傍) を基準 |

## どう進化したか

プロジェクト史で最大の変化は 2022 年の v6 リライトである。v6 以前は、組み込みのワークフロー (dev/build/deploy/purge) がハードコードされた固定シーケンスで、それを調整する手段は固定ステップの前後に hook を足すことだった。v6 はこれを Pipelines に置き換えた。各ワークフローは、組み込みシェルインタプリタ上で動く POSIX シェルスクリプトになり、DevSpace 固有のコマンド (`build_images`・`create_deployments`・`start_dev` など) がそのスクリプト内で組み込みコマンドとして使える。ユーザーは固定ワークフローを hook で回避する代わりに、`devspace.yaml` でワークフロー全体を丸ごと上書きできるようになった。同じリリースで config スキーマを `v2beta1` に移し、imports (別の `devspace.yaml` から設定を取り込む) と注入型の SSH server も追加した (DevSpace 6 announcement、Pipelines docs、v6.0.0 リリースノート)。

もう 1 つの転換はガバナンスである。2022-12-13、CNCF TOC は DevSpace を Sandbox プロジェクトとして採択した。寄贈元は Loft Labs である。同社はこの動きを「主要コントリビュータとしての役割は保ちつつ、ガバナンスを Linux Foundation と広いコミュニティに移す」ものと位置づけ、「Kubernetes 開発者ツールは数十あるが、当時 CNCF にホストされたものはほぼ皆無だった」という文脈を挙げた (The New Stack、Loft Labs ブログ、BusinessWire、ComputerWeekly)。この移行の目に見える痕跡が、リポジトリと Go module path のズレである。コードは現在 `devspace-sh/devspace` にあるが、`go.mod` は依存する全 import を壊さないために module を `github.com/loft-sh/devspace` のまま宣言している (`go.mod:1`)。

## 現在地

DevSpace は活発な CNCF Sandbox プロジェクトである。基準コミット時点で 312 リリースを重ね、`v6.4.x` ラインが現行、`v6.4.0-rc.1` が最新タグである (GitHub Releases)。固定コミット `8ff6260` はそのタグから 12 コミット先にある (`git describe` は `v6.4.0-rc.1-12-g8ff62607` を報告)。Loft Labs が引き続き主要ステュワードであり、プロジェクトは v6 の Pipelines モデルを中核設計として維持している。[採用事例](./adoption) のページでは、組織名の採用事例が薄い点を率直に扱う。ADOPTERS ファイルはなく、CNCF プロジェクトページも列挙していないため、正直なシグナルは企業の一覧ではなく GitHub と DevStats の数値である。
