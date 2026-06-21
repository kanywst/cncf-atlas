# 歴史

## 起源

Permify は 2022 年、Google の Zanzibar (論文で記述されたが公開されなかった社内認可システム) を OSS で再現する試みとして始まった。狙いは、RBAC・ReBAC・ABAC を 1 つの DSL で表現できる単一エンジンをチームに提供すること。リポジトリは 2022-07-14 に作成され、2022 年 7 月に Hacker News で "Show HN: Permify" として初公開された。当初の売りは、データベースの change-data-capture (CDC) で認可データをリレーションタプルへ同期する点だった (出典 1)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2022 | リポジトリ作成 (2022-07-14)、Hacker News で初公開 (出典 1) |
| 2024 | Permify 1.0 を Hacker News で公開 (出典 2) |
| 2025 | 2025-11-20 に FusionAuth が買収、OSS コアは GitHub 上で継続 (出典 3, 4) |
| 2026 | `main` で活発に開発、最新タグは `v1.7.0` と `v1.7.1` (2026 年 6 月) |

## どう進化したか

初期の枠組みは CDC 駆動で、データベースの変更を捕捉してリレーションタプルへ投影することで認可データを同期した (出典 1)。その後、製品はこのリアルタイム同期の関心事を Debezium/Kafka を使う "Sync Service" として分離し、コアエンジンは PostgreSQL のリレーションタプルに対しスナップショットベースの整合性で直接 Check を解決する形に落ち着いた。2024 年の Permify 1.0 は、初期サービスから安定したきめ細かな認可プロダクトへの移行を示した (出典 2)。

コードに表れる最も具体的な整合性判断は、Zanzibar の zookie に相当する SnapToken を PostgreSQL のトランザクションスナップショット (XID8) として実装している点 (`internal/storage/postgres/snapshot/token.go`)。これにより整合性のモデルが、専用の整合性ストアではなく PostgreSQL ネイティブの MVCC 可視性に結びついている。

## 現在地

2025-11-20、FusionAuth が Permify を買収し、認証 (FusionAuth) と認可 (Permify) を 1 つの self-hostable プラットフォームに統合する狙いを表明した。買収金額は非公開 (出典 3, 4)。両社は OSS コアが GitHub 上で継続し、Permify チームの 2 名が contractor として参加すると述べており、GitHub のリポジトリ description も Permify が FusionAuth の一部である旨に変更されている (出典 7)。開発は Go で `main` 上で継続し、`ghcr.io/permify/permify` コンテナとして配布される。直近のタグは 2026 年 6 月の `v1.7.0` と `v1.7.1`。
