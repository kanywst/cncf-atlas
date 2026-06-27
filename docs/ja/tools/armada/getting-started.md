# はじめに

> コミット `85b582d` (タグ v0.21.5 直後) で検証。コマンドは実 Kubernetes クラスタ無しのローカル開発スタックを想定する。

## 前提

- Go (リポジトリは `go.mod` で `go 1.26.1` を宣言)。
- Docker。Docker Compose で redis・postgres・pulsar を立ち上げるのに使う (README:81)。
- `mage`。`magefiles/` のタスクが使うビルドツール。

## インストール

リポジトリを clone し、`armadactl` コマンドラインツールをインストールする。

```bash
git clone https://github.com/armadaproject/armada.git
cd armada
scripts/get-armadactl.sh
```

`scripts/get-armadactl.sh` スクリプトが `armadactl` をインストールする (README:61)。GitHub Releases ページからビルド済みバイナリをダウンロードしてもよい (README:64)。

## 最初の動く構成

fake executor で Armada をローカル起動するため、Kubernetes クラスタは不要である。

1. fake executor 付きでローカルスタックを起動する。リポジトリルートで実行する。

    ```bash
    mage dev:up fake-executor
    ```

    これは `goreman` が無ければ `./bin/` に入れ、redis・postgres・pulsar を立ち上げ、データベース作成と migration 適用を行い、全コンポーネントを前面で起動する (README:81)。`fake-executor` 版は Kubernetes クラスタを必要としない (README:78)。これは起動したままにし、止めるときは Ctrl+C でクリーンに停止する。

2. 別ターミナルで `example` という名前のキューを作成する。

    ```bash
    armadactl create queue example
    ```

3. `jobspec.yaml` というジョブ仕様ファイルを作る。このジョブは 60 秒スリープする (`docs/creating_and_submitting_jobs.md:24-46`)。

    ```yaml
    queue: example
    jobSetId: set1
    jobs:
      - priority: 0
        podSpecs:
          - terminationGracePeriodSeconds: 0
            restartPolicy: Never
            containers:
              - name: sleep
                imagePullPolicy: IfNotPresent
                image: busybox:latest
                args:
                  - sleep
                  - 60s
                resources:
                  limits:
                    memory: 64Mi
                    cpu: 150m
                  requests:
                    memory: 64Mi
                    cpu: 150m
    ```

4. ジョブを投入する (`docs/creating_and_submitting_jobs.md:56`)。

    ```bash
    armadactl submit jobspec.yaml
    ```

## 動作確認

ジョブセットを watch し、ジョブが状態遷移するのを確認する。

```bash
armadactl watch example set1
```

watch はジョブが queued から running、完了へと進むのをリアルタイムに表示する。ローカル開発スタックでは Lookout Web UI は `mage ui` で別途ビルドされ、`http://localhost:8089` で配信される (`docs/developer_guide.md:140`)。

終わったら依存コンテナを停止する。

```bash
mage dev:down
```

## 次に読むもの

- 認証は `mage dev:up auth` でローカルスタックに Keycloak と OIDC (OpenID Connect) を追加する (README:77, `:91`)。
- gang-scheduling・preemption・priority class・ingress などのジョブオプションは `docs/creating_and_submitting_jobs.md` を参照。
- 本番インストールは Armada Operator を使う (README:47-50)。
- システムモデルと一貫性保証は `docs/system_overview.md` を参照。
