# Cortex

> Prometheus 向けの水平スケール可能でマルチテナントな長期ストレージ。メトリクスを remote write で受信する。

- **カテゴリ**: Observability
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [cortexproject/cortex](https://github.com/cortexproject/cortex)
- **ドキュメント基準コミット**: `42c26e7` (2026-06-23、タグ `v1.21.1` 近傍)

## 何をするものか

Cortex は Prometheus を水平スケール可能でマルチテナントな時系列データベースに変える Go サービス群。単体の Prometheus は 1 台のマシンの CPU・メモリ・ディスクで頭打ちになり、1 クラスタ内で多数の独立したチームのメトリクスを隔離できない。Cortex は Prometheus の remote write プロトコルでサンプルを受信し、ハッシュリングで多数のステートフルな ingester に分配し、完成したブロックをオブジェクトストレージへ送って長期保持することでこれを解決する。

コードベースは単一バイナリで、単一プロセス (`-target=all`) でも、個別のマイクロサービス (distributor, ingester, querier, store-gateway, compactor ほか) に分割してそれぞれ独立にスケールしても動く。テナント隔離は全レイヤを貫いており、`X-Scope-OrgID` HTTP ヘッダをキーに、認証はデフォルトで有効。

Cortex は remote write してくる Prometheus 群の背後に位置し、Prometheus 互換のデータソースとして Cortex をクエリする Grafana の前に立つ。Amazon Managed Service for Prometheus は Cortex 上に構築されている。

## いつ使うか

- 多数の Prometheus を運用し、単一ノードのディスクを超える保持期間を持つ中央のクエリ可能なストアが必要なとき。
- ダッシュボードだけでなく、取り込みからクエリまでの厳格なマルチテナント隔離 (チームや顧客単位) が必要なとき。
- Kubernetes で write・read・storage パスを独立にスケールさせたいとき。
- 単体 Prometheus や軽量な単一バイナリストアで規模が足りるなら過剰。マイクロサービス構成は実運用コストが大きい。
- 既存の Prometheus サーバを真実の源として残し、クエリ時のみフェデレートしたいなら、pull/sidecar 型のほうが向く。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [cortexproject/cortex README](https://github.com/cortexproject/cortex/blob/master/README.md)
2. [cortex source at commit `42c26e7`](https://github.com/cortexproject/cortex/tree/42c26e7eab49ce36bb4dc80ecbcf365fe0e33899)
3. [ADOPTERS.md](https://github.com/cortexproject/cortex/blob/master/ADOPTERS.md)
4. [LICENSE (Apache-2.0)](https://github.com/cortexproject/cortex/blob/master/LICENSE)
5. [Cortex on the CNCF project page](https://www.cncf.io/projects/cortex/)
6. [TOC welcomes Cortex as an incubating project (CNCF)](https://www.cncf.io/blog/2020/08/20/toc-welcomes-cortex-as-an-incubating-project/)
7. [Cortex has advanced to incubation within CNCF (Grafana Labs)](https://grafana.com/blog/cortex-the-scalable-prometheus-project-has-advanced-to-incubation-within-cncf/)
8. [Amazon Managed Service for Prometheus](https://aws.amazon.com/prometheus/)
