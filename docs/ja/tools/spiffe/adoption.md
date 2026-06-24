# 採用事例・エコシステム

## 誰が使っているか

以下の採用組織は、CNCF 卒業アナウンス、SPIRE の ADOPTERS ファイル、または公開のエンジニアリング記事に名前がある。SPIFFE は SPIRE のような実装や go-spiffe のようなクライアントライブラリを通じて消費されるため、これらは SPIFFE のモデルを本番で動かす組織である。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Uber | GCP・OCI・AWS・オンプレをまたぐワークロード ID をステートレス/ステートフル/バッチ/CI ジョブに付与 | [Uber ブログ](https://www.uber.com/en/blog/our-journey-adopting-spiffe-spire/) |
| ByteDance / TikTok | 数十万ワークロードを守るゼロトラスト基盤 | [CNCF アナウンス](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/) |
| Square (現 Block) | ハイブリッド基盤と Lambda ワークロードの mTLS ID | [SPIRE ケーススタディ](https://spiffe.io/docs/latest/spire-about/case-studies/) |
| Bloomberg | 本番アダプタ。TPM ノードアテステーションを発表 | [SPIRE ADOPTERS.md](https://github.com/spiffe/spire/blob/main/ADOPTERS.md) |

卒業アナウンスと ADOPTERS ファイルは、GitHub・Netflix・Pinterest・Niantic・Twilio・Duke Energy・Unity Technologies・Z Lab も挙げ、加えて HashiCorp・F5・Intel・IBM・Google・VMware のベンダ統合も列挙する ([出典 #2](https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/)、[出典 #7](https://github.com/spiffe/spire/blob/main/ADOPTERS.md))。

## 採用シグナル

2026-06-24 に GitHub API で取得:

- `spiffe/go-spiffe`: stars 200、forks 85、contributors 38+、最新リリース v2.8.1 (2026-06-19)。
- `spiffe/spiffe` (標準リポジトリ): stars 1788、forks 200、contributors 54+。
- `spiffe/spire` (リファレンス実装): stars 2407。

ライブラリの star 数が控えめなのは、運用者の多くが SPIRE を通じて SPIFFE に触れるためである。go-spiffe は花形のプロジェクトではなくアプリ側の依存である。

## エコシステム

SPIFFE は Envoy (SDS で SVID を配布)、gRPC、Istio (SPIFFE ID 体系を採用)、Kubernetes、Sigstore、Tekton と統合する。go-spiffe は `spiffetls` と `spiffegrpc` でこれらの mTLS 結線を提供する。他言語のクライアントライブラリには java-spiffe・c-spiffe・py-spiffe・spiffe-rs がある。go-spiffe は Windows の named pipe 越しの Workload API に対応する点で差別化される。

## 代替

| 代替 | 違い |
| --- | --- |
| クラウドのワークロード ID (GKE Workload Identity、AWS IAM Roles Anywhere) | 単一プラットフォーム固有。SPIFFE はベンダ中立でクラウドとオーケストレータをまたぐ |
| HashiCorp Vault のワークロード ID | ID を発行するシークレット管理製品。SPIFFE は単一製品ではなく標準と Workload API を定義する |
| サービスメッシュ内蔵 mTLS (例: Linkerd の identity) | ID を 1 つのメッシュに結合する。SPIFFE のフェデレーション (`federation/`) は別々のトラストドメインをまたいで認証する |

決定的な特徴は、SPIFFE がベンダ中立な ID 標準と Workload API を規定しドメイン横断のフェデレーションに対応する一方、クラウド固有のワークロード ID は単一プロバイダ内に閉じる点である。
