# Knative

> Knative はコンテナを Kubernetes 上でリクエスト駆動のサーバーレスワークロードとして動かし、ゼロスケールまで行う。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [knative/serving](https://github.com/knative/serving)
- **ドキュメント基準コミット**: `6fb71ff` (タグ `knative-v1.22.0` の 46 コミット後、committer date 2026-06-19)

## 何をするものか

Knative は、ただのコンテナイメージをリクエスト駆動のサービスに変える Kubernetes コントローラ群である。イメージと並行数ターゲットを渡すと、Deployment を管理し、負荷に応じてレプリカ数を増減させ、トラフィックが来なければゼロまで縮退させる。中核実装は `knative/serving` にあり、本ディープダイブの対象もこれ。イベント配信を担う別リポジトリ `knative/eventing` は対象外とする。

Serving は reconciler 群のコントロールプレーン (`cmd/controller/main.go:56`) と、2 つの要素から成るデータプレーンに分かれる。データプレーンの一つは activator で、ゼロスケール中の Revision が起動する間リクエストをバッファする。もう一つは queue-proxy サイドカーで、各ユーザ Pod 上でライブの並行数を計測する。autoscaler (Knative Pod Autoscaler、KPA) がこの計測値を消費してレプリカ数を決める。

ユーザが触る API は 4 つのカスタムリソースである。`Service` は `Configuration` と `Route` を束ねるトップレベルオブジェクト (`pkg/apis/serving/v1/service_types.go:42`)。Configuration を変更するたびに immutable な `Revision` が生まれ、`Route` が Revision 群へトラフィックを百分率で分配する。

## いつ使うか

- アイドル時にゼロまで縮退し、要求に応じて立ち上がる HTTP/gRPC ワークロードを、自前のオートスケーリング配線なしで実現したいとき。
- 百分率ベースのトラフィック分割と Revision 単位のロールバックを、CI スクリプトではなく組み込みのプリミティブとして使いたいとき。
- スケールのシグナルがリクエスト並行数または RPS、つまり Knative が直接計測するライブ負荷シグナルのとき。
- スケールのシグナルがキュー長や外部イベントソースの場合は不向き。その用途は KEDA がより直接的に扱う。
- 常に固定レプリカ数で動きゼロスケールしない長命サービスには過剰である。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [knative/serving](https://github.com/knative/serving) (ソース、README、LICENSE、go.mod)。コミット `6fb71ff` で読了。
2. [knative/community ADOPTERS.MD](https://github.com/knative/community/blob/main/ADOPTERS.MD)。
3. [Knative project page (CNCF)](https://www.cncf.io/projects/knative/)。
4. [CNCF Announces Knative's Graduation (2025-10-08)](https://www.cncf.io/announcements/2025/10/08/cloud-native-computing-foundation-announces-knatives-graduation/)。
5. [Knative accepted as a CNCF incubating project (2022-03-02)](https://www.cncf.io/blog/2022/03/02/knative-accepted-as-a-cncf-incubating-project/)。
6. [Knative Has Finally Graduated From the CNCF (The New Stack)](https://thenewstack.io/knative-has-finally-graduated-from-the-cncf/)。
7. [cncf/toc #1868 Knative Incubating to Graduating checklist](https://github.com/cncf/toc/issues/1868)。
8. [KEDA vs Knative vs Kubernetes HPA (ThinhDA)](https://thinhdanggroup.github.io/keda-knative-kubenetes/)。
9. [Serverless Open-Source Frameworks (CNCF)](https://www.cncf.io/blog/2020/04/13/serverless-open-source-frameworks-openfaas-knative-more/)。
10. [Knative documentation](https://knative.dev/docs/)。
11. [GitHub REST API repos/knative/serving](https://api.github.com/repos/knative/serving)。
