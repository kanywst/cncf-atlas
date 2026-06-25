# 歴史

## 起源

Contour は 2017 年に Heptio で始まった。GitHub リポジトリの作成日は 2017-10-26 である。動機は標準の Kubernetes `Ingress` 仕様の制約だった。TLS 委譲・マルチチームでの安全な運用・リッチなルーティングを、ベンダー固有のアノテーションに頼らずには表現できなかった。Contour はその隙間を、Envoy をデータプレーンとして駆動することで埋めようとした。

Heptio は 2018 年に VMware に買収され、Contour の開発は VMware 配下で継続した。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | Heptio でプロジェクト発足 (リポジトリ作成 2017-10-26)。 |
| 2018 | Heptio が VMware に買収され、開発が VMware 配下で継続。 |
| 2019 | Contour 1.0 リリース (2019 年 11 月)。 |
| 2020 | cncf/toc PR #330 で CNCF への寄贈を開始、2020-07-07 に Incubating として受理。 |
| 2020 | Cure53 による第三者セキュリティ監査 (2020 年 12 月)。 |

## どう進化したか

CNCF への寄贈は 2020 年初頭、Michael Michael による cncf/toc PR #330 で開始された。デューデリの過程で TOC は、提案提出時にガバナンス文書が見当たらず審査中に新規作成された点を指摘し、メンテナは「運用はしていたが明文化していなかった」と回答した。TOC は 2020-07-07 に Contour を Incubating プロジェクトとして受理した。

Cure53 による第三者セキュリティ監査は 2020 年 12 月に完了した。報告書 (`Contour_Security_Audit_Dec2020.pdf`) はリポジトリに同梱されている。

設定の入口は時間とともに、標準 `Ingress` と `HTTPProxy` CRD から Gateway API へと拡大し、さらに Gateway API オブジェクトから Envoy と Contour のワークロードを生成する Gateway provisioner も加わった。

## 現在地

Contour は引き続き CNCF Incubating プロジェクトである。基準コミット時点で `main` は Envoy 1.38.3・Kubernetes 1.34〜1.36・Gateway API 1.3.0 を対象とし、最新リリース `v1.33.5` (2026-05-28) は Envoy 1.35.10 を対象とする。メンテナは `projectcontour/community` リポジトリの `MAINTAINERS.md` に、CNCF 側は `cncf/foundation` の `project-maintainers.csv` に記載される。triage は週次のコミュニティミーティングで行われる。

## 出典

- projectcontour/contour リポジトリ: <https://github.com/projectcontour/contour>
- TOC accepts Contour as Incubating project (CNCF): <https://www.cncf.io/blog/2020/07/07/toc-accepts-contour-as-incubating-project/>
- Donate Contour to CNCF (cncf/toc PR #330): <https://github.com/cncf/toc/pull/330>
- cncf/foundation project-maintainers.csv: <https://github.com/cncf/foundation/blob/main/project-maintainers.csv>
