# 歴史

## 起源

Akri は Microsoft DeisLabs で始まった。チームは Kubernetes ノードになるには小さすぎるデバイス (カメラ、USB センサ、OPC UA サーバ) をクラスタに取り込み、標準の device plugin framework が無視するエッジ固有の関心事、すなわちネットワーク越しのデバイス発見、断続的な接続への対処、1 つのデバイスの複数ノード共有を扱おうとした。最初の公開議論とリポジトリは 2020 年 12 月に `github.com/deislabs/akri` として現れ、当初は姉妹プロジェクト Krustlet に倣って MIT ライセンスを採用していた (出典 4)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | deislabs/akri で最初の公開リリースとリポジトリ、MIT ライセンス (出典 4) |
| 2021 | 2021-09-14 に CNCF Sandbox 受理。Apache-2.0 へ再ライセンスし open governance を採用 (出典 2、3) |
| 2021 | リポジトリを中立組織 project-akri へ移設。v0.7.0 がこの移設を示す (出典 4) |
| 2024 | v0.13.8 を 2024-11-10 にタグ付け、2024-11-20 に公開 (依然 1.0 未満のリリース) (出典 1) |

## どう進化したか

特に 2 つの転換がある。第 1 に、CNCF onboarding でガバナンスとライセンスが変わった。MIT から Apache-2.0 へ移り、Contributor / Maintainer / Admin ロールを定義する `GOVERNANCE.md` を追加し、チャットを Kubernetes Slack の `#akri` チャネルへ移した (出典 2、3)。続いてリポジトリは Microsoft 所有の `deislabs` 組織からベンダ中立の `project-akri` 組織へ移された。v0.7.0 はその移設を示すために minor を上げただけで、破壊的変更はない (出典 4)。

第 2 に、ランタイムのアーキテクチャが分割された。初期版は Discovery Handler を Agent イメージに埋め込んでいた。これを分離してハンドラを独自の DaemonSet として動かし、gRPC で Agent に登録する形にしたことで、第三者は Agent を再ビルドせずにプロトコルを追加できるようになった (出典 6)。デバイス注入のパスはのちに、device plugin の Allocate レスポンスを直接書く代わりに Container Device Interface (CDI) v0.6.0 スキーマを軸に書き直された。

## 現状

Akri は引き続き CNCF Sandbox プロジェクトであり、公開済みのリリースはすべて 1.0 未満の pre-release である。ドキュメント基準コミットではワークスペースのバージョンは `0.13.26`、v0.13.8 タグの次の開発中バージョンである。コードは Linux amd64、arm64v8、arm32v7 上で Kubernetes v1.33 以降を対象とし、Rust (edition 2024) の Cargo workspace としてビルドされ、デプロイ用に Helm chart を持つ (出典 6)。ガバナンスは [GOVERNANCE.md](https://github.com/project-akri/akri/blob/main/GOVERNANCE.md) のロールモデルで open である。
