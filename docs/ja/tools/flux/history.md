# 歴史

## 起源

Flux は 2016 年に Weaveworks 社内で生まれた。Flux が体現する運用モデルを表す GitOps という語を作ったのも同社だ。Git を宣言的インフラの単一の真実の源とし、クラスタ内で動くソフトウェアがそれをリコンサイルする。最初の公開リリース v0.1.0 は 2017-01-27 にリリースされた (Platform9 history、出典 5)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | Weaveworks で Flux 誕生。GitOps という語も同社発 (出典 5)。 |
| 2017 | 2017-01-27 に v0.1.0 リリース (出典 5)。 |
| 2019 | 2019-07-15 に CNCF Sandbox 受理 (出典 2)。 |
| 2020 | モノリシックな v1 を controller-runtime + CRD で再構築する決定。Flux v2 開始、v1 はメンテナンスモードへ、分割されたコンポーネント群が GitOps Toolkit に (出典 5)。`fluxcd/flux2` リポジトリは 2020-04-24 作成。 |
| 2021 | 2021-03-12 に CNCF Incubating へ昇格。v2 がマルチテナンシと任意数の Git リポジトリ同期を追加 (出典 2)。 |
| 2022 | 2022-11-30 に CNCF Graduated。Argo CD と同時 (出典 2, 3)。 |
| 2023 | Flux v2 が GA に到達。2 度目のセキュリティ監査を CVE ゼロで完了 (出典 4)。 |

## どう進化したか

決定的な転換は 2020 年に始まった v1 から v2 への再設計だ。v1 は単一のモノリシックなデーモンだった。v2 は処理を目的別のコントローラ群に分割し、Kubernetes controller-runtime とカスタムリソースの上に再構築した。これがまとめて GitOps Toolkit と呼ばれる (出典 5)。この分解こそ、`flux2` リポジトリが単一バイナリを抱えるのではなく `source-controller`、`kustomize-controller`、`helm-controller`、`notification-controller` の API モジュールを `go.mod` 経由で依存する理由だ。

再設計はスコープも広げた。v2 はマルチテナンシと任意数の Git リポジトリの同期を追加し、CNCF は Flux の Incubator 昇格時にこれを挙げた (出典 2)。Incubator 在籍中、プロジェクトはユーザベース・統合・利用・コントリビューションで 200〜500% の成長を報告した (出典 2)。

## 現在地

Flux は fluxcd GitHub Organization の下にある CNCF Graduated プロジェクトだ (出典 2, 3)。執筆時点の最新リリースは 2026-05-20 付けの `v2.8.8` で、リリースは `flux2` リポジトリのタグ付きバージョンとして切られる (出典 1)。プロジェクトは CLI と GitOps Toolkit コントローラ群を提供し、Kubernetes GitOps への pull 型・コントローラ駆動のアプローチとして自らを位置づけ続けている (出典 4)。
