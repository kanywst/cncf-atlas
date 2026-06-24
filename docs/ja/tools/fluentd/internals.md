# 内部実装

> コミット `729eb32` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `lib/fluent/supervisor.rb` | スーパーバイザとワーカーのプロセス管理、設定リロード、ソケット継承 |
| `lib/fluent/root_agent.rb` | プラグインツリーの根。`<source>`/`<filter>`/`<match>`/`<label>` を束ねる |
| `lib/fluent/event_router.rb` | タグからコレクタへのルーティング、マッチキャッシュ、フィルタパイプライン |
| `lib/fluent/event.rb` | `EventStream` 階層。イベントの内部表現 |
| `lib/fluent/time.rb` | `EventTime`。ナノ秒精度のタイムスタンプ |
| `lib/fluent/msgpack_factory.rb` | MessagePack ファクトリと拡張型の登録 |
| `lib/fluent/plugin/output.rb` | 出力基底クラス。同期/バッファ emit、チャンク化、flush |
| `lib/fluent/plugin/buffer.rb` | `Buffer`・`Chunk`・`Metadata`。チャンクのライフサイクル |
| `lib/fluent/plugin/` | 組込み `in_*` / `out_*` / `filter_*` / `parser_*` / `formatter_*` / `buf_*` |

## 中核データ構造

`EventStream` (`lib/fluent/event.rb:21`) はイベントの内部表現である。具象形がいくつかある。`OneEventStream` (`lib/fluent/event.rb:79`)、`ArrayEventStream` (`lib/fluent/event.rb:119`)、`MultiEventStream` (`lib/fluent/event.rb:161`)、遅延 unpack の `MessagePackEventStream` (`lib/fluent/event.rb:202`)、gzip 圧縮の `CompressedMessagePackEventStream` (`lib/fluent/event.rb:270`)。すべて `Enumerable` を include し、共通の `to_msgpack_stream` を持つ。

`EventTime` (`lib/fluent/time.rb:25`) はナノ秒精度のために `@sec` と `@nsec` を保持する。`to_msgpack_ext` (`lib/fluent/time.rb:94`) は固定長 8 バイトの拡張型に直列化し、`method_missing` (`lib/fluent/time.rb:126`) は整数の `@sec` に委譲するため、旧来の整数秒タイムスタンプもそのまま動く。

`Buffer` はイベントを `Metadata` (`lib/fluent/plugin/buffer.rb:72`) をキーにチャンクへまとめる。`Metadata` は `timekey`・`tag`・`variables`・`seq` の `Struct` である。`Buffer` はバッファ領域が尽きると `BufferOverflowError` (`lib/fluent/plugin/buffer.rb:34`) を、単一レコードがチャンクサイズ上限より大きいと `BufferChunkOverflowError` (`lib/fluent/plugin/buffer.rb:35`) を投げる。

## 追う価値のあるパス

バッファ出力を例にとる。`Output#emit_events` (`lib/fluent/plugin/output.rb:876`) は configure 時に上書きされ、`@buffering` で分岐する。

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

バッファ側の `emit_buffered` (`lib/fluent/plugin/output.rb:897`) はイベントをチャンク化し、キューに何かある場合だけ flush を投入する。

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

チャンク化は `metadata(tag, time, record)` (`lib/fluent/plugin/output.rb:912`) でチャンクキーを計算し、`Buffer#write` (`lib/fluent/plugin/buffer.rb:330`) でその metadata のチャンクにイベントを追記する。満杯のチャンクは `enqueue_chunk` (`lib/fluent/plugin/buffer.rb:482`) でキューへ移る。flush スレッドが `dequeue_chunk` (`lib/fluent/plugin/buffer.rb:559`) で取り出し、プラグインの `write` (`lib/fluent/plugin/output.rb:118`) か `try_write` (`lib/fluent/plugin/output.rb:122`) を呼ぶ。成功で `commit_write` (`lib/fluent/plugin/output.rb:1118`)、失敗は指数バックオフで再送する。

## 読んで驚いた点

マッチ経路に自前の LRU がある。`EventRouter#match` (`lib/fluent/event_router.rb:133`) はルール走査の前に、最大 1024 件の `MatchCache` (`lib/fluent/event_router.rb:140`) を引く。ルーティング判断はタグごとにキャッシュされるため、`find` (`lib/fluent/event_router.rb:287`) のルール走査は異なるタグごとに 1 回で済む。

フィルタは融合される。`FilterOptimizer` (`lib/fluent/event_router.rb:202`) は `optimized_filter_stream` (`lib/fluent/event_router.rb:227`) でストリームを 1 回走査する間に複数のフィルタを適用し、フィルタごとの中間 `EventStream` を生成しない。フィルタが `filter_stream` を override しているかは `filters_having_filter_stream` (`lib/fluent/event_router.rb:274`) のリフレクションで検知し、プラグイン API の柔軟性を保ちつつ通常ケースの GC 圧を下げる。

`Metadata` の `Struct` は意図的にマイクロ最適化されている。コメントは、これがチャンクごとに生成され「Fluentd で最も多く呼ばれるオブジェクトの 1 つ」だと記す (`lib/fluent/plugin/buffer.rb:157`)。だからこそ Struct のデフォルト比較ではなく `hash` を override している。
