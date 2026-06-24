# Internals

> Read from the source at commit `5123e90`. Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `userspace/falco/falco.cpp` | Process entry, `main`, the restart loop |
| `userspace/falco/app/app.cpp` | Ordered startup and teardown actions |
| `userspace/falco/app/actions/process_events.cpp` | The event loop and output dispatch |
| `userspace/engine/falco_engine.cpp` | `process_event` and result building |
| `userspace/engine/falco_rule.h` | Rule, list, and macro data structures |
| `userspace/engine/falco_source.h` | Per-source ruleset holder |
| `userspace/engine/indexable_ruleset.h` | Event-type indexed ruleset |
| `userspace/engine/evttype_index_ruleset.cpp` | Rule wrapping and filter execution |
| `userspace/engine/rule_loader_*.cpp` | The three-stage rule loading pipeline |

## Core data structures

`falco_rule` (`userspace/engine/falco_rule.h:79`) is one rule. It holds `id`, `source`, `name`, `output` (the format string), `priority`, `tags`, and `exception_fields`. It also carries both the condition AST `std::shared_ptr<libsinsp::filter::ast::expr> condition` (`falco_rule.h:115`) and the compiled `std::shared_ptr<sinsp_filter> filter` (`falco_rule.h:116`). Its `operator==` compares those shared pointers by identity, not by logical content; the code comments call this out explicitly (`falco_rule.h:92-101`).

`falco_list` and `falco_macro` (`falco_rule.h:30`, `:53`) model the `list` and `macro` entries in rule YAML. A macro carries a name and a condition AST (`falco_rule.h:72`) that rule conditions reference at compile time.

`falco_source` (`userspace/engine/falco_source.h:28`) is one event source. It holds a `name` (`falco_source.h:47`), one `ruleset`, and a `ruleset_factory` (`falco_source.h:34-35`). The engine keeps one ruleset per source.

`rule_result` (declared in `userspace/engine/falco_engine.h:225`, built at `falco_engine.cpp:402`) is the DTO handed to the output layer for one match.

## A path worth tracing

Rule evaluation lives in `falco_engine::process_event` (`falco_engine.cpp:364`). After resolving the source and the drop check, it switches on the matching strategy (`falco_engine.cpp:381`):

```text
switch(strategy) {
case ALL:   source->ruleset->run(ev, source->m_rules, ruleset_id);   // :386
case FIRST: source->ruleset->run(ev, source->m_rules[0], ruleset_id); // :394
}
```

The interesting work is inside `ruleset->run`. `ruleset_filters::run` (`indexable_ruleset.h:275`) does not scan every rule. It indexes by event type:

```text
if(m_filter_by_event_type[evt->get_type()].size() > 0)   // :276-277
    run_wrappers(evt, m_filter_by_event_type[evt->get_type()], ...); // :279
if(m_filter_all_event_types.size() > 0)                  // :287
    run_wrappers(evt, m_filter_all_event_types, ...);     // :288
```

`run_wrappers` (`evttype_index_ruleset.cpp:55` and an overload at `:69`) loops the candidate wrappers and calls `wrap->m_filter->run(evt)` (`evttype_index_ruleset.cpp:60`, `:76`). `m_filter` is the compiled `sinsp_filter` for that rule's condition. On a match the wrapper's `falco_rule` is appended to the result.

## Things that surprised me

The event-type index is the throughput story. When a rule is added, `evttype_index_ruleset.cpp:33` wraps it in an `evttype_index_wrapper` and statically analyzes the condition AST: `ppm_sc_codes` and `ppm_event_codes` (`evttype_index_ruleset.cpp:37-38`) compute exactly which syscalls and event types could match. Plugin-source rules are fixed to `PPME_PLUGINEVENT_E` (`:41`). `ruleset_filters::add_filter` (`indexable_ruleset.h:236`) then files the wrapper into `m_filter_by_event_type[etype]` per relevant type (`:246`), or into `m_filter_all_event_types` if the rule is type-independent (`:239`). At evaluation time only the matching bucket is touched. With syscalls arriving hundreds of thousands per second, this is what keeps a linear rule scan off the hot path.

A ruleset is versioned. `indexable_ruleset.h:369` holds `std::vector<std::shared_ptr<ruleset_filters>> m_rulesets`, indexed by `ruleset_id`. Multiple ruleset versions can exist at once, which is how a hot reload swaps rules without stopping evaluation.

Rule equality is pointer identity. `falco_rule::operator==` (`falco_rule.h:92-101`) compares `condition` and `filter` by their underlying pointer, so two rules are equal only when they share the same compiled objects, not when they are logically the same.

Rule loading is split into three stages: `rule_loader_reader.cpp` (1026 lines) parses YAML into an intermediate form, `rule_loader_collector.cpp` (378 lines) aggregates lists, macros, and rules and prepares reference resolution, and `rule_loader_compiler.cpp` (598 lines) expands macros and lists and compiles each condition into a `libsinsp` filter.
