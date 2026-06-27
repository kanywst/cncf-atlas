# sources: bpfman

各出典に番号を振り、ドキュメント側の引用と対応させる。アクセス日は 2026-06-26。

| # | 種別 | タイトル | URL | 参照日 |
| --- | --- | --- | --- | --- |
| 1 | repo | bpfman/bpfman (GitHub, source of truth) | <https://github.com/bpfman/bpfman> | 2026-06-26 |
| 2 | case-study | bpfman (CNCF project page, maturity/stats) | <https://www.cncf.io/projects/bpfman/> | 2026-06-26 |
| 3 | spec | [Sandbox] bpfman application (cncf/sandbox issue #76) | <https://github.com/cncf/sandbox/issues/76> | 2026-06-26 |
| 4 | doc | Launching bpfman (install / load / attach commands) | <https://bpfman.io/v0.6.0/getting-started/launching-bpfman/> | 2026-06-26 |
| 5 | doc | bpfman documentation home | <https://bpfman.io/main/> | 2026-06-26 |
| 6 | blog | eBPF wrapped 2023 (Red Hat, bpfd→bpfman, daemonless) | <https://www.redhat.com/en/blog/ebpf-wrapped-2023> | 2026-06-26 |
| 7 | blog | bpfman blog (rename announcement) | <https://bpfman.io/main/blog/> | 2026-06-26 |
| 8 | blog | bpfman (Red Hat Emerging Technologies project) | <https://next.redhat.com/project/bpfman/> | 2026-06-26 |
| 9 | blog | Introduction to BPF Manager (bpfman) / Fedora 40 | <https://www.ebpf.top/en/post/bpfman_fedora_40/> | 2026-06-26 |
| 10 | doc | eBPF Applications Landscape | <https://ebpf.io/applications/> | 2026-06-26 |

## コード参照 (commit 8e5a9d29 / 近接タグ v0.6.0)

- `bpfman/src/bin/cli/main.rs:23` `fn main`、`:33` `Commands::execute`
- `bpfman/src/bin/cli/load.rs:30` `execute_load_file`、`:31` `setup()`、`:71` `add_programs`
- `bpfman/src/lib.rs:96` `get_db_config`、`:193` `add_programs`、`:221` `add_programs_internal`、`:257` `EbpfLoader::new`、`:281` `loader.load`、`:366` `remove_program`、`:417` `detach`、`:428` `attach_program`、`:481` `attach_program_internal`、`:1226` `setup`、`:1232` `load_program`
- `bpfman/src/lib.rs:92` `RTDIR_DB = "/run/bpfman/db"`
- `bpfman/src/types.rs:166` `LinkData`、`:811` `Link` enum、`:1268` `Program` enum、`:1334` `AttachInfo`、`:1459` `ProgramData(pub sled::Tree)`、`:2367` `XdpProgram`、`:3256` `XdpProceedOnEntry`
- `bpfman/src/multiprog/mod.rs:23` `Dispatcher` enum
- `bpfman/src/multiprog/xdp.rs:50` `XdpDispatcher`、`:63` `XDP_DISPATCHER_BYTES` 埋め込み bytecode、`:65` `XdpDispatcherConfig::new(...)` 10 スロット config
- ルート: `Cargo.toml` (workspace, version 0.6.0, edition 2024)、`.licenserc.yaml` (Apache-2.0 / GPL-2.0 / BSD-2-Clause の分担)、`MAINTAINERS.md` (Red Hat 4 名)
