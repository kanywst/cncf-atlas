# 採用事例・エコシステム

## 誰が使っているか

CNCF のグラジュエーション発表は具体的な利用者とプロバイダを名指しした。Volvo Cars、SAP、RingCentral が利用者として挙げられ、AWS、D2iQ、Microsoft、Red Hat、VMware、Weaveworks が自社の顧客向け GitOps 提供に Flux を採用していると挙げられた (出典 2)。プロジェクトの ADOPTERS ページにはさらに多くの自己申告組織が載っている (出典 6)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Volvo Cars | CNCF グラジュエーション発表で名指しの利用者 | [CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/) |
| SAP | CNCF グラジュエーション発表で名指しの利用者 | [CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/) |
| RingCentral | CNCF グラジュエーション発表で名指しの利用者 | [CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/) |
| AWS, Microsoft, Red Hat, VMware, D2iQ, Weaveworks | 自社の GitOps 提供に Flux を組み込み | [CNCF announcement](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/) |
| Grafana Labs, Kong, Maersk, Cookpad, BlaBlaCar, Giant Swarm | Flux ADOPTERS ページで自己申告 | [Flux Adopters](https://fluxcd.io/adopters/) |

ADOPTERS ページには他にも Cisco、Sonatype、UiPath、Replicated、Scaleway、Infomaniak、Orange、MediaMarktSaturn、Pets at Home、Tchibo、Tietoevry、Trifork、TrueLayer、J.B. Hunt、University of Bordeaux、Virginia Tech、William & Mary などが載る (出典 6)。自己申告リストなので、検証済みのデプロイ一覧ではなく裾野の広さのシグナルとして扱う。

## 採用のシグナル

2026-06-22 に `gh api repos/fluxcd/flux2` で観測 (出典 1):

- Stars: 8,208
- Forks: 765
- Watchers: 68
- コントリビュータ: 約 210 (匿名含む。page 210 までページネーション)
- 最新リリース: `v2.8.8`、2026-05-20 付け

CNCF は、Flux の Incubator 在籍期間 (2021-03〜2022-11) にユーザベース・統合・利用・コントリビューションが 200〜500% 成長したと報告した (出典 2)。

## エコシステム

Flux はテンプレーティングに Kustomize と Helm、デリバリに Cosign 署名検証付きの OCI アーティファクト、secret に SOPS と HashiCorp Vault を統合する (出典 4)。同系統の隣接プロジェクトには、プログレッシブデリバリの Flagger と、OSS Web UI の Weave GitOps がある。Flux はしばしば Terraform や Crossplane と併用され、EKS や AKS などクラウドプロバイダのマネージドコンポーネントとしても提供される (出典 4)。

## 代替候補

直接の代替は Argo CD で、同じ日に CNCF グラジュエートした (出典 2)。違いはアーキテクチャにある。Argo CD はハブ&スポークのコントロールプレーン、一級の `Application` 抽象、リッチな Web UI を中心に据える。Flux は専用コントローラ群を持つ自律的なクラスタ内エージェントとして動き、CLI ファーストのワークフローを取る (出典 7)。Helm の扱いも違う。Argo CD は `helm template` でチャートをレンダリングし、Flux は `HelmRelease` カスタムリソースを一級のデリバリ機構としてリコンサイルする。Flux は secret に SOPS をネイティブ統合する。軽いクラスタあたりフットプリント、エッジや制約環境、強いマルチテナンシなら Flux を、中央コントロールプレーンと主要 Web UI が重要なら Argo CD を選ぶ (出典 7)。

| 代替 | 違い |
| --- | --- |
| Argo CD | `Application` 抽象とリッチな Web UI を持つ中央ハブ&スポークのコントロールプレーン。対する Flux はクラスタごとの分散エージェントと CLI ファーストモデル (出典 7)。 |
