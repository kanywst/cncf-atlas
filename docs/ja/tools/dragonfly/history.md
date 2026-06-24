# 歴史

## 起源

Dragonfly は 2015 年に Alibaba Cloud 社内で始まった。きっかけは規模だ。日次の配布数が数万に達し、アプリケーション数が 1 万を超え、それに伴って中央ソースから大きなファイルを引く際の失敗率が上がった。最初のバージョンは、オリジンと消費者の間にピア共有を挟むイメージ・ファイル高速化システムだった ([出典 7](https://www.alibabacloud.com/blog/p2p-based-intelligent-image-acceleration-system-of-dragonfly_599645))。

プロジェクトは 2017 年末に OSS 化され、Kubernetes とコンテナイメージ配布に転用された。その頃 Alibaba は社内で月あたり約 3.4 PB を配布していたと報じられている ([出典 6](https://thenewstack.io/dragonfly-brings-peer-to-peer-image-sharing-to-kubernetes/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | 大きなファイル配布の失敗を減らすため Alibaba Cloud 社内で誕生 ([出典 7](https://www.alibabacloud.com/blog/p2p-based-intelligent-image-acceleration-system-of-dragonfly_599645)) |
| 2017 | OSS 化され、Kubernetes のイメージ共有に適用 ([出典 6](https://thenewstack.io/dragonfly-brings-peer-to-peer-image-sharing-to-kubernetes/)) |
| 2018 | 2018-11-13 に CNCF Sandbox に受理 ([出典 3](https://www.cncf.io/projects/dragonfly/)) |
| 2020 | 1.0 で Go へ全面リライト、2020-04-09 に CNCF Incubating へ昇格 ([出典 4](https://www.cncf.io/blog/2020/04/09/toc-votes-to-move-dragonfly-into-cncf-incubator/)) |
| 2025 | 2025-10-28 に CNCF を Graduated ([出典 5](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/)) |
| 2026 | `hf://` / `modelscope://` ネイティブ対応で AI モデル配布へ拡張 ([出典 8](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/)) |

## どう進化したか

最初の大きな転換は 1.0 の Go リライトだ。CNCF は 2020 年 4 月に Dragonfly を incubator へ移す投票でこれを評価した ([出典 4](https://www.cncf.io/blog/2020/04/09/toc-votes-to-move-dragonfly-into-cncf-incubator/))。

2 つめの転換は 2.0 のアーキテクチャだ。当初の 1.x 設計は、固定サイズのチャンクを中央制御する supernode を中心としていた。2.0 では役割を Manager・Scheduler・Seed Peer・Peer の 4 つに分割し、ピアグラフの構築を scheduler に移した。旧 `alibaba/Dragonfly` リポジトリはアーカイブされ、作業は `Dragonfly2`、現在の `dragonflyoss/dragonfly` へ移った ([出典 7](https://www.alibabacloud.com/blog/p2p-based-intelligent-image-acceleration-system-of-dragonfly_599645))。

直近の転換は AI/ML への展開だ。Dragonfly は Hugging Face と ModelScope のソースをネイティブに扱えるようにし、TLV ワイヤ形式を使う Vortex という Rust 製転送プロトコルを導入した。大規模なモデル重み配布を狙ったものだ ([出典 8](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/))。

## 現在地

Dragonfly は 2025-10-28 に CNCF を卒業した。卒業時点でプロジェクトは 130 社・271 名による約 2.6 万コミットの貢献を報告している ([出典 5](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/))。ドキュメント基準コミット時点の最新安定タグは `v2.4.3` (2026-03-11)、リリース候補系列には `v2.4.4-rc.3` (2026-06-09) がある。第三者によるセキュリティ監査は Trail of Bits が 2023 年に実施し、リポジトリの `docs/security/` 配下に公開されている ([出典 1](https://github.com/dragonflyoss/dragonfly))。
