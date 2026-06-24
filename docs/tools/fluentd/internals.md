# Internals

> Read from the source at commit `729eb32`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `lib/fluent/supervisor.rb` | Supervisor and worker process management, config reload, socket inheritance |
| `lib/fluent/root_agent.rb` | Root of the plugin tree; binds `<source>`/`<filter>`/`<match>`/`<label>` |
| `lib/fluent/event_router.rb` | Tag-to-collector routing, match cache, filter pipeline |
| `lib/fluent/event.rb` | `EventStream` hierarchy, the internal event representation |
| `lib/fluent/time.rb` | `EventTime`, nanosecond-precision timestamps |
| `lib/fluent/msgpack_factory.rb` | MessagePack factory and extension type registration |
| `lib/fluent/plugin/output.rb` | Output base class: sync vs buffered emit, chunking, flush |
| `lib/fluent/plugin/buffer.rb` | `Buffer`, `Chunk`, `Metadata`; chunk lifecycle |
| `lib/fluent/plugin/` | Built-in `in_*` / `out_*` / `filter_*` / `parser_*` / `formatter_*` / `buf_*` |

## Core data structures

`EventStream` (`lib/fluent/event.rb:21`) is the internal event representation. It has several concrete forms: `OneEventStream` (`lib/fluent/event.rb:79`), `ArrayEventStream` (`lib/fluent/event.rb:119`), `MultiEventStream` (`lib/fluent/event.rb:161`), `MessagePackEventStream` with lazy unpack (`lib/fluent/event.rb:202`), and gzip-backed `CompressedMessagePackEventStream` (`lib/fluent/event.rb:270`). All include `Enumerable` and share `to_msgpack_stream`.

`EventTime` (`lib/fluent/time.rb:25`) holds `@sec` plus `@nsec` for nanosecond precision. Its `to_msgpack_ext` (`lib/fluent/time.rb:94`) serializes to a fixed-length 8-byte extension type, and `method_missing` (`lib/fluent/time.rb:126`) delegates to the integer `@sec` so old integer-second timestamps keep working.

`Buffer` groups events into chunks keyed by `Metadata` (`lib/fluent/plugin/buffer.rb:72`), a `Struct` of `timekey`, `tag`, `variables`, and `seq`. `Buffer` raises `BufferOverflowError` (`lib/fluent/plugin/buffer.rb:34`) when buffer space is exhausted and `BufferChunkOverflowError` (`lib/fluent/plugin/buffer.rb:35`) when a single record is larger than the chunk size limit.

## A path worth tracing

Take a buffered output. `Output#emit_events` (`lib/fluent/plugin/output.rb:876`) is overwritten at configure time to branch on `@buffering`:

```ruby
def emit_events(tag, es)
  # actually this method will be overwritten by #configure
  if @buffering
    emit_buffered(tag, es)
  else
    emit_sync(tag, es)
  end
end
```

The buffered branch, `emit_buffered` (`lib/fluent/plugin/output.rb:897`), chunks the events and submits a flush only when something is queued:

```ruby
def emit_buffered(tag, es)
  @emit_count_metrics.inc
  begin
    execute_chunking(tag, es, enqueue: (@flush_mode == :immediate))
    if !@retry && @buffer.queued?(nil, optimistic: true)
      submit_flush_once
    end
  rescue
    @num_errors_metrics.inc
    raise
  end
end
```

Chunking calls `metadata(tag, time, record)` (`lib/fluent/plugin/output.rb:912`) to compute the chunk key, then `Buffer#write` (`lib/fluent/plugin/buffer.rb:330`) appends events to the chunk for that metadata. A full chunk moves to the queue through `enqueue_chunk` (`lib/fluent/plugin/buffer.rb:482`). A flush thread dequeues it with `dequeue_chunk` (`lib/fluent/plugin/buffer.rb:559`) and calls the plugin's `write` (`lib/fluent/plugin/output.rb:118`) or `try_write` (`lib/fluent/plugin/output.rb:122`); success runs `commit_write` (`lib/fluent/plugin/output.rb:1118`), and failure retries with exponential backoff.

## Things that surprised me

The match path has a hand-rolled LRU. `EventRouter#match` (`lib/fluent/event_router.rb:133`) checks a `MatchCache` (`lib/fluent/event_router.rb:140`) capped at 1024 entries before scanning rules in `find` (`lib/fluent/event_router.rb:287`). Routing decisions are cached per tag, so the rule scan runs once per distinct tag.

Filters are fused. `FilterOptimizer` (`lib/fluent/event_router.rb:202`) applies multiple filters in a single pass over the stream in `optimized_filter_stream` (`lib/fluent/event_router.rb:227`), avoiding an intermediate `EventStream` per filter. It detects whether a filter overrides `filter_stream` through reflection in `filters_having_filter_stream` (`lib/fluent/event_router.rb:274`), preserving plugin API flexibility while reducing GC pressure in the common case.

The `Metadata` struct is deliberately micro-optimized. A comment notes that it is generated per chunk and is "one of the most called object in Fluentd" (`lib/fluent/plugin/buffer.rb:157`), which is why it overrides `hash` instead of using the default Struct comparison.
