# はじめに

> 公式の Kubernetes クイックスタートに基づく ([出典 9](https://d7y.io/docs/getting-started/quick-start/kubernetes/))。コマンドは稼働中の Kubernetes クラスタと Helm 3 を前提とする。

## 前提

- `kubectl` が設定済みの Kubernetes クラスタ。
- Helm 3 がインストール済み。
- ノードランタイムが containerd であること。以下のミラー設定は containerd を対象とする。

## インストール

チャートリポジトリを追加して更新する。

```bash
helm repo add dragonfly https://dragonflyoss.github.io/helm-charts/
helm repo update
```

## 最初の動く構成

チャートは全役割を展開する。manager・scheduler・seed peer、そして DaemonSet としての `dfdaemon` クライアントだ。

1. Dragonfly を専用 namespace にインストールする。

   ```bash
   helm install --create-namespace --namespace dragonfly-system dragonfly dragonfly/dragonfly
   ```

2. イメージのプルが Dragonfly を経由するよう、containerd をレジストリミラーとして Dragonfly プロキシに向ける。チャートにミラー設定が記載されている。各ノードに適用して containerd を再起動する。正確な `config.toml` のスニペットはクイックスタートを参照 ([出典 9](https://d7y.io/docs/getting-started/quick-start/kubernetes/))。

3. 通常どおりイメージをプルする。プルは Dragonfly のピアを経由し、ピアや seed peer からピースを取得して、必要なときだけオリジンにフォールバックする。

## 動作確認

Pod が起動しているか確認する。

```bash
kubectl get pods --namespace dragonfly-system
```

manager・scheduler・seed-peer・`dfdaemon` の Pod が `Running` 状態になっているはずだ。プルが高速化されているか確かめるには、2 台目のノードで同じイメージをプルし、`dfdaemon` のログでオリジンではなくピアから供給されたピースのダウンロードを確認する。

## 次に読むもの

HA、manager を支えるデータベース、役割間の TLS、scheduler のチューニングといった本番運用は、Dragonfly 公式ドキュメントを参照 ([出典 9](https://d7y.io/docs/getting-started/quick-start/kubernetes/))。`hf://` / `modelscope://` ソースでの AI モデル配布は CNCF の記事を参照 ([出典 8](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/))。
