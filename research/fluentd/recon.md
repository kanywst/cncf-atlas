# Fluentd Recon

統合ロギング層 (Unified Logging Layer) を担う OSS データコレクタ。様々な入力からイベントを集め、タグでルーティングし、バッファリングして多様な出力へ流す。CNCF Graduated。実装は Ruby + 一部 C 拡張。

## 基本情報

- repo: `fluent/fluentd` (<https://github.com/fluent/fluentd>)
- pinned commit: `729eb328e43f6bb66efe457787c7af81b3f2d72a` (committer date 2026-06-19) / 近いタグ: `v1.19.2` (リリース 2026-02-19)。pin した HEAD は v1.19.2 より後の master 開発版。`lib/fluent/version.rb:23` は `VERSION = '1.19.0'` を宣言 (master 開発系列の値)。
- 言語 / ビルド: Ruby (コア) + 性能依存部に C 拡張 (依存 gem msgpack / cool.io 経由) / gem 配布。開発は `bundle install` 後 `bundle exec rake test`。
- ライセンス: Apache-2.0。`fluentd.gemspec` の `gem.license = "Apache-2.0"`、ルート `LICENSE` は Apache License 2.0 全文。実物確認済み。
- 必要 Ruby: `>= 3.2` (`fluentd.gemspec` `gem.required_ruby_version = '>= 3.2'`、README Prerequisites と一致)
- CNCF 成熟度: Graduated (2019-04-11 graduated)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Observability
- メインエントリポイント: `bin/fluentd` -> `require 'fluent/command/fluentd'`。実体は `Fluent::Supervisor` (`lib/fluent/supervisor.rb:570`)。設定ロードは `Fluent::Engine.run_configure` (`lib/fluent/supervisor.rb:721,782`)、worker 起動は `Fluent::Engine.run` (`lib/fluent/supervisor.rb:783`)。

## 歴史の素材

- 2011 年、Treasure Data 共同創業者 Sadayuki "Sada" Furuhashi が社内ツールとして考案。初回コミットは 2011-06-18、OSS 公開は 2011 年 10 月。目的は多様なデータ源のログ収集を統一する "Unified Logging Layer"。出典 <https://www.fluentd.org/architecture/>、Wikipedia <https://en.wikipedia.org/wiki/Fluentd>。GitHub リポ作成は 2011-06-19 (gh API `created_at`)。
- 2016-11-08 CNCF に Incubating として受理 (Kubernetes / Prometheus / OpenTracing に続く 6 番目のホスト)。出典 <https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/>。
- 2017-08 CII Best Practices Badge 取得、CNCF Code of Conduct 採択。出典: 同上 + README バッジ (project 1189)。
- 2019-04-11 Graduated (Kubernetes / Prometheus / Envoy / CoreDNS / containerd に続く 6 番目)。出典 <https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/>。
- 親会社 Treasure Data は 2018 年に Arm Ltd. に買収。出典 <https://grokipedia.com/page/Treasure_Data> (二次情報のため弱い)。
- 軽量な姉妹実装 Fluent Bit (C 実装) も fluent org 配下。Fluentd 自体は Ruby で常駐メモリ数十 MB 級。出典 <https://www.fluentd.org/architecture/>。

## アーキテクチャの素材

トップレベル (`lib/fluent/`):

- `supervisor.rb`: supervisor/worker プロセス管理、設定リロード、ソケット継承。`class Supervisor` (`:570`)、`run_supervisor` (`:689`)、`run_worker` (`:758`)。
- `engine.rb`: 設定からプラグインツリーを構築し起動。
- `root_agent.rb`: プラグインのツリー構造の根。`<source>` / `<filter>` / `<match>` / `<label>` を束ねる (`class RootAgent` `:46`)。`@ERROR` ラベル内蔵 (`ERROR_LABEL` `:47`)。`SourceOnlyMode` (`:52`) はゼロダウンタイム再起動向け入力専用バッファモード。
- `agent.rb` / `label.rb`: ルーティング単位。`<label>` ごとに独立した `EventRouter` を持つ。
- `event_router.rb`: タグ -> コレクタ (Output / Filter / 別 EventRouter) のルーティング中枢 (`class EventRouter` `:44`)。
- `event.rb`: `EventStream` 階層 (イベントの内部表現, `:21`)。
- `plugin/`: 組込みプラグイン。`in_*.rb` / `out_*.rb` / `filter_*.rb` / `buf_*.rb` / `parser_*.rb` / `formatter_*.rb`。`in_/out_/filter_` で 31 ファイル。
- `plugin_helper/`: プラグイン作者向けの共通ミックスイン (timer, server, socket, storage, thread, retry_state 等)。
- `config/`: 独自 DSL の設定パーサ (`<source>` ブロック構文)。
- `time.rb`: `EventTime` (ナノ秒精度時刻)。`msgpack_factory.rb`: MessagePack ファクトリと拡張型登録。

ツリー構造 (`root_agent.rb:31` のコメント図): RootAgent -> `<label>` / `<source>` / `<filter>` / `<match>`、`<label>` 配下にさらに `<filter>` / `<match>`。

## 内部実装の素材

コア動作の end-to-end トレース (input -> route -> filter -> output -> buffer):

1. 入力プラグインが `router.emit` を呼ぶ。tail は `router.emit(tag, time, record)` (`lib/fluent/plugin/in_tail.rb:705`)、forward は `router.emit_stream(tag, es)` (`lib/fluent/plugin/in_forward.rb:322`)。
2. `EventRouter#emit` は単一レコードを `OneEventStream` に包み `emit_stream` へ委譲 (`lib/fluent/event_router.rb:104`)。
3. `emit_stream` が `match(tag)` でコレクタを引き `emit_events` を呼ぶ (`lib/fluent/event_router.rb:114`)。`Pipeline::OutputError` を捕捉して `@emit_error_handler` (= `@ERROR` ラベル転送) に流す。
4. `match(tag)` は LRU の `MatchCache` (サイズ 1024) を引き、ミスなら `find(tag)` (`lib/fluent/event_router.rb:133`)。`find` は `@match_rules` を順に走査し、collector が `Plugin::Filter` なら `Pipeline` に積み、Output なら `set_output` で終端 (`lib/fluent/event_router.rb:287` 以降)。
5. `Pipeline#emit_events` がまず filter チェインを通し (`@optimizer.filter_stream`)、結果を `@output.emit_events` へ渡す (`lib/fluent/event_router.rb:192`)。

   ```ruby
   def emit_events(tag, es)
     processed = @optimizer.filter_stream(tag, es)
     begin
       @output.emit_events(tag, processed)
     rescue => e
       raise OutputError.new(e, processed)
     end
   end
   ```

6. output 入口 `Output#emit_events` (`lib/fluent/plugin/output.rb:876`) は configure 時に `@buffering` で分岐。非バッファは `emit_sync` -> `process(tag, es)` (`:885`)、バッファありは `emit_buffered` (`:897`)。

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

7. チャンク化は `metadata(tag, time, record)` (`lib/fluent/plugin/output.rb:914`) でチャンクキー (timekey / tag / variables) を計算し、`Buffer#write` (`lib/fluent/plugin/buffer.rb:330`) が metadata 単位の `Chunk` にイベントを追記。サイズ超過で `enqueue_chunk` (`lib/fluent/plugin/buffer.rb:482`) でキューへ。flush スレッドが `dequeue_chunk` (`:559`) してプラグインの `write(chunk)` / `try_write(chunk)` (`lib/fluent/plugin/output.rb:118,122`) を呼び、成功で `commit_write` (`:1118`)。失敗は retry_state による指数バックオフ再送。

中核データ構造:

1. `EventStream` 階層 (`lib/fluent/event.rb:21`)。`OneEventStream` (`:79`) / `ArrayEventStream` (`:119`) / `MultiEventStream` (`:161`) / `MessagePackEventStream` (遅延 unpack, `:202`) / `CompressedMessagePackEventStream` (gzip, `:270`)。`Enumerable` を include、共通 `to_msgpack_stream`、`each(unpacker:)`。
2. `EventTime` (`lib/fluent/time.rb:25`)。`@sec` + `@nsec` のナノ秒精度。`method_missing` で `@sec` (Integer) に委譲し旧来 Integer タイムスタンプと後方互換 (`:120`)。`to_msgpack_ext` は `[sec,nsec].pack('NN')` の 8 バイト固定長 ext (`:91`)。
3. `EventRouter` + 内部 `Rule` / `MatchCache` / `Pipeline` (`lib/fluent/event_router.rb:44`)。`Rule` は `MatchPattern` (glob 風 `**`) と collector の対 (`:57`)。`MatchCache` は最大 1024 件の自前 LRU (`:140`)。`Pipeline` は filter 列 + 終端 output (`:165`)。
4. `RootAgent` / `Agent` / `Label` のツリー (`lib/fluent/root_agent.rb:46`)。`<label>` 単位で独立 EventRouter。`@ERROR` ラベル (`:47`) はエラーイベント専用経路。
5. `Buffer` / `Chunk` / `Metadata` (`lib/fluent/plugin/buffer.rb:26`)。`Metadata` (timekey, tag, variables) をキーに `Chunk` を束ねる。`buf_memory` / `buf_file` / `buf_file_single` バックエンド。`BufferOverflowError` / `BufferChunkOverflowError` (`:34,35`)。コメント (`:157`) が「Metadata はチャンクごとに生成され最も多く生成されるオブジェクトの一つ」と明記。

非自明な設計判断:

- `EventTime` を MessagePack の固定長 ext 型 (`lib/fluent/time.rb:91`、登録は `lib/fluent/msgpack_factory.rb:68`) として直列化。ナノ秒精度を保ちつつ `method_missing` 委譲 (`:120`) で旧来の Integer 秒タイムスタンプと混在しても算術・比較がそのまま通る。プロトコル後方互換とナノ秒精度の両立。
- `FilterOptimizer` (`lib/fluent/event_router.rb:202`)。filter が `filter_stream` を override していない限り複数 filter をストリーム 1 走査で連続適用し中間 `EventStream` を生成しない (`optimized_filter_stream` `:227`)。override 検知は `instance_methods(false)` のリフレクション (`:274`)。プラグイン API の柔軟性を保ちつつ通常ケースの GC 圧を下げる。

## 採用事例の素材

出典付きの組織名のみ。リポの `ADOPTERS.md` は <https://www.fluentd.org/testimonials> へのリンクのみで具体名なし。

- CNCF graduation 発表 (2019-04-11) が明記する利用企業: Atlassian, Amazon Web Services, Change.org, CyberAgent, LINE Corp, Nintendo, Microsoft。出典 <https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/>。
- 同発表時点で 5,000 以上のコミュニティ利用者。出典: 同上。
- GitHub: stars 13,546 / forks 1,392 / open issues 136 (gh API, 2026-06-22 取得)。contributors はおよそ 285 名 (gh contributors API のページ数, anon 含む, 2026-06-22)。

## 代替・エコシステム

- エコシステム: 500+ のコミュニティ製プラグイン (input/output/filter/parser/formatter/buffer)、`fluent-gem` での gem 管理、`fluent-operator` (Kubernetes operator)、Helm charts、姉妹実装 Fluent Bit。出典 <https://github.com/fluent>、<https://www.atatus.com/blog/fluentd-alternatives/>。
- 代替と差: Fluent Bit (C, 軽量 <1MB 級, edge/K8s sidecar 向け、同じ Fluentd 作者陣)、Logstash (JVM, ELK 連携と grok/dissect 等の強力な変換、最も重い 500MB-2GB)、Vector (Rust, 高性能 + VRL 変換, 中庸なフットプリント)。Fluentd の本質的差別化は「最大級のプラグインエコシステム + ベンダー中立 (CNCF) + タグベースのルーティング/バッファ抽象」。Ruby 実装ゆえ大規模ではメモリ/CPU が重め。出典 <https://www.cncf.io/blog/2022/02/10/logstash-fluentd-fluent-bit-or-vector-how-to-choose-the-right-open-source-log-collector/>、<https://onidel.com/blog/log-shipping-benchmark-2025>。
- 最小構成: `gem install fluentd` -> `fluentd -s conf` で雛形生成 -> `fluentd -c conf/fluent.conf` -> `echo '{"json":"message"}' | fluent-cat debug.test` で動作確認 (README Quick Start)。
