# はじめに

> `v4.0.9` リリース系列で検証済み。コマンドは macOS または Linux のシェルを、クラスタスキャンには動作する `kubectl` コンテキストを想定する。

## 前提

- macOS または Linux のシェル (install スクリプトと Homebrew formula はこれらを対象とする)。
- マニフェスト / Helm チャートのスキャン: ローカルの YAML ディレクトリ。クラスタ不要。
- 稼働クラスタのスキャン: 対象クラスタへ read アクセスできる kubeconfig。
- 初回実行時はネットワークアクセスが必要 (GitHub release からポリシー内容を DL するため)。air-gapped では事前にポリシーをキャッシュし `--use-from` / `--keep-local` を渡す。

## インストール

公式の install スクリプトが `kubescape` バイナリを path に置く:

```bash
curl -s https://raw.githubusercontent.com/kubescape/kubescape/master/install.sh | /bin/bash
```

Homebrew でも入る:

```bash
brew install kubescape
```

バイナリが動くか確認する:

```bash
kubescape version
```

## 最初の動く構成

中核機能はフレームワークスキャンだ。以下はローカルのマニフェストを NSA フレームワークに照らしてスキャンし、compliance スコアでゲートする。

1. スキャン対象のマニフェストを作る。

```bash
cat > deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: demo
spec:
  replicas: 1
  selector:
    matchLabels:
      app: demo
  template:
    metadata:
      labels:
        app: demo
    spec:
      containers:
        - name: demo
          image: nginx:1.27
EOF
```

1. NSA フレームワークに照らしてスキャンする。

```bash
kubescape scan framework nsa deployment.yaml
```

出力は control ごとの pass/fail 行、リソースのサマリ、そして末尾の risk スコアと compliance スコアを表示する。

1. ファイルではなく稼働クラスタをスキャンする。

```bash
kubescape scan framework nsa
```

path 引数なしだと、エンジンは現在の kubeconfig コンテキストからオブジェクトを収集する。

1. スキャンを CI ゲートにする。compliance が 80 を下回るとコマンドが失敗する。

```bash
kubescape scan framework nsa deployment.yaml --compliance-threshold 80
```

## 動作確認

正常な実行はサマリテーブルと非ゼロの compliance スコアで終わる。プロセスの終了コードはゲートを反映する。`--compliance-threshold` を付けると、compliance スコアが閾値を下回ったときコマンドは非ゼロで終了し、これが CI の判定材料になる。`kubescape list frameworks` を実行すると、エンジンがポリシー内容を DL し利用可能なフレームワークを見られることを確認できる。

## 次に読むもの

- in-cluster の operator・脆弱性スキャナ・node-agent はプロジェクトの Helm チャートで導入する。継続的な in-cluster スキャン、ランタイム検知、本番強化については [Kubescape リポジトリ](https://github.com/kubescape/kubescape) とそのドキュメントを参照。
- air-gapped 運用では CLI フラグ `--use-from` と `--keep-local` ([アーキテクチャ](./architecture) 参照) でエンジンを GitHub release ではなくローカルキャッシュのポリシーに向ける。
