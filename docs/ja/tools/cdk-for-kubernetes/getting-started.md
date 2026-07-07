# はじめに

> コミット `558f788` の `cdk8s` エンジン (npm `cdk8s`、最新リリース `v2.70.80`) で検証済み。コマンドは Node.js 18 以上と npm、Unix 系シェルを想定。

## 前提

- Node.js 18 以上と npm。
- ターミナル。合成にはクラスタ不要。適用するときだけクラスタが必要。

## インストール

公式の最短路はコマンドラインツールです。プロジェクト雛形を生成し、`cdk8s` エンジンも取り込んでくれます。

```bash
npm install -g cdk8s-cli
```

## 最初の動く構成

TypeScript からマニフェストを生成し、ディスクに書き出します。

1. プロジェクトディレクトリを作って移動します。

    ```bash
    mkdir hello-cdk8s && cd hello-cdk8s
    ```

2. TypeScript アプリの雛形を生成します。`main.ts` を生成し、依存をインストールし、`output` ディレクトリが `App` の `outdir` と一致しなければならない `cdk8s.yaml` を書きます。

    ```bash
    cdk8s init typescript-app
    ```

3. `main.ts` の本体を書き換え、chart が 1 リソースを定義するようにします。`App`・`Chart`・`ApiObject` クラスは `cdk8s` から来ます。

    ```typescript
    import { App, Chart, ApiObject } from 'cdk8s';
    import { Construct } from 'constructs';

    class MyChart extends Chart {
      constructor(scope: Construct, id: string) {
        super(scope, id);

        new ApiObject(this, 'configmap', {
          apiVersion: 'v1',
          kind: 'ConfigMap',
          data: { hello: 'world' },
        });
      }
    }

    const app = new App();
    new MyChart(app, 'hello');
    app.synth();
    ```

4. 合成します。CLI がコードをコンパイルしてアプリを実行し、chart ごとに 1 ファイルを `dist/` へ書き出します。

    ```bash
    cdk8s synth
    ```

## 動作確認

出力を一覧し、生成されたマニフェストを確認します。

```bash
ls dist/
cat dist/hello.k8s.yaml
```

`hello.k8s.yaml` が見えるはずです。その内容はリソースヘッダから始まり、`apiVersion`・`kind`・`metadata` が先頭に並びます (キー順序は `src/api-object.ts:215` で強制)。

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: hello-configmap-c87d4c10
data:
  hello: world
```

名前末尾のサフィックスは construct アドレス由来の 8 文字ハッシュなので (`src/names.ts:202`)、実際の出力では異なります。

## 次に読むもの

- 合成したマニフェストは自分で適用します: `kubectl apply -f dist/`。CDK8s はクラスタに接続しません。
- 生の `ApiObject` ではなく型付きワークロードクラス (Pod・Deployment・Service) が欲しければ `cdk8s-plus` ライブラリを追加します。
- CRD や Kubernetes API から型付き construct を生成するには CLI の `cdk8s import` を使います。
- マルチ chart アプリ・resolver・Helm chart 取り込みなど本番向けの話題は公式ドキュメント [cdk8s.io](https://cdk8s.io) を参照してください。
