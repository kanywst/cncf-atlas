# OpenFeature

> 言語やバックエンドを問わず使える、ベンダー中立な feature flag 評価の標準と参照実装 (flagd)。

- **カテゴリ**: Developer Tools
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [open-feature/flagd](https://github.com/open-feature/flagd)
- **ドキュメント基準コミット**: `80b9e95` (タグ `flagd/v0.16.0`、2026-06-01)

## 何をするものか

OpenFeature は feature flag 評価のための仕様だ。アプリケーションコードが呼ぶ単一の評価 API を定め、実際の flag 管理システムは `provider` インターフェースの背後に差し込む。狙いはアプリコードを特定の flag ベンダーから切り離すこと。SaaS 製品からセルフホストのバックエンドへ乗り換えても、評価呼び出しを書き換えずに済む (5)(7)。

このプロジェクトは仕様文書だけではない。多くの言語の SDK (Go / Java / JavaScript / .NET / Python ほか) と、flagd という参照 flag バックエンドを提供する。本ディープダイブは端から端までコードを追える実装である flagd を対象にする。flagd は Go 製のデーモンで、flag 定義をファイル・HTTP エンドポイント・Kubernetes CRD・gRPC ストリーム・クラウド blob ストレージから取り込み、gRPC と OpenFeature Remote Evaluation Protocol (OFREP、REST API) で評価を提供する (1)(12)。

flagd は flag 定義とアプリケーションの間に位置する。SDK と provider がこれを呼び、flagd は flag をインメモリストアに保持し、JSONLogic のターゲティングルールを適用し、値と `TARGETING_MATCH` や `STATIC` などの理由コードを返す (1)(6)。

## いつ使うか

- 単一の商用ベンダーに縛られずに feature flag を使いたいとき。OpenFeature は安定した API と、その背後で差し替え可能な provider を提供する (5)(7)。
- ファイル・Kubernetes CRD・オブジェクトストレージから flag 定義を読み、gRPC や REST で提供するセルフホストの OSS flag バックエンドが必要なとき (1)(12)。
- Kubernetes 上で、OpenFeature Operator により flagd をサイドカーとして注入したいとき (2)(5)。
- 向かないのは、ホスト型 SaaS のダッシュボード 1 つで足り、ベンダーロックインを気にしない場合。そのときはベンダー SDK 単体のほうが単純だ。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [open-feature/flagd](https://github.com/open-feature/flagd) (参照バックエンドのリポジトリ)。
2. [open-feature/spec](https://github.com/open-feature/spec) (OpenFeature 仕様)。
3. [OpenFeature CNCF プロジェクトページ](https://www.cncf.io/projects/openfeature/) (受理日・成熟度)。
4. [OpenFeature becomes a CNCF incubating project](https://www.cncf.io/blog/2023/12/19/openfeature-becomes-a-cncf-incubating-project/) (CNCF ブログ、2023-12-19)。
5. [OpenFeature 公式サイト](https://openfeature.dev/) (概念・provider モデル)。
6. [flagd Quick start](https://flagd.dev/quick-start/) (最小起動・評価方法)。
7. [Flagsmith Submits OpenFeature as CNCF Sandbox Project](https://www.flagsmith.com/blog/flagsmith-submit-openfeature-to-cncf) (起源)。
8. [SiliconANGLE: CNCF names OpenFeature an incubating project](https://siliconangle.com/2023/12/19/cncf-names-openfeature-incubating-project-helping-standardize-feature-flags-software-development/)。
9. [SD Times: OpenFeature becomes a CNCF incubating project](https://sdtimes.com/feature-flags/openfeature-feature-flagging-api-becomes-a-cncf-incubating-project/)。
10. [open-feature/community](https://github.com/open-feature/community) (ガバナンス)。
11. [open-feature/flagd の GitHub API](https://api.github.com/repos/open-feature/flagd) (stars / forks / license / 作成日)。
12. [flagd README とドキュメント](https://github.com/open-feature/flagd/blob/main/README.md) (アーキテクチャ・sync ソース・OFREP)。
