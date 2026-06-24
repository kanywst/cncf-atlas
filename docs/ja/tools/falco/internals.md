# Internals

> コミット `5123e90` のソースから読む。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `userspace/falco/falco.cpp` | プロセスのエントリ、`main`、restart ループ |
| `userspace/falco/app/app.cpp` | 順序付きの起動・teardown アクション |
| `userspace/falco/app/actions/process_events.cpp` | イベントループと出力ディスパッチ |
| `userspace/engine/falco_engine.cpp` | `process_event` と結果の構築 |
| `userspace/engine/falco_rule.h` | rule / list / macro のデータ構造 |
| `userspace/engine/falco_source.h` | ソースごとの ruleset 保持 |
| `userspace/engine/indexable_ruleset.h` | event-type インデックス付き ruleset |
| `userspace/engine/evttype_index_ruleset.cpp` | ルールのラップとフィルタ実行 |
| `userspace/engine/rule_loader_*.cpp` | 3 段のルールロードパイプライン |

## 中核データ構造

`falco_rule` (`userspace/engine/falco_rule.h:79`) は 1 ルールの実体である。`id`、`source`、`name`、`output` (フォーマット文字列)、`priority`、`tags`、`exception_fields` を持つ。さらに条件 AST `std::shared_ptr<libsinsp::filter::ast::expr> condition` (`falco_rule.h:115`) とコンパイル済みの `std::shared_ptr<sinsp_filter> filter` (`falco_rule.h:116`) の両方を保持する。`operator==` はこれらの shared ポインタを論理内容ではなく同一性で比較する。コード中のコメントがその旨を明示している (`falco_rule.h:92-101`)。

`falco_list` と `falco_macro` (`falco_rule.h:30`, `:53`) はルール YAML の `list` と `macro` をモデル化する。macro は名前と条件 AST (`falco_rule.h:72`) を持ち、ルール条件がコンパイル時にそれを参照する。

`falco_source` (`userspace/engine/falco_source.h:28`) は 1 つのイベントソースである。`name` (`falco_source.h:47`)、1 つの `ruleset`、`ruleset_factory` (`falco_source.h:34-35`) を持つ。エンジンはソースごとに 1 つの ruleset を持つ。

`rule_result` (`userspace/engine/falco_engine.h:225` で宣言、`falco_engine.cpp:402` で構築) は 1 件のマッチを出力層へ渡す DTO である。

## たどる価値のある経路

ルール評価は `falco_engine::process_event` (`falco_engine.cpp:364`) にある。ソース解決と drop チェックの後、matching 戦略で switch する (`falco_engine.cpp:381`):

```text
switch(strategy) {
case ALL:   source->ruleset->run(ev, source->m_rules, ruleset_id);   // :386
case FIRST: source->ruleset->run(ev, source->m_rules[0], ruleset_id); // :394
}
```

面白い処理は `ruleset->run` の内側にある。`ruleset_filters::run` (`indexable_ruleset.h:275`) は全ルールを走査しない。event type でインデックスする:

```text
if(m_filter_by_event_type[evt->get_type()].size() > 0)   // :276-277
    run_wrappers(evt, m_filter_by_event_type[evt->get_type()], ...); // :279
if(m_filter_all_event_types.size() > 0)                  // :287
    run_wrappers(evt, m_filter_all_event_types, ...);     // :288
```

`run_wrappers` (`evttype_index_ruleset.cpp:55` と `:69` のオーバーロード) は候補ラッパーをループし `wrap->m_filter->run(evt)` を呼ぶ (`evttype_index_ruleset.cpp:60`, `:76`)。`m_filter` はそのルールの条件をコンパイルした `sinsp_filter` である。マッチするとラッパーの `falco_rule` が結果に追加される。

## 驚いた点

event-type インデックスがスループットの肝である。ルール追加時、`evttype_index_ruleset.cpp:33` がルールを `evttype_index_wrapper` で包み、条件 AST を静的解析する。`ppm_sc_codes` と `ppm_event_codes` (`evttype_index_ruleset.cpp:37-38`) が、このルールがマッチしうる syscall と event type を正確に算出する。plugin source のルールは `PPME_PLUGINEVENT_E` に固定される (`:41`)。続いて `ruleset_filters::add_filter` (`indexable_ruleset.h:236`) が、ラッパーを関係する type ごとに `m_filter_by_event_type[etype]` へ登録するか (`:246`)、type 非依存なら `m_filter_all_event_types` へ入れる (`:239`)。評価時には該当バケットだけが触られる。syscall が毎秒数十万件来るなか、これが線形のルール走査をホットパスから外している。

ruleset はバージョン管理される。`indexable_ruleset.h:369` が `std::vector<std::shared_ptr<ruleset_filters>> m_rulesets` を持ち、`ruleset_id` でインデックスする。複数の ruleset バージョンを同時に持てるため、ホットリロード時に評価を止めずにルールを差し替えられる。

ルールの等価性はポインタの同一性である。`falco_rule::operator==` (`falco_rule.h:92-101`) は `condition` と `filter` を underlying ポインタで比較するので、2 ルールが等しいのは同じコンパイル済みオブジェクトを共有するときだけで、論理的に同じだからではない。

ルールロードは 3 段に分かれる。`rule_loader_reader.cpp` (1026 行) が YAML を中間表現へパースし、`rule_loader_collector.cpp` (378 行) が list / macro / rule を集約して参照解決の下準備をし、`rule_loader_compiler.cpp` (598 行) が macro と list を展開して各条件を `libsinsp` フィルタにコンパイルする。
