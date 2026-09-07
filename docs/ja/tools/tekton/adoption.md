# 採用事例・エコシステム

## 誰が使っているか

Tekton のリポジトリに `ADOPTERS` ファイルは無い。以下の名前は、プロジェクトの CNCF incubation 申請と、CNCF による受け入れ発表から取っている。申請には Apple も載っているが「要確認」の扱いなので、ここには含めない。

| 組織 | 用途 | 出典 |
| --- | --- | --- |
| Google | 申請に記載のアダプタ。プロジェクトの寄贈元でもある | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Red Hat | 申請に記載のアダプタ。Tekton の上に OpenShift Pipelines を出している | [CNCF, 2026-03-24](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/) |
| IBM | 申請に記載のアダプタ。Tekton の上に IBM Cloud Continuous Delivery を出している | [CNCF, 2026-03-24](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/) |
| CloudBees | 申請に記載のアダプタ | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Nubank | 申請に記載のアダプタ | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Marriott Vacations Worldwide | 申請に記載のアダプタ | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| OneStock | 申請に記載のアダプタ | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| SolarWinds | 申請に記載のアダプタ | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Ozone | 申請に記載のアダプタ | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Kaiju.ci | 申請に記載のアダプタ | [cncf/toc#1310](https://github.com/cncf/toc/issues/1310) |
| Puppet | CNCF の受け入れ発表に名前が挙がる | [CNCF, 2026-03-24](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/) |
| Ford Motor Company | CNCF の受け入れ発表に名前が挙がる | [CNCF, 2026-03-24](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/) |

注目すべき傾向として、大きな名前のいくつかは自分で動かすエンドユーザーではなく、製品の中に Tekton を組み込んで出しているベンダーだという点がある。Red Hat OpenShift Pipelines と IBM Cloud Continuous Delivery はどちらも、利用者の大半が Tekton として意識しないままの Tekton 導入を意味する。

## 採用の指標

CNCF の発表より、2026-03-24 時点 ([CNCF](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/)): GitHub star 11,000 超、PR 5,000 超、issue 2,500 超、プロジェクトの歴史を通じた contributor 600 人超。

[incubation 申請](https://github.com/cncf/toc/issues/1310)より: 直前の 6 か月で 10 件以上の貢献をした contributor が 60 人超。Artifact Hub には Tekton の task が 350 件超。コンポーネント別のメンテナ数は Pipelines 13、Results 11、Triggers 5、Chains 5、CLI 5、Operator 5、Dashboard 4。単一コンポーネントのプロジェクトならリスクが高いところで、7 つのコンポーネントにそれぞれ 5 人以上が付いている広がりこそ、incubation の審査が見るもの。

リリースは月次で、長期サポート版が年 4 回、1 月・4 月・7 月・10 月 (`releases.md`)。継続的な活動量は [Tekton DevStats](https://tekton.devstats.cncf.io/) に公開されている。

## エコシステム

Tekton ファミリ。いずれも同じ CRD を読む別々のコントローラ。

- **Triggers**: webhook などのイベントを受けて `PipelineRun` を作る。これが無いと、実行の作成はクラスタの外にある何かがやることになる。
- **Chains**: 完了した実行を監視し、生成された成果物に Sigstore で署名して SLSA provenance を出す。Tekton は自分のリリースイメージの署名にこれを使っている (`releases.md`)。
- **Results**: 完了した実行を保管し、履歴が etcd の保持期間より長く残るようにする。
- **CLI (`tkn`)**、**Dashboard**、**Operator**、**Hub**: 人間向けの面とインストールの面。

プロジェクト自身が挙げる統合先: GitOps の Argo CD、ワークロード ID の SPIFFE/SPIRE、Chains 経由の Sigstore、CloudEvents、メトリクスとトレースの OpenTelemetry と Prometheus、Operator を通じた Helm、task カタログの Artifact Hub。リポジトリにも `pkg/spire/` と `pkg/tracing/` がある。

商用ディストリビューション: Red Hat OpenShift Pipelines と IBM Cloud Continuous Delivery ([CNCF](https://www.cncf.io/blog/2026/03/24/tekton-becomes-a-cncf-incubating-project/))。Red Hat の Pipelines as Code は Tekton の上に載る開発者向けのレイヤ。

## 代替

| 代替 | どこが違うか |
| --- | --- |
| Argo Workflows | 同じく Kubernetes ネイティブで、同じく DAG を CRD で書く。Argo は汎用のワークフローエンジンで CI/CD はその用途のひとつ。Tekton の API は CI/CD の名詞で切られている。実務ではデータパイプラインに Argo Workflows、デリバリに Tekton や Argo CD、という併用も多い |
| GitHub Actions, GitLab CI | UI とマーケットプレイスを備え、運用するコントロールプレーンが無いホスト型の製品。引き換えに、クラスタ間のポータビリティと、パイプラインを Kubernetes オブジェクトとして扱えることを失う |
| Jenkins, Jenkins X | 既存勢力であり CDF の兄弟。Jenkins X は実行エンジンとして Tekton を採用した。両者の位置関係を物語っている |
| Dagger | パイプラインを汎用言語のコードとして書き、コンテナで実行する。Kubernetes のカスタムリソースではない。ローカル再現性は上、クラスタネイティブな RBAC や監査の話は無い |
| Concourse | 同じくコンテナベースで宣言的だが、Kubernetes の CRD ではなく独自のスケジューラとリソースモデルを持つ |

結局の問いは「CI/CD を Kubernetes のオブジェクトとして表現したいか」に集約される。したいなら候補は Tekton と Argo Workflows で、選択は CI/CD 型の API が助けになるか邪魔になるかで決まる。したくないなら、ホスト型の製品のほうがほぼ確実に手間が少ない。
