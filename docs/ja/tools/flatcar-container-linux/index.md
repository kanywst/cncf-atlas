# Flatcar Container Linux

> コンテナ実行に特化した最小・イミュータブルな Linux ディストリビューション。A/B パーティション構成と自動アトミック更新を持つ。

- **カテゴリ**: Runtime
- **CNCF 成熟度**: Incubating
- **言語**: Shell と Python
- **ライセンス**: BSD-3-Clause（`scripts` リポジトリ）
- **リポジトリ**: [flatcar/scripts](https://github.com/flatcar/scripts)
- **ドキュメント対象コミット**: `d2c217c`（ブランチ `main`、2026 年 6 月）

## 何をするものか

Flatcar Container Linux はコンテナを動かす 1 点に絞った OS だ。稼働ホストにパッケージマネージャは無い。`/usr` ファイルシステムは読み取り専用でマウントされ dm-verity で保護され、OS はインストール可能なパッケージ群ではなくイメージ全体として配布される。

更新はアトミックだ。システムが片方の `/usr` パーティションから稼働している間に新イメージをもう一方へ書き込み、再起動で入れ替える。新イメージが起動に失敗すれば、ブートローダが直前のイメージへフォールバックする。これは CoreOS Container Linux が導入したモデルで、Flatcar はその系譜を保守し続ける継続先だ。

実装は [flatcar/scripts](https://github.com/flatcar/scripts) にある。Gentoo/Portage ベースのビルドシステムで、事前ビルド済みバイナリパッケージを root ファイルシステムへ emerge し、GPT イメージへ焼き込む。アンブレラの [flatcar/Flatcar](https://github.com/flatcar/Flatcar) はドキュメント、ガバナンス、issue トラッカーを持つ。

## いつ使うか

- Kubernetes や素のコンテナワークロードを動かし、ホスト OS をその場でパッチするサーバーではなく、管理され置き換え可能な単位として扱いたいとき。
- 複数クラウドとベアメタルで同じ OS を使い、初回ブート時に Ignition で宣言的に構成したいとき。
- ロールバック付きの自動更新と、稼働中コンテナを壊さない保守的なリリースペースが欲しいとき。
- デバッグのため SSH と Docker の互換性を残したい（完全な API 専用ホストではなく）とき。

稼働ホストに任意のシステムパッケージを入れたい場合や、単一クラウド向けのアプライアンス OS で既にフリート全体をカバーできる場合には不向きだ。

## この詳解の構成

- [歴史](./history): 起源、節目、なぜ存在するか。
- [アーキテクチャ](./architecture): コンポーネントとイメージのビルド経路。
- [採用とエコシステム](./adoption): 誰が運用し、何が周辺にあるか。
- [内部実装](./internals): ソースから読む、重要なコード経路。
- [入門](./getting-started): インストールと最初の動作セットアップ。

## 出典

1. [flatcar/scripts](https://github.com/flatcar/scripts)、イメージのビルド・合成スクリプト（pinned commit `d2c217c`）。
2. [Flatcar brings Container Linux to the CNCF Incubator](https://www.cncf.io/blog/2024/10/29/flatcar-brings-container-linux-to-the-cncf-incubator/)、CNCF ブログ。
3. [Flatcar Container Linux プロジェクトページ](https://www.cncf.io/projects/flatcar-container-linux/)、CNCF。
4. [Flatcar accepted into CNCF at incubating level](https://opensource.microsoft.com/blog/2024/10/29/flatcar-accepted-into-cncf-at-incubating-level/)、Microsoft Open Source。
5. [Propose Flatcar for Incubation](https://github.com/cncf/toc/pull/991)、cncf/toc PR #991。
6. [flatcar/Flatcar ADOPTERS.md](https://github.com/flatcar/Flatcar/blob/main/ADOPTERS.md)。
7. [Flatcar Container Linux enters new era after CoreOS End-of-Life](https://kinvolk.io/blog/2020/02/flatcar-container-linux-enters-new-era-after-coreos-end-of-life-announcement)、Kinvolk。
8. [Microsoft acquires Kinvolk](https://azure.microsoft.com/en-us/blog/microsoft-acquires-kinvolk-to-accelerate-containeroptimized-innovation/)、Azure ブログ。
