# 歴史

## 起源

k8gb は 2019 年の終わりに、南アフリカの銀行 Absa の中で始まった。リポジトリの `ADOPTERS.md` がそのまま書いている。"K8GB was created in Absa and had its first production use in cross-regional datacenter context"。課題は、複数のデータセンターで Kubernetes を動かす銀行にとってごく普通のものだった。同じアプリケーションが 2 か所にあり、ホスト名は 1 つ、リージョンが落ちたらトラフィックを動かす必要がある。

最初のコミットは 2019-11-27、作者は Donovan Muller。続く 2 つは `[WIP] Added initial solution documentation` (同日) と `[WIP] Added more use cases` (2019-11-28)。Tekton と同じく、コードではなく設計文書から始まっている。

出自はいまもツリーに残っている。コンテナイメージは歴史的に Docker Hub の `absaoss/k8gb` に公開されていて、README は現在の既定が `registry.k8gb.io/k8gb-io/k8gb` であることを説明する際にそれに触れている (`README.md:34`)。より影響が大きいのは API グループで、当初は `k8gb.absa.oss` という特定ベンダーのドメインだった。2026 年はそこからの移行に費やされている。

## 年表

| 年 | 出来事 |
| --- | --- |
| 2019 | 2019-11-27 に Absa で最初のコミット。ソリューションの文書から出発 |
| 2021 | 2021-03-30 に CNCF sandbox 入り [1], [2]。`v0.8.0` を 2021-05-13 にタグ付け |
| 2024 | `v0.14.0` を 2024-09-16 にタグ付け |
| 2026 | 2026-03-09 に ADR-0002 が accepted となり API グループを `k8gb.io` へ。`v0.20.0` が 2026-07-03。2026-07-18 に CNCF incubating へ昇格、発表は 2026-08-05 [1]。`v1.0.0` が 2026-09-02 |

タグとコミットの日付はピン留めした clone の git 履歴から。sandbox・incubation・発表の日付は挙げた CNCF の出典による。

## どう変わってきたか

2026 年をもっとも形づくったのは API グループの改名だった。`k8gb.absa.oss/v1beta1` はプロジェクトを作った会社の名前を含んでいて、中立なガバナンスの下にあるプロジェクトとしては問題だとメンテナは判断した。ADR-0002 (`adr/0002-migrate-gslb-api-group-to-vendor-neutral-k8gb-io.md`、2026-03-09 accepted) にその理由と、ありがたいことに却下された案も残っている。

- **一斉切り替え**: `k8gb.io` だけにする。既存クラスタがすべて壊れる。
- **双方向同期**: 両方のグループを書き込み可能なまま同期させる。ADR は「真実の源が 2 つできる」として却下している。
- **片方向の移行ブリッジ**: `k8gb.io` を正準とし、移行期間は旧 CRD も読めるようにし、旧オブジェクトを自動で移行する。

採ったのは 3 つ目。この判断が、リポジトリにほぼ同一に見える API パッケージが 2 つある理由になっている。`api/v1beta1` はグループ `k8gb.absa.oss` を宣言し (`api/v1beta1/groupversion_info.go:31`)、`api/v1beta1io` は `k8gb.io` を宣言する (`api/v1beta1io/groupversion_info.go:32`)。両者を橋渡しするのが `controllers/gslb_migration_controller.go` と `controllers/conversion_k8gbio.go` で、その間も旧オブジェクトを動かし続けるのが `controllers/gslb_legacy_controller.go`。

もうひとつ目に見える流れは CNCF の階段。2021 年 3 月に sandbox、2026 年 7 月に incubating、そしてその 6 週間後に `v1.0.0`。順序が面白い。1.0 を出すより先に incubating の成熟度に到達している。普通とは逆で、成熟度が先走ったのではなくバージョン番号のほうが抑えられていたことを示唆する。

## 現在地

`v1.0.0` のタグは 2026-09-02。このディープダイブが読んでいるコミットの 1 日前。API グループの移行は完了ではなく進行中で、両方のグループがまだコンパイルされるし、ローカル開発環境は移行パスを常に動かしておくため意図的に旧グループのリソースを配置する (`docs/local.md`)。

プロジェクトは健全性の指標を目立つ場所に出している。README には CLOMonitor、OpenSSF Scorecard、CII Best Practices (project 4866)、FOSSA のバッジが並び、コンテナイメージと Helm チャートは cosign で署名されて `ghcr.io/k8gb-io` に公開される (`docs/CONTRIBUTING.md`)。ガバナンス関連の文書 (`GOVERNANCE.md`, `SECURITY.md`, `SECURITY-INSIGHTS.yml`, `self-assessment.md`) もすべてツリーにある。CNCF の incubation 審査が求めるものが揃っている。
