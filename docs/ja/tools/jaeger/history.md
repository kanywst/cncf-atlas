# 歴史

## 起源

Jaeger は 2015 年に Uber で始まった。急増するマイクロサービス群をまたいだリクエストの流れを理解する必要があったためだ。1 つのユーザ操作が多数のサービス呼び出しに分岐する環境である。設計は Google の Dapper 論文と OpenZipkin に着想を得ている。Uber はその動機とアプローチを [Evolving Distributed Tracing at Uber Engineering](https://eng.uber.com/distributed-tracing/) で説明した。Uber は 2017 年にプロジェクトをオープンソース化した。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | Uber 社内で開発開始。Google Dapper と OpenZipkin に着想。 |
| 2017 | Uber が OSS 公開。2017-09-13 に CNCF incubating として受入。 |
| 2019 | 2019-10-31 に CNCF graduated 到達。財団の 7 番目の卒業プロジェクト。 |
| 2022 | ネイティブの Jaeger クライアントライブラリを廃止。計装は OpenTelemetry SDK に移行。 |
| 2024 | Jaeger v2 を発表。バックエンドを OpenTelemetry Collector 上に再構築。 |

## どう進化したか

Jaeger は OpenTracing API の実装として始まった。OpenTracing と OpenCensus が OpenTelemetry に統合されると、Jaeger も追随した。独自クライアントライブラリを deprecated とし、計装には OpenTelemetry SDK を使うよう案内した。

最大の転換は 2024 年末に発表された Jaeger v2 である。[Jaeger v2 released](https://medium.com/jaegertracing/jaeger-v2-released-09a6033d1b10) に説明がある。v1 は Agent / Collector / Query の別バイナリを提供していた。v2 はこれらを OpenTelemetry Collector ディストリビューションとして 1 つのバイナリに統合する。Collector のコアが受信・バッチ化・パイプライン配線を担い、Jaeger 自身の機能 (クエリ API と UI、ストレージ、サンプリング) は Collector の extension として登録される (`cmd/jaeger/internal/components.go:50`)。これにより OTLP が主要な取り込み経路となり、Jaeger は独自の receiver や processor を維持する代わりに Collector のものを再利用できる。

この移行はコード上ではまだ途上にある。スパンを Jaeger ストレージに書き込む exporter は `StabilityLevelDevelopment` で登録されており (`cmd/jaeger/internal/exporters/storageexporter/factory.go:27`)、内部的には v1 の `spanstore.SpanWriter` モデルへ橋渡ししている (`cmd/jaeger/internal/components.go:116`)。v1 と v2 のストレージ API が併存しており (`internal/storage/v1`, `internal/storage/v2`)、v2 API は OTLP `ptrace.Traces` を直接扱う。

## 現在地

Jaeger は活発に開発が続く CNCF Graduated プロジェクトである。基準コミット `d5e2ccd` は `v2.19.0` リリース (2026-06-03) の直後に位置する。ガバナンスは `GOVERNANCE.md`、メンテナ一覧は `MAINTAINERS.md` に記載があり、オリジナル作者 Yuri Shkuro に加え Grafana Labs、Red Hat、Bloomberg などのメンテナが含まれる。掲げる方向性は、Jaeger のクエリ API・UI・プラガブルなストレージバックエンドを保ちつつ OpenTelemetry Collector への移行を完了させることである。
