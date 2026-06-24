# Flux

> Git に置いたマニフェストと Kubernetes クラスタの状態を継続的に一致させ続ける GitOps ツール。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [fluxcd/flux2](https://github.com/fluxcd/flux2)
- **ドキュメント基準コミット**: `65d975b` (main, 2026-06-19; 最寄りタグ `v2.8.8`)

## 何をするものか

Flux は Kubernetes の構成を Git から配信する。YAML をリポジトリに commit すると、クラスタ内のコントローラ群がその状態を pull して適用する処理を繰り返し、クラスタは Git が示す状態へ収束する。開発者のラップトップや CI ランナーからクラスタへ push するものは何もない。

`fluxcd/flux2` リポジトリは 2 つの顔を持つ。`flux` CLI は day-0 の作業を担う。クラスタのブートストラップ、マニフェスト生成、状態の確認だ (`cmd/flux/main.go:43`)。継続的なリコンサイルは GitOps Toolkit のコントローラ群が行う。これらは別リポジトリにあり、`go.mod` を通じて API モジュールとして取り込まれる。デフォルトインストールでは `source-controller`、`kustomize-controller`、`helm-controller`、`notification-controller` が立ち上がる (`pkg/manifestgen/install/options.go:46`)。

特徴的なのは、Flux が自分自身を GitOps 管理下に置く点だ。ブートストラップ後、Flux 自身のコンポーネントマニフェストも Git に存在し、クラスタ内の `kustomize-controller` が他のワークロードと同様にリコンサイルする。Flux のアップグレードは commit に帰着し、day-1 以降は CLI を必要としない。

## いつ使うか

- 各クラスタが自分自身をリコンサイルし、CI からの中央 push を行わない pull 型 GitOps モデルが欲しいとき。
- 多数のクラスタやエッジ環境を運用し、クラスタあたりの常駐フットプリントを小さくしたいとき。
- Helm を一級のデリバリ機構として扱い、CI でレンダリングするのではなく `HelmRelease` オブジェクトをコントローラにリコンサイルさせたいとき。
- リコンサイルループ内で secret の SOPS ネイティブ復号が必要なとき。
- 単一の中央コントロールプレーンとリッチな Web UI を主要インターフェースにしたい場合は不向き。その形には Argo CD がより直接的に合う。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [fluxcd/flux2 リポジトリ](https://github.com/fluxcd/flux2) (source, LICENSE, go.mod, Makefile)、参照日 2026-06-22。
2. [Flux Graduates from the CNCF Incubator](https://www.cncf.io/announcements/2022/11/30/flux-graduates-from-cncf-incubator/)、参照日 2026-06-22。
3. [Flux is a CNCF Graduated project](https://fluxcd.io/blog/2022/11/flux-is-a-cncf-graduated-project/)、参照日 2026-06-22。
4. [What is Flux CD? (CNCF)](https://www.cncf.io/blog/2023/09/15/what-is-flux-cd/)、参照日 2026-06-22。
5. [An introduction to Flux, Part 1: History and features (Platform9)](https://platform9.com/blog/an-introduction-to-flux-part-1-history-and-features/)、参照日 2026-06-22。
6. [Flux Adopters](https://fluxcd.io/adopters/)、参照日 2026-06-22。
7. [Flux vs Argo CD (Northflank)](https://northflank.com/blog/flux-vs-argo-cd)、参照日 2026-06-22。
