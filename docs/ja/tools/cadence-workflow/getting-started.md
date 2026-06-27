# はじめに

> コミット `66dcbaf` のリポジトリで検証済み。コマンドは macOS / Linux 上の Docker Desktop と `git` を想定。

## 前提

- Compose プラグイン付きの Docker (`docker compose`)。
- `git`。
- Docker を使わない経路のみ: バイナリをビルドするための Go 1.24 (`go.mod:3`)。

## インストール

最速のインストールは同梱の Docker Compose スタックを動かすことで、サーバ・データベース・UI がまとめて立ち上がる。

```bash
git clone https://github.com/cadence-workflow/cadence.git
cd cadence
docker compose -f docker/docker-compose.yml up
```

## 最初の動く構成

バックエンドを起動し、domain (Cadence におけるワークフローの名前空間の単位) を登録し、UI を開く。

1. バックエンドコンポーネントを起動し、動かしたままにする。

   ```bash
   docker compose -f docker/docker-compose.yml up
   ```

2. 2 つめのターミナルで、公式 CLI イメージを使って domain を登録する。frontend は 7933 ポートで待ち受けており (`tools/cli/defs.go:34`)、Docker Desktop では `host.docker.internal` で別コンテナから到達できる。

   ```bash
   docker run --rm ubercadence/cli:master \
     --address host.docker.internal:7933 \
     --domain test-domain domain register
   ```

3. domain ができたことを確認する。

   ```bash
   docker run --rm ubercadence/cli:master \
     --address host.docker.internal:7933 \
     --domain test-domain domain describe
   ```

4. Web UI を `http://localhost:8088` で開き、ワークフロー history とトレースを見る (`README.md:29`)。

5. このサーバに対してサンプルワークフローを動かす。[cadence-samples](https://github.com/cadence-workflow/cadence-samples) (Go) か [cadence-java-samples](https://github.com/cadence-workflow/cadence-java-samples) (Java) を使う。

## 動作確認

ステップ 3 の `domain describe` コマンドは、サーバが正常なら domain の設定を表示する。Compose のログで 4 サービス (frontend、history、matching、worker) が起動を報告するのを見てもよいし、`http://localhost:8088` の UI が読み込まれ `test-domain` が一覧に出るのを確認してもよい。

Docker を使わないなら、バイナリをビルドして SQLite に対してサーバを動かす (`CLAUDE.md`):

```bash
make bins
make install-schema-sqlite
./cadence-server --zone sqlite start
```

## 次に読むもの

- Kubernetes での本番デプロイは [cadence-charts](https://github.com/cadence-workflow/cadence-charts) Helm chart を使う (`README.md:32-34`)。
- ワークフローは公式の [Go](https://github.com/cadence-workflow/cadence-go-client) / [Java](https://github.com/cadence-workflow/cadence-java-client) SDK で書く。
- 高可用性、マルチクラスタレプリケーション、セキュリティ、スケーリングについては、このローカル構成ではなく公式ドキュメントに従う。
