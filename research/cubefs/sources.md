# sources: CubeFS

各出典に番号を振り、recon の `(Sn)` 参照と対応。アクセス日 2026-06-22。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| S1 | repo | cubefs/cubefs README / ADOPTERS / source | <https://github.com/cubefs/cubefs> | 2026-06-22 |
| S2 | repo | CubeFS docs introduction.md | <https://github.com/cubefs/cubefs/blob/master/docs/source/overview/introduction.md> | 2026-06-22 |
| S3 | announcement | CNCF Announces CubeFS Graduation | <https://www.cncf.io/announcements/2025/01/21/cloud-native-computing-foundation-announces-cubefs-graduation/> | 2026-06-22 |
| S4 | project page | CubeFS / CNCF project page | <https://www.cncf.io/projects/cubefs/> | 2026-06-22 |
| S5 | blog | Cloud Native Computing Now Has Its Own File System: CubeFS (The New Stack) | <https://thenewstack.io/cloud-native-computing-now-has-its-own-file-system-cubefs/> | 2026-06-22 |
| S6 | news | CubeFS storage platform graduates from CNCF incubation (SiliconANGLE) | <https://siliconangle.com/2025/01/21/cubefs-storage-platform-graduates-cncf-incubation/> | 2026-06-22 |
| S7 | paper | CFS: A Distributed File System for Large Scale Container Platforms (SIGMOD 2019, DOI 10.1145/3299869.3314046) | <https://dl.acm.org/doi/10.1145/3299869.3314046> | 2026-06-22 |
| S8 | paper preprint | arXiv 1911.03001 (same paper) | <https://arxiv.org/abs/1911.03001> | 2026-06-22 |
| S9 | security | CubeFS self-assessment (CNCF TAG Security) | <https://tag-security.cncf.io/community/assessments/projects/cubefs/self-assessment/> | 2026-06-22 |
| S10 | repo | cubefs/cubefs release v3.5.3 | <https://github.com/cubefs/cubefs/releases/tag/v3.5.3> | 2026-06-22 |
| S11 | news | Cloud-Native Distributed Storage System CubeFS Graduates from CNCF (InfoQ) | <https://www.infoq.com/news/2025/03/cubefs-cncf-graduation/> | 2026-06-22 |

## コード anchor (pin commit `6b2e7926bec66d12fc037f03cd4b2ac680475448`)

- ロール分岐 / 起動: `cmd/cmd.go:71-93`, `cmd/cmd.go:206-239`
- 書き込みパス: `sdk/data/stream/stream_writer.go:355`, `sdk/data/stream/extent_handler.go:231,292,350`
- 複製: `datanode/repl/repl_protocol.go:311-349`, `datanode/wrap_operator.go:912`
- ストレージ書き込み: `datanode/storage/extent_store.go:665`, `datanode/storage/extent.go:499`
- データ構造: `proto/extent_key.go:58`, `metanode/inode.go:78`, `metanode/dentry.go:53`, `metanode/partition.go:484-490`, `metanode/btree.go:31`
