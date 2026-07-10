# はじめに

> リリース v1.42.2 に対応。SDK は Go 1.25 でビルドする (`go.mod:3`)。コマンドは動作する Go ツールチェイン、コンテナエンジン、Kubernetes クラスタへのアクセスを想定する。

## 前提

- Kubernetes クラスタと設定済みの `kubectl` コンテキスト (ローカルの kind や minikube で十分)。
- Go 1.25 か互換版。`go.mod:3` のツールチェインに合わせる。
- イメージのビルド・push 用に Docker や Podman などのコンテナエンジン。
- 生成プロジェクトが使う `make` (`Makefile:92-95`)。

## インストール

リリース済みの `operator-sdk` バイナリを入れるか、ソースからビルドする。リポジトリのチェックアウトから CLI をビルドするには:

```bash
make build
```

これは `go build ... -o $(BUILD_DIR) ./cmd/{operator-sdk,helm-operator}` を実行し (`Makefile:92-95`)、`operator-sdk` バイナリを生成する。公式のバイナリ配布はドキュメントサイト `sdk.operatorframework.io` に一覧がある。

## 最初の動く構成

最小の Go Operator をスキャフォルドし、そのコントローラを現在のクラスタに対して動かす。`init` と `create api` は内部的には kubebuilder のコマンドだ (`internal/cmd/operator-sdk/cli/cli.go:72-128`)。

1. プロジェクトディレクトリを作り、プロジェクトを初期化する。

   ```bash
   mkdir memcached-operator && cd memcached-operator
   operator-sdk init --domain example.com --repo github.com/example/memcached-operator
   ```

1. API の group・version・kind と、そのコントローラを作る。

   ```bash
   operator-sdk create api --group cache --version v1alpha1 --kind Memcached --resource --controller
   ```

1. マニフェストを生成し、CRD をインストールし、コントローラをローカルでクラスタに対して動かす。

   ```bash
   make manifests
   make install
   make run
   ```

`make run` は kubeconfig を使ってコントローラをフォアグラウンドで起動する。manager が起動し reconcile していることをログに出す。

## 動作確認

CLI とインストールされた CRD を確認する:

```bash
operator-sdk version
kubectl get crd memcacheds.cache.example.com
```

version 文字列が埋まり CRD が一覧に出れば、スキャフォルドとインストールが成功している。代わりに OLM パスを試すなら、Operator を bundle としてパッケージし `operator-sdk run bundle <bundle-image>` でデプロイする。これは CatalogSource・Subscription・InstallPlan を作り、CSV のインストールを待つ (`internal/olm/operator/registry/operator_installer.go:55-102`)。

## 次に読むもの

bundle 公開・OLM カタログ管理・scorecard 検証・Ansible / Helm Operator パスなど本番運用の関心事は、公式ドキュメント `sdk.operatorframework.io` を参照。ライフサイクルランタイムは `operator-lifecycle-manager` (v0) と `operator-controller` (v1) を参照。

## 出典

1. Operator SDK documentation site: <https://sdk.operatorframework.io/>
2. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
3. operator-framework/operator-lifecycle-manager: <https://github.com/operator-framework/operator-lifecycle-manager>
4. operator-framework/operator-controller: <https://github.com/operator-framework/operator-controller>
