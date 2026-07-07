# はじめに

> `v1.8.0` リリース系列で検証済み。コマンドは `tar` と `curl` のある Linux ホスト、および選んだ障害が必要とする権限で `blade` を実行できるシェルを想定する (CPU 負荷は特別な権限不要、一部のネットワーク/ディスク障害は root が必要)。

## 前提

- Linux x86-64 ホスト (リリースは OS 別・アーキ別のツールキットで配布される)。
- リリースを取得・展開する `curl` と `tar`。
- Kubernetes 障害の場合: 到達可能なクラスタ、`kubectl`、`helm`。

## インストール

GitHub の releases ページからリリースのツールキットを取得して展開する。tarball には `blade` バイナリと `bin/` executor 群、バージョン付き YAML スペックが含まれる。

```bash
curl -sSL -o chaosblade.tar.gz \
  https://github.com/chaosblade-io/chaosblade/releases/download/v1.8.0/chaosblade-1.8.0-linux-amd64.tar.gz
tar -xzf chaosblade.tar.gz
cd chaosblade-1.8.0
```

## 最初の動く構成

最短の end-to-end 実行は CPU 負荷実験である。作成し、確認し、破棄する。`create` が出力する uid を `status` と `destroy` に渡す。

1. 60% の CPU 負荷を注入する。コマンドは JSON レスポンスを出力し、その `result` フィールドが実験 uid になる。

   ```bash
   ./blade create cpu load --cpu-percent 60
   ```

2. 上で返った uid で実験を照会する。

   ```bash
   ./blade status <experiment-uid>
   ```

3. 実験を停止してホストを回復する。

   ```bash
   ./blade destroy <experiment-uid>
   ```

実験の消し忘れを避けるには `--timeout` を付け、`blade` 自身に destroy をスケジュールさせる。次の実行は 30 秒後に自動回復する。

```bash
./blade create cpu load --cpu-percent 60 --timeout 30
```

Kubernetes では Helm で operator を導入し、Pod 障害を作成する。operator は実験を Custom Resource Definition (CRD) として公開する。

```bash
helm install chaosblade-operator chaosblade-operator-1.8.0.tgz \
  --namespace chaosblade --create-namespace
./blade create k8s pod-cpu fullload --cpu-percent 80 \
  --kubeconfig ~/.kube/config --names <pod-name> --namespace default
```

## 動作確認

`create` は成功時に `"code": 200` と uid を保持する `"result"` を持つ JSON オブジェクトを返す。`./blade status <experiment-uid>` を実行し、実験が `Success` と表示されることを確認する。CPU 負荷実験が動作中はホストの `top` で CPU 使用率の上昇が見え、`destroy` 後 (または `--timeout` 経過後) はベースラインに戻る。状態はバイナリの隣のローカル `chaosblade.dat` SQLite ファイルに記録される。

## 次に読むもの

- 公式ドキュメントは全シナリオカタログ (network・disk・process・JVM・container) を扱う: <https://chaosblade.io/en/docs/>
- Kubernetes operator とその CRD リファレンス: <https://github.com/chaosblade-io/chaosblade-operator>
- `chaosblade-box` プラットフォームは UI・Prometheus 連携・多クラスタ管理を追加する: <https://chaosblade.io/en/blog/2022/06/24/ChaosBlade-Box-a-New-Version-of-the-Chaos-Engineering-Platform-Has-Released/>
