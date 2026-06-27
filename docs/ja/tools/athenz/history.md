# 歴史

## 起源

Athenz は Yahoo (のち Verizon Media / Oath) 社内の認証認可基盤として始まり、OSS 化される前から大規模本番で運用されていた。メンテナの Mujib Wahab と Henry Avetisyan が 2020 年の Dash Open ポッドキャスト第 21 回でその経緯を説明している (出典 5)。公開 GitHub リポジトリは 2016-11-16 に `yahoo` org の下で作成され、のちに `AthenZ` org に移管された。Go module 識別子もそれに合わせて `github.com/yahoo/athenz` から `github.com/AthenZ/athenz` へ移った (出典 3, 6)。

解こうとした課題は次の通り。動的インフラ (オートスケール VM、コンテナ、FaaS) で、長期の静的クレデンシャルを配らずに各ワークロードへ ID を与え、きめ細かい RBAC を中央管理しつつ、実行時はローカルで強制したい。この目標こそが、中央管理 (ZMS) と分散強制 (ZTS とクライアント側ポリシーエンジン) を分離した理由である。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | `yahoo` org 下に GitHub リポジトリ作成 (2016-11-16) (出典 6)。 |
| 2020 | Dash Open 21 でメンテナが OSS 化の経緯を説明 (出典 5)。 |
| 2021 | CNCF Sandbox プロジェクトとして受理 (2021-01-26) (出典 1, 2)。 |
| 2021 | v1.10.4 (2021-02-14) で open governance モデルを採用、変更 #1299 (出典 7)。 |
| 2026 | v1.12.43 を 2026-06-19 にリリース。1.12.x 系で活発にメンテ (出典 6)。 |

## どう進化したか

決定的な転換はリライトではなくガバナンスだった。単一ベンダーのプロジェクトから CNCF Sandbox への移行 (2021-01-26 受理) は、open governance モデルを採用した v1.10.4 リリースと同時期で、CHANGELOG に変更 #1299 として記録されている (出典 2, 7)。`yahoo` org から `AthenZ` org へのリポジトリ移管と、対応する Go module のリネームも、単一企業の所有から離れる同じ流れの一部である (出典 3, 6)。

製品スコープは 2 つの中核サーバ (ZMS と ZTS) から外側へ広がり、プラットフォーム固有の Service Identity Agent (SIA) プロバイダが多数加わった。同じ ID ブートストラップのモデルが、いまや AWS、GCP、Azure、Kubernetes、そして GitHub Actions・Buildkite・Harness・Spacelift といった CI 系まで覆う。

## 現在地

Athenz は 1.12.x のリリースラインにあり、point release を頻繁に出している。最新は 2026-06-19 の v1.12.43 (出典 6)。open governance の下にある CNCF Sandbox プロジェクトである (出典 1, 7)。開発の議論は README からリンクされる Athenz-Dev と Athenz-Users の Google Groups で行われている (出典 3)。
