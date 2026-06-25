# はじめに

> コミット `56169b71` (リリース v0.13.0 付近) のソースで検証。コマンドは `make`・`kubectl`・kind が動く Linux ホストを想定。

## 前提

- 演算子を載せる Kubernetes クラスタ。ローカル作業なら repo の `make tilt-up` が kind クラスタを作る。
- Ironic backend。ironic provisioner が本番の既定で、Ironic Standalone Operator (IrSO) か `ironic-deployment/` の kustomize base でデプロイする。
- IPMI または Redfish で到達できる対応 BMC を持つサーバが最低 1 台と、network または virtual media のブート経路。開発中はハードの代わりに `fixture` backend を使える。

## インストール

開発ワークフローは repo の Makefile を使う ([出典 1](https://github.com/metal3-io/baremetal-operator), [出典 6](https://book.metal3.io/bmo/introduction))。

```bash
git clone https://github.com/metal3-io/baremetal-operator
cd baremetal-operator
make install
```

## 最初の動く構成

1. CRD をクラスタに導入する。

```bash
make install
```

1. コントローラを kustomize で展開し、ironic plugin 込みでローカル起動する。ironic backend は別途デプロイが必要 (IrSO か `ironic-deployment/` の base)。

```bash
make deploy
make run
```

1. 最小の `BareMetalHost` を作る。動くホストには BMC アドレス、credentials secret、起動 NIC の MAC (BMC ではなくホスト NIC)、`online: true` が要る ([出典 6](https://book.metal3.io/bmo/introduction))。

```yaml
apiVersion: metal3.io/v1alpha1
kind: BareMetalHost
metadata:
  name: node-0
spec:
  online: true
  bootMACAddress: 00:11:22:33:44:55
  bmc:
    address: redfish://192.168.1.10/redfish/v1/Systems/1
    credentialsName: node-0-bmc-secret
```

## 動作確認

ホストの状態を確認する。`State` 列は provisioning 状態機械 (registering・inspecting・available・provisioning・provisioned) を反映する。

```bash
kubectl get bmh
```

short name `bmh` / `bmhost` は CRD で定義され (`apis/metal3.io/v1alpha1/baremetalhost_types.go:855`-`:863`)、Status・State・BMC・Online・Error の print 列もここにある。

## 次に読むもの

- [Metal3 Book](https://book.metal3.io/bmo/introduction) が本番デプロイ・Ironic backend・BMC 設定をカバーする。
- 単体テストは envtest 前提で `make unit` で動く (素の `go test` は不可)。e2e は libvirt VM と BMC エミュレータを使い `./hack/ci-e2e.sh` で実行する。
- ベアメタル上に Kubernetes クラスタを作るには `cluster-api-provider-metal3` を参照 ([採用事例・エコシステム](./adoption) に記載)。
