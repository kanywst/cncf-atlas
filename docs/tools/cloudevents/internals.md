# Internals

> Read from the source at commit `1e99396`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `v2/event/` | Canonical `event.Event` and per-version `EventContext` (v1.0, v0.3) |
| `v2/binding/` | Transport-neutral `Message` abstraction and structured/binary transcoding |
| `v2/binding/spec/` | Spec-version registry; attribute lookup across v0.3 and v1.0 |
| `v2/binding/format/` | Structured payload formats such as JSON |
| `v2/protocol/http/` | HTTP transport: header mapping, request and response writers |
| `v2/client/` | High-level `Send`, `Request`, `StartReceiver` API |
| `v2/types/` | Canonical type conversions (URI, URIRef, Timestamp) |
| `sql/` | CloudEvents SQL (CESQL) filter and query language |

## Core data structures

`event.Event` (`v2/event/event.go:15`) is the type the whole SDK turns on. It holds a `Context EventContext`, a `DataEncoded []byte`, a `DataBase64 bool`, and a `FieldErrors map[string]error`. The key invariant is that data is always stored as already-encoded bytes; the choice of encoding (JSON, base64) is deferred rather than re-derived on each access.

`EventContextV1` (`v2/event/eventcontext_v1.go:37`) is the v1.0 context. Required fields are `ID`, `Source` (`types.URIRef`), and `Type`; optional ones are `DataContentType`, `Subject`, `Time` (`types.Timestamp`), and `DataSchema` (`types.URI`), plus an `Extensions map[string]interface{}`. The reserved attribute names are fixed in `specV1Attributes` (`v2/event/eventcontext_v1.go:24`), which the SDK uses to keep extensions from colliding with spec attributes.

`binding.Message` and `MessageReader` (`v2/binding/message.go:89`, `v2/binding/message.go:23`) are the transport-neutral carrier. A reader exposes `ReadEncoding`, `ReadStructured`, and `ReadBinary`; a message adds `Finish`. The interface comments encode the delivery model: `Message` covers QoS 0 (at-most-once) and QoS 1 (at-least-once), and `ExactlyOnceMessage` (`v2/binding/message.go:108`) covers QoS 2.

`binding.BinaryWriter` and the embedded `MessageMetadataWriter` (`v2/binding/binary_writer.go:39`, `v2/binding/binary_writer.go:16`) are the visitor each transport implements. They receive `SetAttribute`, `SetExtension`, `SetData`, `Start`, and `End`. The contract is explicit that the caller of `ReadBinary`, not the reader, drives the `Start` and `End` lifecycle (`v2/binding/message.go:41`).

The spec registry types `Versions`, `version`, and `attribute` (`v2/binding/spec/spec.go:40`, `v2/binding/spec/spec.go:73`, `v2/binding/spec/spec.go:63`) let one code path handle multiple spec versions. `AttributeFromKind` (`v2/binding/spec/spec.go:106`) resolves a cross-version `Kind` to a concrete attribute, and `WithPrefix` (`v2/binding/spec/spec.go:137`) builds a prefixed attribute set for transports that need `ce-` names.

## A path worth tracing

Sending a binary-mode HTTP event walks from `client` down to HTTP headers. The entry is `ceClient.Send`:

```go
if err = e.Validate(); err != nil {
    return err
}
// Event has been defaulted and validated, record we are going to perform send.
ctx, cb := c.observabilityService.RecordSendingEvent(ctx, e)
err = c.sender.Send(ctx, (*binding.EventMessage)(&e))
```

That conversion at `v2/client/client.go:138` reinterprets the `event.Event` as a `binding.EventMessage` with no copy. `EventMessage.ReadEncoding` returns `EncodingEvent` (`v2/binding/event_message.go:37`), which is why `binding.Write` skips the direct path:

```go
enc := message.ReadEncoding()
var err error
// Skip direct encoding if the event is an event message
if enc != EncodingEvent {
    enc, err = DirectWrite(ctx, message, structuredWriter, binaryWriter, transformers...)
```

From `v2/binding/write.go:72`, the call falls through to `ToEvent` and, since the default `preferredEventEncoding` is binary (`v2/binding/write.go:91`), to `writeBinary` and then `message.ReadBinary`. `ReadBinary` visits the context and data:

```go
func (m *EventMessage) ReadBinary(ctx context.Context, b BinaryWriter) (err error) {
    err = eventContextToBinaryWriter(m.Context, b)
```

`eventContextToBinaryWriter` (`v2/binding/event_message.go:80`) resolves the spec version with `spec.VS.Version(c.GetSpecVersion())`, iterates `sv.Attributes()` calling `b.SetAttribute`, then iterates extensions calling `b.SetExtension`. For HTTP, `SetAttribute` (`v2/protocol/http/write_request.go:109`) resolves the header name through `attributeHeadersMapping[attribute.Name()]` and appends the formatted value.

The full chain:

```text
ceClient.Send                         v2/client/client.go:116
  -> Protocol.Send                     v2/protocol/http/protocol.go:168
  -> WriteRequest                      v2/protocol/http/write_request.go:23
  -> binding.Write                     v2/binding/write.go:65
  -> EventMessage.ReadBinary           v2/binding/event_message.go:50
  -> httpRequestWriter.SetAttribute    v2/protocol/http/write_request.go:109
  -> httpRequestWriter.SetData         v2/protocol/http/write_request.go:52
```

## Things that surprised me

The header mapping is built reflectively at package init, not hand-written. `init()` in `v2/protocol/http/headers.go:27` walks `specs.Versions()` and every attribute of each version, mapping `DataContentType` to `Content-Type` and prefixing every other attribute with `ce-` through `textproto.CanonicalMIMEHeaderKey`. New spec attributes get their HTTP header for free.

The data body is a one-way street through `io.Reader`. `httpRequestWriter.setBody` (`v2/protocol/http/write_request.go:57`) special-cases `*bytes.Buffer`, `*bytes.Reader`, and `*strings.Reader` to set `ContentLength` and a replayable `GetBody`, and falls back to leaving the length unknown otherwise. The comments there cite a Go 1.8-era compatibility quirk about zero-length bodies, which is why an empty body becomes `http.NoBody` rather than nil.

The receiver side accepts an unusually wide set of handler signatures. The `Client.StartReceiver` doc comment (`v2/client/client.go:36`) lists eleven valid `fn` shapes, from `func()` to `func(context.Context, event.Event) (*event.Event, error)`, and the invoker resolves which one was passed by reflection at registration time (`v2/client/client.go:198`). That flexibility is a deliberate ergonomic choice paid for with reflection.
