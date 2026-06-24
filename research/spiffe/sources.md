# sources: SPIFFE (go-spiffe)

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日を添える。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | spiffe/go-spiffe (Go library, pinned v2.8.1) | <https://github.com/spiffe/go-spiffe> | 2026-06-24 |
| 2 | announcement | SPIFFE and SPIRE Projects Graduate from CNCF | <https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/> | 2026-06-24 |
| 3 | landing | SPIFFE project page (CNCF) | <https://www.cncf.io/projects/spiffe/> | 2026-06-24 |
| 4 | spec | SPIFFE standards (SPIFFE-ID / SVID / Workload API) | <https://github.com/spiffe/spiffe/tree/main/standards> | 2026-06-24 |
| 5 | site / case-study | spiffe.io and SPIRE case studies | <https://spiffe.io/docs/latest/spire-about/case-studies/> | 2026-06-24 |
| 6 | blog | Uber: Our Journey Adopting SPIFFE/SPIRE at Scale | <https://www.uber.com/en/blog/our-journey-adopting-spiffe-spire/> | 2026-06-24 |
| 7 | repo | spiffe/spire ADOPTERS.md (named adopters) | <https://github.com/spiffe/spire/blob/main/ADOPTERS.md> | 2026-06-24 |
| 8 | docs | go-spiffe v2 Go package reference | <https://pkg.go.dev/github.com/spiffe/go-spiffe/v2> | 2026-06-24 |

## メモ

- stars / forks / contributors の数値は `gh api repos/<repo>` および `repos/<repo>/contributors?per_page=100` で 2026-06-24 取得。contributors は 100 件ページの長さなので「N 以上」。
- ライセンスはローカルの `src/LICENSE`（Apache-2.0 本文）と `gh api .license.spdx_id` の双方で確認済み。
- 採用組織は #2 / #5 / #7 に明記されたもののみ採用。ブログ記事中の定量値（"60% 削減" 等）は一次裏取りできず不採用。
