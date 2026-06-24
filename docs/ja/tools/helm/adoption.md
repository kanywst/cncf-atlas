# 採用事例・エコシステム

## 誰が使っているか

以下は Helm 自身の [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) に記載された組織。ファイルは利用している事実を記録するもので各デプロイの詳細はないため、ユースケース欄はファイルに書かれた内容のみを反映する。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| IBM | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Microsoft | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Oracle | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| New Relic | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Percona | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Samsung SDS | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Octopus Deploy | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Qovery | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| InfoCert | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |
| Ville de Montreal | Helm 採用組織として記載 | [ADOPTERS.md](https://github.com/helm/helm/blob/main/ADOPTERS.md) |

## 採用のシグナル

GitHub API から 2026-06-22 時点で計測:

- スター: 29,902
- フォーク: 7,670
- コントリビュータ: 371 (API の `Link` ヘッダ最終ページ)
- リポジトリ作成: 2015-10-06

CNCF 2025 サーベイでは Kubernetes 利用者の約 75% が Helm を利用していると広く報じられている。一次サーベイ原典は確認できなかったため、これは原典ではなく比較記事群からの二次出典扱い。

## エコシステム

Argo CD や Flux といった GitOps コントローラは Helm チャートを first-class の入力として描画・同期するので、チャートを Git 駆動パイプラインがデプロイする単位にできる。チャートは Helm 3.8 以降 OCI レジストリ (ECR・GAR・GHCR・Docker Hub) で配布でき、HTTP チャートリポジトリと併用できる。Artifact Hub が公開チャートのエコシステムをインデックスしており、1 万を優に超えるチャートを抱える。隣接して Helmfile が複数リリースを一括でオーケストレーションする。

## 代替候補

Helm の際立った特徴はチャート、すなわち Go テンプレート・provenance 署名・OCI 配布を兼ね備えたバージョン管理・配布可能なパッケージだ。多くの OSS が一次インストール手段として Helm チャートを公開しており、この到達範囲は他ツールにない。代償は Go テンプレートの可読性の低さと、型付き設定に比べた描画後 YAML の検証のしにくさ。Helm 4 で server-side apply をネイティブ化し、新しいツールが突いていた差を一部埋めた。

| 代替 | 違い |
| --- | --- |
| [Kustomize](https://www.ibm.com/think/insights/kustomize-vs-helm) | テンプレート無し。素の YAML に overlay と patch を重ねる。`kubectl apply -k` で kubectl 内蔵。パッケージ配布モデルを持たない。 |
| [Timoni](https://timoni.sh/comparison/) | Go テンプレートでなく CUE を使い、OCI artifact として digest 固定で配布、Cosign 署名、Flux のドリフト検出付き server-side apply。まだ early。 |
| [Carvel kapp / Helmfile](https://dev.to/glasskube/our-top-13-deployment-templating-tools-for-kubernetes-4mei) | kapp はリソース集合の apply と diff に注力。Helmfile は複数の Helm リリースを宣言的にオーケストレーションする。 |
