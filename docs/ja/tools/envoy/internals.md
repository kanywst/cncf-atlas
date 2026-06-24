# 内部実装

> コミット `6a45c7d` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `source/exe/` | プロセスのエントリポイントと起動。`main.cc:16` が `main()` を定義。 |
| `source/server/` | サーバインスタンス、listener、worker 管理、ライフサイクル。 |
| `source/common/http/` | HTTP Connection Manager、filter manager、codec。 |
| `source/common/thread_local/` | ロックフリーな設定配布のための thread-local スロット機構。 |
| `source/common/buffer/` | スタック全体で使う I/O バッファ抽象。 |
| `source/extensions/` | 差し替え可能な filter・codec・transport socket・access logger。 |
| `api/` | xDS 設定 API (API v3) の protobuf 定義。 |

## 中核データ構造

`ConnectionManagerImpl` は HTTP を喋る network read filter で、1 ダウンストリームコネクション = 1 インスタンスだ (`source/common/http/conn_manager_impl.h`)。そのネストした `ActiveStream` (`source/common/http/conn_manager_impl.h:145`) は 1 リクエスト/レスポンスの全状態を持つ。`request_headers_` (`:457`)、`DownstreamFilterManager filter_manager_` (`:473`)、確定済みの `cached_route_` (`:512`) だ。`ActiveStream` は `LinkedObject` なので、生存中のストリームはコネクション上で侵入リストを成す。

`FilterManager` (`source/common/http/filter_manager.h:692`) とそのダウンストリーム派生 `DownstreamFilterManager` (`source/common/http/filter_manager.h:1192`) が decoder/encoder filter chain を実行し、iteration を制御し、watermark backpressure を適用する。

`Buffer::OwnedImpl` (`source/common/buffer/buffer_impl.h:643`) は I/O バッファだ。内部は `Slice` (`source/common/buffer/buffer_impl.h:37`) を `SliceDeque` (`source/common/buffer/buffer_impl.h:426`) で連結し、append と drain をゼロコピーに近く保つ。

`ThreadLocal::InstanceImpl` とその `SlotImpl` (`source/common/thread_local/thread_local_impl.h:20`, `:37`) が worker スレッド横断で状態を配布する。

## 追う価値のあるパス

ダウンストリームの HTTP リクエストを、ワイヤ上のバイト列からルート確定まで追う。すべて `source/common/http/conn_manager_impl.cc` 内。

`onData` が network read filter の入口だ。codec を遅延生成し、バイト列を渡す。

```text
ConnectionManagerImpl::onData (:515)
  createCodec(data)            (:525)   // 初回のみ
  codec_->dispatch(data)       (:546)   // フレームをパースし newStream を呼ぶ
ConnectionManagerImpl::newStream (:410)
  make_unique<ActiveStream>    (:430)
  LinkedList::moveIntoList     (:469)   // streams_ で追跡
ActiveStream::decodeHeaders   (:1354)
  request_headers_ = move(headers)      (:1366)
  refreshCachedRoute()                  (:1553) -> (:1811)
    snapped_route_config_->route(...)   (:1827)
  filter_manager_.createDownstreamFilterChain() (:1564)
  filter_manager_.decodeHeaders(...)    (:1600)
```

codec の戻り値は `Status` で、`dispatch` の後にこれを見て buffer flood・protocol error・overload を分類してから先へ進む。ルート確定は一度だけ行われ `cached_route_` に保存されるので、後続の filter は同じ判断を再利用する。

## 読んで驚いた点

thread-local モデルは明示的な危険を前提に組まれている。スロットはメインスレッドで即座に破棄され、その index は再利用される。だからコールバックはスロットオブジェクトを直接キャプチャしてはならず、index を手で渡す。コードがそう述べている (`source/common/thread_local/thread_local_impl.h:60-65`)。破棄直前に post されたコールバックが解放済み状態を参照しないよう、スロットは `std::shared_ptr<bool> still_alive_guard_` (`source/common/thread_local/thread_local_impl.h:69`) を持ち、worker がこれを weak 参照する。ロックではなくスナップショット差し替えを選んだ代償がこれだ。並行性は単一スレッド所有と immutable スナップショットで解き、残る数少ないレースは手作業で防ぐ。
