# DevSpace

> DevSpace はクライアントオンリーの CLI で、ローカルのコードを Kubernetes の Pod 内で動かし、編集を双方向に同期する。オペレータや CRD を一切入れずに、実クラスタに対して開発できる。

- **カテゴリ**: Developer Tools
- **CNCF 成熟度**: Sandbox (2022-12-13 採択)
- **言語**: Go (`go 1.25.0`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [devspace-sh/devspace](https://github.com/devspace-sh/devspace)
- **ドキュメント基準コミット**: `8ff6260` (タグ `v6.4.0-rc.1` の近傍)

## 何をするものか

DevSpace は Kubernetes 上で動くアプリを開発するためのコマンドラインツールである。コンテナ化されたアプリの内側の開発ループ (inner loop) は普通は遅い。コードを編集し、イメージをビルドし、push し、再デプロイし、Pod の再起動を待ち、結果を確認する。DevSpace はこのループを畳む。ワークロードをクラスタ内で起動し、作業ディレクトリと動作中のコンテナの間でファイルを常時同期する。保存した編集は、再ビルドも再デプロイもなしに、その場でコンテナへ届く。

すべてはクライアント側で動く。DevSpace は `kubectl` や `helm` と同じ流儀で既存の kube-context を読み、クラスタには恒久的なものを何も入れない。オペレータも CRD も、reconcile を待つコントローラもない。サーバ側の唯一の部品は小さなヘルパーバイナリで、必要になったときに対象コンテナへ注入され、Pod とともに消える。ワークフロー自体は 1 枚の `devspace.yaml` に宣言され、チームが git で共有する。イメージのビルド方法、デプロイ方法、開発セッションの回し方をそこにまとめる。

DevSpace はエディタとクラスタの間、inner loop 開発の位置に立つ。デプロイプラットフォームではなく開発者ツールである。すでに使っているビルド・デプロイのバックエンド (ビルドは Docker・BuildKit・kaniko、デプロイは Helm・kubectl マニフェスト・kustomize) を置き換えず、それらを駆動する。

## いつ使うか

- アプリが Kubernetes 上でしか意味をなさず (クラスタのサービス・ConfigMap・Secret・サイドカーを必要とする)、その環境をローカルで模擬する代わりに、実際の Pod に対して開発したい。
- インタプリタ系ランタイムやホットリロード対応フレームワークで、保存した編集を数秒で動作中コンテナへ届けたい。イメージの再ビルドや再デプロイなしに。
- ビルド・デプロイ・開発のワークフローを 1 ファイルに宣言し、チーム全員が git で共有して同じやり方で開発したい。
- 自前のクラスタと kube-context をそのまま使い、クラスタには恒久的なものを何も入れたくない。
- ローカルの素のプロセスや `docker compose` で環境が十分に再現できているなら不向き。クラスタ往復は不要な可動部を増やす。
- CI や本番デプロイのツールではない。開発者の inner loop を対象とし、その Pod 置換の仕組みは開発者 1 人のセッションのために動作中ワークロードを意図的に書き換える。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと dev セッションの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [devspace-sh/devspace README](https://github.com/devspace-sh/devspace) (参照 2026-07-08)
2. [devspace ソース (固定コミット 8ff6260)](https://github.com/devspace-sh/devspace/tree/8ff6260787edacfa2c0d30d1ff62358d36d482bc) (参照 2026-07-08)
3. [The New Stack: Why Loft Labs Is Donating DevSpace to CNCF](https://thenewstack.io/why-loft-labs-is-donating-devspace-to-cncf/) (参照 2026-07-08)
4. [Loft Labs: Loft Labs Contributes Open Source Project DevSpace to the CNCF](https://www.vcluster.com/blog/loft-labs-contributes-open-source-project-devspace-to-the-cloud-native-computing-foundation) (参照 2026-07-08)
5. [DevSpace Documentation: Pipelines](https://www.devspace.sh/docs/configuration/pipelines/) (参照 2026-07-08)
6. [Loft Labs: DevSpace 6 is Here!](https://www.vcluster.com/blog/devspace-6-announcement) (参照 2026-07-08)
7. [BusinessWire: Loft Labs Contributes DevSpace to the CNCF](https://www.businesswire.com/news/home/20221215005183/en/) (参照 2026-07-08)
8. [ComputerWeekly: Loft Labs donates DevSpace to CNCF](https://www.computerweekly.com/blog/Open-Source-Insider/Loft-Labs-donates-DevSpace-to-CNCF) (参照 2026-07-08)
9. [CNCF プロジェクトページ: DevSpace](https://www.cncf.io/projects/devspace/) (参照 2026-07-08)
10. [DevSpace 公式サイト](https://www.devspace.sh/) (参照 2026-07-08)
11. [Tilt](https://tilt.dev/) (参照 2026-07-08)
12. [Garden](https://garden.io/) (参照 2026-07-08)
13. [Ugur Elveren: Best Kubernetes Development Environment for Large Teams](https://blog.ugurelveren.com/post/best-kubernetes-development-environment-for-large-teams/) (参照 2026-07-08)
14. [DevSpace v6.0.0 リリースノート](https://github.com/devspace-sh/devspace/releases/tag/v6.0.0) (参照 2026-07-08)
