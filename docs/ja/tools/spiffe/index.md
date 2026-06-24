# SPIFFE

> SPIFFE は、秘密の事前配布なしに、ワークロードへ短命で暗号学的に検証可能な ID を与えるための標準群である。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [spiffe/go-spiffe](https://github.com/spiffe/go-spiffe)
- **ドキュメント基準コミット**: `e9973f6` (v2.8.1)

## 何をするものか

SPIFFE (Secure Production Identity Framework For Everyone) は、ワークロード ID のためのベンダ中立な標準群である。定義するのは 3 つ。SPIFFE ID (ワークロードを名付ける `spiffe://` URI)、SVID (検証可能な ID ドキュメントである X509-SVID または JWT-SVID)、Workload API (SVID を発行・ローテーションする gRPC API) である。これらの標準を実装するリファレンスのサーバ/エージェントは別プロジェクトの SPIRE にある。

このディープダイブは、アプリケーションが SPIFFE を利用するための正準 Go クライアントライブラリ `spiffe/go-spiffe` を読む。Workload API をラップし、ワークロード間の相互認証 TLS、X509-SVID と JWT-SVID の取得・検証、トラストバンドル管理を提供する ([README.md:5-9](https://github.com/spiffe/go-spiffe/blob/e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96/README.md#L5-L9))。

ワークロードは長命なクレデンシャルを一切見ない。ローカルの Workload API エンドポイント (Unix ソケット越しの SPIRE Agent) に接続し、エージェントがワークロードをアテステーションし、go-spiffe が新規発行された SVID をアプリの TLS 設定へ流し込む。ID は証明書中の URI であり、認可はその URI を許可集合と照合することである。

## いつ使うか

- クラスタ・クラウド・VM をまたいでサービスを動かし、プラットフォームごとの IAM ではなく単一の ID モデルを使いたいとき。
- ピアの ID がホスト名や共有トークンではなく `spiffe://` URI であるような、サービス間 mTLS が欲しいとき。
- 別々のトラストドメイン間で信頼を連携させ、一方のワークロードが他方のワークロードを認証できるようにしたいとき。
- 人間やエンドユーザの認証だけが必要な場合は不向き。SPIFFE は人ではなくワークロードを識別する。
- 単一プラットフォームのネイティブなワークロード ID (例: クラウド IAM) で要件が満たせるなら、運用負荷が増えるだけになる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [spiffe/go-spiffe リポジトリ](https://github.com/spiffe/go-spiffe) (pinned v2.8.1)。
2. [SPIFFE and SPIRE Projects Graduate from CNCF](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)。
3. [SPIFFE project page (CNCF)](https://www.cncf.io/projects/spiffe/)。
4. [SPIFFE standards (SPIFFE-ID / SVID / Workload API)](https://github.com/spiffe/spiffe/tree/main/standards)。
5. [spiffe.io and SPIRE case studies](https://spiffe.io/docs/latest/spire-about/case-studies/)。
6. [Uber: Our Journey Adopting SPIFFE/SPIRE at Scale](https://www.uber.com/en/blog/our-journey-adopting-spiffe-spire/)。
7. [spiffe/spire ADOPTERS.md](https://github.com/spiffe/spire/blob/main/ADOPTERS.md)。
8. [go-spiffe v2 Go package reference](https://pkg.go.dev/github.com/spiffe/go-spiffe/v2)。
