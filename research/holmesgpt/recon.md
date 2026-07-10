# recon: HolmesGPT

調査メモ。自分用の密度。出典は sources.md の番号と対応。`file:line` は pinned commit 基準。

## 基本情報

- repo: `HolmesGPT/holmesgpt`（旧 `robusta-dev/holmesgpt` から org 移管済み。`git remote -v` が `https://github.com/HolmesGPT/holmesgpt.git` を返す。README 見出しも "HolmesGPT — The CNCF SRE Agent"）(S1)(S2)
- pinned commit: `84cb39c9a3267d676dc82550c2a3e4732f7ca68a`（2026-07-06）/ 近いタグ: `0.35.0`（2026-07-01。直後に `0.36.0-alpha` も同日付。HEAD は 0.35.0 の後ろ）(S1)
- 言語 / ビルド: Python / Poetry（`poetry install`、テストは `make test-without-llm` = `pytest -m "not llm"`）(S3)
- ライセンス: Apache-2.0（`LICENSE`、`gh repo view` の licenseInfo も apache-2.0）(S1)(S2)
- CNCF 成熟度: Sandbox（2025-10-08 に TOC 承認）(S4)(S5)
- カテゴリ（tools.ts の CATEGORY_ORDER から）: Observability
- リポジトリ作成: 2024-05-30（`gh repo view` createdAt）(S2)
- メンテナ: Robusta.Dev（創業者 Natan Yellin / `aantn` ほか）＋ Microsoft（`mainred`）。`MAINTAINERS.md` に Robusta 10 名＋Microsoft 1 名 (S6)

一言で: 本番インシデントの調査と根本原因特定を行う OSS の AI エージェント（"SRE Agent"）。LLM に observability 系ツール群（toolsets）を持たせ、agentic loop でライブデータを取りに行かせて RCA を出す。Kubernetes 必須ではなく VM / クラウド / DB / SaaS でも動く。(S1)

## 歴史の素材

- Robusta.Dev（Kubernetes 監視 SaaS を出している会社）が発端。README に "Originally created by [Robusta.Dev](http://robusta.dev), with major contributions from [Microsoft](https://microsoft.com/)" と明記 (S1)。`MAINTAINERS.md` でも Robusta 所属が大半、Microsoft から 1 名（`mainred` / Qingchuan Hao）(S6)
- 最初の public コミット/リポジトリ作成は 2024-05-30（GitHub createdAt）(S2)
- 2025-10-08、CNCF TOC が Sandbox として受理。CNCF プロジェクトページに "HolmesGPT was accepted to CNCF on October 8, 2025 at the Sandbox maturity level" (S4)。オンボーディング/申請は `cncf/sandbox` の issue #392（申請）・#411（オンボーディング）(S5)
- CNCF 側の紹介ブログ（2026-01-07）が Robusta 起源・Microsoft 共同メンテという経緯と position（agentic troubleshooting）を説明 (S7)
- 移管: 元 `robusta-dev/holmesgpt` から専用 org `HolmesGPT/holmesgpt` へ。現在の canonical は `HolmesGPT/holmesgpt`（remote / README で確認）(S1)
- 最近の方向性: "Operator Mode"（バックグラウンドで 24/7 稼働し、問題を先に検知して Slack 通知、GitHub 連携で修正 PR まで出す）を README 冒頭で前面に出している (S1)

補足: `0.0.0` が `pyproject.toml` の version 値（リリースはタグ側で管理。実リリースは `0.35.0` が latest）(S2)(S3)。

## アーキテクチャの素材

トップレベル構成（`holmes/`）:

- CLI エントリ `holmes/main.py`（Typer）: `ask` / `investigate` / `toolset` サブコマンド。設定ロードとコマンドルーティング (S3)
- 設定 `holmes/config.py`: `~/.holmes/config.yaml` から model / api_key / toolsets を読む。source（AlertManager, Jira, PagerDuty, OpsGenie）のファクトリ (S3)
- コアエンジン `holmes/core/tool_calling_llm.py`: `ToolCallingLLM` クラス。tool-calling 付き agentic loop の本体（`core/*.py` で計 ~10k 行、うち本ファイルが中心）
- LLM 抽象 `holmes/core/llm.py`: `DefaultLLM`（`LLM` 基底）。LiteLLM 経由でマルチプロバイダ（OpenAI / Anthropic / Azure / Bedrock / Gemini など）。トークン数計算・context window 管理もここ (S1)
- プロンプト構築 `holmes/core/prompt.py` ＋ Jinja2 テンプレート `holmes/plugins/prompts/generic_ask.jinja2`（system）/ `base_user_prompt.jinja2`（user）
- プラグイン `holmes/plugins/`
  - `toolsets/`: データソース統合。46 エントリ（yaml 定義＋Python 実装が混在。Kubernetes / Prometheus / Grafana / Datadog / AWS / Docker / Elasticsearch / MCP など）(S1)
  - `sources/`: アラート取り込み（`github` / `jira` / `opsgenie` / `pagerduty` / `prometheus`(AlertManager)）
  - `prompts/`: Jinja2 テンプレート
  - `destinations/`: Slack 等への書き戻し
- ツール実行・型 `holmes/core/tools.py`: `Tool.invoke`（tools.py:353）、`StructuredToolResult`（status enum: `success` / `error` / `no_data` / `approval_required` / `frontend_pause`、tools.py:64-69）

### 代表操作 = アラート調査を端から端まで（`holmes investigate`）

1. `holmes/main.py:163` `_investigate_issue(ai, issue, config)`。`build_system_prompt(...)`（`main.py:173`→`prompt.py:177`）で system prompt、`generate_user_prompt("...issue...:\n{issue.raw}", {})`（`main.py:181`→`prompt.py:161`）で user prompt を作る。investigation 用の追記文は `main.py:172`（"Provide a terse analysis of the following {source} alert/issue and why it is firing."）。messages = system + user を組んで `ai.call(messages, ...)`（`main.py:189`）
2. `ToolCallingLLM.call`（`tool_calling_llm.py:575`）は `call_stream` の同期ラッパ。ストリームを drain して `LLMResult` を再構成する。`call_stream`（`tool_calling_llm.py:1031`）が本体
3. agentic loop（`tool_calling_llm.py:1101` `while i < max_steps`）
   - `check_compaction_needed` → `compact_if_necessary`（`core/truncation/input_context_window_limiter.py:81`）で context window 超過時に会話履歴を圧縮（決定的）
   - `self.llm.completion(messages=..., tools=tools, tool_choice="auto", temperature=TEMPERATURE, stream=False, drop_params=True)`（`tool_calling_llm.py:1163`）で LLM を 1 回叩く。LiteLLM 経由（`llm.py`）
   - 応答に `tool_calls` が無ければ `ANSWER_END`（`tool_calling_llm.py:1262`）を emit して終了。`content` が最終的な合成 RCA（LLM が書く）
   - `tool_calls` があれば `ThreadPoolExecutor(max_workers=16)`（`tool_calling_llm.py:1295`）で並行実行。各呼び出しは `_invoke_llm_tool_call`（`tool_calling_llm.py:866`）→ `_directly_invoke_tool_call` → `Tool.invoke`（`tools.py:353`）でデータソースを実際に叩く
   - 結果は `to_llm_message()` で messages に追記（`tool_calling_llm.py:1390`）し、次イテレーションへ。max_steps に達したら tools を外して締める（`tool_calling_llm.py:1108`）
4. 途中の決定的セーフガード:
   - 同一パラメータの重複ツール呼び出しを拒否 `prevent_overly_repeated_tool_call`（`safeguards.py:24`。read-only 前提でループ抑止）
   - approval が要るツールは `Tool.invoke` 内で `APPROVAL_REQUIRED` を返し（`tools.py:363-377`）、loop 側で pause（`tool_calling_llm.py:1326`）。承認トークンを署名付きで mint（`tool_calling_llm.py:1417`）
   - 巨大なツール出力は `spill_oversized_tool_result`（`tool_calling_llm.py:954`、`core/tools_utils/tool_context_window_limiter.py:30`）でディスクに退避 or 予算内に丸める

### 決定的 vs LLM 駆動（ここが読みどころ）

- 決定的（Python が固定で回す）: ループ制御と `max_steps`、ツールの並行ディスパッチ、重複呼び出し拒否（safeguards.py:24）、approval ゲート（tools.py:363）、context 圧縮/出力退避、トークン計上・トレース（OTel span）。
- LLM 駆動: どのツールをどの引数で呼ぶか、何回イテレートしていつ止めるか、最終的な根本原因の文章化。RCA 用のハードコードされた決定木は無い。runbook（後述）はプロンプトに差し込むテキストのガイドで、実行判断は依然 LLM。
- つまり "エージェント" の意思決定は全部 LLM 側にあり、Holmes 本体は「安全に何度も tool を叩かせて、出力を context に収まる形で LLM に戻す」オーケストレーションに徹する設計。

## 内部実装の素材

重要ディレクトリ:

- `holmes/core/` — エンジン中枢。`tool_calling_llm.py`（loop）、`llm.py`（LiteLLM ラッパ・model registry・token 計算）、`prompt.py`（プロンプト組立）、`tools.py`（Tool / Toolset / StructuredToolResult）、`safeguards.py`、`truncation/`（context 圧縮）、`tools_utils/`（出力退避）、`models.py`（`ToolCallResult` などの I/O 型）
- `holmes/plugins/toolsets/` — 46 個のデータソース統合。`investigator/` は少し特殊で、RCA 用ツールではなく `TodoWrite` ツール（`core_investigation.py`）を提供して LLM にタスク分解を「決定的に」記録させる仕組み
- `holmes/plugins/sources/` — アラート取り込み（github / jira / opsgenie / pagerduty / prometheus[=AlertManager]）
- `holmes/plugins/prompts/` — Jinja2。`generic_ask.jinja2` が system prompt の本体で、`intro` / `cluster_name`（マルチクラスタ注意書き）/ `todowrite` / `toolset_instructions` / `style_guide` などをコンポーネント単位で on/off できる（`prompt.py:12` PromptComponent, `prompt.py:97` is_component_enabled、env `ENABLED_PROMPTS` で制御）

中核データ構造:

- `StructuredToolResult`（`tools.py:96`）: すべてのツール出力の統一型。`status`（enum `tools.py:64`）＋ data ＋ error ＋ params。`no_data` を明示的に区別するのがミソで、LLM に「探したが無かった」を伝えて自己修正させる（CLAUDE.md の toolset 設計指針=詳細なエラーを必ず返す、とも一致）
- `ToolCallResult`（`core/models.py:11`）: 1 ツール呼び出しの結果ラッパ。`to_llm_message()`（models.py:19）で LLM 向け message へ、`to_client_dict()`（models.py:48）でクライアント向けへ変換
- `ToolCallingLLM`（`tool_calling_llm.py:196`）: `tool_executor` / `max_steps` / `llm` / `tool_results_dir` を持つ。`with_executor` でリクエストごとの frontend tool 注入用に shallow copy する（`tool_calling_llm.py:213`）

追う価値のあるパス（深掘り済み）:

- `call`（575）→ `call_stream`（1031）の while ループ（1101〜）。特に「tool_calls が無い＝終了」の分岐（1249）と、tool 結果を message に戻して次ループへ回す部分（1387-1395）。ここが agentic loop の心臓。
- approval 再開パス: `call` が `APPROVAL_REQUIRED` を受けたら `_prompt_for_approval_decisions`（696）でユーザ判断を取り、`tool_decisions` を付けて `call_stream` を再入。`call_stream` 冒頭 `_execute_tool_decisions`（252）で承認済みツールを再実行、拒否は否認エラーを注入（tool_use には必ず tool_result が要るという LLM API 制約への対処）。

驚いたところ/非自明:

- `stream=False` で回している（`tool_calling_llm.py:1169`）。名前は `call_stream` だが、これは「LLM の token streaming」ではなく「Holmes のイテレーションを 1 回ずつ yield する」ストリーム。コメントにも明記（`tool_calling_llm.py:1044-1046`）。
- ツール呼び出しはイテレーション内で最大 16 並列（`max_workers=16`）。1 ステップで複数ツールを同時に投げてレイテンシを削る設計。
- 全ツールは設計上 read-only（CLAUDE.md Security Notes）。だから「同一呼び出し拒否」セーフガードが成立する（mutate するなら外す必要があると safeguards.py:36-38 のコメントが断っている）。
- default model が `gpt-5.4`（CLAUDE.md 記載）だが、ドキュメント例は Anthropic Claude を推奨、と方針が分かれている。

## 採用事例の素材

出典付きのみ（`ADOPTERS.md`）:

- Microsoft Azure Kubernetes Service (AKS) Team — ノード readiness / pod scheduling / DNS / アップグレード等のクラスタ障害調査に使用。contact `aritraghosh` (S8)
- Innovaccer（Cloud Infrastructure Team）— 自社 Infrainsights 内で P0/P1 インシデントの RCA/調査自動化、APM・ログ解析に使用。contact `chitender` (S8)

その他の裏付け:

- Microsoft は ADOPTERS だけでなくコード貢献側でもある（README・MAINTAINERS で Microsoft を共同メンテと明記。`mainred` が maintainer）(S1)(S6)

GitHub シグナル（`gh repo view HolmesGPT/holmesgpt`、取得日 2026-07-08）(S2):

- Stars: 2,814
- Forks: 403
- 作成: 2024-05-30 / 最終 push: 2026-07-09
- latest release: `0.35.0`（2026-07-01）
- primary language: Python

注意: マーケ的な "使われている" 主張は入れない。名前入り adopter は上記 2 組織のみ（ADOPTERS.md 準拠）。

## 代替・エコシステム

隣接/統合:

- LiteLLM（LLM プロバイダ抽象。Holmes の LLM 層の土台）
- MCP（Model Context Protocol）toolset 対応。GitHub / GitLab / Azure / GCP など MCP 経由の統合が多数 (S1)
- Robusta プラットフォーム（親会社の SaaS。UI / マルチクラスタ / 履歴データを Holmes と組み合わせる。`robusta` toolset あり）(S1)
- アラート源: Prometheus AlertManager / PagerDuty / OpsGenie / Jira（双方向。findings を書き戻せる）(S1)

主な代替（本質的な差）:

- K8sGPT（CNCF Sandbox, 現 Incubating 申請系の観測系ツール）: Kubernetes に絞った "analyzer + LLM 説明" 型。決まった analyzer が k8s リソースを走査し、その要約を LLM に説明させる比重が高い。Holmes は特定プラットフォームに縛られず、LLM 自身に任意 toolset を agentic に叩かせて調査させる（より汎用・よりエージェント寄り）。
- kagent（CNCF Sandbox）: Kubernetes 上で AI エージェントを動かすためのフレームワーク/ランタイム寄り。Holmes は「インシデント調査に特化した完成品エージェント＋データソース統合」であって、汎用エージェント基盤ではない。
- 商用/クローズド SRE エージェント各種（本 recon では出典が薄いので列挙しない）。

要旨: 「LLM＋read-only な observability toolset を安全な agentic loop で回して RCA を書かせる」ことに全振りした OSS。決定的ロジックは安全弁と context 管理に限定し、調査の頭脳は LLM に置く。K8sGPT より汎用・エージェント寄り、kagent よりアプリ特化。
