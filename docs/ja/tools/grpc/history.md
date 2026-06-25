# History

## 起源

gRPC は Google 社内で始まった。Google は 10 年以上にわたり、製品の裏側のサービスをつなぐ単一の汎用 RPC 基盤 Stubby を運用してきた。About ページにはこうある。"Google has used a single general-purpose RPC infrastructure called Stubby ... for over a decade" (<https://grpc.io/about/>)。Stubby は Google 社内インフラに密結合で、公開標準に依存していなかったため、そのままでは公開できなかった。

SPDY・HTTP/2・QUIC の登場が、その基盤を公開標準の上に作り直す道を与えた。2015 年 3 月、Google は Stubby の次世代版を作りオープンソース化することを決め、その結果が gRPC だった (<https://grpc.io/about/>)。最初の公開リリースはシリアライズに Protocol Buffers、トランスポートに HTTP/2 を採用した (<https://en.wikipedia.org/wiki/GRPC>)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2014 | GitHub リポジトリ `grpc/grpc` 作成 (2014-12-08、GitHub API より)。 |
| 2015 | gRPC を発表しオープンソース公開。Protocol Buffers と HTTP/2 がベース (<https://grpc.io/about/>)。 |
| 2017 | CNCF に Incubating プロジェクトとして受理 (2017-02-16、<https://www.cncf.io/projects/grpc/>)。 |
| 2026 | 1.83 線で活発に開発中。直近リリースは `v1.81.1` (2026-06-08)、`v1.82.0-pre1` がタグ済み。 |

## どう進化したか

gRPC を形づくった公開上の設計判断は、独自プロトコルではなく HTTP/2 の上に作ったことだ。HTTP/2 の多重化・ヘッダ圧縮・ストリーミングは gRPC の 4 種類の呼び出し (unary、サーバストリーミング、クライアントストリーミング、双方向) に直接対応し、既存のプロキシやロードバランサに乗れる (<https://grpc.io/about/>)。

内部では呼び出し機構の移行が進む。リポジトリには現在、コールスタックが 2 世代併存する。古いコールバック駆動の実装と、新しい promise ベースの実装が、同じ公開 C API の裏に同居する。これは `src/core/call/AGENTS.md:31` に記され、コードベースで進行中の最大のアーキテクチャ転換だ。

## 現状

gRPC は CNCF の Incubating プロジェクトのままで、卒業はしていない (<https://www.cncf.io/projects/grpc/>)。リリースはおよそ 6 週間周期で、ここで対象とする HEAD は 1.83 開発線にある。`MAINTAINERS.md` の maintainer 一覧は Google 社員が大半を占め、ガバナンス規程は別リポジトリ `grpc/grpc-community` に置かれる。この強い単一ベンダー支配が、長く Incubating に留まっている一因だと議論されてきた (<https://news.ycombinator.com/item?id=36698723>)。
