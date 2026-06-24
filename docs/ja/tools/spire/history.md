# 歴史

## 起源

SPIFFE はコードのない設計ドキュメントとして始まった。Joe Beda が約 10 年前に元の設計を書き、GlueCon で発表した ([10 Years of SPIFFE](https://joe.dev/posts/10-years-of-spiffe/))。参照実装はその後に登場する。Sunil James が Scytale を創業して構想を CNCF に持ち込み、SPIRE を Scytale が書いた ([The New Stack のインタビュー](https://thenewstack.io/sunil-james-ceo-of-scytale-explains-spiffe/))。

解こうとした課題は、長命の共有シークレットを配布せずにサービス間の信頼をブートストラップすること。SPIFFE がアイデンティティ形式と Workload API を定義し、SPIRE がワークロードを attest してそれらのアイデンティティを発行するランタイムを担う。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | SPIFFE/SPIRE の公開ローンチ。初の公開プレゼンは KubeCon NA 2017 (Evan Gilman、2017-12-15) ([Scytale](https://scytale.io/opensource-spiffe/)) |
| 2018 | CNCF Sandbox プロジェクトとして受理 (2018-03-29) ([Scytale](https://scytale.io/opensource-spiffe/)) |
| 2019 | HPE が Scytale を買収。チームが founding contributor として合流 ([HPE Developer](https://developer.hpe.com/blog/spiffe-spire-graduates-enabling-greater-security-solutions/)) |
| 2020 | CNCF Incubating へ移行 (2020-06-22) |
| 2022 | SPIRE が CNCF Graduated 入り (2022-08-22)。アナウンスは 2022-09-20 ([CNCF](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)) |

## どう進化したか

SPIFFE と SPIRE は明確に役割分担した関連プロジェクトだ。SPIFFE 仕様は別リポジトリ (`spiffe/spiffe`) にあり、SPIRE がそれを実装する。SPIRE のアーキテクチャは主要機能を共通の catalog 経由で読み込むプラグインにした。ノード attestation・鍵管理・upstream authority・ワークロード attestation がすべて差し替え可能だ。同じバイナリが Kubernetes・AWS・GCP・TPM ベースのハードウェア・join トークンによるブートストラップをカバーするのはこのためだ。

2019 年の HPE による Scytale 買収後も、元の作者たちが founding contributor として開発を続け、Sandbox から Graduated への移行を通じて連続性が保たれた ([HPE Developer](https://developer.hpe.com/blog/spiffe-spire-graduates-enabling-greater-security-solutions/))。

graduation には Cure53 によるサードパーティのセキュリティ監査と CNCF TAG Security レビューの通過が必要で、コミッタープロセス・ライセンス・CII Best Practices Badge の要件も満たした ([CNCF アナウンス](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/))。

## 現在地

SPIRE は CNCF Graduated プロジェクト。リポジトリは 2017-08-11 に作成され、ドキュメント基準コミット時点の最新リリースは `v1.15.1` (2026-05-28)。メンテナは `MAINTAINERS.md` で管理され、レビュー担当は `CODEOWNERS` が規定する。CNCF アナウンスは graduation 時点の本番 end user として Anthem・GitHub・Netflix・Niantic・Pinterest・Uber を名指しした ([CNCF](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/))。
