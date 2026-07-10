# 採用事例・エコシステム

## 誰が使っているか

リポジトリに ADOPTERS ファイルはなく、CNCF プロジェクトページも named adopter を列挙していない。そのため本稿は組織名を挙げない。出典なしにどこかの企業が DevSpace を使っていると主張するのは捏造であり、通常の出典 (ADOPTERS ファイル、CNCF ケーススタディ、KubeCon 登壇、named org に紐づくエンジニアリングブログ) のいずれも見つからなかった。

正直に重みを量るべき記録が 1 つある。Ugur Elveren による個人実務者ブログが、大規模チームの Kubernetes 開発環境として KIND・DevSpace・DevContainers を組み合わせて使うことを述べている (Ugur Elveren)。これは個人の利用記録であって組織の採用ではなく、まさにそのものとしてここに出典を付ける。

## 採用のシグナル

named adopter が出典として示せない以上、測定可能なシグナルが重みを担う。2026-07-08 時点、GitHub リポジトリから: スター 5,080、フォーク 412、コントリビュータ約 124 (contributors API の最終ページ)、リリース 312、最新タグは `v6.4.0-rc.1` である (GitHub リポジトリと API)。

CNCF プロジェクトページはこれと異なる、より大きい数値を報告する。集計方法が違う DevStats 由来だからだ。all-time のコントリビュータ約 647、contributing organizations 約 207 (いずれも前年比プラス)、観測 2026-07-08 (CNCF プロジェクトページ)。これらは上記の GitHub コントリビュータ数とは比較できない。DevStats はリポジトリの著者一覧より広い範囲の貢献活動を数える。プロジェクトは OpenSSF Best Practices バッジ (project #6945、README からリンク) も持つ。

## エコシステム

DevSpace はクライアントオンリーで、ユーザーがすでに動かしているバックエンドに寄りかかる。イメージビルドは Docker・BuildKit・kaniko・custom ビルダから選ぶ (`pkg/devspace/build/builder/`)。デプロイは Helm・kubectl マニフェスト・kustomize を駆動する (`pkg/devspace/deploy/`)。ステュワードの Loft Labs は vcluster (仮想クラスタ) も保守しており、開発者ごとに隔離された仮想クラスタを DevSpace で開発するという両者の組み合わせを訴求している (Loft Labs)。`devspace.yaml` の imports は、複数リポジトリ間でベース設定を共有できるようにする機能で、多数のサービスをまたいで開発ワークフローを標準化するというプロジェクトの答えになっている。

## 代替候補

DevSpace は Kubernetes の inner-loop 開発カテゴリで競合する。分かれ目は、ツールがどこまでクラスタ内開発 (Pod 置換 + 双方向同期 + terminal/SSH) に踏み込むか、それともビルド・デプロイのパイプライン標準化に寄るか、である。主要な代替はすべて CNCF の外にある。

| 代替 | 違い |
| --- | --- |
| Skaffold (Google) | ビルド/デプロイ/開発のパイプラインを宣言 config で標準化し、ファイル同期と継続 dev モードを持つ。Pod を置換してクラスタ内で開発するよりパイプライン標準化に寄る |
| Tilt | マルチサービスの開発ループを Starlark の `Tiltfile` で記述し、ライブアップデートと UI が強い。DevSpace はシェルパイプラインと `devspace.yaml` を使う |
| Garden | ビルド・テスト・デプロイをスタックグラフとして整理し、クラスタ内編集より CI・テスト統合に寄る |
| Okteto | 同じくコードを開発コンテナへ同期してクラスタ内開発する、最も直接の一致。Okteto は CLI をマネージド Platform と組み合わせ、DevSpace はクライアントオンリー |
