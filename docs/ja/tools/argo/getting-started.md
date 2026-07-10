# はじめに

> 公式 Getting Started ガイド (出典 8) に基づく。コマンドは稼働中の Kubernetes クラスタと、それに向けて設定済みの `kubectl` を前提とする。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ。
- `kubectl` CLI。
- login と app 管理用の `argocd` CLI (公式ドキュメントの手順でインストール)。

## インストール

namespace を作り、`stable` ブランチの upstream install マニフェストを適用する (出典 8)。

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

マニフェスト群は repo の `manifests/` 以下にある。

## 最初の動く構成

1. 中核 pod が立ち上がるのを待つ。

   ```bash
   kubectl wait --for=condition=available --timeout=300s \
     deployment/argocd-server -n argocd
   ```

1. 初期 admin パスワードを取得し、API server をローカルに公開する。

   ```bash
   argocd admin initial-password -n argocd
   kubectl port-forward svc/argocd-server -n argocd 8080:443
   ```

port-forward は UI と API をローカルアドレス `localhost:8080` で提供する。

1. login し、Git repo のパスを指す Application を登録する。

   ```bash
   argocd login localhost:8080
   argocd app create guestbook \
     --repo https://github.com/argoproj/argocd-example-apps.git \
     --path guestbook \
     --dest-server https://kubernetes.default.svc \
     --dest-namespace default
   ```

1. sync して、コントローラにマニフェストを適用させる。

   ```bash
   argocd app sync guestbook
   ```

## 動作確認

app が `Synced` かつ `Healthy` を報告するか確認する。

```bash
argocd app get guestbook
```

出力に `Sync Status: Synced` と `Health Status: Healthy` が出ればよい。`localhost:8080` の api-server UI でコントローラの reconcile を見ることもできる。

## 次に読むもの

HA、宣言的セットアップ、SSO、RBAC、repo-server とコントローラのスケーリングなど本番運用は [Argo CD 公式ドキュメント](https://argo-cd.readthedocs.io/en/stable/) を参照。本ガイドは意図的に単一の非 HA インストールで止めている。
