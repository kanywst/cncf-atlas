# recon: bpfman

調査メモ。密度優先。出典は URL 付き、コードは `file:line` 付き。`src/` は `research/bpfman/src/` 配下のクローン。

## 基本情報

- repo: `bpfman/bpfman` (<https://github.com/bpfman/bpfman>)
- pinned commit: `8e5a9d296a570dfacc3ed748b5e1639cebbc5d55` (2026-04-21) / 近いタグ: `v0.6.0` (HEAD はタグ直後の main、`v0.6.0` = `755a3f95ad33ed02c32444decff117f8d9bab3fb`)
- 言語 / ビルド: Rust (edition 2024, rust-version 1.85.0) + 一部 Go (k8s 連携) / `cargo build`、`Cargo.toml` は workspace (`bpfman`, `bpfman-api`, `bpfman-ns`, `csi`, `bpf-log-exporter`, `bpf-metrics-exporter`, `xtask`)
- ライセンス: Apache-2.0 (Rust コード本体)。ただしカーネルにロードする eBPF ディスパッチャ bytecode は別ライセンス。`.licenserc.yaml` で `bpfman/bpf/xdp_dispatcher_v1.bpf.c` / `xdp_dispatcher_v2.bpf.c` は `GPL-2.0-only`、`bpfman/bpf/tc_dispatcher.bpf.c` は `(GPL-2.0-only OR BSD-2-Clause)`。リポジトリに `LICENSE-APACHE` / `LICENSE-GPL2` / `LICENSE-BSD2` の 3 本が同梱される。GitHub API の `license.spdx_id` は `Apache-2.0`。
- CNCF 成熟度: Sandbox (2024-06-19 受理、応募は cncf/sandbox issue #76、Red Hat 起案)
- カテゴリ (本エンジンの選択肢から): Runtime
- 主要 entrypoint: CLI バイナリ `bpfman` = `bpfman/src/bin/cli/main.rs:23` (`fn main`)。gRPC デーモン `bpfman-rpc` = `bpfman-api/src/bin/rpc/main.rs`。ライブラリ crate のルートは `bpfman/src/lib.rs`。

## 歴史の素材

- 前身は `bpfd`。Red Hat の Emerging Technologies 発。最初のコミットは 2021-11-30 (CNCF プロジェクトページ記載)。GitHub リポジトリ作成は 2021-12-02 (`repos/bpfman/bpfman` API `created_at`)。出典: <https://www.cncf.io/projects/bpfman/>, <https://next.redhat.com/project/bpfman/>
- 2023-12 に `bpfd` から `bpfman` へ改名。「同じプロジェクト、新しい名前」。同時期に CNCF Sandbox へ寄贈申請。README にも `Formerly know as bpfd` と残る (`README.md:38` 付近)。出典: <https://www.redhat.com/en/blog/ebpf-wrapped-2023>, <https://bpfman.io/main/blog/>
- CNCF Sandbox 応募 (issue #76, 2023-12-20, Dave Tucker / Red Hat)。応募文の主張は「特権 Pod なしで eBPF をロードする安全な方法」。`gitvote/passed` ラベルで承認、受理日 2024-06-19。出典: <https://github.com/cncf/sandbox/issues/76>, <https://www.cncf.io/projects/bpfman/>
- 2024 Q1 にアーキテクチャ大転換: 「daemonless 化」。常駐デーモン前提から、CLI がプロセス内で直接カーネル操作し状態を組込み DB に永続化する設計へ。これが v0.6.0 の現状コードに直結 (後述)。出典: <https://www.redhat.com/en/blog/ebpf-wrapped-2023>
- Fedora 40 で bpfman をデフォルトの eBPF プログラムマネージャにする提案が進行 (FESCo 承認前提)。出典: <https://www.ebpf.top/en/post/bpfman_fedora_40/>

## アーキテクチャの素材

eBPF プログラムの「ロード」と「アタッチ」のライフサイクル管理が責務。通常 eBPF は各プロセスが特権で直接ロードするが、bpfman は集約点を作り、最小権限・複数プログラム共存・再起動耐性を提供する。

トップレベル構成 (workspace crate):

- `bpfman` (lib + CLI): 中核ロジック。aya 経由でカーネルへロード/アタッチし、状態を sled (組込み DB) に保存。CLI はこの lib を **プロセス内で直接呼ぶ** (デーモン不要)。
- `bpfman-api` (`bpfman-rpc` バイナリ): tonic ベースの gRPC (gRPC Remote Procedure Call) サーバ。proto は `proto/bpfman.proto`。中身は同じ lib をラップ。Kubernetes 連携 (bpfman-agent) や CSI から使われる遠隔/特権分離経路。`bpfman-api/src/bin/rpc/{serve,rpc,storage}.rs` が tonic を使用。
- `csi`: BPF filesystem を Pod にマウントするための CSI (Container Storage Interface) ドライバ。proto は `proto/csi.proto`。
- `bpfman-ns`: ネットワーク名前空間に入って操作する補助バイナリ (コンテナ内 uprobe 等)。
- `bpf-log-exporter` / `bpf-metrics-exporter`: OpenTelemetry へログ/メトリクスを出す補助デーモン。

設計判断 (非自明): **CLI は常駐デーモンを介さない**。`bpfman/src/bin/cli/load.rs:31` で `setup()` を呼び、`load.rs:71` で `add_programs()` を同一プロセス内で直接実行する。`setup()` (`bpfman/src/lib.rs:1226`) は設定ファイルを開き sled DB を初期化するだけ。DB の実体は tmpfs 上の `/run/bpfman/db` (`bpfman/src/lib.rs:92` `RTDIR_DB`、`get_db_config()` は `lib.rs:96`)。つまり「状態 = sled DB」「ロジック = lib 関数」で、プロセスは使い捨て。gRPC デーモン (`bpfman-rpc`) は Kubernetes や socket activation による権限分離が必要な場面のみ起動する任意要素。Web 上の古い解説や CNCF 応募文は今も「system daemon + gRPC」と書くが、v0.6.0 実コードは daemonless が既定。

代表オペレーションのトレース (XDP プログラムを CLI でロード):

1. `bpfman load image --image-url ... --programs xdp:pass` を実行。`main.rs:23` の `fn main` から `Commands::execute` (`main.rs:33`) へ。`Commands::Load` 経由で `load.rs` の `execute_load_file` / `execute_load_image` を呼ぶ。
2. `execute_load_file` (`load.rs:30`): `setup()` (`load.rs:31`) で `(Config, Db)` を得て、CLI 引数から `ProgramData::new(...)` を組み、`prog_type` 文字列で `Program::Xdp(XdpProgram::new(data)?)` 等に振り分ける (`load.rs:52`-`68`)。
3. `add_programs(&config, &root_db, progs)` (`load.rs:71` から `lib.rs:193`)。ログ出力後 `add_programs_internal` (`lib.rs:221`) へ委譲。
4. `add_programs_internal` (`lib.rs:221`): 各 program の `get_data_mut().load(root_db)` で temp sled tree を作り (`lib.rs:228`)、OCI イメージから bytecode を引いて `set_program_bytes` (`lib.rs:251`)。
5. aya の `EbpfLoader::new()` を 1 つ生成 (`lib.rs:257`)。同一 bytecode イメージ由来の全 program で global data を共有するため `loader.set_global(...)` (`lib.rs:263`)。XDP/非 TCX TC は `loader.extension(name)` で freplace 用拡張として登録 (`lib.rs:266`-`277`)。
6. `loader.load(&bytes)` でカーネルへロード (`lib.rs:281`)。各 program ごとに `load_program(root_db, &mut ebpf, ...)` (`lib.rs:287` の呼び出し、定義は `lib.rs:1232`)。XDP の場合 `load_program` 内でディスパッチャの fd に対し `ext.load(fd, "compat_test")` を行い (`lib.rs:1263` 付近)、`prog_{id}` として bpffs に pin する。
7. 失敗があれば全 program を `delete` してロールバック (`lib.rs:298`-`306`)。成功時はカーネルが採番した program id で `save_map` (`lib.rs:311`) と `finalize` (`lib.rs:315`) を行い sled tree を確定。
8. アタッチは別 API。`attach_program` (`lib.rs:428`) が `prog.add_link()` で link を作り (`lib.rs:458`)、`link.attach(attach_info)` 後 `attach_program_internal` (`lib.rs:481`) へ。XDP/TC は `attach_multi_attach_program` (`lib.rs:491`, ディスパッチャ経由)、その他単一アタッチ型は `attach_single_attach_program` (`lib.rs:499`) に分岐。成功で `link.finalize` (`lib.rs:506`)。

v0.6.0 で load と attach が分離されている点に注意 (旧来は一括)。`load` はカーネルにプログラムを置くだけ、`attach` で初めてフックに紐づく。

## 内部実装の素材

中核データ構造:

- `Program` enum (`bpfman/src/types.rs:1268`): XDP/Tc/Tcx/Tracepoint/Kprobe/Uprobe/Fentry/Fexit/Unsupported のバリアント。各バリアントは `XdpProgram` (`types.rs:2367`) 等の具体型を保持。
- `ProgramData(pub sled::Tree)` (`bpfman/src/types.rs:1459`): 1 プログラム分の状態を sled の 1 tree として持つ薄いラッパ。フィールドではなくキー文字列でメタ情報 (name, location, global data, kernel info, map_owner_id, map_pin_path 等) を読み書きする。**メモリ上の構造体ではなく DB tree が真実の源**という設計がここに表れる。
- `Link` enum (`bpfman/src/types.rs:811`) と `LinkData(pub(crate) sled::Tree)` (`types.rs:166`): アタッチ (フックへの結び付き) を表す。ロード状態 (`ProgramData`) とアタッチ状態 (`LinkData`) を別の sled tree に分離。
- `AttachInfo` enum (`bpfman/src/types.rs:1334`): アタッチ点の指定。XDP は `priority`/`iface`/`proceed_on`/`netns`、Kprobe は `fn_name`/`offset`/`container_pid` など型ごとに異なるパラメータを enum で表現。
- `Dispatcher` enum (`bpfman/src/multiprog/mod.rs:23`) と `XdpDispatcher` (`bpfman/src/multiprog/xdp.rs:50`) / `TcDispatcher`: 複数プログラム共存の心臓部。

非自明な設計判断 (ディスパッチャパターン): XDP (eXpress Data Path) と (非 TCX の) TC (Traffic Control) フックはカーネル仕様上インターフェース当たり 1 プログラムしか付かない。bpfman は自前の小さな eBPF プログラム (ディスパッチャ) をその唯一のスロットに置き、ユーザのプログラム群を freplace/extension としてディスパッチャ内のスロットに差し込み、優先度順に呼び出す。ディスパッチャ bytecode は registry から引かずバイナリに埋め込み (`xdp.rs:63` `let program_bytes = XDP_DISPATCHER_BYTES;`)。`XdpDispatcherConfig::new(11, 0, [0; 10], [DEFAULT_PRIORITY; 10], [0; 10])` (`xdp.rs:65`) のとおりスロットは 10 個固定で、優先度配列で順序を制御する。これにより「1 インターフェースに複数の XDP プログラム」を実現し、`proceed_on` で次のプログラムへ進む条件 (`XdpProceedOnEntry`, `types.rs:3256`) も持つ。sled DB のキーは `xdp.rs:40`-`47` に定数定義 (`revision`, `if_index`, `mode`, `num_extension` 等)。

その他の追う価値あるパス:

- `init_database` (`lib.rs:869`) と sled tree のプレフィックス命名 (`PROGRAM_PREFIX`, `LINKS_LINK_PREFIX` 等、`lib.rs:41` で import)。再起動後はこれらの tree を走査して状態復元。
- `remove_program` (`lib.rs:366`) から `remove_program_internal` (`lib.rs:397`): link を全 detach してから `prog.delete` と `delete_map`。`detach` (`lib.rs:417`) は link tree 単体から復元して detach。
- カーネル I/F は aya crate に全面依存 (`Cargo.toml` の `aya = 0.13.1`, `aya-obj = 0.2.1`)。libbpf ではなく Rust 製 aya を使うのが bpfman の出自的特徴。

## 採用事例の素材

- 公式 `ADOPTERS.md` / `USERS.md` はリポジトリに **存在しない** (`ls ADOPTERS* USERS*` で no match)。production 採用組織を名指しできる一次情報は見つからず。憶測での adopter 記載はしない。
- GitHub シグナル (2026-06-27, `repos/bpfman/bpfman` API): stars 750、forks 84、open issues 23、最終 push 2026-05-25、repo created 2021-12-02。最新リリース v0.6.0 (2026-03-31)。CNCF プロジェクトページの health 系指標 (contributors 184 / 67 organizations 等) は CNCF 集計値であり、bpfman-operator 等の関連リポを含む可能性があるため数値の出所として弱い。出典: <https://github.com/bpfman/bpfman>, <https://www.cncf.io/projects/bpfman/>
- メンテナは全員 Red Hat (`MAINTAINERS.md`: Dave Tucker, Andrew McDermott, Andre Fredette, Billy McFall。emeritus に Andrew Stoycos)。実質シングルベンダ主導の Sandbox プロジェクト。
- エコシステム上は NetObserv (ネットワーク可観測 eBPF agent/operator) や Falco, Cilium 等と並んで「Kubernetes 上の eBPF プロジェクト」として言及されるが、これらが bpfman を内部採用しているという一次情報は確認できなかった。bpfman は「他の eBPF (Cilium/libbpf/aya) で書いたプログラムを load/unload する管理層」という位置づけ。出典: <https://ebpf.io/applications/>, <https://bpfman.io/main/>

## 代替・エコシステム

- 隣接/補完: aya (Rust eBPF ライブラリ、bpfman の基盤)、libbpf / bpftool (eBPF 標準ツール群、bpfman が代替/上位管理を狙う対象)、bpfman-operator (別リポ、k8s 上の bpfman ライフサイクル管理)。
- 本質的な差: Cilium や Falco は「特定用途の eBPF アプリケーション」。bpfman は用途中立の **ロード/アタッチ管理層 (program manager)**。複数の独立した eBPF プログラムを 1 ノードで安全に共存させ、特権 Pod を排し、再起動耐性 (sled DB と bpffs pin) を与える点が差別化。XDP/TC のディスパッチャによる複数プログラム共存は bpftool には無い固有機能。
- 統合先: Kubernetes (CRD と operator と agent)、systemd (socket activation で権限分離)、OpenTelemetry (log/metrics exporter)、OCI registry (bytecode をイメージとして配布)。

## getting-started (最小起動、Linux ホスト)

ビルドとインストール、XDP プログラムのロードからアタッチまでの最小手順。出典: <https://bpfman.io/v0.6.0/getting-started/launching-bpfman/>

```bash
cargo build
sudo ./scripts/setup.sh install
sudo bpfman load image --image-url quay.io/bpfman-bytecode/xdp_pass:latest \
    --programs xdp:pass --application XdpPassProgram
sudo bpfman attach <PROGRAM_ID> xdp --iface eth0 --priority 35
sudo bpfman list programs --application XdpPassProgram
sudo bpfman unload <PROGRAM_ID>
```

`load` が返す program id を `attach` に渡す 2 段構え。`setup.sh install` は CLI/RPC バイナリを `/usr/sbin/` に置き systemd サービスを設定する。
