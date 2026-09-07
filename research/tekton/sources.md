# sources: Tekton

`recon.md` の `[n]` と対応する。コードの `file:line` はすべて pinned commit `9dec5e4b1530cb040eb2edbfcdc1f4a0985ce25f` に対するもので、ここには挙げない。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | blog | Tekton Becomes a CNCF Incubating Project (CNCF) | <https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/> | 2026-09-07 |
| 2 | blog | A Year of Tekton (CD Foundation) | <https://cd.foundation/blog/2019/11/15/a-year-of-tekton/> | 2026-09-07 |
| 3 | blog | Introducing the Continuous Delivery Foundation, the new home for Tekton, Jenkins, Jenkins X and Spinnaker (Google Open Source Blog) | <https://opensource.googleblog.com/2019/03/introducing-continuous-delivery-foundation.html> | 2026-09-07 |
| 4 | repo | CD Foundation FAQ | <https://github.com/cdfoundation/faq> | 2026-09-07 |
| 5 | blog | The Tekton Pipelines Beta release (Google Open Source Blog) | <https://opensource.googleblog.com/2020/05/the-tekton-pipelines-beta-release.html> | 2026-09-07 |
| 6 | blog | Tekton Graduation (tekton.dev) | <https://tekton.dev/blog/2022/10/26/tekton-graduation/> | 2026-09-07 |
| 7 | issue | [Incubation] Tekton Incubation Application (cncf/toc#1310) | <https://github.com/cncf/toc/issues/1310> | 2026-09-07 |
| 8 | announcement | Tekton Moves to the CNCF (CD Foundation) | <https://cd.foundation/announcement/2026/03/24/tekton-moves-to-the-cncf/> | 2026-09-07 |
| 9 | blog | Tekton joins the CNCF: a new era for cloud native CI/CD (Red Hat Developer) | <https://developers.redhat.com/articles/2026/05/11/tekton-joins-cncf-new-era-cloud-native-cicd> | 2026-09-07 |
| 10 | blog | Tekton Joins the CNCF as an Incubating Project (tekton.dev) | <https://tekton.dev/blog/2026/03/25/tekton-joins-the-cncf-as-an-incubating-project/> | 2026-09-07 |
| 11 | repo | cncf/landscape `landscape.yml` (成熟度と受け入れ日の一次データ) | <https://github.com/cncf/landscape/blob/master/landscape.yml> | 2026-09-07 |
| 12 | docs | Tekton documentation | <https://tekton.dev/docs/> | 2026-09-07 |
| 13 | devstats | Tekton DevStats | <https://tekton.devstats.cncf.io/> | 2026-09-07 |

## 一次データとして repo から直接取ったもの

出典 URL ではなく pinned clone から引いた事実。write 側で「repo の git 履歴より」と書けばよい。

- タグの日付 (`v0.1.0` 2019-02-20 から `v1.16.0` 2026-08-21 まで)
- 初コミット `301b41380` 2018-08-29 と `Add pipeline strawman example` 2018-08-31
- v1 API 型の追加日 (`pkg/apis/pipeline/v1/task_types.go` 2022-06-29)
- PipelineResources 削除コミット (`6ba1c48ed`, `81876e6bc`, `3ca844439`)
- リリース方針と LTS (`releases.md`)
- Kubernetes の最低バージョン推移 (`README.md`)
