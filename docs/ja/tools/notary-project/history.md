# 歴史

## 起源

このプロジェクトの起点は、Docker が 2015 年に開始し後に CNCF へ寄贈した Notary だ。Docker Content Trust (DCT) としても提供されたこの第一世代は、The Update Framework (TUF) をベースにサーバとクライアントを分けた構成だった。現行の Notary Project 仕様は実装していない ([source 3](https://notaryproject.dev/docs/faq/)、[source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/))。

後継 (当初は "Notary v2" と呼ばれた) は 2019 年 12 月にマルチベンダ WG として発足し、Docker / Microsoft / Google / Amazon が参加した。狙いは TUF ベース v1 の具体的な制約の解消だ。署名がレジストリ間で可搬でない、1 イメージ 1 署名のみ、コンテナイメージ以外の OCI アーティファクトに署名できない、という 3 点である ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2015 | Docker が Notary を開始。後に CNCF へ寄贈し Notary v1 / Docker Content Trust となる ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)) |
| 2017 | Notary Project が CNCF に Incubating として受理 ([source 2](https://www.cncf.io/projects/notary-project/)) |
| 2019 | "Notary v2" マルチベンダ WG が発足 ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)) |
| 2021 | 新設計の alpha ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/)) |
| 2023 | メジャーリリース。名称が "Notary Project"、ツール名が "Notation" に ([source 5](https://notaryproject.dev/blog/2023/announcing-major-release/)) |
| 2025 | 2 回目のセキュリティ監査が完了 ([source 2](https://www.cncf.io/projects/notary-project/)) |

## どう進化したか

最も大きな転換は、署名保管を TUF サーバ方式からレジストリ自身に OCI Referrer として保存する方式へ変えたことだ。これが署名のレジストリ間ポータビリティと、1 アーティファクトに複数署名を可能にした ([source 10](https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/))。"Notary v2" の呼称は 2023 年のメジャーリリースで廃止され、現在は総称が "Notary Project"、CLI が "Notation" だ ([source 5](https://notaryproject.dev/blog/2023/announcing-major-release/))。

Docker Content Trust の廃止が新設計の採用を後押ししている。Azure Container Registry は 2025-03-31 に DCT の廃止を開始し、2028-03-31 の完全削除を予定、代替として Notary Project 署名を案内する ([source 6](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-content-trust-deprecation))。

## 現在地

安定最新リリースは `v1.3.2` (2025-04-27) で、`main` ブランチは `v2.0.0-alpha.1` の開発線を進める (`internal/version/version.go:18`)。module パスは `github.com/notaryproject/notation/v2`。ガバナンスは公開された Notary Project GOVERNANCE 文書、CNCF Slack の `#notary-project` チャンネル、定例コミュニティミーティングで運営される ([source 11](https://github.com/notaryproject/.github/blob/main/GOVERNANCE.md)、[source 1](https://github.com/notaryproject/notation))。2 回目のセキュリティ監査は 2025 年に完了した ([source 2](https://www.cncf.io/projects/notary-project/))。
