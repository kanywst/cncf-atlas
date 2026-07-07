# はじめに

> tag `v0.2.0` (commit 761a00b) で検証済み。コマンドは動作する `kubectl` コンテキスト、Go 1.24+、Docker、push できるコンテナレジストリを想定。

## 前提

- Go v1.24.0+ (README と `go.mod` が `go 1.24.0` を固定)。
- Docker 17.03+。
- `kubectl` v1.11.3+ と、Kubernetes v1.11.3+ クラスタへのアクセス。
- 実際の attach を行うには、対応する CDI プロバイダ (Fujitsu FTI_CDI、SNIA Sunfish、NEC) とその背後の composable fabric が必要。無い場合も operator のインストールと起動はできるが、`ComposabilityRequest` オブジェクトは完了しない。

## インストール

リポジトリを clone し、ドキュメントのバージョンをチェックアウトする。

```bash
git clone https://github.com/CoHDI/composable-resource-operator.git
cd composable-resource-operator
git checkout v0.2.0
```

manager バイナリをビルドしてツールチェインの準備を確認する。`build` ターゲットは先に `manifests`、`generate`、`fmt`、`vet` を実行する。

```bash
make build
```

## 最初の動く構成

1. kubeconfig が指すクラスタに CRD をインストールする。

   ```bash
   make install
   ```

2. 両方の CRD が登録されたことを確認する。

   ```bash
   kubectl get crds | grep cro.hpsys.ibm.ie.com
   ```

3. operator イメージをビルドしてレジストリに push する。

   ```bash
   make docker-build docker-push IMG=<some-registry>/composable-resource-operator:v0.2.0
   ```

4. manager をデプロイする。デプロイには環境変数 (`CDI_PROVIDER_TYPE`、`DEVICE_RESOURCE_TYPE`、プロバイダのエンドポイント) 経由で設定したプロバイダが必要。実ハードウェアを接続するなら apply 前に `config/manager` を編集する。

   ```bash
   make deploy IMG=<some-registry>/composable-resource-operator:v0.2.0
   ```

5. `ComposabilityRequest` を作成する。これはプロジェクト README にある spec の形式。

   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: cro.hpsys.ibm.ie.com/v1alpha1
   kind: ComposabilityRequest
   metadata:
     name: composabilityrequest-sample
   spec:
     resource:
       type: "gpu"
       size: 2
       model: "NVIDIA-A100-PCIE-40GB"
       target_node: "node1"
       allocation_policy: "samenode"
   EOF
   ```

## 動作確認

operator が動いていること、リクエストがステートマシンを進んでいることを確認する。

```bash
kubectl get pods -n composable-resource-operator-system
kubectl get composabilityrequest composabilityrequest-sample -o jsonpath='{.status.state}'
```

fabric が設定されていれば、状態は `NodeAllocating` から `Updating`、`Running` へ進み、デバイス 1 つにつき 1 つの `ComposableResource` が現れる。

```bash
kubectl get composableresource
```

fabric が無い場合、リクエストは手前の状態に留まる。それでも CRD とコントローラがインストールされ reconcile していることは確認できる。

## 次に読むもの

- 終わったら `make undeploy` と `make uninstall` でアンインストールする。
- [アーキテクチャ](./architecture) と [内部実装](./internals) が reconcile ステートマシンと CDI プロバイダ層を扱う。
- 本番向けの注意点 (レジストリ権限、RBAC、build-installer バンドル) はプロジェクトの [README](https://github.com/CoHDI/composable-resource-operator/blob/main/README.md) と [Kubebuilder ドキュメント](https://book.kubebuilder.io/introduction.html) を参照。
