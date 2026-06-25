# 採用事例・エコシステム

## 誰が使っているか

以下の組織は出典を示せるものに限る。最初の 5 社は Thanos の incubation 時点で CNCF が挙げたもの。Wikimedia は自前の運用ドキュメントを公開している。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Alibaba Cloud | 本番メトリクス | [CNCF ブログ, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| Banzai Cloud | 本番メトリクス | [CNCF ブログ, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| HelloFresh | 本番メトリクス | [CNCF ブログ, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| Monzo | 本番メトリクス | [CNCF ブログ, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| Red Hat | 本番メトリクス | [CNCF ブログ, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) |
| Wikimedia | Prometheus の長期保存 | [Wikitech: Thanos](https://wikitech.wikimedia.org/wiki/Thanos) |

## 採用のシグナル

2026-06-25 時点、[thanos-io/thanos](https://github.com/thanos-io/thanos) に対する GitHub API での計測:

- Stars: 14,124
- Forks: 2,318
- Open issues: 869
- コントリビュータ: 約 408 名 (ページング済みコントリビュータ一覧の末尾ページ)

リリースはおおむね 6 週ごとに、GitHub Releases の単一バイナリと `quay.io/thanos/thanos` コンテナイメージとして出る。

## エコシステム

- **Prometheus**: データソース。サイドカー経由か Receive への remote-write で。
- **Grafana**: Prometheus 互換クエリ API 経由で Thanos に問い合わせる。
- **デプロイ**: Prometheus Operator と Helm チャート。
- **オブジェクトストレージ**: `thanos-io/objstore` ライブラリ経由で S3、GCS、Azure、Swift、Tencent COS。
- **学習**: インタラクティブな Killercoda チュートリアル。

## 代替候補

Cortex は Thanos と同じ日に CNCF incubation 入りした ([CNCF ブログ, 2020-08-19](https://www.cncf.io/blog/2020/08/19/toc-approves-thanos-from-sandbox-to-incubation/) 参照)。VictoriaMetrics と M3 がその他のよくある比較対象。

| 代替 | 違い |
| --- | --- |
| Cortex | 最初から push / マルチテナント集約型。既存 Prometheus へのサイドカー後付けではない。 |
| VictoriaMetrics | 独自ストレージエンジンで単体性能を売る。TSDB ブロック形式のオブジェクトストレージ再利用ではない。 |
| M3 | 独自のクラスタリングモデルを持つ分散時系列ストア。 |

Thanos の固有点は、既存 Prometheus にサイドカーで後付けし、TSDB ブロック形式をそのままオブジェクトストレージに置き、再帰的な StoreAPI 抽象とダウンサンプリングでグローバル / 階層クエリを成立させることだ。push 集約 (Receive) は後から第 2 の選択肢として両対応された。
