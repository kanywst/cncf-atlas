# recon: chaosblade

調査メモ。出典は URL 付き。path:line は `research/chaosblade/src` の pin commit 上で確認済み。

## 基本情報

- repo: `chaosblade-io/chaosblade`
- pinned commit: `39a0c02e5f34af980f561440c0f1c218a3cde821` (2026-06-18) / 最寄りタグ: `blade-ai-v0.5.0`
- mainline 最新リリース: `v1.8.0`、AI レイヤ最新: `blade-ai-v0.5.1` (2026-06-23)
- 言語 / ビルド: コア CLI は Go (go.mod `go 1.25`) / `make build` (cli ターゲット)。新規の blade-ai は Python 3.11+。GitHub の言語統計は blade-ai のせいで Python 74.2% と出るが、`blade` 本体は Go
- ライセンス: Apache-2.0 (検証: `src/LICENSE` が Apache 2.0 全文、`go.mod` / 各 `.go` 冒頭に Apache ヘッダ、`blade-ai/NOTICE` 存在)
- CNCF 成熟度: Sandbox (受理 2021-04-28)
- カテゴリ: Chaos Engineering
- GitHub 指標 (2026-06-27, `gh api repos/chaosblade-io/chaosblade`): stars 6,358 / forks 1,001 / open issues 348 / contributors 約 52 (`contributors?per_page=1&anon=true` の last page=52)

CNCF (Cloud Native Computing Foundation、クラウドネイティブ計算基盤) の Sandbox は最も早期の成熟段階。同じ Chaos Engineering の Chaos Mesh と LitmusChaos は一段上の Incubating。出典: <https://www.cncf.io/projects/chaosblade/>

## 歴史の素材

- 起源: Alibaba 社内の障害テスト/演習ツール「MonkeyKing」。約 10 年の故障注入実践を製品化したもの。マイクロサービスの依存関係問題の検証から始まり、クラウド/クラウドネイティブの定常状態検証へ広がった。出典: <https://www.alibabacloud.com/blog/chaosblade---an-open-source-chaos-engineering-tool-by-alibaba_594850>
- OSS 公開: 2019 年。当初は `chaosblade` (Go の CLI + 基本リソース/コンテナ executor) と `chaosblade-exe-jvm` (JVM 用 executor) の 2 リポジトリ構成。出典: 同上 + <https://chaosblade.io/en/docs/>
- 課題意識: 当時の chaos ツールは「シナリオが散在」「導入が難しい」「実験モデルの標準が無い」「拡張・蓄積が困難」。これを実験モデル標準化で解こうとした。出典: <https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663>
- ツールからプラットフォームへ: 後に多クラスタ/多環境/多言語のプラットフォーム `chaosblade-box` を追加。v1.0.0-GA 時点で Linux/Windows/Docker/Kubernetes に対応、Java/Golang/JavaScript/C++ をカバー、200+ シナリオ・3000+ パラメータ。出典: 同上
- CNCF Sandbox 入り: 2021-04-28 (TOC 投票通過)。出典: <https://www.cncf.io/projects/chaosblade/>
- 最近 (2026): リポジトリ内に Python 製の AI エージェント層 `blade-ai/` を追加。「平文で障害を記述 → 意図理解・安全審査・注入・検証・回復・レポート」を行う orchestration layer。`blade-ai/README_en.md` 冒頭に記述あり。タグ `blade-ai-v0.5.1` が 2026-06-23 リリース

## アーキテクチャの素材

トップレベル (`src/`):

- `cli/` — `blade` CLI 本体 (cobra)。エントリは `cli/main.go:26`
- `exec/` — ドメイン別 executor アダプタ: `cloud` `cplus` `cri` `docker` `jvm` `kubernetes` `middleware` `os`
- `data/` — ローカル実験状態ストア (SQLite)
- `version/` — バージョン情報 (`version/version_info.go` は `scripts/version.sh` で自動生成、`version/version.go` はプレースホルダ)
- `blade-ai/` — Python 製 AI エージェント (別配布物)
- `build/` `hack/` `scripts/` — ビルド補助

エントリと初期化:

- `cli/main.go:27` で `cmd.CmdInit()` を呼び、`cli/main.go:28` で cobra の `Execute()`
- `cli/cmd/cmd.go:23` `CmdInit()` が root に `version` `prepare` `revoke` `create` `destroy` `status` `query` `check` を登録。`cli/cmd/cmd.go:58` のコメント通り server モードは 2023-12-30 に無効化済み (README には残っているが CLI からは外れている)

spec 駆動のコマンドツリー (これが設計の肝):

- `CreateCommand.Init` (`cli/cmd/create.go:60`) が `newBaseExpCommandService(cc)` を呼ぶ (`cli/cmd/create.go:74`)
- `newBaseExpCommandService` (`cli/cmd/exp.go:99`) → `registerSubCommands` (`cli/cmd/exp.go:119`) が os/middleware/cloud/jvm/cplus/docker/cri/k8s を順に登録
- 例: `registerOsExpCommands` (`cli/cmd/exp.go:139`) は `chaosblade-os-spec-<ver>.yaml` を yaml home から読み、`specutil.ParseSpecsToModel(file, os.NewExecutor())` (`cli/cmd/exp.go:141`) で `spec.Models` に展開。各 model を `registerExpCommand` (`cli/cmd/exp.go:331`) で cobra サブコマンド化し、action ごとに `registerActionCommand` (`cli/cmd/exp.go:380`) で `RunE` に `actionRunEFunc` を結線
- つまりシナリオ (target/action/flag) はコード埋め込みでなく、バージョン付き YAML から実行時ロード

## 内部実装の素材

代表オペレーションを end-to-end で追う: `blade create cpu load --cpu-percent 60`

1. `cli/main.go:27-28` — `CmdInit()` 後に cobra `Execute()`
2. `cli/cmd/create.go:104` `actionRunEFunc` が返すクロージャが当該 action の `RunE`
3. `cli/cmd/create.go:106` `createExpModel(target, scope, action, cmd)` で cobra フラグから `spec.ExpModel` を構築 (実装は `cli/cmd/exp.go:435`、`cmd.Flags().VisitAll` で全フラグを `ActionFlags` に格納 `cli/cmd/exp.go:443`)
4. `cli/cmd/create.go:140` `actionCommand.recordExpModel(cmd.CommandPath(), expModel)` → `cli/cmd/command.go:76`。uid 採番 (`command.go:82` で `generateUid` 呼び出し、宣言は `command.go:122`)、`data.ExperimentModel` を組み (`command.go:96`)、`GetDS().InsertExperimentModel` で SQLite に INSERT (`command.go:106`)
5. 同期パス (`cli/cmd/create.go:178` の else): `executor := actionCommandSpec.Executor()` (`create.go:180`)、`executor.SetChannel(channel.NewLocalChannel())` (`create.go:181`)、`executor.Exec(model.Uid, ctx, expModel)` (`create.go:183`)
6. os executor `exec/os/executor.go:42` `Exec`: destroy/create を判定 (`executor.go:51-56`)、`argsArray` を組み (`executor.go:58-64`)、`chaosOsBin := path.Join(util.GetProgramPath(), "bin", spec.ChaosOsBin)` (`exec/os/executor.go:66`)、`os_exec.CommandContext(ctx, chaosOsBin, argsArray...)` (`exec/os/executor.go:67`) で**別バイナリ `chaos_os` を子プロセス起動**。常駐型 (ProcessHang) なら `command.Start()` で PID を返す (`executor.go:71-76`)、それ以外は `CombinedOutput()` して `spec.Decode` (`executor.go:78-84`)
7. 結果で状態更新: 成功時 `GetDS().UpdateExperimentModelByUid(model.Uid, Success, ...)` (`cli/cmd/create.go:222`、実装 `data/experiment.go:164`)
8. `PostRunE` = `actionPostRunEFunc` (`cli/cmd/create.go:252`): `timeout` フラグがあれば `nohup /bin/sh -c 'sleep N; blade destroy <uid>'` を仕込み自動回復 (`cli/cmd/create.go:275-277`)。container/pod は timeout+60s (`create.go:271-272`)

非同期パス (`--async`): `cli/cmd/create.go:150-177` で自分自身を `nohup blade create ... --nohup=true &` として再起動し uid を即返す。

中核データ構造:

- `data.ExperimentModel` (`data/experiment.go:30`) — 永続化される実験レコード。Uid/Command/SubCommand/Flag/Status/Error/CreateTime/UpdateTime。DDL は `data/experiment.go:71` の `experiment` テーブル
- `data.SourceI` (`data/source.go:36`) / `data.Source` (`data/source.go:41`) — SQLite ストア抽象。`ExperimentSource` (`data/experiment.go:41`) + `PreparationSource` を合成
- `spec.ExpModel` (chaosblade-spec-go 由来) — 実行時の実験表現。`cli/cmd/exp.go:435` で生成、Target/Scope/ActionName/ActionFlags を持つ
- `baseExpCommandService` (`cli/cmd/exp.go:91`) — `commands map[string]*modelCommand` と `executors map[string]spec.Executor` のレジストリ。executor key は `createExecutorKey` (`cli/cmd/exp.go:452`) で `target-actionTarget-action` を生成
- `CreateCommand` (`cli/cmd/create.go:41`) — `async` / `endpoint` / `nohup` フラグを保持する cobra コマンド

非自明な設計判断:

- **`blade` 本体は障害を注入しない。spec 駆動の dispatcher である。** os executor は `bin/chaos_os` という別バイナリへ shell out し (`exec/os/executor.go:66-67`)、シナリオ定義 (target/action/flag) は実行時に versioned YAML (`chaosblade-os-spec-<ver>.yaml` 等) から読む (`cli/cmd/exp.go:140`)。これらの executor バイナリと YAML は兄弟リポジトリ (`chaosblade-exec-os` 等、`go.mod` に `v1.8.0` 依存として列挙) が生成し、`Makefile:341-355` がビルド時に `git clone` して `make` し target にパッケージする。結果として「OS/JVM/C++/Docker/CRI/K8s/cloud」を CLI 本体が各実装を知らないまま横断できる。executor は YAML 契約で疎結合
- 状態は外部 DB 不要のローカル SQLite ファイル `chaosblade.dat` (`data/source.go:34`)。ドライバは cgo 不要の pure-Go `github.com/glebarez/sqlite` (`data/source.go:28`、接続は `sql.Open("sqlite", ...)` `data/source.go:113`)。パスは `CHAOSBLADE_DATAFILE_PATH` で上書き可 (`data/source.go:77`)
- `timeout` フラグは全 action に自動付与される (`addTimeoutFlag` `cli/cmd/exp.go:405`)。回復忘れ対策として PostRun で自動 destroy をスケジュール

## 採用事例の素材

- Alibaba Cloud ブログ記載: 「40 社以上が登録、うち ICBC (中国工商銀行)、China Mobile、Xiaomi、JD.com 等が本番適用」。出典: <https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663>
- リポジトリに `ADOPTERS` ファイルは無い。README は GitHub issue 経由での企業登録を案内する方式。上記 4 社以外の citable な名前は確認できなかった
- 学術調査 (arXiv 2505.13654, 2025) は ChaosBlade を CNCF Sandbox、26 リリース、継続開発中と位置づけ。Chaos Mesh / LitmusChaos は Incubating と対比。出典: <https://arxiv.org/html/2505.13654>
- LFX Insights: 直近四半期のアクティブ contributor 15、1 contributor が 51%+ を占める単一依存リスクあり。出典: <https://insights.linuxfoundation.org/project/chaosblade>

## 代替・エコシステム

代替:

- Chaos Mesh (CNCF Incubating, PingCAP 発、K8s ネイティブ CRD ベース)
- LitmusChaos (CNCF Incubating, K8s chaos ワークフロー/実験ハブ)
- Gremlin (商用 SaaS)、Chaos Toolkit、PowerfulSeal、kube-monkey、AWS FIS (Fault Injection Service)

本質的な差:

- 単一 CLI + 実験モデル標準 (YAML spec) で host / JVM / C++ / Docker / CRI / Kubernetes / cloud を横断する「幅」。Chaos Mesh/Litmus は基本 K8s 中心
- アプリ層注入が強い: JVM は Java Agent で動的 attach (zero-cost, リソース完全回収)、C++ は GDB でメソッド/行レベル注入 (兄弟リポジトリ `chaosblade-exec-jvm` / `chaosblade-exec-cplus`)
- K8s は CRD 経由の `chaosblade-operator`、UI/監視は `chaosblade-box` (Helm デプロイ、Prometheus 連携、litmuschaos ホスティングも可)。出典: <https://chaosblade.io/en/blog/2022/06/24/ChaosBlade-Box-a-New-Version-of-the-Chaos-Engineering-Platform-Has-Released/>

エコシステム/統合先:

- `chaosblade-operator` (K8s CRD)、`chaosblade-box` (プラットフォーム UI)、`chaosblade-exec-*` (各ドメイン executor)、`chaosblade-spec-go` (実験モデル SDK)、新規 `blade-ai` (LLM エージェント層)

## install / 最小動作セットアップ

ホスト (最小):

1. Releases からツールキット tarball を取得して展開し、`blade` を PATH に置く。出典: <https://github.com/chaosblade-io/chaosblade/releases>

   ```bash
   blade create cpu load --cpu-percent 60
   blade status <experiment-uid>
   blade destroy <experiment-uid>
   ```

Kubernetes:

1. `chaosblade-operator` を Helm で導入。出典: <https://github.com/chaosblade-io/chaosblade-operator/releases>

   ```bash
   helm install chaosblade-operator chaosblade-operator-<version>.tgz \
     --namespace chaosblade --create-namespace
   blade create k8s pod-cpu fullload --cpu-percent 80 \
     --kubeconfig ~/.kube/config --names <pod-name> --namespace default
   ```

CLI コマンド体系 (README より): `prepare` (alias `p`) で JVM 等の事前 attach、`create` (alias `c`) で注入、`destroy` (alias `d`) で回復、`status` で照会。出典: <https://github.com/chaosblade-io/chaosblade/blob/master/README.md>
