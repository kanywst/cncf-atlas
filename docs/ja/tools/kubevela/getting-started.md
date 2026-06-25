# はじめに

> インストール手順は公式ドキュメントに従う。コマンドは稼働中の Kubernetes クラスタと Helm 3 を想定。

## 前提

- `kubectl` で到達できる Kubernetes クラスタ。
- ローカルにインストール済みの Helm 3。

## インストール

KubeVela のコアコントローラは、プロジェクトの chart リポジトリから Helm chart としてインストールする ([KubeVela docs](https://kubevela.io/docs/)):

```bash
helm repo add kubevela https://kubevela.github.io/charts
helm repo update
helm install --create-namespace -n vela-system kubevela kubevela/vela-core
```

## 最初の動く構成

コントローラが起動したら、アプリケーションを配信する。`Application` カスタムリソースを `kubectl` で適用する。

最小の `Application` を `app.yaml` に書く:

```yaml
apiVersion: core.oam.dev/v1beta1
kind: Application
metadata:
  name: first-vela-app
spec:
  components:
    - name: express-server
      type: webservice
      properties:
        image: oamdev/hello-world
        ports:
          - port: 8000
            expose: true
```

適用する:

```bash
kubectl apply -f app.yaml
```

`Application` リソースは `components` / `policies` / `workflow` を持つ (`src/apis/core.oam.dev/v1beta1/application_types.go:51-65`)。`webservice` 型とその `properties` は reconcile 時に対応する ComponentDefinition が解決する。

## 動作確認

`Application` リソースは phase と health の print column 付きで登録されているため、素の `get` で状態が見える (`src/apis/core.oam.dev/v1beta1/application_types.go:74-78`):

```bash
kubectl get application first-vela-app
```

`PHASE` 列が `running` になるのを待つ。controller-manager は各 reconcile を `Start reconcile application` ... `End reconcile application` としてログに出す (`src/pkg/controller/core.oam.dev/v1beta1/application/application_controller.go:112-114`)。配信が詰まったときに役立つ。

## 次に読むもの

マルチクラスタ配信、CUE による独自 ComponentDefinition / TraitDefinition、アドオン、本番強化については公式ドキュメント [`kubevela.io/docs`](https://kubevela.io/docs/) を参照。
