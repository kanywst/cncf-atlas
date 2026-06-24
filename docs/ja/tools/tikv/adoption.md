# 採用事例・エコシステム

## 誰が使っているか

以下の組織は、出典を示せるものに限る。公式 adopters ページ [7] または CNCF ケーススタディ [8] による。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| JD Cloud & AI | オブジェクトストレージ (OSS) のメタデータを MySQL から TiKV へ移行。1,000 億〜1 兆行を見込む | [8](https://www.cncf.io/blog/2019/11/26/case-study-tikv-in-jd-cloud/) |
| Zhihu | TiDB と Zetta Table Store を TiKV 上に構築し、MySQL のスケーラビリティ限界を解消 | [7](https://tikv.org/adopters/) |
| U-Next | 2019-12 から ARM プラットフォーム上で本番運用。COVID-19 期のトラフィック増に対応 | [1](https://www.cncf.io/announcements/2020/09/02/cloud-native-computing-foundation-announces-tikv-graduation/) |
| Shopee | TiDB なしで TiKV を採用 | [7](https://tikv.org/adopters/) |
| LY.com | TiDB なしで TiKV を採用 | [7](https://tikv.org/adopters/) |
| Zhuan Zhuan | TiDB なしで TiKV を採用 | [7](https://tikv.org/adopters/) |
| Meituan-Dianping | TiDB なしで TiKV を採用 | [7](https://tikv.org/adopters/) |
| Ele.me | TiDB なしで TiKV を採用 | [7](https://tikv.org/adopters/) |

## 採用のシグナル

CNCF 卒業告知の時点で、本番採用はおよそ 1,000 社に倍増し、コアリポジトリのコントリビュータは 78 から 226 に増えた [1]。メンテナは PingCAP・Zhihu・JD Cloud・Yidian Zixun を含む複数企業で構成される [1]。

2026-06-23 に観測した GitHub 統計: スター 16,739、フォーク 2,295、コントリビュータ約 389 [9]。

## エコシステム

- TiDB が最大の利用者で、TiKV はその分散ストレージ層である。TiDB は coprocessor 経由で計算を push-down する [4]。
- Placement Driver (`tikv/pd`) は auto-sharding・Region リバランス・TSO 発行を担う必須コンポーネントである。
- クライアントライブラリ `client-rust`・`client-go`・`client-java`・`client-python` は、TiDB を介さず TxnKV / RawKV API を直接使う。
- 変更データキャプチャは `components/cdc` と `components/resolved_ts` (および TiCDC) が提供する。
- バックアップと Point-In-Time Recovery は BR と `backup-stream` を使う。

## 代替候補

| 代替 | 違い |
| --- | --- |
| etcd | 同じ Raft + KV モデルだが、小さな構成データ (数 GB) 向け。TiKV は 100+ TB と分散 ACID トランザクションが目的 |
| CockroachDB | 同じく Spanner/Percolator 系だが SQL 層まで一体。TiKV は KV 専用で SQL は TiDB に分離 |
| YugabyteDB | 同系統の分散トランザクション SQL/KV。ストレージレイアウトと TiKV 独自の CF 分割が異なる |
| FoundationDB | 決定的シミュレーションテストとレイヤ設計が中心の分散トランザクション KV。TiKV は Raft + RocksDB + PD 構成と coprocessor push-down が差別化 |
| Cassandra / ScyllaDB | 結果整合の wide-column。TiKV は強整合 + 分散トランザクションで対照的 |

## 出典

- [1] [Cloud Native Computing Foundation announces TiKV Graduation (CNCF)](https://www.cncf.io/announcements/2020/09/02/cloud-native-computing-foundation-announces-tikv-graduation/)
- [4] [tikv/tikv README](https://github.com/tikv/tikv)
- [7] [TiKV Adopters](https://tikv.org/adopters/)
- [8] [Case study: TiKV in JD Cloud (CNCF)](https://www.cncf.io/blog/2019/11/26/case-study-tikv-in-jd-cloud/)
- [9] [tikv/tikv GitHub stats](https://github.com/tikv/tikv)
