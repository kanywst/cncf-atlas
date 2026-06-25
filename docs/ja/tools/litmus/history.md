# 歴史

## 起源

Litmus は 2017 年後半、MayaData 社内で OpenEBS コミュニティから派生する形で始まった。Kubernetes のストレージやワークロードに対して単純な chaos job を流すのがルーツである。GitHub リポジトリの作成日は 2017-03-15。CNCF Q4 2025 update が、OpenEBS をルーツに独立したカオスエンジニアリングプロジェクトへ至る系譜をたどっている。

MayaData がプロジェクトを CNCF に寄贈し、Litmus は 2020-06-25 に Sandbox に受理された。Sandbox への申請は cncf/toc issue #390 として提出された。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | MayaData 社内で OpenEBS コミュニティから派生して開始。リポジトリ作成は 2017-03-15 |
| 2020 | CNCF Sandbox に受理 (2020-06-25) |
| 2021 | MayaData から ChaosNative が分社、Litmus 専任の企業に (2021-02-10) |
| 2022 | CNCF Incubating に昇格 (2022-01-11)、本番採用 25+ 組織 |
| 2023 | KubeCon Chicago で Litmus 3.0 GA。ChaosCenter の全面リアーキテクチャ |
| 2026 | リリース 3.30.0 (2026-06-17)。本ディープダイブが基準とするコミット |

## どう進化したか

最大の商業的転換は 2021-02-10 で、MayaData から ChaosNative が分社し、Litmus の採用拡大に専念する企業となった (CEO は Uma Mukkara)。ChaosNative はその後 Harness に買収され、現在の UI は Harness の UICore library を基盤としている。

最大の技術的転換は Litmus 3.0 で、2023 年 11 月の KubeCon Chicago で GA となった。ChaosCenter の全面リアーキテクチャで、UI 刷新、Environments、YAML とビジュアル編集を行う Monaco ベースの Chaos Studio エディタ、再利用可能な resilience probe、MongoDB への標準化、バックエンド API のリファクタを含む。3.0 では中核概念の名称も変わり、Chaos Agents は Chaos Infrastructures に、Workflows は Chaos Experiments に、旧 Experiments は Chaos Faults になった。3.x は 2.x と非互換である。

## 現在地

minor リリース (3.x.0) は毎月 15 日にリリースされ、patch は需要ベースで出る。ここで基準としているコミットは tag 3.30.0 (2026-06-17 リリース) である。Litmus は引き続き CNCF Incubating プロジェクトである。障害注入のコードと実験バンドルは別リポジトリ (`litmuschaos/litmus-go` と `litmuschaos/chaos-charts`) で保守され、本リポジトリは ChaosCenter コントロールプレーンを担う。
