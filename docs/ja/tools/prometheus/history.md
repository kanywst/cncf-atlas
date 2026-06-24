# 歴史

## 起源

Prometheus は 2012 年に SoundCloud で始まった。元 Google エンジニアの Matt Proud と Julius Volz が、当時の StatsD / Graphite ベースの構成が containerized infrastructure に耐えられなかったため立ち上げた。設計上のルーツは Google 社内の監視システム Borgmon にある (2)(3)。最初のコミットは 2012-11-24 で、これは GitHub リポジトリの作成日時 `2012-11-24T11:14:12Z` と一致する (10)。プロジェクトの公開アナウンスは 2015 年 1 月 (2)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2012 | Matt Proud と Julius Volz が SoundCloud で開始。最初のコミットは 2012-11-24 (2)(10) |
| 2015 | 公開アナウンス (2) |
| 2016 | 2016-05-09 に CNCF が受理。Kubernetes に次ぐ 2 番目のプロジェクト。7 月に Prometheus 1.0 リリース (1)(4)(2) |
| 2017 | Prometheus 2.0 が新ストレージエンジン (現行 TSDB) を導入し、リソースとディスク使用量を大幅削減 (2) |
| 2018 | 2018-08-09 に CNCF Graduated へ昇格。2 番目の Graduated プロジェクト (1)(4) |

## どう進化したか

最大の転換点は 2017 年 11 月の 2.0 ストレージリライトだった。元のストレージ層は現行の TSDB 設計に置き換えられ、性能が向上しディスク使用量が大幅に減った (2)。この TSDB (head, block, WAL, mmapped chunk) は pin したコミットでも依然としてローカルストレージエンジンである。

CNCF incubation からの卒業は 2018-08-09 で、PromCon (Munich) で発表された。この時点で active maintainer は約 20 名、contributor は 1,000 名超、commit は 13,000 超だった (1)(4)(9)。founder の Julius Volz は卒業時に、Prometheus をメトリクスベース監視の事実上の標準と表現している (1)。

バージョニングには Go module 由来の癖がある。Go module の import path 規約のため、Prometheus v3.y.z はライブラリとしては `v0.3y.z` タグで公開される。README に明記されている。

## 現在地

開発は単一実装リポジトリ `prometheus/prometheus` で続いており、`prometheus` と `promtool` の 2 つのバイナリをビルドする。pin したコミット `fc561264` は release-3.13 のマージで、`VERSION` ファイルは `3.13.0-rc.0`。recon 時点の安定最新リリースは v3.12.0 (2026-05-28) だった (10)。Alertmanager・node_exporter・client_golang などのエコシステムコンポーネントは別リポジトリにある。
