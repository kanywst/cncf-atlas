# はじめに

> v0.14.0 (コミット `aec3a9f`) で検証済み。コマンドは、`kubectl` アクセスと cluster-admin 権限を持つ Linux Kubernetes クラスタを想定する。

## 前提

- ノードが Linux で動く Kubernetes クラスタ (ノードエージェントは `lvcreate` をシェル実行する)。
- 各ノードに 10 GiB を超えるベアディスクが 1 本以上。空き容量が 9 GiB の予約マージンを割り込むとドライバはボリュームを拒否する (`pkg/devicemanager/volume/volume.go:65`)。
- ノードのファイルシステムは ext4 または xfs。
- kubelet がコンテナ内で動く場合は、ホストの `/dev` をコンテナにマウントする (`/dev:/dev`)。
- 階層化が欲しい場合は bcache カーネルモジュール。なければプロジェクトの FAQ に従いノードマニフェストを編集する。

## インストール

```bash
git clone https://github.com/carina-io/carina.git
cd carina/deploy/kubernetes
./deploy.sh
```

`deploy.sh` はデフォルトで `install` パスを実行する (`deploy/kubernetes/deploy.sh:70`)。configmap、2 つの CRD (custom resource definition)、コントローラとノードの RBAC およびワークロード、スケジューラ、3 つの StorageClass、Prometheus ServiceMonitor を適用する。

## 最初の動く構成

1. Carina の Pod が `kube-system` で動いていることを確認する。

    ```bash
    kubectl get pods -n kube-system | grep carina
    ```

2. LVM の StorageClass が入っていることを確認する。マニフェストはこれを `csi-carina-sc` と名付け、`provisioner: carina.storage.io`、`volumeBindingMode: WaitForFirstConsumer`、`allowVolumeExpansion: true` を持つ (`deploy/kubernetes/storageclass-lvm.yaml`)。

    ```bash
    kubectl get storageclass csi-carina-sc
    ```

3. StorageClass を参照する PVC (PersistentVolumeClaim) を作る。

    ```bash
    kubectl apply -f - <<'EOF'
    apiVersion: v1
    kind: PersistentVolumeClaim
    metadata:
      name: carina-pvc
    spec:
      accessModes:
        - ReadWriteOnce
      storageClassName: csi-carina-sc
      resources:
        requests:
          storage: 5Gi
    EOF
    ```

4. PVC をマウントする Pod を作る。StorageClass は `WaitForFirstConsumer` を使うため、ローカル論理ボリュームは Pod がスケジュールされた後にだけ作られる。

    ```bash
    kubectl apply -f - <<'EOF'
    apiVersion: v1
    kind: Pod
    metadata:
      name: carina-test
    spec:
      containers:
        - name: app
          image: busybox
          command: ["sh", "-c", "sleep 3600"]
          volumeMounts:
            - name: data
              mountPath: /data
      volumes:
        - name: data
          persistentVolumeClaim:
            claimName: carina-pvc
    EOF
    ```

## 動作確認

Pod がスケジュールされると、PVC が bind し `LogicVolume` リソースが現れるはずである。`LogicVolume` CRD は Cluster スコープで short name は `lv` である (`api/v1/logicvolume_types.go:60`)。

```bash
kubectl get pvc carina-pvc
kubectl get lv
```

bind した PVC と、status に volume id を示す `LogicVolume` が見えれば、ノードエージェントがローカルボリュームを作ったことを確認できる。

## 次に読むもの

raw パーティションとホストパスのボリュームは `deploy/kubernetes/storageclass-raw.yaml` と `deploy/kubernetes/storageclass-host.yaml` を参照。bcache 階層化・ディスクグループ化・スケジューリング戦略はリポジトリ <https://github.com/carina-io/carina> の README と `docs` ディレクトリを参照。
