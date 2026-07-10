# はじめに

> 公式 Getting Started の手順 (出典 7) をコミット `f5c408d` (最寄りタグ `v1.5.1`) で確認。Cozystack はベアメタルまたは仮想マシンのノードを前提とするため、ラップトップ上のクラスタでは完全なインストールには足りない。

## 前提

- ノードにするベアメタルのマシン (または KubeVirt をネストできる VM) を 1 台以上。
- そのノードで動かす Talos Linux。Cozystack は OS 層を管理する。
- ワークステーションに `kubectl` とブートストラップツール `talm`。
- 計画済みの Pod / Service CIDR と、プラットフォーム用の `root-host` DNS 名。

## インストール

Cozystack は公式ガイド (出典 7) に沿って 5 段階でインストールする:

1. ノードに Talos Linux を導入する。
2. `talm` で Kubernetes をブートストラップする。
3. Cozystack 本体をインストールする。
4. テナントを作成する。
5. テナントにアプリを展開する。

段階 3 が Cozystack 固有のステップだ。`cozy-system` namespace に `cozystack-config` ConfigMap (bundle 名、Pod / Service CIDR、`root-host`) を置き、installer manifest を適用する。

```bash
kubectl create namespace cozy-system
kubectl apply -f cozystack-installer.yaml
```

installer は `cozystack-operator` をデプロイする。その variant (`talos` / `generic` / `hosted`) は installer の values で設定する (`packages/core/installer/values.yaml:8`)。operator はその後 `platform` パッケージをリコンサイルし、残りのシステムコンポーネントを Flux 経由で立ち上げる。設定した `root-host` と `bundle-name` は共有プラットフォーム値に読み込まれる (`packages/core/platform/templates/apps.yaml:22`)。

## 最初の動く構成

プラットフォームが立ったら、テナントを作り、その中にマネージドデータベースをプロビジョニングする。テナント自体が `apps.cozystack.io` の kind だ。

1. テナントの namespace とオブジェクトを作る。

   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: apps.cozystack.io/v1alpha1
   kind: Tenant
   metadata:
     name: my-tenant
     namespace: tenant-root
   spec: {}
   EOF
   ```

1. テナントに Postgres をプロビジョニングする。ここの `spec` は `packages/apps/postgres` chart の Helm values になる (`pkg/registry/apps/application/rest.go:1605`)。

   ```bash
   kubectl apply -f - <<'EOF'
   apiVersion: apps.cozystack.io/v1alpha1
   kind: Postgres
   metadata:
     name: my-db
     namespace: tenant-my-tenant
   spec:
     replicas: 2
   EOF
   ```

## 動作確認

Cozystack は自前の store を持たないので、裏の `HelmRelease` が唯一の真実だ。Application ビューと Flux オブジェクトの両方を確認する。

```bash
kubectl get postgres -n tenant-my-tenant
kubectl get helmrelease -n tenant-my-tenant
```

`Postgres` オブジェクトが ready を報告し、対応する `HelmRelease` (kind の prefix 付きの名前) が `Ready` にリコンサイルするはずだ。`HelmRelease` が詰まる場合、問題は chart のインストールにあり、Flux の helm-controller がログを出す。

## 次に読むもの

実運用では公式ドキュメント [cozystack.io](https://cozystack.io/docs/) に従い、ノードのサイジング、ストレージ (LINSTOR / Piraeus)、ネットワーク (Cilium / Kube-OVN)、テナント分離、マネージドサービスの全カタログを確認する。単一ノードのクイックスタートを本番トポロジと見なさないこと。
