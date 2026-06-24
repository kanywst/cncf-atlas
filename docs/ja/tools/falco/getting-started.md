# Getting Started

> Falco `0.44.x` の Helm チャートで検証。コマンドは Kubernetes クラスタと Helm 3 を前提とする。

## 前提条件

- eBPF プローブまたはカーネルモジュールをロードする権限で DaemonSet を動かせる Kubernetes クラスタ。
- そのクラスタに対して設定済みの `kubectl` と `helm`。
- フル機能の eBPF (CO-RE) には Linux カーネル 5.8 以降が必要。それ未満はカーネルモジュールにフォールバックする (出典 6, 9)。

## インストール

```bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update
helm install falco falcosecurity/falco --namespace falco --create-namespace
```

出力フォワーダと Web UI も同時に入れる場合:

```bash
helm install falco falcosecurity/falco \
  --set falcosidekick.enabled=true \
  --set falcosidekick.webui.enabled=true
```

## 最初に動く構成

1. 上の最初のコマンドでチャートをインストールする。Falco は DaemonSet として展開され、ノードごとに 1 つの pod が自ノードのカーネルイベントを読む (出典 6)。

1. pod が ready になるのを待つ:

```bash
kubectl get pods --namespace falco --watch
```

1. 組み込みルールを発火させる。既定のルールセットはコンテナ内で起動したシェルにアラートするので、稼働中の任意の pod に exec してシェルを起動する:

```bash
kubectl exec -it <some-pod> -- /bin/sh
```

## 動作確認

Falco のログを読みルールのマッチを探す。既定ルール "Terminal shell in container" が上の手順で発火する:

```bash
kubectl logs --namespace falco -l app.kubernetes.io/name=falco | grep "Terminal shell"
```

正常なインストールでは、ルール名・コンテナ・ユーザーを含む Warning priority の行が出る。Web UI を有効にしていれば、同じイベントがそこにも表示される。

## 次に読むもの

インストール手段、ドライバ選択 (eBPF とカーネルモジュール)、ルール作成、出力設定については公式ドキュメント (出典 6) と Kubernetes クイックスタート (出典 11) をたどること。ルールとプラグイン管理など本番の関心事は `falcoctl` (出典 7) を、アラートの外部システムへのルーティングは `falcosidekick` を参照。
