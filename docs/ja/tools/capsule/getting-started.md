# はじめに

> Helm チャート version 0.12.4 で検証済み。コマンドは稼働中のクラスタと設定済みの `kubectl` コンテキストを想定する。

## 前提

- Helm 3。
- Kubernetes v1.16 以降で、`MutatingAdmissionWebhook`・`ValidatingAdmissionWebhook`・`ResourceQuota`・`LimitRanger` の admission plugin が有効 (出典 6)。
- cluster-admin 権限を持つクラスタを指す `kubectl`。

## インストール

Open Container Initiative (OCI) レジストリからインストールする。

```bash
helm install capsule oci://ghcr.io/projectcapsule/charts/capsule \
  --version 0.12.4 -n capsule-system --create-namespace
```

HTTP チャートリポジトリ経由でも可。

```bash
helm repo add projectcapsule https://projectcapsule.github.io/charts
helm install capsule projectcapsule/capsule \
  --version 0.12.4 -n capsule-system --create-namespace
```

## 最初の動く構成

1. コントローラが動いていることを確認する。

    ```bash
    kubectl get pods -n capsule-system
    ```

2. `alice` というユーザが所有するテナントを作る。`Tenant` CRD はクラスタスコープなので Namespace は不要。

    ```bash
    kubectl apply -f - <<'EOF'
    apiVersion: capsule.clastix.io/v1beta2
    kind: Tenant
    metadata:
      name: oil
    spec:
      owners:
        - name: alice
          kind: User
    EOF
    ```

3. テナントを確認する。print column に Namespace quota・Namespace count・Ready 状態が出る。

    ```bash
    kubectl get tenant oil
    ```

`alice` が Namespace を作ると、mutating webhook がテナントを OwnerReference に設定し、validating webhook が永続化前に quota・prefix・metadata を検査する。

## 動作確認

テナントが Active 状態で condition が Ready であることを確認する。

```bash
kubectl get tenant oil -o jsonpath='{.status.state}{"\n"}'
```

正常なインストールでは `Active` と出る。admission webhook が登録されていることも確認できる。

```bash
kubectl get validatingwebhookconfigurations | grep capsule
kubectl get mutatingwebhookconfigurations | grep capsule
```

## 次に読むもの

本番運用の懸念 (高可用性、webhook の証明書管理、共有 quota 向けの ResourcePool、ルールと enforcement モデル) は公式ドキュメントが扱う。インストール・運用ガイド (出典 6) とメインのドキュメントサイト (出典 5) から始めるとよい。
