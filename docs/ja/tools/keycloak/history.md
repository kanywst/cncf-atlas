# 歴史

## 起源

Keycloak は 2014 年、Bill Burke と Stian Thorgersen によって立ち上げられた。Red Hat / WildFly コミュニティ配下のプロジェクトとして始まり、Red Hat build of Keycloak の upstream となった。狙いは、アプリごとにログインを再実装させず、標準プロトコル経由で認証と SSO を一手に担うサーバを用意することだった。出典は [CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/) と [Wikipedia](https://en.wikipedia.org/wiki/Keycloak)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2014 | Bill Burke と Stian Thorgersen が Red Hat / WildFly コミュニティで Keycloak を立ち上げ ([Wikipedia](https://en.wikipedia.org/wiki/Keycloak)) |
| 2022 | Keycloak 17 が Quarkus 配布物をデフォルト化、WildFly アプリサーバを置き換え ([migration doc](https://www.keycloak.org/migration/migrating-to-quarkus)) |
| 2023 | CNCF が 2023-04-10 に Keycloak を Incubating として受理 ([CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/)) |
| 2026 | リリースは `26.x` 系。最新は `26.6.3` (2026-06-04) ([releases](https://github.com/keycloak/keycloak/releases)) |

## どう進化したか

最大の転換は WildFly からの脱却だった。Keycloak 17 まで配布物は WildFly アプリサーバで、XML と `jboss-cli` で構成していた。Keycloak 17 (2022 年 2 月) は Quarkus ベースの配布物をデフォルトにした。構成は単一の設定ファイル + CLI 引数 + 環境変数へ集約され、サーバは二段モデルを採用した。`kc.sh build` が build-time オプションを確定し、その後 `kc.sh start` が DB・hostname・TLS などの run-time 設定を適用する ([migration doc](https://www.keycloak.org/migration/migrating-to-quarkus)、[n-k.de](https://www.n-k.de/2022/02/keycloak-17-quarkus-distribution-default.html))。

WildFly 配布物は Keycloak 20 までサポートされ、その後完全に削除された。新しい Kubernetes Operator は Quarkus 配布物を前提とする ([migration doc](https://www.keycloak.org/migration/migrating-to-quarkus))。

もう一つの大きな変化はガバナンスである。Keycloak は 2023-04-10 に CNCF Incubating プロジェクトとして受理された。受理時点で GitHub 15,000 stars 超、keycloak.org が月間 15 万訪問超と報告されている ([CNCF blog](https://www.cncf.io/blog/2023/04/11/keycloak-joins-cncf-as-an-incubating-project/))。

## 現在地

Keycloak は `26.x` 系で頻繁にマイナーリリースを出しており、`26.6.3` は 2026-06-04 にリリースされた ([releases](https://github.com/keycloak/keycloak/releases))。CNCF Incubating プロジェクトであり ([CNCF プロジェクトページ](https://www.cncf.io/projects/keycloak/))、Red Hat build of Keycloak の upstream であり続けている。
