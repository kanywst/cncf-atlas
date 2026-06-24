# はじめに

> コミット `fc561264` (3.13.0-rc.0) の README で検証済み。コマンドは Docker のある Unix シェル、またはソースビルド用の Go と Node を想定。

## 前提

- 手早く試すなら Docker。または
- ソースからビルドするなら Go (`go.mod` 記載のバージョン以上)、Node (`web/ui/.nvmrc` 記載のバージョン以上)、npm 10 以上 (README:71-74)。

## インストール

最短は公式コンテナイメージ (README:60-61)。

```bash
docker run --name prometheus -d -p 127.0.0.1:9090:9090 prom/prometheus
```

ソースからビルドする場合 (README:79-101)。

```bash
git clone https://github.com/prometheus/prometheus.git
cd prometheus
make build
```

`make build` は web アセットを埋め込んだ `prometheus` と `promtool` バイナリをコンパイルするので、どこからでも実行できる (README:97-101)。

## 最初の動く構成

上記コンテナはデフォルト設定で起動する。自前の設定で動かすには、自分自身を scrape する設定ファイルを指す。

1. 最小の `prometheus.yml` を書く。

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: prometheus
    static_configs:
      - targets: ["localhost:9090"]
```

1. その設定でサーバを起動する (README:85-86)。

```bash
./prometheus --config.file=prometheus.yml
```

`make build` ではなく `go install` でビルドした場合は、`web/ui/static` 配下の web アセットを見つけられるよう、clone したリポジトリのルートからバイナリを実行する (README:88-92)。

## 動作確認

web UI を `http://localhost:9090/` で開く (README:64)。次に、Prometheus が自分自身を scrape していることを確認する。式ブラウザで `up` を実行するか、API を直接叩く。

```bash
curl 'http://localhost:9090/api/v1/query?query=up'
```

健全なサーバは `"status":"success"` を含む JSON を返し、`prometheus` job の `up` 系列の値が `1` になる。

## 次に読むもの

- [公式の first steps ガイド](https://prometheus.io/docs/prometheus/latest/getting_started/) がターゲット追加とクエリ記述を解説している。
- HA・長期保存・単一ノードを超えるスケーリングは、[採用事例・エコシステム](./adoption)ページと [prometheus.io](https://prometheus.io/) のドキュメントを参照。ここで再ドキュメント化はしない。
