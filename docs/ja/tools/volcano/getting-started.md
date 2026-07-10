# はじめに

> `master` のインストールマニフェスト (最新リリース v1.15.0) で検証済み。コマンドは、動作する Kubernetes クラスタと cluster-admin 権限の `kubectl` を想定。

## 前提

- Kubernetes クラスタ (この YAML インストールは x86_64 と arm64 の両方で動く)。
- そのクラスタに向けて設定済みの `kubectl`。
- Kubernetes v1.17 以上では、下のマニフェストが推奨 CRD を自動で使う。

## インストール

既存クラスタに development マニフェストを適用する:

```bash
kubectl apply -f https://raw.githubusercontent.com/volcano-sh/volcano/master/installer/volcano-development.yaml
```

あるいは Helm で公式リリースをインストールする:

```bash
helm repo add volcano-sh https://volcano-sh.github.io/helm-charts
helm install volcano volcano-sh/volcano -n volcano-system --create-namespace
```

## 最初の動く構成

1. `volcano-system` で 3 つのコントロールプレーン Pod が動いていることを確認する。

   ```bash
   kubectl get pods -n volcano-system
   ```

期待される出力は、スケジューラ・コントローラ・admission Webhook がそれぞれ 1 つずつ Running の状態:

```text
NAME                                   READY   STATUS    RESTARTS   AGE
volcano-admission-5bd5756f79-dnr4l     1/1     Running   0          96s
volcano-controllers-687948d9c8-nw4b4   1/1     Running   0          96s
volcano-scheduler-94998fc64-4z8kh      1/1     Running   0          96s
```

1. VolcanoJob を投入する。要となるフィールドは `schedulerName: volcano` と、gang サイズである `minAvailable`。この例は 6 replica を要求するが、少なくとも 3 Pod を同時に配置できて初めて起動する。

   ```yaml
   apiVersion: batch.volcano.sh/v1alpha1
   kind: Job
   metadata:
     name: test-job
   spec:
     minAvailable: 3
     schedulerName: volcano
     queue: default
     maxRetry: 5
     tasks:
       - replicas: 6
         name: "default-nginx"
         template:
           spec:
             containers:
               - image: nginx
                 imagePullPolicy: IfNotPresent
                 name: nginx
                 resources:
                   requests:
                     cpu: "1"
             restartPolicy: OnFailure
   ```

1. 適用する。

   ```bash
   kubectl apply -f job.yaml
   ```

## 動作確認

ジョブが PodGroup を作り、その Pod が Volcano にスケジュールされたかを確認する:

```bash
kubectl get podgroups
kubectl get pods -l volcano.sh/job-name=test-job
```

健全なジョブは、`minAvailable` 個の Pod が配置されると PodGroup が `Running` フェーズに到達する。`minAvailable` に満たない数しか収まらない場合、gang は部分起動せず pending のままになる。

## 次に読むもの

キューとフェアシェア、階層クォータ、トポロジ・NUMA 対応スケジューリング、GPU/NPU のデバイス共有、preempt や reclaim action の有効化については、公式ドキュメント <https://volcano.sh/en/> を参照。スケジューラの HA、Webhook 証明書、スケジュール周期のチューニングといった本番運用もそこで扱われている。
