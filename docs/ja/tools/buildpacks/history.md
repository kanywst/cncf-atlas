# 歴史

## 起源

Buildpacks は 2011 年に Heroku のプラットフォームの仕組みとして生まれた。アプリの言語を検出し、依存を取得し、実行可能な成果物をビルドする。すべて Dockerfile なしで行う。2012 年に Heroku は Buildpack API を OSS 化し、Heroku 固有の要素を取り除いた。これにより他のプラットフォームがこの考え方を採用できるようになった。Cloud Foundry と Pivotal、Google App Engine、GitLab、Deis、Dokku がそれぞれ独自の派生を育てた。その結果 API が分裂し、同じ言語の buildpack をプラットフォームごとに二重メンテする必要が生じた。

Cloud Native Buildpacks (CNB) は、この分裂したエコシステムを単一の platform-to-buildpack 契約で再統一するため、2018 年 1 月に Pivotal と Heroku の共同プロジェクトとして立ち上がった。旧 v2 buildpack と違い、CNB はモダンなコンテナ標準の上に作られた。OCI イメージフォーマット、レジストリの cross-repo blob mount、レイヤ rebase である。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2011 | Heroku が PaaS 向けに buildpack を発明。言語自動検出 + ビルド、Dockerfile 不要。 |
| 2012 | Heroku が Buildpack API を OSS 化。他プラットフォームが派生し、エコシステムが分裂。 |
| 2018-01 | Pivotal と Heroku が CNB プロジェクトを立ち上げ、OCI 上で契約を再統一。 |
| 2018-10 | CNB が Apache-2.0 で CNCF Sandbox に受理。 |
| 2020-11 | CNCF TOC が Sandbox から Incubation への昇格を承認。 |
| 2024-2025 | Heroku が次世代基盤 "Fir" で CNB を全面採用。 |

## どう進化したか

旧来の Heroku buildpack に対する CNB の決定的な選択は OCI を対象にしたことだ。イメージは OCI レイヤとして組み立てられ、rebase で run イメージをアプリの下から差し替えられ、レジストリは cross-repo mount で共有 blob を移動できる。これが buildpack を単一の PaaS に縛られず、プラットフォーム間で移植可能にした。

ガバナンスも技術とともに移った。2020-11-18 に CNCF TOC が Incubation を承認した際は、15 を超える本番ユーザ、複数組織からの committer、確立されたオープンガバナンスを承認理由に挙げた。設計変更は現在 `buildpacks/rfcs` リポジトリの公開 RFC プロセスを通る。

## 現状

CNB は CNCF Incubating のままで、Graduated には到達していない。`pack` CLI が主要なプラットフォーム実装であり、`buildpacks/lifecycle` が参照ビルドエンジン、`buildpacks/spec` が契約である。最近の方向性は Heroku の "Fir" 世代が起点で、Fir 世代は全アプリでデフォルトに CNB を採用し、旧 Cedar 世代は classic buildpack を維持する。

## 出典

1. [TOC Approves Cloud Native Buildpacks from Sandbox to Incubation (CNCF)](https://www.cncf.io/blog/2020/11/18/toc-approves-cloud-native-buildpacks-from-sandbox-to-incubation/)
2. [Buildpacks Go Cloud Native, Turning Source Code into Docker Images (Heroku)](https://www.heroku.com/blog/buildpacks-go-cloud-native/)
3. [Standardizing Heroku Buildpacks with CNCF (Salesforce Engineering)](https://engineering.salesforce.com/standardizing-heroku-buildpacks-with-cncf-a43525f6c441/)
4. [Planting New Platform Roots in Cloud Native with Fir (Heroku)](https://www.heroku.com/blog/planting-new-platform-roots-cloud-native-fir/)
5. [How Maintaining Cloud Native Buildpacks Powers Platforms Like Heroku](https://www.heroku.com/blog/how-maintaining-cloud-native-buildpacks-powers-platforms-like-heroku/)
6. [buildpacks/rfcs リポジトリ](https://github.com/buildpacks/rfcs)
