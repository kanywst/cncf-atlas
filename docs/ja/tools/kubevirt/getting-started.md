# はじめに

> リリース `v1.8.4` で検証済み。コマンドは、稼働中の Kubernetes クラスタと、それに向けて設定済みの `kubectl` を想定。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ。
- ハードウェア仮想化が使えるノード。使えない場合 (ネストや emulation 環境など) は `KubeVirt` CR に software emulation 設定が必要。
- 対応する GitHub リリースから入手した `virtctl` CLI。

## インストール

インストール起点は `virt-operator`。operator マニフェストを適用し、続いて operator に残りの配備を指示する `KubeVirt` カスタムリソースを適用する ([docs/getting-started.md](https://github.com/kubevirt/kubevirt/blob/main/docs/getting-started.md)、[docs/updates.md](https://github.com/kubevirt/kubevirt/blob/main/docs/updates.md))。

```bash
export RELEASE=v1.8.4
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-operator.yaml
kubectl apply -f https://github.com/kubevirt/kubevirt/releases/download/${RELEASE}/kubevirt-cr.yaml
```

## 最初の動く構成

1. operator がコントロールプレーンを配備し、インストールが Available になるのを待つ。

   ```bash
   kubectl -n kubevirt wait kv kubevirt --for condition=Available --timeout=10m
   ```

2. ノードにハードウェア仮想化がない場合は、上記が完了する前に `KubeVirt` CR で software emulation を有効化する。

   ```bash
   kubectl -n kubevirt patch kubevirt kubevirt --type=merge \
     -p '{"spec":{"configuration":{"developerConfiguration":{"useEmulation":true}}}}'
   ```

3. Available になったら `VirtualMachine` を作成し、`virtctl` で起動する。

   ```bash
   virtctl start <vm-name>
   ```

## 動作確認

KubeVirt インストールが正常で、コンポーネントが動いているか確認する。

```bash
kubectl -n kubevirt get kv kubevirt -o=jsonpath='{.status.phase}'
kubectl -n kubevirt get pods
```

正常なインストールは phase `Deployed` を報告し、`virt-api`・`virt-controller`・`virt-handler` の Pod が Running になる。VM 起動後は `kubectl get vmi` でインスタンスが見え、`virtctl console <vm-name>` でシリアルコンソールに接続できる。

## 次に読むもの

アップグレード・HA・CDI によるストレージ・live migration など本番運用は、公式の [KubeVirt ドキュメント](https://kubevirt.io/user-guide/) と、サポートされる更新フローについてリポジトリの [docs/updates.md](https://github.com/kubevirt/kubevirt/blob/main/docs/updates.md) を参照。
