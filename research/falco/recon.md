# recon: Falco

調査メモ。自分用の密度。出典 URL は `sources.md` に番号で対応。パスは `research/falco/src/` 以下を指す。

## 基本情報

- repo: `falcosecurity/falco`
- CNCF プロジェクト "Falco" の中心実装はこの 1 リポジトリ。`falco` バイナリ本体 (C++) が入る。周辺の `falcosidekick` / `falcoctl` / `falco-operator` / `libs` は別リポジトリ。deep-dive の主対象は検知エンジンを持つ `falcosecurity/falco`。出典 #2。
- pinned commit: `5123e90e58ee8187f0c135fcdf273eecd07ae571` (branch `master`, 2026-06-18 のコミット)
- 近いタグ: 安定最新リリースは `0.44.1` (2026-06-11 公開)。pin した master はそれより先行する開発版。出典 #3。
- 言語: C++ (大半)。`tools/` 配下に Go のヘルパあり。コア検知エンジンは `userspace/engine/`、アプリ層は `userspace/falco/`。
- ビルド: CMake。`mkdir build && cd build && cmake .. && make falco`。多数の依存を CMake `ExternalProject` で取り込む (`cmake/modules/*.cmake`)。中核の syscall 取得とフィルタ評価ライブラリ `falcosecurity-libs` は外部依存として pin される (`cmake/modules/falcosecurity-libs.cmake:45` で `FALCOSECURITY_LIBS_VERSION` = `01b5cf7ffb294bc6605bc745b327e43f8cf55b40`)。
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認。各ソースに `SPDX-License-Identifier: Apache-2.0`)。GitHub API も `Apache-2.0` を返す。出典 #2。
- CNCF 成熟度: Graduated (2024-02-29 卒業)。出典 #1, #5。
- カテゴリ (tools.ts CATEGORY_ORDER): Security & Compliance。

## 歴史の素材

- 2016 年に Sysdig が作成しオープンソース化。GitHub repo の `created_at` は 2016-01-19。出典 #2, #4。
- ドライバの最初のコードは 2014 年。技術的ルーツは BPF/libpcap までさかのぼり、現在の eBPF ベース実装に至る。出典 #4。
- CNCF への寄贈は 2018 年 (Sandbox 受理、ランタイムセキュリティで初)。Incubator は 2020-04。出典 #1, #4。
- Graduated は 2024-02-29。卒業の過程で TOC の due diligence、第三者セキュリティ監査、CNCF プロジェクトが GPL ライセンスの Linux カーネルモジュールを eBPF コードと同梱できるようにする調整を経た。出典 #1, #5。
- 創業者 Loris Degioanni のスタンス: ランタイムセキュリティは eBPF によるデータ収集だけではなく enrichment、オーケストレータ統合、複数データソースの相関、整備されたポリシーライブラリが要る、というもの。出典 #4。

## アーキテクチャの素材

Falco は単一バイナリ `falco`。ノードごとに DaemonSet で動かし、カーネルイベント (syscall) を eBPF プローブまたはカーネルモジュールで取得し、ルールで評価してアラートを出す。出典 #6。

トップレベルのコンポーネント分割:

- `userspace/falco/` : アプリケーション層。CLI、設定、出力 (file/http/program/stdout/syslog/grpc)、webserver、metrics、イベントループ。エントリは `userspace/falco/falco.cpp:59` の `main()`。
- `userspace/engine/` : ルールエンジン本体。ルールのロード (reader/collector/compiler)、フィルタ評価、出力フォーマット。`falco_engine` クラスが公開 API。
- `falcosecurity-libs` (外部依存、`libsinsp`) : syscall キャプチャ、イベントの抽象 (`sinsp_evt`)、フィルタ AST とフィルタ実行エンジン、プラグインフレームワーク。Falco はこれを `sinsp` インスペクタとして使う。
- `rules/` : 既定のルール YAML。`submodules/falcosecurity-rules` でルールリポジトリを取り込む。
- plugin (ランタイム拡張) : syscall 以外のイベントソース (Kubernetes audit, cloudtrail, GitHub, Okta など) を共有ライブラリで追加する仕組み。出典 #6, #7。

アプリの起動は「アクションのリスト」を順に実行する設計。`userspace/falco/app/app.cpp:56` の `run_steps` に `load_config` から `load_plugins`、`init_inspectors`、`init_falco_engine`、`load_rules_files`、`init_outputs`、`start_webserver`、`process_events` までが直列に並ぶ。各アクションは `run_result` を返し `merge` される (`app.cpp:96`)。失敗してもクリーンアップ用 steps が必ず走る (`app.cpp:104`)。

### 代表操作のトレース: 1 イベントが入って 1 アラートが出るまで

1. イベントループ。`userspace/falco/app/actions/process_events.cpp:163` の `while(1)` で `inspector->next(&ev)` を呼び 1 件取得 (`:164`)。`SCAP_TIMEOUT` / `SCAP_FILTERED_EVENT` / `SCAP_EOF` を分岐し、シグナル (SIGINT/SIGHUP/SIGUSR1) もここで処理する。
2. ソース確定。capture モードか live モードかでイベントソース index を決める (`process_events.cpp:240-278`)。drop 検知は `sdropmgr.process_event` (`:298`)。
3. エンジンへ。`process_events.cpp:307` で `s.engine->process_event(source_engine_idx, ev, s.config->m_rule_matching)` を呼ぶ。注釈どおりインスペクタ側ではフィルタしないので全イベントがここに来る (`:302-306`)。
4. ルール評価。`userspace/engine/falco_engine.cpp:364` `process_event()`。`find_source(source_idx)` でソース固有の ruleset を引き (`:375`)、`should_drop_evt()` でサンプリング判定 (`:377`)。`rule_matching` 戦略で分岐し、`ALL` なら全マッチ収集、`FIRST` なら最初の 1 件 (`:381-398`)。実体は `source->ruleset->run(ev, ..., ruleset_id)` (`:386`, `:394`)。
5. event-type index による絞り込み。`userspace/engine/indexable_ruleset.h:275` の `ruleset_filters::run()` が `evt->get_type()` をキーに `m_filter_by_event_type[etype]` だけを評価し、続いて event-type 非依存の `m_filter_all_event_types` を評価する (`:276-291`)。全ルール線形走査を避ける。
6. 個々のフィルタ実行。`userspace/engine/evttype_index_ruleset.cpp:55` / `:69` の `run_wrappers()` が各 `wrap->m_filter->run(evt)` を呼ぶ (`:60`, `:76`)。`m_filter` は `libsinsp` の `sinsp_filter` で、ルール条件の AST をコンパイルしたもの。マッチしたら `falco_rule` を `match` / `matches` に積む。
7. 結果整形。`falco_engine.cpp:400-415` でマッチした各 `falco_rule` から `rule_result` (evt / rule 名 / source / output フォーマット文字列 / priority / tags / extra fields) を作り `std::vector` で返す。
8. 出力。`process_events.cpp:308-319` で `res` を走査し `s.outputs->handle_event(evt, rule, source, priority, format, tags, extra_output_fields)` を各設定済み出力に渡す。capture (PCAP 相当のダンプ) も `m_capture_mode` 次第でここで走る (`:309-323`)。

## 内部実装の素材

中核データ構造 (`file:line` 付き):

- `falco_rule` (`userspace/engine/falco_rule.h:79`) : 1 ルールの実体。`id` / `source` / `name` / `output` (フォーマット文字列) / `priority` / `tags` / `exception_fields` に加え、条件 AST `std::shared_ptr<libsinsp::filter::ast::expr> condition` (`:115`) とコンパイル済み `std::shared_ptr<sinsp_filter> filter` (`:116`) を両方保持。`==` は AST/filter をポインタ等価で比較する旨を明記 (`:92-101`)。
- `falco_list` / `falco_macro` (`falco_rule.h:30`, `:53`) : ルール YAML の `list` と `macro`。macro は名前と条件 AST を持ち、ルール条件展開時に参照される。`used` フラグで未使用検出に使う。
- `falco_source` (`userspace/engine/falco_source.h:28`) : イベントソース 1 つ分。`name` (`:47`)、評価対象の `std::shared_ptr<filter_ruleset> ruleset` (`:48`)、`ruleset_factory` (`:49`)。エンジンはソースごとに ruleset を 1 つ持つ。
- `evttype_index_wrapper` (`userspace/engine/evttype_index_ruleset.cpp:33` で生成) : ルール 1 件を `m_rule` / `m_filter` / `m_sc_codes` / `m_event_codes` で包む。AST から `ppm_sc_codes` / `ppm_event_codes` を静的解析して、どの syscall/event でこのルールを評価すべきかを事前算出する (`:37-43`)。plugin source は `PPME_PLUGINEVENT_E` 固定、全ルールに `PPME_ASYNCEVENT_E` を足す。
- `rule_result` (`falco_engine.cpp:402` で構築、型は `falco_engine.h`) : マッチ 1 件を出力層へ渡す DTO。

非自明な設計判断: **event-type でインデックスしたルールセット** (`userspace/engine/indexable_ruleset.h`)。ルール条件 AST を静的解析して「このルールに関係する event type 集合」を求め (`evttype_index_ruleset.cpp:37-43`)、`ruleset_filters::add_filter` (`indexable_ruleset.h:236`) で `m_filter_by_event_type` という event code でインデックスした vector に登録する。イベント評価時 (`indexable_ruleset.h:276`) は `evt->get_type()` でそのバケットだけを引き、event-type 非依存ルール (`m_filter_all_event_types`) だけ追加で評価する。syscall は毎秒数十万件来るので、全ルール線形評価を避けるこの index がスループットの肝。ルールセットは `ruleset_id` で複数版を同時に持て (`m_rulesets` vector, `indexable_ruleset.h:369`)、ホットリロード時の差し替えに使う。

ルールロードのパイプラインは 3 段で分離されている (各ファイルの行数は実コードで確認):

- `rule_loader_reader.cpp` (1026 行) : YAML を読みパースして中間表現に。
- `rule_loader_collector.cpp` (378 行) : list/macro/rule を集約、参照解決の下準備。
- `rule_loader_compiler.cpp` (598 行) : macro/list を展開し条件を `libsinsp` filter にコンパイル。`filter_macro_resolver` / `filter_warning_resolver` などのリゾルバを噛ませる。

`main()` は `falco_run()` を `restart` フラグが立つ限りループする (`falco.cpp:67`)。SIGHUP でルール/設定を読み直すホットリスタートのため、プロセスを殺さずアプリ層を作り直す構造。

## 採用事例の素材

`ADOPTERS.md` に自己申告の採用組織が多数 (出典 #8)。記述付きで citable なもの:

- Booz Allen Hamilton : k8s 環境で CD DevSecOps パイプラインの挙動検証に Falco を使用。KubeCon NA 2019 で発表。出典 #8。
- GitLab : GitLab Ultimate に Falco をタイトに統合しコンテナアプリのランタイム防御に使用。出典 #8。
- Coveo : Falco アラートを SIEM に集約してコンテナ内可視化に使用。出典 #8。
- Secureworks : Taegis XDR プラットフォームの k8s デプロイ保護と顧客の Linux/コンテナ環境保護に Falco を使用。出典 #8。
- gVisor : gVisor ランタイム実行情報の上で Falco の脅威検知エンジンを使い異常検知。出典 #8。
- MathWorks : k8s 脅威検知に Falco を使用。KubeCon NA 2020 で発表 (YouTube リンクあり)。出典 #8。
- Fairwinds / Giant Swarm / Logz.io / Qonto / Replicated / Deckhouse なども記述付きで掲載。出典 #8。
- CNCF/Sysdig の卒業告知では Cisco, Shopify, Skyscanner, Vinted を named adopter として挙げ、self-declared adopter が 30+、ダウンロード 1 億回超と記載。出典 #1, #4。

## 採用シグナル (数値、参照日 2026-06-22)

- GitHub stars: 9,071 / forks: 1,032 / watchers: 125 (GitHub API、2026-06-22)。出典 #2。
- contributors: GitHub contributors API のページネーション (per_page=1) で last page = 266。約 266 名規模 (2026-06-22)。出典 #2。
- 最新リリース: `0.44.1` (2026-06-11)。出典 #3。
- ダウンロード 1 億回超、Incubation 移行後にアクティブコントリビュータ 400% 増、ダウンロード総数 526% 増 (CNCF/Sysdig 告知時点)。出典 #1, #4。

## 代替・エコシステム

エコシステム (同 falcosecurity 配下、出典 #6, #7):

- `falcosidekick` : Falco の出力を 60+ の外部ツール (Slack, Loki, Elasticsearch, CloudWatch ほか) へ fan-out するプロキシ転送。Web UI もある。出典 #7。
- `falcoctl` : ルール/プラグインを artifact/index として管理する CLI。Helm では init コンテナ `falcoctl-artifact-install` と sidecar `falcoctl-artifact-follow` として動く。出典 #7。
- `falco-operator` : Falco インスタンスと周辺コンポーネントのライフサイクルを管理する Kubernetes Operator。Artifact Operator がルール/プラグイン/設定を管理。出典 #7。
- plugin フレームワーク : syscall 以外のソース (k8s audit, cloudtrail, GitHub, Okta) を共有ライブラリで追加。2022-01 に launch。プラグインは実行可能オブジェクトなので auto-install は非推奨。出典 #7。

代替プロジェクトと本質的な差 (出典 #9, #10):

- Tetragon (Cilium 由来) : eBPF ベースだが in-kernel での enforcement (プロセス kill / コネクション drop) が強み。CPU オーバーヘッド最小。Falco は検知/アラートに軸足があり enforcement は基本持たない。
- Tracee (Aqua) : eBPF ベースのランタイムセキュリティ/フォレンジック。MITRE ATT&CK 整合の検知に強いが、リソース消費が大きめ。
- Falco の差別化: 最も成熟した CNCF Graduated プロジェクト、整備されたルールライブラリ、syscall 以外のデータソースをプラグインで取り込むモジュール性、古いカーネル向けにカーネルモジュールへフォールバックできる点 (Tetragon/Tracee は新しめのカーネル必須)。メモリ消費は 3 ツール中最小という比較もある。出典 #9, #10。

## インストール / 最小構成

Helm が基本 (出典 #7):

```bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update
helm install falco falcosecurity/falco --namespace falco --create-namespace
```

falcosidekick と Web UI も同時に入れる場合:

```bash
helm install falco falcosecurity/falco \
  --set falcosidekick.enabled=true \
  --set falcosidekick.webui.enabled=true
```

Falco は DaemonSet として全ノードに展開され、ノードのカーネルから syscall を取り eBPF プローブまたはカーネルモジュールで検知する。フル機能の eBPF (CO-RE) はカーネル 5.8+ が要件、それ未満はカーネルモジュールへフォールバック。出典 #6, #9。
