# 採用事例・エコシステム

## 誰が使っているか

リポジトリに ADOPTERS ファイルは無く、SpiceDB を本番で運用している組織名を挙げる信頼できる一次ソースは見つからなかった。出典付きで言えるのは、SpiceDB の一部を実装・設計に貢献した企業の認可チームの集合であり、これは本番採用より弱いシグナルだが裏が取れている。

| 組織 | 関与 | 出典 |
| --- | --- | --- |
| GitHub | 認可チームが MySQL データストアを実装・寄贈 | [star-history](https://www.star-history.com/blog/spicedb/) |
| Netflix | 認可チームが Caveats のスポンサー兼設計パートナー | [star-history](https://www.star-history.com/blog/spicedb/) |
| Adobe、Google、Fastly、Plaid、Red Hat、Reddit | 貢献企業として挙げられている | [star-history](https://www.star-history.com/blog/spicedb/) |

これらは確認された本番デプロイではなく、コントリビュータの所属として扱うこと。

## 採用のシグナル

GitHub REST API から 2026-06-22 に測定:

- スター: 6,791
- フォーク: 399
- ウォッチャー (subscribers): 50
- オープン issue: 137
- コントリビュータ: 約 76

リリース頻度は `main` で安定しており、最新リリースタグは `v1.54.0`、基準コミット `4bb1d7b3` はそのすぐ先にある。

## エコシステム

- **zed**: SpiceDB サーバと対話する公式コマンドラインクライアント。
- **awesome-spicedb**: クライアントライブラリと連携をまとめたキュレーションリスト (`authzed/awesome-spicedb`)。
- **可観測性**: SpiceDB は OpenTelemetry と Prometheus と連携する (CNCF プロジェクトを利用する側であり、自身は CNCF ではない)。
- **マネージド提供**: AuthZed が SpiceDB のホスト版を提供する。

## 代替候補

最も直接の代替は OpenFGA である。どちらも Apache-2.0 の Zanzibar 系 ReBAC である。SpiceDB は gRPC ファーストで、トークンベースの厳密 consistency (ZedToken) を既定にするのに対し、OpenFGA は REST ファーストで、より高い consistency をオプトインフラグとして扱う。完全な Zanzibar consistency モデルと複数のストレージバックエンドが欲しいなら SpiceDB を、REST ファースト API と CNCF ガバナンスを重視するなら OpenFGA を選ぶ。関係グラフを伴わない属性ポリシー判定なら、どちらよりも OPA が問題に合う。

| 代替 | 違い |
| --- | --- |
| OpenFGA | REST ファースト、CNCF Incubating。高い consistency は既定ではなくオプトイン。 |
| Ory Keto | Ory スタックと統合された Go の Zanzibar 実装。consistency 制御は粗い。 |
| OPA / Rego | 関係グラフ探索ではなくポリシーコード評価。問題領域が異なる。 |
