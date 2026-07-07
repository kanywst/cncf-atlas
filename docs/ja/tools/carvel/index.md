# Carvel

> Carvel は単機能の Kubernetes ツール群であり、そのクラスタ内エンジン kapp-controller が、宣言的なパイプラインでアプリケーション構成を fetch・template・deploy する。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [carvel-dev/kapp-controller](https://github.com/carvel-dev/kapp-controller)
- **ドキュメント基準コミット**: `be1faef` (v0.60.3)

## 何をするものか

Carvel は単一のプログラムではない。それぞれが 1 つの仕事をこなす小さなコマンドラインツールの集まりである。`ytt` は YAML をテンプレート化し、`kbld` はイメージ参照を解決し、`imgpkg` は構成を Open Container Initiative (OCI) イメージとしてパッケージ化し、`vendir` はリモートソースを取り込み、`kapp` はリソース群を 1 つの単位としてクラスタへ適用する。これらのツールは、UNIX コマンドをパイプで繋ぐように組み合わせて使うことを前提としている。

本ディープダイブが扱うのは、それらのツールを束ねるクラスタ内エンジン `kapp-controller` である。これは controller-runtime 上に構築された Kubernetes コントローラだ。カスタムリソース (CR) を監視し、まず `App`・`PackageInstall`・`PackageRepository` を対象とする。各 `App` に対しては 3 段階のパイプライン (構成を fetch し、template し、deploy する) を実行する。各段は Carvel のコマンドラインツールのいずれかを呼び出す。

kapp-controller は、GitOps エンジンやパッケージマネージャが位置する場所に座る。`App` リソースは、構成がどこから来るか、どうレンダリングするか、どう適用するかを宣言する。kapp-controller はその宣言をタイマーでクラスタと突き合わせて調整し、各段の結果をリソースの status に記録する。

## いつ使うか

- git・Helm チャート・OCI バンドルからのアプリ構成を宣言的かつ継続的に調整したく、ドリフト是正を `kapp` に任せたいとき。
- ソフトウェアをバージョン付きパッケージとして配布し、クラスタ運用者が `PackageInstall` でインストールできるようにしたいとき (OCI レジストリを背後に持つパッケージマネージャに近い)。
- 1 つの巨大なテンプレート兼デプロイバイナリより、焦点を絞ったツールの組み合わせを好むとき。
- 一方、クライアント側の一度きりの apply だけで足り、あるいはチームが既に単一の GitOps コントローラに統一していてクラスタ内に 2 つ目の調整器を増やしたくない場合は、適合度が下がる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと reconcile の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [carvel-dev/kapp-controller](https://github.com/carvel-dev/kapp-controller) (主実装)、2026-06-26 参照。
2. [carvel-dev/carvel](https://github.com/carvel-dev/carvel) (umbrella / community)、2026-06-26 参照。
3. [Introduction to Carvel](https://carvel.dev/blog/introduction-to-carvel-blog-post/)、2026-06-26 参照。
4. [Carvel Sets Sail for the CNCF Sandbox (VMware OSS)](https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/)、2026-06-26 参照。
5. [Project Carvel has joined the CNCF](https://carvel.dev/blog/carvel-cncf-sandbox/)、2026-06-26 参照。
6. [CNCF project page: Carvel](https://www.cncf.io/projects/carvel/)、2026-06-26 参照。
7. [kapp-controller ドキュメント](https://carvel.dev/kapp-controller/)、2026-06-26 参照。
8. [Comparing Kubernetes deployment tools (NETWAYS)](https://nws.netways.de/blog/2024/07/16/comparing-kubernetes-deployment-tools-what-we-got-today)、2026-06-26 参照。
9. [kapp-controller releases](https://github.com/carvel-dev/kapp-controller/releases) (v0.60.3 アセット)、2026-06-26 参照。
