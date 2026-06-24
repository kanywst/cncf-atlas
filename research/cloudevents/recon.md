# recon: CloudEvents

調査メモ。CloudEvents は「イベントデータの記述フォーマット」を定めるベンダー中立な仕様 (CNCF Graduated)。本体は仕様リポ `cloudevents/spec` (1)(2) だが、deep-dive の対象としてはコードを追える主力実装の **Go SDK `cloudevents/sdk-go`** を採る。仕様リポと SDK の関係は後述。出典は `(n)` で sources.md に対応。`file:line` は `research/cloudevents/src/` 以下の相対パス。

## リポ解決の根拠

- CloudEvents プロジェクトの中心は仕様 (`cloudevents/spec`, 5,799 stars / 613 forks, gh 2026-06-22) (2)(13)。ただし spec リポは大半が markdown で、コード trace の対象に乏しい。
- 言語別 SDK のうち **sdk-go が最も普及** (956 stars / 246 forks / 138 open issues, gh 2026-06-22)。次点の sdk-javascript (約 399) / sdk-csharp (約 332) / sdk-java (約 360) を 2.5 倍超で上回る (1)(13)。「主実装リポを採れ」の指示に従い sdk-go を対象とする。

## 基本情報

- repo: cloudevents/sdk-go (1)。仕様本体は cloudevents/spec (2)。
- pinned commit: `1e993966fbdfb21b99d161a7be69198a4402afc4` (2026-06-19, main ブランチ HEAD)
- 近いタグ: `v2.16.2` (2025-09-22 リリース。HEAD はこのタグより後の main 上。`git tag --points-at HEAD` は空)。SDK の最新リリースタグは `v2.16.2` (1)(13)。
- 言語 / ビルド: Go (`v2/go.mod` は `go 1.25.0`、ローカル toolchain `go1.26.4`)。マルチモジュール構成。コアは `cd v2 && go build ./...`。protocol binding や samples は別 go.mod。
- ライセンス: Apache-2.0。`LICENSE` 本文 (Apache License Version 2.0) と各ソース冒頭の `SPDX-License-Identifier: Apache-2.0` を確認。`gh api repos/cloudevents/sdk-go` の `license.spdx_id` も `Apache-2.0` (1)(13)。
- CNCF 成熟度: Graduated (2024-01-25 昇格) (3)。
- カテゴリ (tools.ts CATEGORY_ORDER): App Definition & GitOps。
- 主エントリポイント: ライブラリ。アンブレラパッケージ `github.com/cloudevents/sdk-go/v2` が `v2/alias.go` で client / event / protocol/http を再エクスポート (`NewClient`, `NewClientHTTP`, `NewEvent`, `NewHTTP` 等, `v2/alias.go:91-97`)。動作可能な例は `samples/http/sender/main.go`。

## 歴史の素材

- 2017-04: CNCF Serverless WG が TOC により発足。FaaS のベンダーロックイン (関数 API とイベントフォーマットの差異) を緩和する共通イベントフォーマットの調査を提言 (4)(6)。
- 2017-12: 仕様の実作業開始 (Serverless WG 配下) (6)。
- 2018-05-15: CNCF Sandbox 受理。CloudNativeCon EU 2018 で公表。Google / Microsoft / IBM / Red Hat / Oracle / Huawei らが当初から参加 (4)。
- 2018-04: Microsoft が v0.1 を Azure Event Grid で最初に実装 (9)。
- 2019-06: v0.3。属性の map を廃し簡素化、batching / error handling 等を整理 (6)。
- 2019-10-28: v1.0 リリース、同時に Incubation 昇格。共通属性と HTTP 等の protocol binding を定義 (4)。
- 2020-12-10: v1.0.1 (WebSocket binding 追加等)。2022-02-05: v1.0.2 (specs リポ再編) (2)。
- 2022-10: Trail of Bits によるセキュリティ評価実施 (spec リポ README に記載) (2)。
- 2024-01-25: CNCF Graduated 昇格 (3)。
- 2024-06-13: CloudEvents SQL (CESQL) が V1 承認。CloudEvents のフィルタ/クエリ言語 (2)。

## アーキテクチャの素材 (sdk-go)

トップレベル構成 (`v2/` 配下):

- `event/` : `event.Event` と spec バージョン別 `EventContext` (v1.0 / v0.3)。仕様の正準データモデル。
- `binding/` : protocol 非依存の `Message` 抽象と、構造化/バイナリの双方向トランスコード (`write.go`, `to_event.go`)。`binding/spec/` に spec バージョンレジストリ、`binding/format/` に JSON 等のフォーマット。
- `protocol/` : transport 実装。`http/` のほか別モジュールで kafka (sarama / confluent)、mqtt、amqp、nats、nats_jetstream、pubsub (GCP)、stan、gochan。
- `client/` : `event.Event` を送受信する高レベル API (`Send` / `Request` / `StartReceiver`)。
- `types/` : URI / Timestamp 等の正準型変換。`extensions/`, `observability/`, `context/` が補助。

送信フロー (HTTP binary mode を end-to-end で trace):

```text
cloudevents.Event
  -> client.Send (Validate + defaulter)
  -> http.Protocol.Send -> Request
  -> http.WriteRequest
  -> binding.Write (encoding 判定)
  -> EventMessage.ReadBinary (属性/拡張/data を visit)
  -> httpRequestWriter.SetAttribute/SetExtension/SetData (HTTP ヘッダ + body)
```

- `v2/client/client.go:116` `ceClient.Send`: outbound context decorator 適用 -> `eventDefaulterFns` 適用 (id/time 補完など) -> `e.Validate()` -> `c.sender.Send(ctx, (*binding.EventMessage)(&e))`。`event.Event` をゼロコピーで `binding.EventMessage` に型変換して渡すのが要点。
- `v2/protocol/http/protocol.go:168` `Protocol.Send`: 実体は `Request` に委譲。レスポンスを `Finish` し、非 ACK エラー時はボディを読んで `Result` にラップ。
- `v2/protocol/http/write_request.go:23` `WriteRequest`: `*http.Request` を `httpRequestWriter` にキャストし (structured/binary の両 Writer を兼ねる)、`binding.Write` を呼ぶ。
- `v2/binding/write.go:65` `Write`: `message.ReadEncoding()` を読む。`EventMessage` は `EncodingEvent` (`event_message.go:37`) なので DirectWrite をスキップし、`ToEvent` (実体は同じ Event) を経て、既定 `preferredEventEncoding = EncodingBinary` のため `writeBinary` -> `message.ReadBinary` を呼ぶ (`write.go:91-105`, `write.go:165-179`)。
- `v2/binding/event_message.go:50` `EventMessage.ReadBinary`: `eventContextToBinaryWriter` が `spec.VS.Version(specversion)` で属性集合を引き、各属性を `b.SetAttribute`、拡張を `b.SetExtension`、最後に `b.SetData` (`event_message.go:80-100`)。
- `v2/protocol/http/write_request.go:109` `httpRequestWriter.SetAttribute`: `attributeHeadersMapping` で属性名を HTTP ヘッダ名へ写像し、`types.Format` で文字列化してヘッダに格納。`SetData` で request body を設定 (`write_request.go:52-107`)。
- ヘッダ写像表は `v2/protocol/http/headers.go:27` の `init()` で全 spec バージョンの属性を走査して構築 (`datacontenttype` は `Content-Type`、他は `ce-` prefix + CanonicalMIMEHeaderKey)。

設計判断 (非自明):

- **direct transcoding**: `binding.Write` はまず `DirectWrite` (`write.go:32-52`) を試み、structured->structured / binary->binary をペイロードを decode せずヘッダ/ボディコピーで通す。decode+再エンコード (`ToEvent`) は直接経路が使えない時だけのフォールバック。イベントルータ等で payload を解析せず転送できる。context キー (`skipDirectStructuredEncoding` / `skipDirectBinaryEncoding` / `preferredEventEncoding`, `write.go:14-20`) で挙動を調整。これにより transport 間ブリッジが安価になる。

## 内部実装の素材 (中核データ構造)

- `event.Event` (`v2/event/event.go:15`): `Context EventContext` + `DataEncoded []byte` + `DataBase64 bool` + `FieldErrors map[string]error`。data を常にエンコード済みバイト列で保持し、エンコーディング (JSON/base64) を遅延させる。
- `event.EventContextV1` (`v2/event/eventcontext_v1.go:37`): 仕様 v1.0 のコンテキスト属性。必須 `id` / `source` (`types.URIRef`) / `type`、任意 `datacontenttype` / `subject` / `time` (`types.Timestamp`) / `dataschema` (`types.URI`)、`Extensions map[string]interface{}`。`specV1Attributes` (同 `:24`) が予約名集合。
- `binding.Message` / `MessageReader` (`v2/binding/message.go:89`, `:23`): protocol 非依存のイベント運搬抽象。`ReadEncoding` / `ReadStructured` / `ReadBinary` / `Finish`。QoS 0/1 を表現し、QoS 2 は `ExactlyOnceMessage` (`message.go:108`)。
- `binding.BinaryWriter` / `StructuredWriter` (`v2/binding/binary_writer.go:39`, `MessageMetadataWriter` 同 `:16`): visitor。各 protocol がこれを実装し、`SetAttribute` / `SetExtension` / `SetData` / `Start` / `End` を受ける。`Start`/`End` のライフサイクルは呼び出し側が制御 (`message.go:41-43`)。
- `spec.Versions` / `version` / `attribute` (`v2/binding/spec/spec.go:40`, `:73`, `:63`): spec バージョンレジストリ。`Kind` 列挙でバージョン横断に属性を参照し、`AttributeFromKind` / `Get` / `Set` で v0.3 と v1.0 を同一コードで扱う。`WithPrefix` (`spec.go:137`) で `ce-` 等の prefix 付きセットを生成 (HTTP/Kafka 等が利用)。

追う価値のあるパス:

- 受信側: `v2/client/client.go:198` `StartReceiver` -> poll goroutine -> `invoker.Invoke` (`v2/client/invoker.go`)。リフレクションで多様な handler シグネチャを受ける (`client.go:36-49`)。
- decode 側: `v2/binding/to_event.go` と `v2/event/event_unmarshal.go` (json-iterator ベースの高速 unmarshal、benchmark テスト併設)。
- CESQL: トップレベル `sql/` (フィルタ言語の実装)。

## 採用事例の素材

CNCF Graduation 発表 (3) が明記する採用先 (捏造なし、出典 (3)):

- 製品/サービス: Adobe I/O Events、Alibaba Cloud EventBridge、Azure Event Grid、European Commission、Google Cloud Eventarc、IBM Cloud Code Engine。
- CNCF プロジェクト: Argo、Falco、Harbor、Knative、Serverless Workflow。

補強:

- Azure Event Grid は CloudEvents v1.0 JSON と HTTP binding をネイティブ対応 (8)(9)。Microsoft は v0.1 段階の最初の実装者 (9)。
- Knative Eventing はイベント送受信を CloudEvents 準拠の HTTP POST で行う (10)。
- コミュニティ規模: 仕様には 122 組織から 340+ contributors が関与 (CNCF Graduation 発表) (3)。sdk-go の contributors は約 122 (`gh api repos/cloudevents/sdk-go/contributors` のページネーション末尾, 2026-06-22) (13)。

## 代替・エコシステム

- **言語別 SDK** (公式): Go、JavaScript/TypeScript、Java、C#、Python、Ruby、PHP、PowerShell、Rust (1)(5)。
- **sdk-go の protocol binding**: http、kafka_sarama、kafka_confluent、mqtt、amqp、nats、nats_jetstream、pubsub (GCP)、stan、gochan (`protocol/` と `samples/` で確認)。
- **CESQL**: CloudEvents を SQL 風にフィルタ/クエリ。sdk-go では `sql/` (2)。
- 代替/隣接:
  - AsyncAPI (12): event-driven な API/チャネルの「契約・ドキュメント」記述。CloudEvents は payload 非依存の「エンベロープ (メタデータ) + protocol binding」を標準化する点で目的が異なる。両者は併用可能 (CloudEvents 封筒 + AsyncAPI でチャネル記述)。
  - クラウド固有のイベントスキーマ (例: AWS EventBridge のネイティブ形式)。CloudEvents は移植性のための中立フォーマットで、各社サービスが CloudEvents モードを併設する形が多い (8)。
  - 標準エンベロープなしの素の JSON/Avro/Protobuf。CloudEvents は属性命名と protocol binding を統一する点が本質差。
- 最小セットアップ (install):

```bash
go get github.com/cloudevents/sdk-go/v2
```

```go
package main

import (
    "context"
    "log"

    cloudevents "github.com/cloudevents/sdk-go/v2"
)

func main() {
    ctx := cloudevents.ContextWithTarget(context.Background(), "http://localhost:8080/")
    p, err := cloudevents.NewHTTP()
    if err != nil {
        log.Fatal(err)
    }
    c, err := cloudevents.NewClient(p, cloudevents.WithTimeNow(), cloudevents.WithUUIDs())
    if err != nil {
        log.Fatal(err)
    }
    e := cloudevents.NewEvent()
    e.SetType("com.example.sent")
    e.SetSource("example/sender")
    _ = e.SetData(cloudevents.ApplicationJSON, map[string]string{"msg": "hello"})
    if res := c.Send(ctx, e); cloudevents.IsUndelivered(res) {
        log.Printf("failed: %v", res)
    }
}
```

(上記は `samples/http/sender/main.go` を最小化したもの。`WithTimeNow` / `WithUUIDs` が `time` / `id` を補完するため `Validate` を通る。)
