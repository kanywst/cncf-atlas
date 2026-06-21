# 歴史

## 起源

authentik はドイツ・ハンブルクで Jens Langhammer の個人プロジェクトとして始まった。プロジェクト自身の振り返りは、最初のコミットを 2018 年 11 月 11 日としている ([Happy Birthday to Us!](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/))。GitHub リポジトリ `goauthentik/authentik` は 2019 年 12 月 30 日に作成された ([GitHub REST API](https://api.github.com/repos/goauthentik/authentik))。出発点はセルフホスト型のシングルサインオンを提供することで、これはセルフホスト/ホームラボのコミュニティと、ホスト型 ID サービスに課金したくない小規模な会社が共有するニーズだった。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2018 | 最初のコミット。Jens Langhammer のハンブルクでの個人プロジェクトとして |
| 2019 | GitHub リポジトリ `goauthentik/authentik` 作成 (2019-12-30) |
| 2021 | セルフホストコミュニティで注目を集める |
| 2022 | Open Core Ventures が創設者に資金提供を打診。Authentik Security, Inc. が public benefit company として設立 |
| 2026 | 活発にリリース。本コミットのコードは `2026.8.0-rc1` を宣言、直近の安定タグは `version/2026.5.3` |

## どう進化したか

転換点は 2 つ。1 つ目は個人プロジェクトから会社への移行。2022 年 4 月頃に Open Core Ventures が Jens に資金を打診し、2022 年 11 月に Authentik Security, Inc. が public benefit company として設立された。Jens Langhammer が CTO、Fletcher Heisler が CEO を務める ([Happy Birthday to Us!](https://goauthentik.io/blog/2023-11-1-happy-birthday-to-us/))。ここからプロジェクトは open core モデルで動く: パーミッシブにライセンスされたコアと、`authentik/enterprise/` 配下の source-available な Enterprise エディション ([ソース](https://github.com/goauthentik/authentik))。

2 つ目はスコープ。authentik は SSO から、OAuth2/OIDC・SAML・LDAP・RADIUS・SCIM を話す 1 つのサーバへと成長し、プロトコル固有のゲート (proxy、LDAP、RADIUS、RAC) は `cmd/` と `internal/outpost/` 配下の独立した Go の「outpost」プロセスに切り出された。

## 現在地

authentik はカレンダーバージョニングのリリースを頻繁に出している (本コミットのコードは `2026.8.0-rc1` を宣言、直近の安定タグは `version/2026.5.3`)。ガバナンスは単一ベンダで、方向性は Authentik Security, Inc. が決める。中立財団がガバナンスするプロジェクトとは対照的だ。authentik は CNCF プロジェクトではない ([CNCF Projects](https://www.cncf.io/projects/)、2026-06-22 確認)。リポジトリは Python コア・Go の outpost・TypeScript/Lit の Web UI の単一の置き場であり続けている。
