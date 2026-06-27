# 歴史

## 起源

Aeraki Mesh は Huabing (Robin) Zhao (GitHub `zhaohuabing`) が始めました。彼は Tetrate 所属で CNCF Ambassador です。`MAINTAINERS.md` の筆頭メンテナで、Company は Tetrate.io と記載されています。リポジトリの作成は 2020-11-05 です。

解決を狙った課題は README に明記されています。Istio など主要メッシュは HTTP/gRPC 以外の L7 プロトコルへの対応が薄く、Envoy の RDS は HTTP 専用に設計されています。Dubbo や Thrift はリスナのインラインルートしか使えず、ルート変更時に既存接続が切れます。独自プロトコルを導入するにはデータプレーン用の Envoy filter と、それを管理するコントロールプレーンの両方を書く必要があります (`README.md:49-51`)。Aeraki の答えは、非侵襲なコントロールプレーンと MetaProtocol Proxy という抽象化で、プロトコル追加をメッシュ全体の統合ではなく codec 実装に縮小することです (`README.md:71-72`)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | 2020-11-05 にリポジトリ作成。 |
| 2021 | 2021-09-27 に作者が紹介ブログを公開。 |
| 2022 | IstioCon 2022 で Tencent Music が Istio + Aeraki を発表。2022-06-17 に CNCF Sandbox プロジェクトに採択。 |
| 2023 | 2023-08-20 にタグ `1.4.1` リリース。 |
| 2025 | master で開発継続。本ディープダイブはコミット `56e4de0` (2025-05-12) を固定。 |

## どう進化したか

Aeraki のスコープは 2 つのコントロールプレーン役割で、固定コミットの時点でどちらもコードに存在します。1 つ目は宣言的な config から Istio `EnvoyFilter` リソースを生成する役割 (`internal/envoyfilter/controller.go:128`)。2 つ目は MetaProtocol データプレーン向けの RDS サーバとして振る舞う役割 (`internal/xds/server.go:52`)。MetaProtocol という抽象化があったからこそ、プロトコルごとのコントロールプレーンコードなしに対応プロトコルを増やせました。bRPC (Baidu がオープンソース化)、tRPC (Tencent で使用)、qza (Tencent Music で使用) などが MetaProtocol 上の対応プロトコルとして挙げられています (`README.md:91-95`)。

2022 年の CNCF Sandbox 採択時には、作者ブログによれば Baidu・Zhihu・Alauda・Tencent Music・DiDi の貢献に謝辞が述べられています。併設のデータプレーン `meta-protocol-proxy` と、共有の API・client モジュール (`github.com/aeraki-mesh/api`、`github.com/aeraki-mesh/client-go`) は、本体のコントロールプレーンが依存する別リポジトリにあります (`go.mod`)。

## 現在地

本プロジェクトは CNCF Sandbox プロジェクトで、活動中です。リポジトリは archived ではなく、最終 push は 2025-12-05 です。開発は `1.4.1` タグより先の master で進みます。Istio とのバージョン互換は厳密に追跡されており、install docs によれば Aeraki 1.4.x は Istio 1.18.x と MetaProtocol Proxy 1.4.x を対象とします。メンテナンスは原作者が主導し、Tencent の共同メンテナがいます (`MAINTAINERS.md`)。
