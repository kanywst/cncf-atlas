# sources: Buildpacks (Cloud Native Buildpacks)

recon.md の「出典 N」と対応。アクセス日はすべて 2026-06-24。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | blog | TOC Approves Cloud Native Buildpacks from Sandbox to Incubation (CNCF) | <https://www.cncf.io/blog/2020/11/18/toc-approves-cloud-native-buildpacks-from-sandbox-to-incubation/> | 2026-06-24 |
| 2 | docs | Cloud Native Buildpacks 公式サイト | <https://buildpacks.io/> | 2026-06-24 |
| 3 | blog | Buildpacks Go Cloud Native, Turning Source Code into Docker Images (Heroku) | <https://www.heroku.com/blog/buildpacks-go-cloud-native/> | 2026-06-24 |
| 4 | blog | Standardizing Heroku Buildpacks with CNCF (Salesforce Engineering) | <https://engineering.salesforce.com/standardizing-heroku-buildpacks-with-cncf-a43525f6c441/> | 2026-06-24 |
| 5 | blog | Planting New Platform Roots in Cloud Native with Fir (Heroku) | <https://www.heroku.com/blog/planting-new-platform-roots-cloud-native-fir/> | 2026-06-24 |
| 6 | blog | How Maintaining Cloud Native Buildpacks Powers Platforms Like Heroku | <https://www.heroku.com/blog/how-maintaining-cloud-native-buildpacks-powers-platforms-like-heroku/> | 2026-06-24 |
| 7 | docs | App Platform Buildpack References (DigitalOcean) | <https://docs.digitalocean.com/products/app-platform/reference/buildpacks/> | 2026-06-24 |
| 8 | docs | Getting Started / How to Use Paketo Builders (Paketo Buildpacks) | <https://paketo.io/docs/howto/builders/> | 2026-06-24 |
| 9 | repo | buildpacks/pack (一次実装 CLI) | <https://github.com/buildpacks/pack> | 2026-06-24 |
| 10 | repo | buildpacks/lifecycle (lifecycle 参照実装) | <https://github.com/buildpacks/lifecycle> | 2026-06-24 |
| 11 | repo | buildpacks/spec (Buildpack / Platform API 仕様) | <https://github.com/buildpacks/spec> | 2026-06-24 |
| 12 | docs | Basic App チュートリアル (buildpacks.io docs) | <https://buildpacks.io/docs/for-app-developers/tutorials/basic-app/> | 2026-06-24 |
| 13 | repo | buildpacks/rfcs (設計・ガバナンスプロセス) | <https://github.com/buildpacks/rfcs> | 2026-06-24 |

## 補足メモ

- pin commit `2df3b8c3b0955ea41aec010783ddfe70cbc17c56` (tag `v0.40.7`) の `LICENSE` で Apache-2.0 を直接確認。`gh api /repos/buildpacks/pack` の `license.spdx_id` も `Apache-2.0`。
- stars/forks/issues/contributors の数値は `gh api` (2026-06-24) で取得。stars 2,939 / forks 345 / open issues 169 / contributors 約 164 (anon 含む last page)。出典 9。
- ガバナンス: CNCF Incubating、設計変更は RFC プロセス (`buildpacks/rfcs`)。出典 1, 13。
