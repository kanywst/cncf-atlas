# Dalec

> Dalec は Docker BuildKit のフロントエンドであり、1 枚の宣言的 YAML spec から、ネイティブな RPM/DEB パッケージと、署名・SBOM 付きの最小コンテナを、Docker だけでビルドする。

- **カテゴリ**: Supply Chain
- **CNCF 成熟度**: Sandbox (2025-10-08 採択)
- **言語**: Go (`go 1.25.9`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [project-dalec/dalec](https://github.com/project-dalec/dalec)
- **ドキュメント基準コミット**: `0d888c2` (main, 2026-06-26, タグ `v0.21.2` の近傍)

## 何をするものか

Dalec は Docker BuildKit のビルドフロントエンドである。BuildKit は現代の Docker の内部にあるビルドエンジンで、LLB (Low-Level Build、BuildKit の中間表現) と呼ばれるグラフを解決してビルドを進める。フロントエンドとは、ビルド定義を読み取り、その LLB グラフを出力するプログラムのことである。Dockerfile はビルトインのフロントエンドが扱うそうした定義の 1 つだ。Dalec はそれとは別のフロントエンドを提供する。Dockerfile の代わりに、1 枚の YAML spec を読む。

その 1 枚の spec から、Dalec は一連の流れをすべて実行する。ソースを取得し、ビルドし、ネイティブな Linux パッケージ (Azure Linux・AlmaLinux・Rocky Linux 向けの RPM、Debian・Ubuntu 向けの DEB) を生成し、それに対してテストを走らせ、そのパッケージを入れた最小コンテナイメージを組み立てる。パッケージへの署名や、SBOM・provenance の attestation 付与も可能だ。利用者に必要なのは `docker build` だけである。別建てのビルドサーバも、ホスト上の `rpmbuild` や `dpkg` も、自前のシェルスクリプトも要らない。

Dalec は Microsoft の Azure Upstream チームから生まれた。内部のコンプライアンス要件、すなわち署名済みパッケージ・SBOM・provenance を伴う再現可能なビルドを満たすためのものだ。位置づけとしては、プロジェクトのソースと配布可能な成果物の間に立つ。上流にはソースとビルド手順を記した spec があり、下流には出荷される RPM/DEB パッケージとコンテナイメージがある。

## いつ使うか

- ソースからビルドしたネイティブな distro パッケージ (RPM または DEB) が必要で、同じ spec を複数の distro に向けたい。単にファイルをイメージへコピーするのとは違う場合。
- 署名・SBOM・provenance をビルドの一部として成果物に付けたい。コンプライアンスやサプライチェーンのポリシーを満たすため。
- 自分のパッケージとその実行時依存だけを含む最小コンテナを、ビルドとテストを一括で通して得たい。
- これらすべてを、専用ビルドサービスなしに、ローカルや CI の素の `docker build` で回したい。
- 素の Dockerfile で足りていて、ネイティブなパッケージング・署名・attestation を気にしないなら不向き。
- リリースオーケストレータではない。ビルドとパッケージングは行うが、バージョン繰り上げ、リリース横断の changelog 生成、レジストリやパッケージリポジトリへの公開は扱わない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとビルドリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が作り、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動くビルド。

## 出典

1. [project-dalec/dalec README](https://github.com/project-dalec/dalec/blob/main/README.md) (参照 2026-06-26)
2. [dalec ソース (固定コミット 0d888c2)](https://github.com/project-dalec/dalec) (参照 2026-06-26)
3. [Dalec: Declarative Package and Container Builds (Microsoft Community Hub)](https://techcommunity.microsoft.com/blog/linuxandopensourceblog/dalec-declarative-package-and-container-builds/4465290) (参照 2026-06-26)
4. [\[Sandbox\] Dalec, cncf/sandbox Issue #396](https://github.com/cncf/sandbox/issues/396) (参照 2026-06-26)
5. [Dalec プロジェクトページ (CNCF)](https://www.cncf.io/projects/dalec/) (参照 2026-06-26)
6. [Dalec ドキュメントサイト](https://project-dalec.github.io/dalec/) (参照 2026-06-26)
7. [What's new with Microsoft at KubeCon NA 2025](https://opensource.microsoft.com/blog/2025/11/10/whats-new-with-microsoft-in-open-source-and-kubernetes-at-kubecon-north-america-2025/) (参照 2026-06-26)
8. [What's new with Microsoft at KubeCon EU 2026](https://opensource.microsoft.com/blog/2026/03/24/whats-new-with-microsoft-in-open-source-and-kubernetes-at-kubecon-cloudnativecon-europe-2026/) (参照 2026-06-26)
9. [moby/buildkit (LLB / フロントエンド機構)](https://github.com/moby/buildkit) (参照 2026-06-26)
10. [Docker BuildKit custom frontend syntax](https://docs.docker.com/build/buildkit/frontend/) (参照 2026-06-26)
11. [GitHub REST API repos/project-dalec/dalec](https://api.github.com/repos/project-dalec/dalec) (参照 2026-06-26)
