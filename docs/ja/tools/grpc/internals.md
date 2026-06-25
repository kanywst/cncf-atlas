# Internals

> コミット `c697b01` のソースから読んだ。ここでの主張はすべて file:line を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `src/core/call/` | 呼び出しライフサイクル: `CallSpine`、`CallFilters`、client/server call ラッパ、メタデータ。 |
| `src/core/lib/surface/` | 公開 C API surface。Call V1 の `FilterStackCall` を含む。 |
| `src/core/lib/promise/` | Call V3 を支える promise ライブラリと `Party` スケジューラ。 |
| `src/core/lib/resource_quota/` | 呼び出しごとの `Arena` 確保とリソース計上。 |
| `src/compiler/` | スタブを生成する `protoc` プラグイン。 |
| `src/cpp/`, `src/python/` ほか各言語ディレクトリ | コア上の各言語ラッパ。 |

## 中核データ構造

`CallSpine` は 1 本の RPC の中心だ: `class CallSpine final : public Party, public channelz::DataSource` (`src/core/call/call_spine.h:48`)。`Party` を継承して promise を直列実行し、呼び出しの `CallFilters` を `call_filters_` に直接保持する (`src/core/call/call_spine.h:365`)。クライアントビュー (`CallInitiator`) とサーバビュー (`CallHandler`) は同じ spine を共有する。

`CallFilters` が実際のフィルタチェーンを担う。補助の `StackData` は、コード自身の言葉で「あるフィルタ集合で 1 call を実行するために必要な全コードの完全表現」であり「channel 層に置かれ多数の in-flight call で共有される」(`src/core/call/call_filters.h:1077`)。op ごとの `Layout` 構造体 (`src/core/call/call_filters.h:370`) は、各 op 種別の promise サイズ・アライメント・オペレータ列を記録する。

`MetadataMap` は型付きメタデータコンテナだ (`src/core/call/metadata_batch.h:1420`)。既知ヘッダを `Traits...` で型として持ち、`StatefulCompressor` をテンプレートで合成して、トランスポートが適切なアルゴリズムに圧縮を委譲できる (`src/core/call/metadata_batch.h:1426`)。HTTP/2 の HPACK 圧縮を実行時ルックアップではなく型レベルで扱う。

`Arena` は呼び出しごとの bump アロケータだ: `class Arena final : public RefCounted<...>` (`src/core/lib/resource_quota/arena.h:156`)。call スコープのオブジェクトを `New<T>()` で確保し (`src/core/lib/resource_quota/arena.h:193`)、call 終了でまとめて解放する。これが RPC あたりの `malloc` 回数を削る。

`Party` は Call V3 の協調スケジューラだ。party に spawn された participant は「直列に実行されることが保証され」(`src/core/lib/promise/party.h:118`)、全員が sleep すると party も sleep し (`src/core/lib/promise/party.h:102`)、呼び出しは `party_.reset()` でキャンセルする (`src/core/lib/promise/party.h:115`)。

## 追う価値のあるパス

クライアント呼び出しが実際にどう始まるかを追う。`ClientCall::StartCall` (`src/core/call/client_call.cc:256`) が `MakeCallPair` で initiator/handler ペアを作り (`src/core/call/client_call.cc:274`)、`StartCallMaybeUpdateState` (`src/core/call/client_call.cc:282`) が仕事をする。呼び出し状態を CAS 遷移させ、開始遷移時に handler を下流へ渡し、早く来た batch を drain する。

```text
if (call_state_.compare_exchange_strong(cur_state, kStarted, ...)) {
  call_destination_->StartCall(std::move(handler));
  auto unordered_start = reinterpret_cast<UnorderedStart*>(cur_state);
  while (unordered_start != nullptr) {
    unordered_start->start_pending_batch();
    auto next = unordered_start->next;
    delete unordered_start;
    unordered_start = next;
  }
}
```

このループは `src/core/call/client_call.cc:299` にある。こうした call を生成する C-core API 入口は `MakeClientCall` (`src/core/call/client_call.cc:479`) で、arena からオブジェクトを確保し `->c_ptr()` で `grpc_call*` を返す (`src/core/call/client_call.cc:490`)。

## 驚いたこと

このコードベースは 2 つの完全なコールスタックを同時に走らせる。Call V1 は `src/core/lib/surface/` の `FilterStackCall` で、Combiner とクロージャでスケジュールされ、`grpc_call_create` で生成され、CHTTP2 と legacy InProc トランスポートが使う。Call V3 は `ClientCall`/`ServerCall` と `CallSpine` で、promise ライブラリの `Party` でスケジュールされ、`MakeClientCall`/`MakeServerCall` で生成され、PH2・Chaotic Good・InProc トランスポートが使う (`src/core/call/AGENTS.md:45`, `src/core/call/AGENTS.md:47`, `src/core/call/AGENTS.md:53`)。`call.h` の公開 API は両者で共有される。どちらのスタックが走るかはトランスポートが決めるため、1 つのバイナリが call の 2 実装を同時に抱えうる。この 2 世代併存の移行が、コアが大きく入り組んでいる主因だ。
