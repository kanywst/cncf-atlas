# 歴史

## 起源

Clusternet は `clusternet` GitHub organisation 配下のオープンソースプロジェクトとして始まった。リポジトリは 2021-06-07 に作成され、最初のリリース `v0.1.0` は翌 2021-06-08 に公開された ([GitHub Releases](https://api.github.com/repos/clusternet/clusternet/releases)、[リポジトリメタデータ](https://api.github.com/repos/clusternet/clusternet))。メンテナは Tencent、Intel、Purple Mountain Laboratory の所属である ([MAINTAINERS.md](https://github.com/clusternet/clusternet/blob/main/MAINTAINERS.md))。

狙う課題は名前に表れている。「Clusternet」は「Cluster Internet」の略で、インターネット上のどのサイトにも届くように、多数の Kubernetes クラスタをひとつの場所から管理し訪問したい。NAT やファイアウォールの内側にクラスタがあってもである ([README](https://github.com/clusternet/clusternet))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | リポジトリ作成 (2021-06-07)、初回リリース `v0.1.0` 公開 (2021-06-08)。 |
| 2023 | 2023-03-07 に CNCF Sandbox 成熟度で受理 (提出 [cncf/sandbox#10](https://github.com/cncf/sandbox/issues/10))。 |
| 2025 | 直近タグ `v0.18.1` を 2025-08-13 に公開、全 28 リリース。 |

## どう進化したか

コントロールプレーンは 3 コンポーネントから 4 コンポーネントへ拡大した。`v0.15.0` 以降で `clusternet-controller-manager` が独立コンポーネントとして分離され、現在の `clusternet-agent`、`clusternet-scheduler`、`clusternet-controller-manager`、`clusternet-hub` の構成になった ([Introduction](https://clusternet.io/docs/introduction/))。scheduler は Kubernetes scheduler framework を、ノードではなくクラスタをスケジュールするよう移植したもので、`pkg/scheduler` に見える。

Kubernetes バージョンのサポートは各マイナーラインで前進している。README の互換性マトリクスでは `v0.18.x` が Kubernetes `>=v1.30` を要求し、`v0.17.x` は `>=v1.28,<v1.30`、`v0.16.x` は `<v1.28` をサポートする ([README](https://github.com/clusternet/clusternet))。

## 現在地

Clusternet は引き続き CNCF Sandbox プロジェクトである ([CNCF Projects](https://www.cncf.io/projects/clusternet/))。直近タグは `v0.18.1` (2025-08-13) で、本ディープダイブの pin したコミット (`e8b5a0c`、2026-05-10) はそのタグより先の `main` である。2026-06-28 時点でリポジトリは約 1,440 stars、208 forks、約 48 名のコントリビュータを示す ([リポジトリメタデータ](https://api.github.com/repos/clusternet/clusternet)、[contributors](https://api.github.com/repos/clusternet/clusternet/contributors))。CRD と API は利用者向けに `github.com/clusternet/apis` という別モジュールとしても公開されている ([README](https://github.com/clusternet/clusternet))。
