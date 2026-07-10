# 採用事例・エコシステム

## 誰が使っているか

Dex の主戦場は他のオープンソースプロジェクトの内側で、それらが自身の OIDC プロバイダとして組み込む。`ADOPTERS.md` にはプロジェクトと企業の両方が挙がっている。代表的なもの:

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Argo CD | web UI と CLI の SSO | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| sigstore | 公開 Fulcio CA の認証。コード署名証明書を OIDC ID に紐づける | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Kubeflow | Kubeflow Platform の外部 OIDC 認証コンポーネント | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Kyma | Kubernetes API server 認証と、統合 UI（Grafana・Loki・Jaeger）の保護 | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| LitmusChaos | ChaosCenter の OAuth2 ログイン | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Chef | Chef Automate のユーザ認証 | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Ericsson | Cloud Container Distribution の Kubernetes API server 認証 | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Flant | Managed Kubernetes サービスの中核コンポーネントへのアクセス | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Kasten | K10 バックアッププラットフォームのダッシュボード認証 | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |
| Pydio | Pydio Cells の OIDC サービス | [ADOPTERS.md](https://github.com/dexidp/dex/blob/master/ADOPTERS.md) |

ファイルにはさらに多く載っている。Aspect・Banzai Cloud・JuliaBox・Pusher・Elastisys（Welkin）・Terrakube・LLMariner など。各エントリには採用先へのリンクとユースケースの説明が付く。

## 採用のシグナル

2026 年 7 月時点でリポジトリ上に観測されるもの。GitHub スター約 10,900、フォーク約 1,950、プロジェクト全期間のコントリビュータ約 260 名。現行リリースは `v2.45.x` 系で、`v2.45.1` は 2026 年 3 月公開。README には OpenSSF Scorecard と OpenSSF Best Practices バッジがある。到達度の最も明確なシグナルは間接的だ。Dex は Argo CD のような広くデプロイされるプロジェクトの中に同梱されるので、実際のインストール規模は自身のダウンロード数が示すよりはるかに大きい。

## エコシステム

Dex は Kubernetes スタックの使い込まれた結節点に座る。Kubernetes API server の OIDC 認証は Dex の ID Token をそのまま消費し、通常は `kubelogin` のような `kubectl` プラグイン経由でコマンドラインから到達する。AWS STS も同様に Dex の issuer に対してフェデレーションできる。OIDC 非対応の web UI には、`oauth2-proxy` を前段に置いて Dex 越しに認証させるのが定番。運用面では gRPC 管理 API（`api/api.proto`）が、外部ツールから実行時に client やコネクタを管理させる。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Keycloak | フル機能の IAM プラットフォーム。ユーザデータベース・管理コンソール・ロール管理を自前で持つ。Dex はユーザストアを持たない薄い委譲プロバイダ。 |
| Zitadel | 製品寄りのマルチテナント IdP で、監査とセルフサービスを備える。Dex は組み込まれることを前提とした、より小さな構成部品。 |
| Ory Hydra | 同じく OAuth2 / OIDC に特化したサーバだが、Hydra はログインとユーザ管理を別に作るアプリへ外出しする。Dex の売りは、既存の上流へ委譲する組み込みコネクタ。 |
| Authelia | 独自のログインと 2FA を持つリバースプロキシの forward-auth ゲート。OIDC provider 対応は後発。Dex は OIDC プロバイダとして出発し、プロキシレベルのゲーティングはしない。 |

Dex を選ぶのは、ディレクトリや OAuth2 上流にフェデレーションし、Kubernetes が消費できるトークンを発行する小さなプロバイダが欲しいとき、とりわけ別製品に組み込むとき。Keycloak や Zitadel を選ぶのは、登録・ロール・管理 UI を伴ってユーザの台帳（system of record）になる必要があるとき。

もう一つ量るべきトレードオフ。README は SAML 2.0 コネクタを「メンテされておらず認証バイパスに脆弱である可能性が高い」と明記している（ディスカッション [#1884](https://github.com/dexidp/dex/discussions/1884)）。上流が SAML だけなら、Dex を選ぶ前にこの点を織り込むこと。

## 出典

- [Dex ADOPTERS ファイル](https://github.com/dexidp/dex/blob/master/ADOPTERS.md)
- [Dex README](https://github.com/dexidp/dex/blob/17a54e9046cee1142530de4d0a809809d7c9cee9/README.md)
- [Dex ドキュメント](https://dexidp.io/docs/)
