# sources: TiKV

各出典に番号を振り、`recon.md` の `[n]` と対応。アクセス日は 2026-06-22 から 2026-06-23。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | announcement | Cloud Native Computing Foundation announces TiKV Graduation (CNCF) | <https://www.cncf.io/announcements/2020/09/02/cloud-native-computing-foundation-announces-tikv-graduation/> | 2026-06-23 |
| 2 | blog | Celebrating TiKV's CNCF Graduation (TiKV blog) | <https://tikv.org/blog/graduation-announcement/> | 2026-06-23 |
| 3 | project page | TiKV project (CNCF) 成熟度・受理日 | <https://www.cncf.io/projects/tikv/> | 2026-06-23 |
| 4 | repo | tikv/tikv README (起源・特徴・ガバナンス) | <https://github.com/tikv/tikv> | 2026-06-23 |
| 5 | blog | TOC votes to move TiKV into CNCF Incubator (CNCF) | <https://www.cncf.io/blog/2019/05/21/toc-votes-to-move-tikv-into-cncf-incubator/> | 2026-06-23 |
| 6 | blog | CNCF TOC votes to move TiKV to Incubating Status (TiKV blog) | <https://tikv.org/blog/cncf-incubating/> | 2026-06-23 |
| 7 | adopters | TiKV Adopters (公式) | <https://tikv.org/adopters/> | 2026-06-23 |
| 8 | case-study | Case study: TiKV in JD Cloud (CNCF) | <https://www.cncf.io/blog/2019/11/26/case-study-tikv-in-jd-cloud/> | 2026-06-23 |
| 9 | repo / API | tikv/tikv GitHub stats (stars/forks/contributors/releases) | <https://github.com/tikv/tikv> | 2026-06-23 |
| 10 | docs | TiKV Documentation / Deep Dive | <https://tikv.org/docs/latest/concepts/overview/> | 2026-06-23 |
| 11 | governance | TiKV Governance (tikv/community) | <https://github.com/tikv/community/blob/master/GOVERNANCE.md> | 2026-06-23 |

## 補足メモ

- ライセンスは clone した `LICENSE` (Apache License 2.0 全文) と `Cargo.toml:6` の `license = "Apache-2.0"` で直接検証。出典 URL ではなくソース内検証。
- pinned commit `2ce11742650d4dd1c87070a82f9ae816ec94d61c` の `src/` 内コードは `file:line` を直接確認。Web 出典には依存しない。
- Incubating 昇格日は出典で揺れ (CNCF は April 2019、TiKV blog は May 2019、TOC 投票公表は 2019-05-21)。recon に明記済み。
