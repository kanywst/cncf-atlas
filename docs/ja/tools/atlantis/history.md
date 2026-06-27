# 歴史

## 起源

Atlantis は Hootsuite 社内で生まれた。Anubhav Mishra が初期の社内ツールを作り、Luke Kysow とともに Go で書き直し、2 人がそれを `hootsuite/atlantis` として OSS 化した。解こうとした課題はコラボレーションだった。チームでどう `terraform plan` と `terraform apply` を協調運用するか、そして開発者に直接の本番アクセスを与えずに安全にインフラ変更を apply させるにはどうするか。創業時の記事「Introducing Atlantis」は「もともと 2017 年 9 月 11 日に書かれた」と注記され、公開は 2018 年 2 月 27 日である (出典 2)。

Hootsuite 起源はソースそのものに残っている。`main.go` には今も `// Copyright 2017 HootSuite Media Inc.` の行があり (`main.go:1`)、次行に SPDX (Software Package Data Exchange) 識別子 `Apache-2.0` が付く (`main.go:2`)。

Atlantis が広めた考え方が「apply before merge」だ。apply は Pull Request 上で、変更がまだレビュー中でオープンなうちに、実インフラに対して走る。state はユーザ自身の Terraform backend にあり、Atlantis はロックと plan メタデータのみを持つ。この分担は今日の設計でも中核のままである。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | Anubhav Mishra と Luke Kysow が Hootsuite でツールを作り、Go で書き直す (出典 2)。 |
| 2018 | 公開告知記事; GitHub リポジトリは 2018-02-06 作成、プロジェクトは `hootsuite/atlantis` から `runatlantis/atlantis` org へ移管 (出典 2, 3)。 |
| 2024 | 2024 年上半期コホートとして 2024-06-18 に CNCF Sandbox 受諾 (出典 4, 6)。 |
| 2026 | リリース `v0.44.0` を 2026-06-10 公開; 本 deep-dive はその直後の main を pin (出典 15)。 |

## どう進化したか

最も目立つガバナンスの転換は、企業 namespace からの脱出だった。2018 年にプロジェクトは `hootsuite/atlantis` から `runatlantis/atlantis` という GitHub org へ移され、単一の雇用主の下ではなく中立的な置き場に移った (出典 3)。元の 2 人の作者はその後 HashiCorp に参加し、CNCF 寄贈の時点で Terraform チームの支援が言及されている (出典 4)。

CNCF への寄贈は機能ではなくガバナンスが目的だった。プロジェクトは一時的に静かな時期を経ており、CNCF への寄贈はそのガバナンスと継続性を強化する手段だった。Sandbox 申請は cncf/sandbox#60 として提出され、TAG App Delivery レビューが cncf/tag-app-delivery#474 として走り、2024 年半ばのコミュニティ投票が基準を通過してから 2024-06-18 に受諾された (出典 4, 5, 6)。

## 現在地

Atlantis は定期的にタグ付きリリースを出しており、`v0.44.0` は 2026-06-10 に出た (出典 15)。CNCF Sandbox プロジェクトであり、`MAINTAINERS.md` に列挙されたグループが維持し、メンテナは 1 社ではなく複数社から集まっている (出典 14)。スコープは意図的に狭いまま保たれている。Terraform と OpenTofu のための Pull Request 自動化レイヤであり続け、state・module・ポリシーはユーザ自身の backend とツールに委ねている。
