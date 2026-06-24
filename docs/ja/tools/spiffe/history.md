# 歴史

## 起源

SPIFFE は、繰り返し現れる課題へのベンダ中立な答えとして始まった。長命な秘密を群れ全体にばらまかずに、すべてのサービスへ検証可能な ID を与えるにはどうするか、という課題である。この取り組みは Scytale (後に HPE が買収) と CNCF コミュニティから生まれ、標準は SPIFFE ID・SVID・Workload API に分割された。go-spiffe リポジトリは 2017-05-07 に作成され、これはプロジェクトが CNCF 入りする前であり、アプリケーションが Workload API 実装と通信するための Go クライアントである。

## タイムライン

| 年 | マイルストーン |
| --- | --- |
| 2017 | go-spiffe リポジトリ作成 (2017-05-07)。 |
| 2018 | SPIFFE が CNCF Sandbox に受理 (2018-03-29)。 |
| 2020 | CNCF Incubating に昇格 (2020-06-22)。 |
| 2022 | CNCF を卒業 (2022-08-23、発表は 2022-09-20)。 |
| 2026 | go-spiffe v2.8.1 リリース (2026-06-19)。 |

## どう進化したか

SPIFFE は仕様プロジェクトなので、その進化は 3 つのリポジトリに跨って現れる。標準そのもの (SPIFFE ID、X509-SVID、JWT-SVID、Workload API) は `spiffe/spiffe` にある。リファレンス実装の SPIRE がサーバとエージェントを提供する。go-spiffe は消費側であり、`github.com/spiffe/go-spiffe/v2` モジュールが現行のメジャーバージョンで、そのコードは `v2/` サブディレクトリではなくリポジトリルート直下に置かれる。

2022 年の卒業は SPIRE と同時だった。CNCF は両プロジェクトをまとめて卒業させ、大規模な群れを運用する企業での本番利用を理由に挙げている ([出典 #2](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/))。

## 現在地

go-spiffe は定期的にタグ付きリリースを出しており、v2.8.1 は 2026-06-19 に切られた。このライブラリは SPIFFE 標準に追従し、多くのプロジェクトが使う Go の入口である。新しい機能面は `exp/` 配下に置かれ、例えば実験的な WIT-SVID (Workload Identity Token) が `exp/svid/witsvid/` にある。これにより、メンテナは安定 API を壊さずに新興フォーマットを反復できる。プロジェクト全体の方向性については、標準リポジトリと CNCF プロジェクトページが一次情報である ([出典 #3](https://www.cncf.io/projects/spiffe/)、[出典 #4](https://github.com/spiffe/spiffe/tree/main/standards))。
