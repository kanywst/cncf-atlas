# Fluid

> データセットを Kubernetes の一級リソースに昇格させ、分散キャッシュ (Alluxio・JuiceFS・JindoCache など) をオーケストレーションして、AI やビッグデータのワークロードのデータアクセスを高速化する Kubernetes オペレータ。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [fluid-cloudnative/fluid](https://github.com/fluid-cloudnative/fluid)
- **ドキュメント基準コミット**: `25531595` (master, 2026-06-23。直前のリリースは `v1.0.8`, 2025-10-31)

## 何をするものか

Fluid は弾力的なデータアクセスのための Kubernetes オペレータである。リモートストレージ (オブジェクトストア・HDFS・NFS) を受動的なマウントとして扱うのではなく、データの所在を記述する `Dataset` カスタムリソースと、それぞれが分散キャッシュエンジンを包む `Runtime` リソース群を導入する。`Dataset` と同名の `Runtime` を作ると、Fluid はキャッシュシステムを展開し、両者をバインドし、結果をアプリ Pod がマウントできる通常の PersistentVolumeClaim として公開する。

狙いはローカリティである。キャッシュエンジンがデータを計算ノードの近くに引き寄せ、Fluid がスケジューリングアフィニティを注入して、キャッシュが既に存在するノードに Pod を配置する。同じ大規模データセットを繰り返し読み、リモートストレージへの帯域がボトルネックになる AI 学習や分析で最も効く。

Fluid はストレージシステムではなくオーケストレーション層である。ファイルシステムそのものは実装しない。Alluxio・JuiceFS・JindoCache・Vineyard・EFC といったエンジンを単一の抽象 (`pkg/ddc/base/engine.go:32`) の背後で管理し、Kubernetes コントローラ・CSI ドライバ・admission webhook を通じて駆動する。

## いつ使うか

- 大規模なリモートデータセットを繰り返し読み (モデル学習・バッチ分析)、各キャッシュエンジンを手組みせずノードローカルキャッシュを使いたいとき。
- 計算 Pod をキャッシュ済みデータの近くに置く、データ対応スケジューリングが欲しいとき。
- キャッシュエンジン (Alluxio・JuiceFS・JindoCache) を 1 つの宣言的 API の背後で切り替え・併用したいとき。
- 一次永続ストアが必要な場合は不向き。Fluid は他所にあるデータへのアクセスを高速化するもので、記録の正本ではない。
- データが既に高速なノードローカルディスクにあり一度しか読まないなら不要。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [fluid-cloudnative/fluid](https://github.com/fluid-cloudnative/fluid) ソース、コミット `25531595e9233cb9340a3c544eb284b400b82d50` 固定。
2. [ADOPTERS.md](https://github.com/fluid-cloudnative/fluid/blob/master/ADOPTERS.md)。
3. [LICENSE](https://github.com/fluid-cloudnative/fluid/blob/master/LICENSE) (Apache-2.0)。
4. [Fluid CNCF プロジェクトページ](https://www.cncf.io/projects/fluid/)。
5. [Fluid Becomes a CNCF Incubating Project](https://www.cncf.io/blog/2026/03/24/fluid-becomes-a-cncf-incubating-project/)。
6. [Fluid ドキュメント](https://fluid-cloudnative.github.io/docs)。
7. [GitHub REST API: fluid-cloudnative/fluid](https://api.github.com/repos/fluid-cloudnative/fluid)。
