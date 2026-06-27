# はじめに

> Agones 公式の install quickstart (出典 5) に基づく。コマンドは、`kubectl` と `helm` を設定済みの動作中 Kubernetes クラスタを想定する。

## 前提

- `kubectl` で到達できる動作中の Kubernetes クラスタ。
- `helm` v3 がインストール済みで `PATH` 上にあること。
- Agones が使う HostPort レンジへの inbound 通信を許可するノード (ゲームクライアントは Node のホストポートに直結する)。

## インストール

```bash
helm repo add agones https://agones.dev/chart/stable
helm repo update
```

## 最初の動く構成

ゲームサーバを動かす最短経路は、Agones コントローラをインストールし、サンプルの `GameServer` を適用して `Ready` になるのを見ることだ。

1. Agones を `agones-system` 名前空間にインストールする。

    ```bash
    helm install my-release --namespace agones-system --create-namespace agones/agones
    ```

2. コントローラの Pod が立ち上がるのを待つ。

    ```bash
    kubectl get pods --namespace agones-system
    ```

3. リポジトリ同梱のサンプル `GameServer` を適用する。

    ```bash
    kubectl apply -f https://raw.githubusercontent.com/agones-dev/agones/main/examples/simple-game-server/gameserver.yaml
    ```

4. ゲームサーバが各状態を経て `Ready` になるのを見る。

    ```bash
    kubectl get gameservers
    ```

## 動作確認

`kubectl get gameservers` の出力で、ゲームサーバが `STATE` `Ready` に達し、`ADDRESS` と `PORT` が埋まっているはずだ。コントローラはそのアドレスを `Scheduled` と `Ready` の遷移で書き込む (`pkg/gameservers/controller.go:947`, `pkg/gameservers/controller.go:1014`)。`kubectl get pods --namespace agones-system` でコントローラの健全性も確認でき、コントローラ Pod が `Running` であればよい。

## 次に読むもの

- グループ管理とロールアウト: 単体のゲームサーバではなく `Fleet` (`pkg/apis/agones/v1/fleet.go:41`) を定義する。リポジトリの `examples/fleet.yaml` を参照。
- アロケーション: `GameServerAllocation` (`pkg/apis/allocation/v1/gameserverallocation.go:52`) で Ready なサーバを確保する。`examples/gameserverallocation.yaml` を参照。
- オートスケール: `FleetAutoscaler` を追加する。`examples/fleetautoscaler.yaml` を参照。
- HA・セキュリティ強化・スケーリングなど本番運用は公式ドキュメント (出典 5) を参照。
