# はじめに

> コミット `e100613` (チャートタグ `helm-chart-2.7.0` 近傍) のソースで検証済み。コマンドは稼働中の Kubernetes クラスタと `kubectl`・`helm` を想定する。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ (ローカルの kind や minikube で十分)。
- Helm 3。オペレータのチャートインストールに使う。
- 以下の最初の構成にクラウドアカウントは不要。組み込みの `fake` プロバイダを使うため、実バックエンドを配線せず同期を確認できる。

## インストール

Helm でオペレータと CRD をインストールする。

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets --create-namespace
```

## 最初の動く構成

`fake` プロバイダを使う `SecretStore` を作り、`ExternalSecret` を通して 1 つの値を同期し、生成された Kubernetes Secret を読む。`fake` プロバイダはストアにインラインで書いた値を返すため、外部サービスなしで reconcile 経路全体を実行できる。

1. `fake` プロバイダを使い、1 つの固定値を持つ `SecretStore` を作る。

```bash
kubectl apply -f - <<'EOF'
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: fake-store
spec:
  provider:
    fake:
      data:
        - key: "/db/password"
          value: "s3cr3t"
EOF
```

1. そのキーを `db-secret` という Kubernetes Secret に取り込む `ExternalSecret` を作る。

```bash
kubectl apply -f - <<'EOF'
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: db-secret
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: fake-store
    kind: SecretStore
  target:
    name: db-secret
  data:
    - secretKey: password
      remoteRef:
        key: "/db/password"
EOF
```

1. 同期された Secret を読み戻し、値を確認する。

```bash
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 -d
```

`fake` プロバイダが返した値 `s3cr3t` が表示される。

## 動作確認

`ExternalSecret` が正常に同期を報告しているか確認する。

```bash
kubectl get externalsecret db-secret
```

オペレータがターゲット Secret を書き込むと、`STATUS` 列は `SecretSynced`、`READY` は `True` になる。ストア設定が誤っていれば、`SecretStore` の status と `ExternalSecret` のイベントにその理由が載る。参照先のリモートキーが存在しないとき、オペレータは即座に失敗するのではなくターゲットの `deletionPolicy` (Delete・Retain・Merge) を適用する。

## 次に読むもの

実バックエンド (AWS Secrets Manager・HashiCorp Vault・GCP Secret Manager・Azure Key Vault ほか 41 プロバイダ)、認証オプション、クラスタ全体のストア向け `ClusterSecretStore`、multi-namespace fan-out 向け `ClusterExternalSecret`、プロバイダへ書き戻す `PushSecret`、ターゲット Secret のテンプレート化については、公式ドキュメント <https://external-secrets.io> を参照。
