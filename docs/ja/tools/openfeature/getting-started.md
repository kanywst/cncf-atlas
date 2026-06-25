# はじめに

> flagd `v0.16.0` (コミット `80b9e95`) で検証済み。コマンドは Docker とローカルシェルを想定。

## 前提

- Docker (公開イメージは `ghcr.io/open-feature/flagd`)。
- 評価 service 用 (`8013`) と OFREP 用 (`8016`) のローカルポートが空いていること。
- OFREP REST エンドポイントを試すための `curl`。

## インストール

最も簡単なのはコンテナイメージで、ビルド手順は不要だ (6)。

```bash
docker pull ghcr.io/open-feature/flagd:latest
```

ソースからビルドする場合、リポジトリは Go workspace と Makefile を使う (`make build` で `flagd` バイナリを生成) (1)。

## 最初の動く構成

1. カレントディレクトリに flag 定義ファイル `flags.json` を書く。`state` で flag を有効化し、`variants` が取りうる値を並べ、`defaultVariant` が targeting にマッチしないときに返る。

```json
{
  "flags": {
    "show-welcome-banner": {
      "state": "ENABLED",
      "variants": {
        "on": true,
        "off": false
      },
      "defaultVariant": "off"
    }
  }
}
```

1. ファイルをマウントし、`file:` sync ソースとして渡して flagd を起動する。flag のデフォルトポートは `8013` (評価)・`8014` (management)・`8015` (gRPC sync)・`8016` (OFREP) (`flagd/cmd/start.go:53-56`)。

```bash
docker run --rm -it \
  -p 8013:8013 -p 8016:8016 \
  -v "$(pwd)":/etc/flagd \
  ghcr.io/open-feature/flagd:latest \
  start --uri file:/etc/flagd/flags.json
```

1. OFREP (REST 評価 API) で flag を評価する。空のコンテキストは targeting 入力なしで評価する。

```bash
curl -X POST http://localhost:8016/ofrep/v1/evaluate/flags/show-welcome-banner \
  -H 'Content-Type: application/json' \
  -d '{"context": {}}'
```

応答には解決された値と理由が入る。targeting ルールが無ければ理由は `STATIC` で、値は `defaultVariant` だ (`core/pkg/evaluator/json.go:420`)。

## 動作確認

- 上の OFREP 呼び出しは `off` variant の値 (`false`) を理由 `STATIC` で返すはず。
- flag に `targeting` の JSONLogic ルールを足し、マッチするコンテキストで再評価すると、理由は `TARGETING_MATCH` に変わる (`core/pkg/evaluator/json.go:401-406`)。
- 無効な flag (`"state": "DISABLED"`) は理由 `DISABLED` を返す (`core/pkg/evaluator/json.go:349-352`)。

## 次に読むもの

- ファイル以外の sync ソース (HTTP / Kubernetes CRD / gRPC / blob ストレージ) と、サイドカー注入用の OpenFeature Operator は flagd ドキュメントへ (1)(12)。
- 生の OFREP ではなく provider 経由でアプリコードから flagd を呼ぶには OpenFeature SDK を使う (5)。
- TLS・OpenTelemetry エクスポート・ファンアウト用の flagd-proxy など本番運用は公式ドキュメントへ (1)(12)。
