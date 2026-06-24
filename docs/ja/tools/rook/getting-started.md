# はじめに

> コミット `63eed4e` の `master` example マニフェストで検証済み。コマンドは稼働中の Kubernetes クラスタと、それに対して設定済みの `kubectl` を想定する。

## 前提

- Ceph OSD 用に raw block デバイスか未フォーマットのパーティションを使えるノードを持つ Kubernetes クラスタ。
- cluster-admin 権限の `kubectl`。
- chart ベースのインストールを好むなら任意で `helm`。

## インストール

`deploy/examples` の 3 つのオペレータマニフェストを順に apply する。

```bash
git clone https://github.com/rook/rook.git
kubectl apply -f rook/deploy/examples/crds.yaml
kubectl apply -f rook/deploy/examples/common.yaml
kubectl apply -f rook/deploy/examples/operator.yaml
```

Helm の経路も同等で、オペレータ用に `rook-ceph` chart、続いてクラスタ用に `rook-ceph-cluster` chart をインストールする ([Getting Started](https://rook.github.io/docs/rook/latest-release/Getting-Started/intro/))。

## 最初の動く構成

1. オペレータ pod が動いていることを確認する。

   ```bash
   kubectl -n rook-ceph get pod -l app=rook-ceph-operator
   ```

2. クラスタを作成する。実マルチノードクラスタには `cluster.yaml`、単一ノードのテスト構成には `cluster-test.yaml` を使う。

   ```bash
   kubectl apply -f rook/deploy/examples/cluster.yaml
   ```

3. Ceph コマンドを実行できるよう toolbox pod を deploy する。

   ```bash
   kubectl apply -f rook/deploy/examples/toolbox.yaml
   ```

## 動作確認

CephCluster リソースの health が `HEALTH_OK` を報告するまで監視する。

```bash
kubectl -n rook-ceph get cephcluster
```

続いて toolbox に exec し、Ceph に直接問い合わせる。

```bash
kubectl -n rook-ceph exec -it deploy/rook-ceph-tools -- ceph status
```

Rook は `status.conditions` を通じてクラスタを駆動し、mon・mgr・OSD を設定する間リソースを `Progressing` へ移す (`pkg/operator/ceph/cluster/cluster.go:116`)。そのため CephCluster の status がオーケストレーション完了の権威ある合図になる。

## 次に読むもの

HA・ストレージクラス設定・オブジェクト/ファイルストレージ・監視・アップグレードといった本番運用については、公式の [Rook Ceph ドキュメント](https://rook.github.io/docs/rook/latest-release/Getting-Started/intro/) を参照。
