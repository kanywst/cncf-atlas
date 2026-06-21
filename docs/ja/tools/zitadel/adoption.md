# 採用事例・エコシステム

## 誰が使っているか

ZITADEL には CNCF ケーススタディも、ベンダー中立な採用調査も存在しない。CNCF ホスト project ではないからだ。引用できる採用企業は、リポジトリの `ADOPTERS.md` に自己申告した組織になる。独立検証ではなく自己申告である点に注意。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Rawkode Academy | 自己申告の採用者 | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| XPeditionist | 自己申告の採用者 | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| devOS: Sanity Edition | 自己申告の採用者 | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| CNAP.tech | 自己申告の採用者 | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| Minekube | 自己申告の採用者 | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| OpenAIP | 自己申告の採用者 | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| roclub GmbH | 自己申告の採用者 | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |
| CEEX AG | 自己申告の採用者 | [ADOPTERS.md](https://github.com/zitadel/zitadel/blob/main/ADOPTERS.md) |

ファイルには Dribdat・Micromate・Smat.io・hirschengraben・D1V.AI も載っている。2022 年の Series A 時点で会社は「150 社以上の顧客」を主張したが ([Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a))、それらの組織は公開ソースで個別に名指しされていない。

## 採用のシグナル

GitHub API から 2026-06-22 に計測 ([repo metadata](https://api.github.com/repos/zitadel/zitadel)):

- Stars: 14,138
- Forks: 1,121
- Open issues: 1,083
- Watchers: 61
- Contributors: 約 246 (非匿名、API ページネーション基準)

リリースは活発で、2026 年半ばに v4 系のポイントリリースが続く ([repo](https://github.com/zitadel/zitadel))。2022 年の Series A 時点では 10k+ stars・200+ contributors を報告していた ([Series A](https://www.startupticker.ch/en/news/zitadel-raises-9-million-series-a))。以降は着実な成長傾向だ。

ZITADEL は CNCF landscape にホスト project として (どの成熟度でも) 載っていない ([CNCF Landscape](https://landscape.cncf.io/)、2026-06-22 確認)。最も近い競合 Keycloak は 2023 年に CNCF incubation 入りしており、メンテナが意図的に対比している点だ ([Open Source in the AI Era](https://zitadel.com/blog/open-source-in-the-ai-era))。

## エコシステム

ZITADEL は OpenID Connect (certified)・OAuth 2.0・SAML 2.0、provisioning 用の SCIM 2.0 server を実装する ([API introduction](https://zitadel.com/docs/apis/introduction))。Actions v2 が webhook・カスタムコード・token enrichment を拡張フックとして提供する。中核の周囲には各言語 SDK、Helm chart と Terraform provider、セルフホスト用の Kubernetes operator がある (README.md:117)。ZITADEL Cloud はマネージド提供で、セルフホスト版と同一のコードベースで動く。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Keycloak | Java/Quarkus、CNCF incubating。LDAP サーバとして振る舞えるなど機能が最広だが、運用は重い |
| Ory (Hydra + Kratos) | Go、headless で API-first の microservices を自前で組む。管理 UI も組み込みマルチテナンシーもない |
| Authentik | Python/TypeScript、flow ベースの強力な UI。LDAP 提供や forward-auth も可能だが、イベントソーシングの監査は弱い |
| FusionAuth | 商用フレンドリーな単一バイナリ。無料枠あり、完全な OSS ではない |
| Auth0 / Okta | SaaS のみ。セルフホスト不可、OSS コードなし |

セルフホストの B2B マルチテナンシー、API で公開されるイベントソーシングの監査証跡、SaaS とセルフホストの同等性が欲しいなら ZITADEL。ZITADEL を LDAP サーバとして使う必要があるなら、それはできないので Keycloak か Authentik を選ぶ ([skycloak comparison](https://skycloak.io/blog/open-source-authentication-comparison-2026/)、[houseoffoss comparison](https://blog.houseoffoss.com/post/the-state-of-open-source-identity-in-2025-authentik-vs-authelia-vs-keycloak-vs-zitadel))。
