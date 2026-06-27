# はじめに

> タグ `1.4.1` で検証済み。コマンドは互換版 Istio がすでに入った Kubernetes クラスタを想定。

## 前提

- `kubectl` を設定済みの Kubernetes クラスタ。
- 互換版の Istio インストール (Aeraki 1.4.x は Istio 1.18.x を対象)。出典: [install docs](https://www.aeraki.net/docs/v1.x/install/)。
- Istio の ConfigMap に、Aeraki のプロトコルが必要とする DNS capture と metrics 設定を追加すること。出典: [install docs](https://www.aeraki.net/docs/v1.x/install/)。
- ソースからビルドする場合: Go >= 1.16 と、Docker および Docker Compose (`README.md:131-132`)。

## インストール

```bash
git clone https://github.com/aeraki-mesh/aeraki.git
cd aeraki
export AERAKI_TAG=1.4.1
make install
```

`make install` は `bash demo/install-aeraki.sh` を実行する (`Makefile:39-40`)。

## 最初の動く構成

1. リポジトリを clone し、リリースタグを固定する。

   ```bash
   git clone https://github.com/aeraki-mesh/aeraki.git
   cd aeraki
   export AERAKI_TAG=1.4.1
   ```

2. Aeraki をクラスタにインストールする。

   ```bash
   make install
   ```

3. 非 HTTP プロトコルを試すためデモアプリを deploy する。

   ```bash
   make demo
   ```

   これは `bash demo/install-demo.sh default` を実行する (`Makefile:43-44`)。Kafka 版は `make demo-kafka`、bRPC 版は `make demo-brpc` (`Makefile:49-54`)。

## 動作確認

Aeraki コントロールプレーンの pod が動いているか確認する:

```bash
kubectl get pod -n istio-system -l app=aeraki
```

Aeraki のデフォルト root namespace は `istio-system` です (`cmd/aeraki/main.go:40`)。Aeraki が `EnvoyFilter` を生成したか確認する。これらは reconcile の基準となる `manager=aeraki` ラベルを持ちます (`internal/envoyfilter/controller.go:135-137`)。

```bash
kubectl get envoyfilter -A -l manager=aeraki
```

## 次に読むもの

HA などの本番運用については、leader election とレプリカのモデルを [アーキテクチャ](./architecture) ページで説明しています。Linux と macOS でのソースビルドは `make build` と `make build IMAGE_OS=darwin` を参照 (`README.md:137-141`)。公式の [クイックスタート](https://www.aeraki.net/docs/v1.x/quickstart/) と [インストールガイド](https://www.aeraki.net/docs/v1.x/install/) がバージョン整合や独自プロトコル追加のチュートリアルを扱っています。
