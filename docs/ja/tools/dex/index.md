# Dex

> フェデレーテッド OpenID Connect プロバイダ。アプリは Dex に対して 1 つのプロトコル（OIDC）だけを話し、実際の認証は LDAP・SAML・GitHub・Google などの上流 ID プロバイダに委譲される。

- **カテゴリ**: Identity & Policy
- **CNCF 成熟度**: Sandbox
- **言語**: Go（`go 1.25`）
- **ライセンス**: Apache-2.0
- **リポジトリ**: [dexidp/dex](https://github.com/dexidp/dex)
- **ドキュメント基準コミット**: `17a54e9`（v2.45.0 + 248 コミット）

## 何をするものか

Dex は認証サービスで、前段のアプリには単一の OpenID Connect（OIDC）面だけを見せ、実際の認証は背後の別の ID プロバイダに委譲する。アプリは OIDC を一度だけ実装すればよい。あとは Dex が、コネクタというプラグイン機構を通じて LDAP・SAML・GitHub・Google など十数種の上流の差を吸収する。

Dex が発行するトークンは標準的な OIDC ID Token、つまり署名付き JWT である。これが効いてくるのは、Kubernetes API server の OIDC プラグインや AWS STS がこのトークンをそのまま消費できるからだ。よくある構成は、Dex を社内ディレクトリ（LDAP や SAML）の前に置き、`kubectl` やクラスタのダッシュボードが、各々ディレクトリのプロトコルを覚えることなくそのディレクトリでユーザを認証できるようにするもの。

Dex 自身はユーザデータベースを持たない。短命なリクエスト状態と発行済みトークンだけを、選んだストレージバックエンド（インメモリ、SQL データベース、etcd、Kubernetes カスタムリソース）に保持する。Kubernetes CRD 上で動かせば、Dex は別途データベースなしでクラスタネイティブに動作する。

## いつ使うか

- Kubernetes や任意の OIDC 対応アプリに、既存ディレクトリ（LDAP・SAML、あるいは GitHub・Google のような OAuth2 プロバイダ）を裏付けとした単一のシングルサインオン入口を与えたいとき。
- オープンソース製品を作っていて、各デプロイにフル機能の ID プラットフォームの運用を強いるのではなく、OIDC プロバイダを組み込みたいとき。これが Dex の主戦場で、Argo CD や Kubeflow などが同梱している。
- ユーザの台帳（system of record）ではなく、小さな委譲プロバイダが欲しいとき。

登録・セルフサービスのパスワードリセット・ロール・管理コンソールといったユーザのライフサイクルを自前で持ちたい場合は不向き。Dex にはユーザ管理 UI がない。その場合は [採用事例・エコシステム](./adoption) の Keycloak / Zitadel との比較を参照。

## このディープダイブの構成

- [歴史](./history): CoreOS 起源、v2 の書き直し、CNCF への寄贈。
- [アーキテクチャ](./architecture): server・connector・storage と、認可リクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、シグナルはどうで、本当の代替は何か。
- [内部実装](./internals): トークンエンドポイント・PKCE・ID Token 署名をソースから読む。
- [はじめに](./getting-started): mock コネクタで最小の動くプロバイダを立てる。

## 出典

- [Dex リポジトリ](https://github.com/dexidp/dex)
- [Dex ドキュメント](https://dexidp.io/docs/)
- [Dex の CNCF Sandbox 提案（TOC）](https://github.com/cncf/toc/pull/379)
- [Dex ADOPTERS ファイル](https://github.com/dexidp/dex/blob/master/ADOPTERS.md)
