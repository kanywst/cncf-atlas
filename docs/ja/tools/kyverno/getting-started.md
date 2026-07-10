# はじめに

> `v1.18.1` で検証済み。コマンドは稼働中の Kubernetes クラスタと動作する `kubectl` を想定。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ (ローカルの kind や minikube で十分)。
- チャートでインストールするなら Helm 3。

## インストール

Helm の場合:

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace
```

またはリリースマニフェストを直接適用:

```bash
kubectl apply -f https://github.com/kyverno/kyverno/releases/download/v1.18.1/install.yaml
```

## 最初の動く構成

目標は、すべての Pod にラベルを必須にし、欠けた Pod を Kyverno がブロックするのを見ることだ。

1. controller が動いていることを確認する。

   ```bash
   kubectl get pods -n kyverno
   ```

1. Pod に `team` ラベルを必須とし、それを enforce するポリシーを作る。

   ```bash
   cat <<'EOF' | kubectl apply -f -
   apiVersion: kyverno.io/v1
   kind: ClusterPolicy
   metadata:
     name: require-team-label
   spec:
     validationFailureAction: Enforce
     rules:
       - name: check-team-label
         match:
           any:
             - resources:
                 kinds:
                   - Pod
         validate:
           message: "The label 'team' is required on every Pod."
           pattern:
             metadata:
               labels:
                 team: "?*"
   EOF
   ```

1. ラベルなしの Pod を作ろうとする。admission リクエストは拒否される。

   ```bash
   kubectl run nginx --image=nginx
   ```

期待される出力:

```text
Error from server: admission webhook "validate.kyverno.svc-fail" denied the request:

resource Pod/default/nginx was blocked due to the following policies

require-team-label:
  check-team-label: 'The label ''team'' is required on every Pod.'
```

1. 同じ Pod をラベル付きで作ると admit される。

   ```bash
   kubectl run nginx --image=nginx --labels team=payments
   ```

## 動作確認

ポリシーが登録され ready であることを確認する。

```bash
kubectl get clusterpolicy require-team-label
```

`READY` 列が `True` のはず。Kyverno が API server に webhook を登録したことも確認できる。

```bash
kubectl get validatingwebhookconfigurations | grep kyverno
```

## 次に読むもの

本番運用では、公式ドキュメントの高可用性、セキュリティ・ハードニングガイド、controller のスケーリングを読むこと。CEL ベースのポリシー型 (ValidatingPolicy 等) が前進方向で、別途ドキュメント化されている。まずは [Kyverno introduction](https://kyverno.io/docs/introduction/) から。
