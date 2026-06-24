# はじめに

> コマンドは稼働中の Kubernetes クラスタと、動作する `kubectl` および `helm` を想定。外部依存なしの最速確認には自己署名 Issuer を使う。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ。
- Helm 3 がインストール済み (または静的マニフェストを使う)。
- cert-manager は CRD をインストールするので cluster-admin 権限。

## インストール

```bash
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true
```

Helm を使わない場合は、リリース資産の静的マニフェストを `kubectl apply -f` で適用する ([出典 1](https://github.com/cert-manager/cert-manager))。

## 最初の動く構成

外部 CA も DNS も不要で動く最短経路は、自己署名 Issuer + Certificate 1 つである。ACME 発行は到達可能なドメインと DNS が要るので、最初の確認には向かない。

1. namespace に自己署名 Issuer を作る。

```bash
kubectl create namespace demo
cat <<'EOF' | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: selfsigned
  namespace: demo
spec:
  selfSigned: {}
EOF
```

1. そこから Certificate を要求する。

```bash
cat <<'EOF' | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: demo-cert
  namespace: demo
spec:
  secretName: demo-cert-tls
  commonName: demo.example.com
  dnsNames:
    - demo.example.com
  issuerRef:
    name: selfsigned
    kind: Issuer
EOF
```

## 動作確認

Certificate が Ready を報告し、裏付ける Secret が存在することを確認する。

```bash
kubectl get certificate demo-cert -n demo
kubectl get secret demo-cert-tls -n demo
```

Certificate の `READY` 列が `True` になり、Secret に `tls.crt` と `tls.key` が含まれているはずだ。`False` のままなら `kubectl describe certificate demo-cert -n demo` でリソースの連鎖を確認し、紐づく CertificateRequest を見る。

## 次に読むもの

ACME (Let's Encrypt) issuer、DNS-01 / HTTP-01 solver、Gateway API 統合、HA、強化については `cert-manager.io` の公式ドキュメントを参照。このページは最小のローカル確認だけを扱う。本番運用は upstream に文書化されている。
