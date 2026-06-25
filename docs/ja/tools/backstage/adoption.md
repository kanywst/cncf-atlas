# 採用事例・エコシステム

## 誰が使っているか

リポジトリの `ADOPTERS.md` は、Adopter フォームと PR を通じて集めた組織の自己申告リストで、288 行の組織エントリがある。以下は、そこに掲載され、かつ Backstage の利用が公に知られている組織だ (S1)。Spotify は発祥元であり、その上に構築を続けている (S7)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Spotify | Backstage を作成。社内で運用し、その上に商用 Spotify Portal を提供 | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1), [Spotify Engineering](https://engineering.atspotify.com/2025/4/celebrating-five-years-of-backstage) (S7) |
| American Airlines | 社内開発者ポータル | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Expedia | 社内開発者ポータル | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Splunk | 社内開発者ポータル | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Booking.com | 社内開発者ポータル | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Zalando | 社内開発者ポータル | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Mercedes-Benz | 社内開発者ポータル | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |
| Epic Games | 社内開発者ポータル | [ADOPTERS.md](https://github.com/backstage/backstage/blob/master/ADOPTERS.md) (S1) |

同ファイルに掲載されている他の組織には VMware・Wayfair・Box・HP・Fidelity・Telenor・Twilio・Volvo・Palo Alto Networks などがある (S1)。

## 採用のシグナル

2026-06-24 に pin したコミットで GitHub API から測定 (S1):

- スター 33,688、フォーク 7,423、watcher (subscribers) 231、open issue 448。
- contributors: contributors API のページング集計で 360+ の異なるコミット作者。API には上限があるため実数はこれより多い。
- CNCF velocity ランキングは、寄贈年の 2020 に 100+ プロジェクト中 8 位から、2025 には 230+ 中 6 位へ上昇 (CNCF と Aniszczyk のコメント) (S8)。

カテゴリ自体も伸びている。Port が引く Gartner 2025 IDP Market Guide は、2028 までに 85% のソフトウェア組織が社内開発者プラットフォームを採用すると予測する (2023 は 25% 未満) (S10)。

## エコシステム

Backstage は `plugins/*` に 159 個の公式プラグインを出荷し、加えてコミュニティプラグインのエコシステムがある。代表的な連携プラグインは Kubernetes・GitHub・ArgoCD・PagerDuty をカバーする (S2, S3)。バックエンドは Knex を介して Postgres または SQLite に永続化する (S2)。最近の追加は AI と MCP への展開を示す。サンプルバックエンドに `plugin-mcp-actions-backend` と `catalog-backend-module-ai-model` が現れ、カタログモデルには `AiResourceEntityV1alpha1`・`McpServerApiEntity` kind が加わった (S1)。

Backstage 上に構築されたマネージド/商用提供には Roadie (マネージド Backstage) と Spotify Portal for Backstage がある (S7, S10)。

## 代替候補

Backstage はフレームワークだ。自分のポータルを構築・運用するため柔軟性が手に入るが、その代わりにエンジニアを張り付ける必要がある。主な代替は、より固定的なデータモデルと速い time-to-value を持つ製品だ (S10)。

| 代替 | 違い |
| --- | --- |
| Port | SaaS 型 IDP。固定寄りのデータモデルで製品化され、数週間ではなく数日で立ち上がる |
| Cortex | サービス成熟度とスコアカードに焦点を当てた SaaS 型 IDP。フレームワークではなく製品として運用 |
| OpsLevel | サービスカタログとオーナーシップを中心に据えた SaaS 型 IDP。自前構築ではなくマネージド |
| Roadie | マネージド Backstage。同じ OSS 本体を、セルフホストの代わりに運用代行してくれる |
