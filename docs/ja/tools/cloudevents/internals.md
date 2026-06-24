# 内部実装

> コミット `1e99396` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `v2/event/` | 正準型 `event.Event` とバージョン別 `EventContext` (v1.0、v0.3) |
| `v2/binding/` | トランスポート非依存の `Message` 抽象と structured/binary トランスコード |
| `v2/binding/spec/` | spec バージョンレジストリ。v0.3 と v1.0 をまたぐ属性参照 |
| `v2/binding/format/` | JSON 等の structured ペイロード形式 |
| `v2/protocol/http/` | HTTP トランスポート: ヘッダ写像、リクエスト/レスポンス writer |
| `v2/client/` | 高レベル `Send`・`Request`・`StartReceiver` API |
| `v2/types/` | 正準型変換 (URI、URIRef、Timestamp) |
| `sql/` | CloudEvents SQL (CESQL) のフィルタ/クエリ言語 |

## 中核データ構造

`event.Event` (`v2/event/event.go:15`) が SDK 全体が回転する型だ。`Context EventContext`・`DataEncoded []byte`・`DataBase64 bool`・`FieldErrors map[string]error` を保持する。鍵となる不変条件は、データを常にエンコード済みバイト列で保持する点だ。エンコーディング (JSON、base64) の選択はアクセスごとに再導出せず遅延させる。

`EventContextV1` (`v2/event/eventcontext_v1.go:37`) が v1.0 のコンテキストだ。必須フィールドは `ID`・`Source` (`types.URIRef`)・`Type`、任意は `DataContentType`・`Subject`・`Time` (`types.Timestamp`)・`DataSchema` (`types.URI`)、加えて `Extensions map[string]interface{}`。予約属性名は `specV1Attributes` (`v2/event/eventcontext_v1.go:24`) に固定され、SDK はこれで拡張が spec 属性と衝突しないようにする。

`binding.Message` と `MessageReader` (`v2/binding/message.go:89`、`v2/binding/message.go:23`) がトランスポート非依存の運搬体だ。reader は `ReadEncoding`・`ReadStructured`・`ReadBinary` を、message は `Finish` を加える。インターフェースのコメントが配信モデルを表現している。`Message` は QoS 0 (at-most-once) と QoS 1 (at-least-once) を、`ExactlyOnceMessage` (`v2/binding/message.go:108`) が QoS 2 を扱う。

`binding.BinaryWriter` と埋め込まれた `MessageMetadataWriter` (`v2/binding/binary_writer.go:39`、`v2/binding/binary_writer.go:16`) が、各トランスポートが実装する visitor だ。`SetAttribute`・`SetExtension`・`SetData`・`Start`・`End` を受ける。コントラクトは、`Start` と `End` のライフサイクルを reader ではなく `ReadBinary` の呼び出し側が制御すると明記する (`v2/binding/message.go:41`)。

spec レジストリの型 `Versions`・`version`・`attribute` (`v2/binding/spec/spec.go:40`、`v2/binding/spec/spec.go:73`、`v2/binding/spec/spec.go:63`) により、1 つのコードパスで複数の spec バージョンを扱える。`AttributeFromKind` (`v2/binding/spec/spec.go:106`) がバージョン横断の `Kind` を具体属性に解決し、`WithPrefix` (`v2/binding/spec/spec.go:137`) が `ce-` 名を要するトランスポート向けに prefix 付き属性集合を構築する。

## 追う価値のあるパス

binary モードでの HTTP イベント送信は `client` から HTTP ヘッダまで歩く。入口は `ceClient.Send` だ。

```go
if err = e.Validate(); err != nil {
    return err
}
// Event has been defaulted and validated, record we are going to perform send.
ctx, cb := c.observabilityService.RecordSendingEvent(ctx, e)
err = c.sender.Send(ctx, (*binding.EventMessage)(&e))
```

`v2/client/client.go:138` のこの変換は `event.Event` をコピーなしで `binding.EventMessage` として再解釈する。`EventMessage.ReadEncoding` は `EncodingEvent` を返す (`v2/binding/event_message.go:37`)。だから `binding.Write` は direct path をスキップする。

```go
enc := message.ReadEncoding()
var err error
// Skip direct encoding if the event is an event message
if enc != EncodingEvent {
    enc, err = DirectWrite(ctx, message, structuredWriter, binaryWriter, transformers...)
```

`v2/binding/write.go:72` から呼びは `ToEvent` に落ち、既定の `preferredEventEncoding` が binary なので (`v2/binding/write.go:91`) `writeBinary`、そして `message.ReadBinary` に進む。`ReadBinary` がコンテキストとデータを訪問する。

```go
func (m *EventMessage) ReadBinary(ctx context.Context, b BinaryWriter) (err error) {
    err = eventContextToBinaryWriter(m.Context, b)
```

`eventContextToBinaryWriter` (`v2/binding/event_message.go:80`) は `spec.VS.Version(c.GetSpecVersion())` で spec バージョンを解決し、`sv.Attributes()` を反復して `b.SetAttribute` を呼び、続いて拡張を反復して `b.SetExtension` を呼ぶ。HTTP では `SetAttribute` (`v2/protocol/http/write_request.go:109`) が `attributeHeadersMapping[attribute.Name()]` でヘッダ名を解決し、文字列化した値を追加する。

呼び出しチェーン全体:

```text
ceClient.Send                         v2/client/client.go:116
  -> Protocol.Send                     v2/protocol/http/protocol.go:168
  -> WriteRequest                      v2/protocol/http/write_request.go:23
  -> binding.Write                     v2/binding/write.go:65
  -> EventMessage.ReadBinary           v2/binding/event_message.go:50
  -> httpRequestWriter.SetAttribute    v2/protocol/http/write_request.go:109
  -> httpRequestWriter.SetData         v2/protocol/http/write_request.go:52
```

## 読んで驚いた点

ヘッダ写像は手書きではなく、パッケージ init で reflective に構築される。`v2/protocol/http/headers.go:27` の `init()` は `specs.Versions()` と各バージョンの全属性を走査し、`DataContentType` を `Content-Type` に、他すべての属性を `textproto.CanonicalMIMEHeaderKey` を通した `ce-` prefix に写す。新しい spec 属性は HTTP ヘッダを自動で得る。

データボディは `io.Reader` を通る一方通行だ。`httpRequestWriter.setBody` (`v2/protocol/http/write_request.go:57`) は `*bytes.Buffer`・`*bytes.Reader`・`*strings.Reader` を特別扱いして `ContentLength` と再生可能な `GetBody` を設定し、それ以外では長さ不明のままにする。そこのコメントは長さ 0 ボディに関する Go 1.8 時代の互換性上のクセに言及しており、空ボディが nil ではなく `http.NoBody` になる理由がそれだ。

受信側は異例に広いハンドラシグネチャ集合を受ける。`Client.StartReceiver` の doc コメント (`v2/client/client.go:36`) は `func()` から `func(context.Context, event.Event) (*event.Event, error)` まで 11 個の有効な `fn` 形を列挙し、invoker は登録時にどれが渡されたかをリフレクションで解決する (`v2/client/client.go:198`)。この柔軟性はリフレクションの代償と引き換えの意図的な使い勝手の選択だ。
