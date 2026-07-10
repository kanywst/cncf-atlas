# はじめに

> リリース `0.35.0` (コミット `84cb39c`) で検証済み。コマンドはモデルプロバイダの API キーを持つシェルを想定。

## 前提

- モデルプロバイダの API キー。例では Anthropic (`ANTHROPIC_API_KEY`) を使う。OpenAI (`OPENAI_API_KEY`) その他も LiteLLM 経由で同様に動く。
- HolmesGPT が読めるデータソースを 1 つ。Kubernetes toolset は kubeconfig を使うので、到達可能なクラスタが最短の入口だが、HolmesGPT は Kubernetes 以外のシステムも調査できる。
- CLI をインストールする Homebrew・`pipx`・Poetry のいずれか (インストールドキュメント)。

## インストール

Homebrew で CLI をインストールする。

```bash
brew tap robusta-dev/homebrew-holmesgpt
brew install holmesgpt
```

または `pipx` で。

```bash
pipx install holmesgpt
```

バイナリがあることを確認する。

```bash
holmes ask --help
```

## 最初の動く構成

最短の動く実行は、クラスタに対する 1 回の `ask` だ。ツールはモデルが選ぶ。こちらが渡すのは質問と API キーだけである。

1. プロバイダの API キーを設定する。

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

1. モデルを指定して HolmesGPT に調査させる。質問は自分のデータソースが見えるものに向ける。

```bash
holmes ask "what pods are unhealthy in my cluster and why?" \
  --model="anthropic/claude-sonnet-4-5-20250929"
```

1. 実行を眺める。HolmesGPT はツールを呼び (例: Pod の一覧やログの取得)、結果をモデルに戻し、モデルがツール呼び出しを止めた時点で根本原因分析を出力する。

Kubernetes を使っていないなら、手元にあるソースについて尋ねる。例: `holmes ask "what Prometheus alerts are currently firing and why?"`。

## 動作確認

正常な実行は、途中で呼んだツールを表示しつつ進み、エラーではなく書かれた分析で終わる。分析前に終了する場合、よくある原因は API キーの欠落・誤り、プロバイダが認識しないモデル名、到達可能なデータソースの不在だ。`holmes ask --help` は CLI がインストールされていることを確認できる。既知の良いソース (意図的に壊した Pod のあるクラスタ) で再実行すれば、ループがデータに到達して結論に至ることを確認できる。

## 次に読むもの

クラスタ内での実行、常駐の Operator Mode、アラート源統合 (AlertManager・PagerDuty・OpsGenie・Jira)、toolset の全カタログ、プロバイダ設定は、公式ドキュメント <https://holmesgpt.dev/> を参照。リポジトリの `docs/installation/` にはここで示していない Kubernetes・Docker Compose・Python SDK の導入経路がある。
