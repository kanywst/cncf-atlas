# sources: k8gb

`recon.md` の `[n]` と対応する。コードの `file:line` はすべて pinned commit `34b4535c7642f38876d409ae8f1ba8fb9557c60e` に対するもので、ここには挙げない。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | announcement | K8gb becomes a CNCF incubating project (CNCF) | <https://www.cncf.io/announcements/2026/08/05/k8gb-becomes-a-cncf-incubating-project/> | 2026-09-07 |
| 2 | repo | cncf/landscape `landscape.yml` (`accepted` 2021-03-30 / `incubating` 2026-07-18 の一次データ) | <https://github.com/cncf/landscape/blob/master/landscape.yml> | 2026-09-07 |
| 3 | case-study | Millennium bcp (CNCF case study) | <https://www.cncf.io/case-studies/millennium-bcp/> | 2026-09-07 |
| 4 | project | k8gb (CNCF project page) | <https://www.cncf.io/projects/k8gb/> | 2026-09-07 |
| 5 | docs | k8gb documentation | <https://www.k8gb.io/> | 2026-09-07 |
| 6 | devstats | k8gb DevStats | <https://k8gb.devstats.cncf.io/> | 2026-09-07 |
| 7 | monitor | CLOMonitor: K8GB | <https://clomonitor.io/projects/cncf/k8gb> | 2026-09-07 |

## 一次データとして repo から直接取ったもの

出典 URL ではなく pinned clone から引いた事実。write 側では「repo より」と書けばよい。

- `ADOPTERS.md` の 7 組織 (Absa, Millennium bcp, Eficode, Open Systems, PagBank, Darede, envio.dev) と各社の用途
- 初コミット `d834431a` 2019-11-27 (Donovan Muller) と最初の 3 コミットが設計文書であること
- タグの日付 (`v0.8.0` 2021-05-13、`v0.14.0` 2024-09-16、`v0.20.0` 2026-07-03、`v1.0.0` 2026-09-02)
- ADR-0002 (2026-03-09、API グループの `k8gb.absa.oss` → `k8gb.io` 移行と検討された 3 案)
- Helm chart の CoreDNS イメージ `registry.k8gb.io/k8gb-io/k8s_crd` (`chart/k8gb/values.yaml:119`)
- 依存バージョン (`go.mod`: controller-runtime v0.24.1 / external-dns v0.21.0 / miekg/dns v1.1.72)
- DNS プロバイダ別の導入手順 (`docs/deploy_route53.md` ほか `docs/deploy_*.md`)
