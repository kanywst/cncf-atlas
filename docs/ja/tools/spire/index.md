# SPIRE

> SPIRE は共有ブートストラップシークレットなしで、短命の暗号学的アイデンティティ (X509-SVID と JWT-SVID) をワークロードに発行する。SPIFFE 仕様の参照実装。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Graduated
- **言語**: Go (`go 1.26.4`、`go.mod:3`)
- **ライセンス**: Apache-2.0 (`LICENSE:1-3`)
- **リポジトリ**: [spiffe/spire](https://github.com/spiffe/spire)
- **ドキュメント基準コミット**: `73215a39` (タグ `v1.15.1` の近傍、2026-06-22)

## 何をするものか

SPIRE は SPIFFE Runtime Environment。2 つのバイナリで動く。`spire-server` は信頼ドメインの認証局として動き、`spire-agent` は各ノードで動いてローカルのワークロードに Unix domain socket 経由でアイデンティティを渡す。サーバはノードを attest し、登録エントリ (RegistrationEntry) に基づいてアイデンティティ文書 (SVID) を署名・発行する。agent はアイデンティティを要求してきたプロセスを attest し、manager が事前に取得・ローテーションした SVID を渡す。

中核となる発想は、ワークロードがアイデンティティを要求するときに一切クレデンシャルを提示しないこと。アイデンティティはカーネルが検証したプロセスのメタデータから導出されるので、配布・ローテーションすべきブートストラップシークレットが存在しない。SPIRE は Kubernetes・VM・ベアメタル・サーバレスをまたいで動き、別々の信頼ドメイン間で信頼をフェデレートする。

スタック上では、サービスメッシュ・API ゲートウェイ・mTLS を使う任意のシステムの下に位置し、それらが消費するアイデンティティを供給する。Envoy・Istio・Linkerd・Consul はいずれも SPIRE が発行した SVID を消費できる。

## いつ使うか

- 単一の信頼モデルの下で、複数プラットフォーム (Kubernetes と VM、複数クラウド、オンプレ) をまたぐワークロードアイデンティティが必要なとき。
- サービス間認証から長命の共有シークレットを排除し、短命で attest された証明書に置き換えたいとき。
- 組織や信頼ドメインの境界をまたいでアイデンティティをフェデレートする必要があるとき。
- メッシュ固有・クラウド固有のアイデンティティ機構ではなく、オープン標準 (SPIFFE) のベンダ非依存な実装が欲しいとき。

向かない場面:

- 単一の Kubernetes クラスタ内かつ単一メッシュで、メッシュ組み込みの CA (istiod など) が全ワークロードをカバーしているなら、別建ての ID 基盤は不要かもしれない。
- attestation を伴わない汎用シークレットストレージや汎用 PKI だけが必要なチームは、Vault PKI のようなツールで足りる。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [spiffe/spire (GitHub)](https://github.com/spiffe/spire)
2. [spiffe/spire ADOPTERS.md](https://github.com/spiffe/spire/blob/main/ADOPTERS.md)
3. [SPIFFE and SPIRE Projects Graduate from CNCF Incubator](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)
4. [SPIRE / CNCF project page](https://www.cncf.io/projects/spire/)
5. [10 Years of SPIFFE (Joe Beda)](https://joe.dev/posts/10-years-of-spiffe/)
6. [Sunil James, CEO of Scytale, Explains SPIFFE (The New Stack)](https://thenewstack.io/sunil-james-ceo-of-scytale-explains-spiffe/)
7. [Opensource SPIFFE and SPIRE (Scytale)](https://scytale.io/opensource-spiffe/)
8. [SPIFFE/SPIRE graduates (HPE Developer)](https://developer.hpe.com/blog/spiffe-spire-graduates-enabling-greater-security-solutions/)
9. [SPIFFE Getting Started (Kubernetes quickstart)](https://spiffe.io/docs/latest/try/getting-started-k8s/)
10. [AWS: mTLS with SPIFFE/SPIRE in App Mesh on EKS](https://aws.amazon.com/blogs/containers/using-mtls-with-spiffe-spire-in-app-mesh-on-eks/)
11. [Anthropic: SPIFFE WIF provider for Claude API](https://platform.claude.com/docs/en/manage-claude/wif-providers/spiffe)
12. [Square: providing mTLS identities to Lambdas](https://developer.squareup.com/blog/providing-mtls-identities-to-lambdas/)
13. [Production Identity Framework SPIRE Graduates from CNCF (InfoQ)](https://www.infoq.com/news/2022/09/spire-graduates-cncf/)
