# はじめに

> リリース v3.5.3 と master コミット `6b2e792` で検証。コマンドは Docker のある Linux、または Go 1.18+ と gcc を前提とする。

## 前提

- 手早い経路なら Docker と docker-compose。ソースビルドなら Go 1.18+ と gcc (libsdk と blobstore が CGO を使う)。
- DataNode 用に最低 10 GB の空きディスク。スクリプトが `MIN_DNDISK_AVAIL_SIZE_GB=10` を強制する (`docker/run_docker.sh:6`)。

## インストール

リポジトリを clone してソースからビルドします。

```bash
git clone https://github.com/cubefs/cubefs.git
cd cubefs
make build
```

`make build` は `build/build.sh` 経由で `cfs-server`, `cfs-client`, `cfs-cli` などのバイナリを生成します。

## 最初の動く構成

クラスタを動かす最短経路は同梱の Docker compose スタックです。master, metanode, datanode, objectnode, client, monitor を一括で起動します。

1. 10 GB 以上の空きがあるディスクパスを指定して、スタック全体を起動します。

   ```bash
   ./docker/run_docker.sh -r -d /path/to/disk
   ```

1. 単一ロールを手動で起動するなら、バイナリにロール config を渡します。ロールは `role` キーから読まれ (`cmd/cmd.go:184`)、dispatch の switch がサーバへマップします (`cmd/cmd.go:206-239`)。

   ```bash
   ./cfs-server -c master.json
   ```

有効なロールは `cmd/cmd.go:71-93` の定数です。`master`, `metanode`, `datanode`, `objectnode`, `authnode`, `console`, `lcnode`, `flashnode`, `flashgroupmanager`。

## 動作確認

compose スタックは monitor Web UI を起動します (`docker/run_docker.sh` の `-m` フラグ)。スタックが立ち上がったら、`cfs-cli` でクラスタ状態を照会し、FUSE クライアントでマウントするか ObjectNode に S3 リクエストを送って読み書きが往復することを確認します。

## 次に読むもの

本番のトポロジ・高可用性・セキュリティ強化・スケーリングは、Helm chart (`cubefs/cubefs-helm`) と CSI ドライバ (`cubefs/cubefs-csi`) を使い、単一ホストの Docker スタックではなく公式ドキュメントに従ってください (S1, S2)。
