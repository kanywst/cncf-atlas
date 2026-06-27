# 採用事例・エコシステム

## 誰が使っているか

以下の組織は、プロジェクトの `ADOPTERS.md` ファイルと adopters ページに自己申告されているものである。ファイルは組織名のみで使用規模の記述はないため、「Capsule を使っている」以上の意味には取らないこと。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Bedag Informatik AG | 掲載された採用組織 | [ADOPTERS.md:9](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Department of Defense (米国国防総省) | 掲載された採用組織 | [ADOPTERS.md:12](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Enreach | 掲載された採用組織 | [ADOPTERS.md:15](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Fastweb | 掲載された採用組織 | [ADOPTERS.md:18](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Klarrio | 掲載された採用組織 | [ADOPTERS.md:21](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| KubeRocketCI | 掲載された採用組織 | [ADOPTERS.md:24](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| ODC-Noord | 掲載された採用組織 | [ADOPTERS.md:27](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| PITS Global Data Recovery Services | 掲載された採用組織 | [ADOPTERS.md:30](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Politecnico di Torino | 掲載された採用組織 | [ADOPTERS.md:33](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Reevo | 掲載された採用組織 | [ADOPTERS.md:36](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |
| Seeweb | 掲載された採用組織 | [ADOPTERS.md:39](https://github.com/projectcapsule/capsule/blob/main/ADOPTERS.md) |

`MAINTAINERS.md` には Wargaming、Peak Scale、Proximus、ODC-Noord 所属のメンテナが現れる (出典 13)。公開の adopters ページはこのファイルを反映している (出典 7)。

## 採用のシグナル

GitHub REST API で 2026-06-26 時点に測定した値 (出典 14): スター約 2,112、フォーク 210、コントリビュータ 75、open issue 26。同時点の最新リリースは v0.13.7 で、2026-06-24 にカットされた (出典 1)。2022-12-13 に採択された CNCF Sandbox プロジェクトである (出典 2, 3)。リリースは安定した頻度で出ており、これがメンテナチームが活動的であることの最も明確なシグナルである。

## エコシステム

- Capsule Proxy: クラスタスコープ資源 (Namespace 一覧など) をテナント単位でフィルタする API プロキシ。テナントオーナーが自分の所有する資源を自己発見できるようにする。Capsule 本体だけではクラスタスコープの読み取りをフィルタできず、プロキシがその隙間を埋める。
- GitOps 連携: Capsule は宣言的かつ GitOps ready である。Clastix は Flux のリファレンス実装 (`clastix/flux2-capsule-multi-tenancy`) と Azure Kubernetes Service 上のリファレンスアーキテクチャ (`clastix/coaks-baseline-architecture`) を公開している。
- Helm: 公式のデプロイ手段。チャートは CRD のライフサイクルも管理する (`charts/capsule/README.md`)。

## 代替候補

Capsule はソフトマルチテナンシーであり、テナントは 1 つのコントロールプレーンを共有し admission control と RBAC で分離される。以下の各代替との本質的な差は、その代替がテナントに専用のクラスタスコープサーフェスを与えるか、そしてそのコストはどれだけか、にある (出典 10, 11)。

| 代替 | 違い |
| --- | --- |
| Hierarchical Namespace Controller (HNC) | Namespace を親子ツリーで入れ子にし継承させる。Namespace を構造化するが上位のテナント抽象は加えず、クラスタスコープ資源はクラスタ全体共有のまま。 |
| kiosk (Loft Labs) | Account / Space によるセルフサービス Namespace を提供していた。現在は vCluster に統合され、ほぼ非推奨。 |
| vCluster (Loft) | Namespace 内にテナントごとの仮想 API サーバを立て、各テナントが事実上 cluster-admin としてクラスタスコープ資源を管理できる。コントロールプレーンあたりの資源コストは高い。 |
| Kamaji (Clastix) | Control Plane as a Service。テナントごとに専用コントロールプレーンを持ち、内部チームより Kubernetes-as-a-Service プロバイダ向け。 |

これらの比較からの目安: 相互信頼のある内部チームには Capsule のソフト分離で十分かつ運用コストが安い。専用のクラスタスコープ資源を必要とする非信頼テナントには、vCluster や Kamaji のようなハード分離ツールが適する。
