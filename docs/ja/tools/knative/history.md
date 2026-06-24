# 歴史

## 起源

Knative は 2018 年に Google で発足した。プロプライエタリなプラットフォームではなく Kubernetes 上でサーバーレスワークロードを動かすことが狙いだった。IBM、Red Hat、VMware、SAP が初期から参加している ([CNCF 卒業アナウンス](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/)、[The New Stack](https://thenewstack.io/knative-has-finally-graduated-from-the-cncf/))。`knative/serving` リポジトリは 2018-01-24 に作成された ([GitHub API](https://api.github.com/repos/knative/serving))。

当初は Build / Serving / Eventing の 3 本柱だった。Build は後に Tekton へ発展して分離し、Serving と Eventing の 2 本柱が中核として残った ([The New Stack](https://thenewstack.io/knative-has-finally-graduated-from-the-cncf/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2018 | Google で発足。Serving リポジトリは 2018-01-24 作成 |
| 2021 | v1.0 リリース、production ready を宣言 |
| 2022 | CNCF Incubating プロジェクトとして受理 (2022-03-02) |
| 2025 | CNCF 卒業 (2025-09-11 卒業、2025-10-08 アナウンス) |

## どう進化したか

スコープは時間とともに絞られた。Build は Tekton として外へ出て、プロジェクトは Serving (リクエスト駆動オートスケーリング) と Eventing (イベント配信) の 2 つの安定面に落ち着いた ([The New Stack](https://thenewstack.io/knative-has-finally-graduated-from-the-cncf/))。2021 年の v1.0 リリースは API の安定化と production ready の姿勢を示した ([CNCF アナウンス](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/))。

CNCF Incubating は 2022-03-02 に受理された ([CNCF ブログ](https://www.cncf.io/blog/2022/03/02/knative-accepted-as-a-cncf-incubating-project/))。卒業はプロジェクト発足からおよそ 7 年後で、TOC レビューは [cncf/toc #1868](https://github.com/cncf/toc/issues/1868) で追跡され、2025-10-08 にアナウンスされた ([CNCF アナウンス](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/))。

## 現在地

Knative は CNCF Graduated プロジェクトである ([CNCF プロジェクトページ](https://www.cncf.io/projects/knative/))。卒業時点で掲げる方向性は、ネットワークスタックを Kubernetes Gateway API へ寄せること、安全側デフォルトのコンテナ設定を強化すること、メトリクスとトレースを OpenTelemetry へ移すことである ([CNCF アナウンス](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/))。本ディープダイブはコミット `6fb71ff` のコードを読む。これは `knative/serving` リポジトリでタグ `knative-v1.22.0` の 46 コミット後にあたる。
