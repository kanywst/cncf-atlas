# はじめに

> v0.60.3 で検証済み。コマンドは、動作する Kubernetes クラスタと設定済みの `kubectl` を想定する。

## 前提

- cluster-admin 権限で到達できる Kubernetes クラスタ (ローカルの `kind` や `minikube` で十分)。
- そのクラスタを指すよう設定された `kubectl`。

## インストール

リリースマニフェストを適用して kapp-controller をインストールする。

```bash
kubectl apply -f https://github.com/carvel-dev/kapp-controller/releases/latest/download/release.yml
```

これにより `kapp-controller` デプロイメント、そのカスタムリソース定義 (`App`・`PackageInstall`・`PackageRepository`)、集約 API サービスが作られる。

## 最初の動く構成

中核の仕事は、`App` を宣言してコントローラに fetch・template・deploy させることだ。以下の例は公開された Carvel サンプルリポジトリを使う。

1. コントローラが ready になるのを待つ。

    ```bash
    kubectl rollout status deployment/kapp-controller -n kapp-controller
    ```

2. `App` がデプロイに使うサービスアカウントと namespace スコープの RBAC を作る。これを `rbac.yml` として保存する。

    ```yaml
    apiVersion: v1
    kind: ServiceAccount
    metadata:
      name: default-ns-sa
      namespace: default
    ---
    kind: Role
    apiVersion: rbac.authorization.k8s.io/v1
    metadata:
      name: default-ns-role
      namespace: default
    rules:
    - apiGroups: ["*"]
      resources: ["*"]
      verbs: ["*"]
    ---
    kind: RoleBinding
    apiVersion: rbac.authorization.k8s.io/v1
    metadata:
      name: default-ns-role-binding
      namespace: default
    subjects:
    - kind: ServiceAccount
      name: default-ns-sa
      namespace: default
    roleRef:
      apiGroup: rbac.authorization.k8s.io
      kind: Role
      name: default-ns-role
    ```

    適用する。

    ```bash
    kubectl apply -f rbac.yml
    ```

3. git から fetch し、`ytt` で template し、`kapp` で deploy する `App` を宣言する。これを `app.yml` として保存する。

    ```yaml
    apiVersion: kappctrl.k14s.io/v1alpha1
    kind: App
    metadata:
      name: simple-app
      namespace: default
    spec:
      serviceAccountName: default-ns-sa
      fetch:
      - git:
          url: https://github.com/k14s/k8s-simple-app-example
          ref: origin/develop
          subPath: config-step-2-template
      template:
      - ytt: {}
      deploy:
      - kapp: {}
    ```

    適用する。

    ```bash
    kubectl apply -f app.yml
    ```

## 動作確認

`App` の status を確認する。`DESCRIPTION` 列が各 reconcile の結果を報告する。

```bash
kubectl get app simple-app -n default
```

正常なら `Reconcile succeeded` が表示される。status に記録された段ごとの詳細 (fetch・template・deploy の出力と終了コード) を見るには次のようにする。

```bash
kubectl get app simple-app -n default -o yaml
```

サンプルがレンダリングしたリソース (Deployment と Service) が `default` namespace に存在するはずだ。

```bash
kubectl get deployment,service -n default
```

## 次に読むもの

- [kapp-controller ドキュメント](https://carvel.dev/kapp-controller/) は、パッケージング (`PackageRepository` と `PackageInstall`)、プライベートレジストリ認証、エアギャップ環境でのインストールを扱う。
- デプロイ用サービスアカウントの制限、`--namespace` フラグによる namespace スコープ化、サイドカーのセキュリティモデルといった本番運用の関心事は、同ドキュメントと [メインリポジトリ](https://github.com/carvel-dev/kapp-controller) から始めるとよい。
