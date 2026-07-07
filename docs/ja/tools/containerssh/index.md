# ContainerSSH

> 接続ごとに使い捨てコンテナを起動してユーザをその中に入れる SSH サーバ。認証も接続ごとの設定も外部 HTTP webhook に委譲する。

- **カテゴリ**: Developer Tools
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [ContainerSSH/ContainerSSH](https://github.com/ContainerSSH/ContainerSSH)
- **ドキュメント基準コミット**: `ce7d2b6` (main, 2026-05-08, タグ v0.6.0 の後)

## 何をするものか

ContainerSSH は固定ユーザも固定シェルも持たない SSH サーバだ。クライアントが接続しても、ホスト上でシェルを開くことはしない。まず外部 webhook に資格情報が有効か問い合わせ、次に別の webhook にこの接続へどの設定を与えるか問い合わせ、それからコンテナ (Docker, Kubernetes、または Docker 互換 API 経由の Podman) を起動し、SSH セッションをそのコンテナ内のプロセスに接続する。クライアントが切断するとコンテナは削除される。セッションを越えて残るものは何もない。

この設計は 2 つの判断をサーバから切り離し、自分で書く HTTP エンドポイントに移す。認証は自分の webhook への POST で、任意の IdP・データベース・LDAP ディレクトリを背後に置ける。接続ごとの設定は 2 つ目の POST で、同じサーバがユーザ A を Docker コンテナに、ユーザ B を Kubernetes pod に落とし、ログインごとに image を変えることまでできる。そのロジックはすべて設定ファイルではなく自分のサービス側にある。

プロジェクトを駆動する用途は 2 つ。1 つは開発・ラボアクセスで、ホストアカウントを用意せずに本物の隔離コンテナを SSH 越しに配る。もう 1 つは honeypot で、攻撃者が打った内容 (パスワードを含む) をすべてバイナリ監査ログに記録する SSH サーバを、強く隔離された使い捨てコンテナの中で公開する。設定スイッチ 1 つで隔離の強さが変わるので、同じサーバが両方をこなせる。

## いつ使うか

- ホストのユーザアカウントを作らず、接続ごとの使い捨てコンテナを SSH 越しに配りたい。
- 認証やユーザごとの設定を、静的ファイルではなく自分が管理するサービス (IdP、データベース) から取りたい。
- SSH honeypot を作りたく、強い隔離とセッション全体の監査ログ (キー入力と資格情報を含む) が欲しい。
- 永続的なホームディレクトリや、SSH 接続より長く生きるセッションが必要なら不向き。コンテナは設計上、切断で破棄される。
- 既存のマシン群への証明書ベースのアクセスが欲しい場合も不向き。それは Teleport のようなツールが扱うアクセスプレーンの問題だ。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. ContainerSSH GitHub リポジトリ: <https://github.com/ContainerSSH/ContainerSSH>
2. ContainerSSH README: <https://github.com/ContainerSSH/ContainerSSH/blob/main/README.md>
3. CNCF プロジェクトページ, ContainerSSH: <https://www.cncf.io/projects/containerssh/>
4. CNCF Sandbox projects: <https://www.cncf.io/sandbox-projects/>
5. "Creating an SSH honeypot" (LWN.net, FOSDEM 2021 の要約): <https://lwn.net/Articles/848291/>
6. About ContainerSSH: <https://containerssh.io/about/>
7. Getting started / quick start: <https://containerssh.io/v0.5/getting-started/>
8. Honeypot use case: <https://containerssh.io/v0.5/usecases/honeypots/>
9. ContainerSSH/examples (quick-start): <https://github.com/ContainerSSH/examples>
10. GitHub REST API (stars, forks, contributors): <https://api.github.com/repos/ContainerSSH/ContainerSSH>
11. slsa-verifier: <https://github.com/slsa-framework/slsa-verifier>
