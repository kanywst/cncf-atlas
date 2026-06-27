# 採用事例・エコシステム

## 誰が使っているか

プロジェクトの `ADOPTERS.md` に公開記載されている組織は 1 つ、Armada を立ち上げた G-Research のみである。それ以外の組織は記載がないため、ここでは G-Research だけを挙げる。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| G-Research | Armada を本番運用し、1 日あたり数百万ジョブを数万ノードにまたがって処理 | [ADOPTERS.md](https://github.com/armadaproject/armada/blob/master/ADOPTERS.md) |

Armada を採用して掲載されたい場合、ADOPTERS ファイルが pull request を歓迎している (ADOPTERS.md:5)。G-Research 以外に公開・引用可能な採用者リストは無いため、以下の GitHub シグナルが利用可能な利用の証跡になる。

## 採用のシグナル

GitHub REST API から 2026-06-26 に測定:

- スター: 602
- フォーク: 166
- オープン issue: 109
- コントリビュータ: 約 102 (contributors API の last page)
- リポジトリ作成: 2019-06-19、最終 push: 2026-06-26
- 最新リリース: v0.21.6 (2026-06-26)

Armada は CNCF Sandbox プロジェクトで、2022-07-25 に受理された (CNCF プロジェクトページ)。リリースが頻繁なこと自体、活発なメンテナンスのシグナルである。

## エコシステム

- Apache Pulsar は必須依存。サブシステム間の全メッセージをルーティングするイベントログである (`docs/system_overview.md:62`)。
- PostgreSQL が scheduler と Lookout を支え、Redis はローカル開発スタックに含まれる (README:81)。
- Prometheus 連携がシステム挙動とリソース割当の analytics を公開する (README:30)。
- Airflow operator が Armada を Airflow ワークフローに統合する (`docs/armada_airflow_operator.md`)。
- Python・Java・.NET のクライアントライブラリがある (`docs/client_libraries.md`)。
- Kubernetes への推奨インストール経路は Armada Operator (README:47-50)。

## 代替候補

Armada はマルチクラスタかつクラスタ外の meta-scheduler である。多くの代替は単一クラスタ内でスケジュールする点が主な違いである。

| 代替 | 違い |
| --- | --- |
| Volcano (CNCF Incubating) | 単一 Kubernetes クラスタ向けのクラスタ内バッチスケジューラ。Armada はクラスタ外から多数のクラスタにまたがってキューイング・スケジュールする。 |
| Kueue (Kubernetes SIG) | クラスタ内のジョブキューイング。Armada のクラスタ横断キューと違い単一クラスタ志向。 |
| Apache YuniKorn | Kubernetes 向けのバッチ・データスケジューラだが、やはりクラスタ内スケジューリング志向。 |
| Karmada / Open Cluster Management | マルチクラスタだが汎用ワークロードのフェデレーション向けで、高スループットなバッチキューイングが主眼ではない。 |

バッチ規模が単一クラスタを超え、etcd に過負荷をかけず数百万ジョブのキューが必要なら Armada を選ぶ (README:21)。単一クラスタで規模が足り、より簡潔なデプロイが欲しいならクラスタ内スケジューラを選ぶ。
