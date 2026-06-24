# はじめに

> v2.14 のインストールフローで確認。コマンドは Docker と Docker Compose のある Linux ホストを前提とする。

## 前提条件

- `docker` 20.10.10-ce 以上と `docker-compose` 1.18.0 以上のある Linux ホスト (`README.md:57`)。
- レジストリ・データベース・キャッシュするイメージに足りるディスク。
- クライアントが Harbor に到達するためのホスト名か IP。

## インストール

Harbor は単一バイナリではなくリリースバンドルからインストールします。[releases ページ](https://github.com/goharbor/harbor/releases) から offline (または online) installer を落として展開します。

```bash
tar xzvf harbor-offline-installer-v2.14.4.tgz
cd harbor
```

## 最初に動く構成

同梱テンプレートから config を作り、ホスト名を設定します。

```bash
cp harbor.yml.tmpl harbor.yml
```

`harbor.yml` を編集します。`hostname` をホストのアドレスにし、`https` の証明書パスを設定するか、HTTP のみで試すなら `https` ブロックをコメントアウトします。管理者パスワードは `harbor_admin_password` で設定します。

installer を実行します。config を生成し、Docker Compose でコンテナを起動します。Trivy スキャナを含めるには `sudo ./install.sh --with-trivy` を実行します。

```bash
sudo ./install.sh
```

出力の末尾はこうなります。

```text
[Step 5]: starting Harbor ...
✔ ----Harbor has been installed and started successfully.----
```

Docker CLI でログインしてイメージを push すると Harbor の project に入ります。

```bash
docker login your-harbor-host
docker tag myuser/app:1.0 your-harbor-host/library/app:1.0
docker push your-harbor-host/library/app:1.0
```

Kubernetes では `install.sh` の代わりに [Harbor Helm chart](https://github.com/goharbor/harbor-helm) でデプロイします (`README.md:61`)。

## 動作確認

コンテナが healthy で、ポータルが応答するか確認します。

```bash
sudo docker-compose ps
```

ブラウザでホスト名のポータルを開き、`admin` と `harbor.yml` のパスワードでログインします。デフォルトの `library` project が見え、push したイメージが tag・サイズ・スキャン状態とともにその配下に現れるはずです。

## 次に読むもの

HTTPS 設定、外部 PostgreSQL と Redis、高可用性、ストレージバックエンドは [Installation & Configuration Guide](https://goharbor.io/docs/latest/install-config/) を参照してください。production の堅牢化 (RBAC 設計、OIDC 連携、レプリケーションポリシー、retention、クォータ) は [Harbor のドキュメント](https://goharbor.io/docs/) でカバーされています。
