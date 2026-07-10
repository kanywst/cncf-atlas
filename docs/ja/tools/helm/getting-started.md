# はじめに

> Helm v4 系 (ピン留めコミット `74fa4fce`、タグ v4.2.2 付近) で検証。コマンドは到達可能な Kubernetes クラスタを想定。

## 前提

- kubeconfig 経由で到達可能な Kubernetes クラスタ。install パスは `IsReachable()` を呼び、クラスタに到達できなければ即座に失敗する (`pkg/action/install.go:296`)。
- `helm` バイナリが PATH 上にあること。

## インストール

macOS の Homebrew なら:

```bash
brew install helm
```

Linux は公式インストールスクリプトかバイナリリリースを使う。スクリプトとチェックサムは [installation guide](https://helm.sh/docs/intro/install/) を参照。

## 最初の動く構成

最短経路は、チャートリポジトリを追加し、チャートを名前付きリリースとしてインストールし、確認すること。

1. チャートリポジトリを追加する。

   ```bash
   helm repo add <name> <repo-url>
   helm repo update
   ```

1. チャートをリリースとしてインストールする。

   ```bash
   helm install <release> <name>/<chart>
   ```

OCI ホストのチャートなら、repo ではなく参照でインストールする:

```bash
helm install <release> oci://<registry>/<chart> --version <version>
```

1. namespace 内のリリースを一覧する。

   ```bash
   helm list
   ```

1. 終わったらリリースを削除する。

   ```bash
   helm uninstall <release>
   ```

## 動作確認

`helm list` がリリースを `deployed` ステータスで表示する。Helm が namespace に保存するリリースレコード、すなわち `helm.sh/release.v1` 型の Secret も確認できる (`pkg/storage/driver/secrets.go:284`):

```bash
kubectl get secret -l owner=helm
```

## 次に読むもの

チャートの provenance と署名、OCI レジストリ配布、`HELM_DRIVER` による storage driver の選択、チャート作成といった本番運用は [公式 Helm ドキュメント](https://helm.sh/docs/) を参照。GitOps 利用者は `helm install` を手で叩くより Argo CD や Flux 経由で Helm を駆動するのが普通。
