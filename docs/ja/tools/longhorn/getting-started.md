# はじめに

> `longhorn/longhorn` の `README.md` のインストール手順と公式ドキュメント ([出典 9](https://longhorn.io/docs/latest/deploy/install/)) に基づく。執筆時点の最新リリースは `v1.12.0`。コマンドは稼働中の Kubernetes クラスタと、それに向けて設定済みの `kubectl` を想定する。

## 前提

manager の `README.md` の requirements 節より:

- [mount propagation](https://kubernetes-csi.github.io/docs/deploying.html#enabling-mount-propagation) が有効な Kubernetes クラスタ。
- 各ホストに `iscsiadm`/`open-iscsi` と NFS クライアント (`nfs-common`/`nfs-utils`/`nfs-client`) がインストール済みであること。
- データ格納用に `file extents` 機能をサポートするファイルシステム (ext4 または XFS)。

インストール前に公式の環境チェックを走らせる:

```bash
curl -sSfL https://raw.githubusercontent.com/longhorn/longhorn/master/scripts/environment_check.sh | bash
```

## インストール

同梱のデプロイマニフェストを適用する。manager、instance manager、CSI driver、UI を `longhorn-system` namespace に入れる。

```bash
kubectl create -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml
```

## 最初の動く構成

1. control plane が立ち上がるのを待つ。全コンポーネントは `longhorn-system` で動く。

   ```bash
   kubectl -n longhorn-system get pods --watch
   ```

1. デフォルトの `StorageClass` が作られたか確認する。マニフェストは `longhorn` を登録する。

   ```bash
   kubectl get storageclass longhorn
   ```

1. `longhorn` クラスを使う `PersistentVolumeClaim` でボリュームを要求する。

   ```yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: longhorn-demo
   spec:
     accessModes:
       - ReadWriteOnce
     storageClassName: longhorn
     resources:
       requests:
         storage: 1Gi
   ```

1. 適用して bind を確認する。

   ```bash
   kubectl apply -f longhorn-demo.yaml
   kubectl get pvc longhorn-demo
   ```

## 動作確認

claim が `Bound` に達し、Longhorn がレプリカをスケジュール済みの健全な `Volume` CR を報告すればよい。

```bash
kubectl get pvc longhorn-demo
kubectl -n longhorn-system get volumes.longhorn.io
```

健全なボリュームは (pod がマウントすると) `State: attached`、利用前なら `detached` かつ `Robustness: healthy` を示す。`longhorn-system` の Longhorn UI サービスを開けば、ボリュームとそのエンジン、レプリカも確認できる。

## 次に読むもの

Longhorn が別途ドキュメント化している本番運用は公式ドキュメント ([出典 9](https://longhorn.io/docs/latest/deploy/install/)) を参照: 専用ディスクとノード構成、レプリカ数と data-locality のチューニング ([出典 12](https://cloudcasa.io/blog/longhorn-on-production-clusters-storage-configuration-tuning-and-gotchas))、S3 または NFS へのバックアップ、ディザスタリカバリ用ボリューム、v2 (SPDK) data engine。
