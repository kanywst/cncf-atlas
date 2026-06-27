# recon: Atlantis

調査メモ。自分用の密度。出典は URL 必須、コードは `src/` の pin commit で確認した `file:line` のみ。

## 基本情報

- repo: `runatlantis/atlantis`
- pinned commit: `b7cea535d4d83b1ceeb428fca61458c126c107e3` (commit date 2026-06-25)
- 近いタグ: shallow clone のためタグは取得できず。最新リリースは `v0.44.0` (2026-06-10 公開)。pin は `v0.44.0` 直後の main HEAD。
- 言語 / ビルド: Go (`go.mod` の `go 1.26.4`)。ビルドは `make build-service` (`CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -v -o atlantis .`)、テストは `make test` (`go test -short $(PKG)`)。`Makefile:25-26,51-52`。
- エントリポイント: `main.go`。`cmd.RootCmd` に `server` / `version` / `testdrive` の 3 サブコマンドを登録 (`main.go:48-54`)。実体は HTTP サーバ。
- ライセンス: Apache License 2.0。`LICENSE` 本体、`go.mod` 由来コードの各ファイル先頭が `SPDX-License-Identifier: Apache-2.0`、GitHub API の `licenseInfo.key=apache-2.0` でも確認。`main.go:1-2` に `Copyright 2017 HootSuite Media Inc.`。
- CNCF 成熟度: Sandbox (2024-06-18 受諾)。
- カテゴリ (tools.ts CATEGORY_ORDER から): App Definition & GitOps。
- 一言: Terraform/OpenTofu を Pull Request のコメント (`atlantis plan` / `atlantis apply`) から実行する、サーバサイド実行型の IaC 自動化サービス。

## 歴史の素材

- 起源は Hootsuite。Anubhav Mishra が社内ツールとして作り始め、Luke Kysow と Go で書き直して OSS 化。`hootsuite/atlantis` として公開。解こうとした課題は「チームで Terraform をどう協調運用するか」「開発者に安全に terraform plan/apply させるには」。出典: [Introducing Atlantis (Luke Kysow, Medium)](https://medium.com/runatlantis/introducing-atlantis-6570d6de7281)。同記事は「originally written September 11th, 2017」と注記、公開告知は 2018-02-27。
- 2018 年に `hootsuite/atlantis` から `runatlantis/atlantis` 個人 org へ移管。出典: [Moving Atlantis to runatlantis/atlantis (Medium)](https://medium.com/runatlantis/moving-atlantis-to-runatlantis-atlantis-on-github-4efc025bb05f)。GitHub repo `createdAt` は 2018-02-06 (gh repo view)。
- `main.go` の著作権表記が `Copyright 2017 HootSuite Media Inc.` で、Hootsuite 起源を裏取りできる (`main.go:1`)。
- 創業者 2 名はその後 HashiCorp に参加。Terraform 本家による支援は CNCF 寄贈時にも言及あり。出典: [cncf/sandbox#60](https://github.com/cncf/sandbox/issues/60)。
- 「apply-before-merge」(マージ前に PR 上で apply する) ワークフローを広めたのが Atlantis。状態はユーザの Terraform backend に残り、Atlantis 自身はロックと plan メタデータのみを持つ。
- CNCF 寄贈の経緯: 一時休眠していたプロジェクトをガバナンス強化のため寄贈。Sandbox 申請が [cncf/sandbox#60](https://github.com/cncf/sandbox/issues/60)、TAG App Delivery レビューが [cncf/tag-app-delivery#474](https://github.com/cncf/tag-app-delivery/issues/474)。2024-06 にコミュニティ投票 (binding vote 66% 以上で通過)。受諾は 2024-06-18 で 2024 H1 cohort。出典: [CNCF Atlantis project page](https://www.cncf.io/projects/atlantis/)。

## アーキテクチャの素材

トップレベルのコンポーネント (`server/` 配下):

- `server/controllers/` : HTTP ハンドラ。webhook 受信 (`events/`)、ロック UI (`locks_controller.go`)、ジョブ stream (`jobs_controller.go`)、ステータス (`status_controller.go`)、API (`api_controller.go`)。
- `server/events/` : コマンドの中核。webhook から コメント解釈、コマンド実行までのドメインロジック。`command_runner.go` / `*_command_runner.go` / `project_command_*.go`。
- `server/events/vcs/` : GitHub / GitLab / Gitea / Bitbucket (cloud/server) / Azure DevOps のクライアント抽象。
- `server/core/` : 実行基盤。`terraform/` (バイナリ実行)、`runtime/` (ステップ実行器)、`locking/` (ロック)、`db/` + `boltdb/` + `redis/` (永続化)、`config/` (リポ設定 `atlantis.yaml` のパース/検証)。

### 代表操作のエンドツーエンド: PR コメント `atlantis plan`

1. webhook POST は `VCSEventsController.Post` が受ける。ヘッダ (`X-Github-Event` ほか) でホストを判定し `handleGithubPost` などへ分岐。`server/controllers/events/events_controller.go:101`、GitHub 分岐は `:110-117`、ハンドラ定義は `:169`。
2. コメントイベントは `handleCommentEvent` に集約。`server/controllers/events/events_controller.go:673`。リポが allowlist を通れば goroutine で `e.CommandRunner.RunCommentCommand(...)` を呼ぶ。`:742`。
3. コメント本文は `CommentParser.Parse` が解釈。先頭トークンが `atlantis` (実行名) か照合し、`terraform` 等の打ち間違いには警告を返す。`server/events/comment_parser.go:156`、実行名照合は `:172-181`。
4. `DefaultCommandRunner.RunCommentCommand` がドメインのオーケストレーション。`server/events/command_runner.go:292`。drainer でシャットダウン中をはじき (`:293`)、team allowlist で権限確認 (`:313-329`)、`command.Context` を組み立て (`:351`)、pending の commit status を設定 (`:372-381`)、pre-workflow hook を実行 (`:386`)、コマンド種別ごとの runner を `buildCommentCommandRunner` で取得して `Run` (`:416-418`)、最後に post-workflow hook (`:420`)。
5. plan の場合 `PlanCommandRunner.run` へ。`server/events/plan_command_runner.go:194`。`prjCmdBuilder.BuildPlanCommands` で変更ファイルから対象プロジェクト群を構築 (`:214`)、generic plan なら過去の plan とロックを破棄 (`:270-277`)、`runProjectCmdsWithCancellationTracker(..., p.prjCmdRunner.Plan)` で各プロジェクトに対し plan を (必要なら並列で) 実行 (`:279`)。
6. プロジェクト単位は `DefaultProjectCommandRunner.Plan` から `doPlan`。`server/events/project_command_runner.go:242` / `:666`。doPlan は (a) repo/dir/workspace の Atlantis ロックを `Locker.TryLock` で取得 (`:668`)、(b) 作業ディレクトリの内部ロックを `WorkingDirLocker.TryLock` で取得 (`:678`)、(c) `WorkingDir.Clone` でリポを clone (`:685`)、(d) `runSteps` でワークフローのステップ列を実行 (`:710`)、成功時に `PlanSuccess` (LockURL, TerraformOutput, RePlanCmd, ApplyCmd) を返す (`:719-725`)。
7. `runSteps` は `valid.Step` の `StepName` で分岐するディスパッチャ。`init` / `plan` / `apply` / `policy_check` / `run` / `env` などをステップ実行器に振る。`server/events/project_command_runner.go:902`、plan ステップは `:917` (`p.PlanStepRunner.Run`)。ステップ実行中は `GitReadLock` を保持して clone/reset/merge を排除 (`:906`)。
8. plan ステップの実体は `planStepRunner.Run`。`server/core/runtime/plan_step_runner.go:50`。TF distribution/version を解決し (`:51-58`)、plan ファイル名を決め (`:60`)、`TerraformExecutor.RunCommandWithVersion(...)` で実際に terraform/opentofu バイナリを起動 (`:62`)。TFE (Terraform Enterprise) remote ops のエラーを検知すると `remotePlan` にフォールバック (`:63-66`)。
9. 結果は `markdown_renderer.go` で整形され VCS クライアント経由で PR コメントとして書き戻される (commit status も更新)。

### 設計判断

- 実行モデルはサーバサイド。Atlantis サーバが terraform/opentofu バイナリを自分のディスク上で動かす (`plan_step_runner.go:62`)。state はユーザの backend に残り、Atlantis は state を保持しない。永続化するのはロックと plan メタデータのみ。
- push / pull のうち push 型。VCS からの webhook (push) で起動し、reconcile ループは持たない。コメント駆動の命令的フロー。
- 二重ロック設計が非自明 (後述)。
- 拡張点は `atlantis.yaml` のカスタムワークフロー。`valid.Workflow` が Plan/Apply/PolicyCheck/Import/StateRm の `Stage` を持ち、`Stage` は `Step` の列。`run` ステップで任意シェルを差し込める。`server/core/config/valid/repo_cfg.go:231,252`。

## 内部実装の素材

重要ディレクトリ:

- `server/events/` : コマンドのオーケストレーション層。`command_runner.go` がハブ。
- `server/core/runtime/` : `*_step_runner.go` がワークフローの各ステップ (init/plan/apply/policy_check/run/env/multienv/import/state_rm)。`runSteps` の分岐先 (`project_command_runner.go:913-940`) と 1:1。
- `server/core/terraform/` : terraform/opentofu バイナリのダウンロードと実行 (`Distribution`, `RunCommandWithVersion`)。
- `server/core/locking/` + `server/core/db/` + `boltdb/` + `redis/` : ロックの永続化。デフォルトは BoltDB (組み込み)、Redis はオプション。
- `server/core/config/valid/` : `atlantis.yaml` を検証済み構造体 (`RepoCfg`, `Project`, `Workflow`, `Stage`, `Step`) に落とす。

中核データ構造:

- `command.Context` : 1 コマンド実行のリクエストスコープ。User / Pull / PullStatus / HeadRepo / Trigger / PolicySet などを束ねる。組み立ては `server/events/command_runner.go:351`。
- `command.ProjectContext` : 1 プロジェクト 1 操作のコンテキスト。`CommandName` / `ApplyCmd` / `PlanRequirements` / `AutoplanEnabled` / `AutoplanWhenModified` / `EscapedCommentArgs` などを持つ大型構造体。`server/events/command/project_context.go:24`。`EscapedCommentArgs` のコメントに `sh -c "terraform plan $(touch bad)"` を防ぐためエスケープすると明記あり (`:57-61`)、コメント引数をシェルに渡す設計上のリスク対策が見える。
- `models.ProjectLock` : ロックの実体。Project / Pull / User / Workspace / Time。`server/events/models/models.go:271`。
- `models.Project` : Terraform プロジェクトの同定子。`ProjectName` / `RepoFullName` / `Path` (repo ルート相対、`.` はルート)。`server/events/models/models.go:290`。`Path` を boltdb 互換のため `RepoRelDir` にリネームできないという TODO コメントが歴史的負債として残る (`:298-301`)。
- `valid.Workflow` / `valid.Step` : カスタムワークフロー定義。`Workflow` は Apply/Plan/PolicyCheck/Import/StateRm の `Stage`。`Step` は `StepName` + `ExtraArgs` + `RunCommand` + `RunShell` 等。`server/core/config/valid/repo_cfg.go:252` / `:231`。

非自明な設計選択:

- 二重ロック。`doPlan` はまず DB に永続化される Atlantis のプロジェクトロック (`Locker.TryLock`、`project_command_runner.go:668`) を取り、同一 repo/dir/workspace への同時 plan/apply を PR をまたいで直列化する。その上で別途プロセス内の `WorkingDirLocker.TryLock` (`:678`) で「同じ作業ディレクトリ」への並行操作を防ぐ。さらに `runSteps` 内で `GitReadLock` を張り (`:906`)、ステップ実行中に clone/reset/merge が走らないようにする。永続ロック (PR 間の論理排他) と プロセス内ロック (ファイルシステム競合の排他) を別レイヤで持つのがポイント。
- ロックキーは `{repoFullName}/{path}/{workspace}/{projectName}` で、正規表現 `keyRegex` で逆パースする。`server/core/locking/locking.go:49-50`。
- `RunCommentCommand` を webhook ハンドラから goroutine で投げる非同期実行 (`events_controller.go:742`)。HTTP は即 200 を返し、結果は PR コメントで非同期に返す。drainer (`command_runner.go:293,299`) で graceful shutdown 時に新規実行をはじく。

## 採用事例の素材

ADOPTERS.md (`src/ADOPTERS.md`) に記載がある組織のみ:

- Lambda (`lambda.ai`, contact @genpage) : 内部プラットフォームのセルフサービス基盤のオーケストレーション。
- Rapid7 (`rapid7.com`, @snorlaX-sleeps) : k8s 上の per-project Atlantis でチームの Terraform デプロイを統括。
- CloudScript (`cloudscript.com.br`, @xcloudscript) : マルチクラウド k8s プラットフォームの標準化。
- Vend (`vend.com`, @kasperbrandenburg) : 複数クラウドにまたがる複数チームのインフラ運用。

過去の Hootsuite 社内実績 (出典: [Introducing Atlantis](https://medium.com/runatlantis/introducing-atlantis-6570d6de7281)): 78 contributors / 144 Terraform repos / 全 Terraform 変更で利用、と記載 (歴史的数値)。

GitHub シグナル (gh repo view, 2026-06-26 取得): stars 9,155 / forks 1,285。OpenSSF Best Practices 登録あり (badge #9428, README)。メンテナは `MAINTAINERS.md` に Dylan Page (Lambda)、PePe/José Amengual (Slalom)、Rui Chen (Meetup) ほか Core Contributor が記載。

## 代替・エコシステム

- Terragrunt : 競合ではなく併用が一般的。Atlantis のカスタム Docker イメージ + `run` ステップで Terragrunt を呼び出す。出典: [Scalr: Terraform & Terragrunt with Atlantis](https://scalr.com/learning-center/the-ultimate-guide-to-terraform-atlantis-with-terragrunt)。
- Spacelift : 商用 TACOS (Terraform Automation and Collaboration Software)。OPA ポリシー多段適用、private module registry、drift detection、Stack 依存などを内蔵。Atlantis は PR 自動化に特化、これらは自前で組む必要。出典: [Spacelift: Atlantis alternatives](https://spacelift.io/blog/atlantis-alternatives)。
- env0 : SaaS 中心の TACOS。TTL 付き ephemeral environment が特徴。出典: [env0 alternatives/atlantis](https://www.env0.com/alternatives/atlantis-alternative)。
- Digger (OpenTaco) : OSS、既存 CI (GitHub Actions / GitLab CI) 内で Terraform/OpenTofu を実行しシークレットを CI に留める。2025-11 に OpenTaco へリブランド。出典: [Digger whyopentaco](https://digger.dev/whyopentaco)。
- HashiCorp Terraform Cloud / HCP Terraform, Scalr : マネージド state + 実行。Atlantis は state を持たずユーザ backend に委ねる点が差。
- 統合先: GitHub / GitLab / Gitea (Forgejo 含む) / Bitbucket Cloud+Server / Azure DevOps を VCS として、terraform と OpenTofu (`terraform_distribution: opentofu`) をエンジンとして、Conftest/OPA Rego を `policy_check` ステップで、Infracost をコスト見積もりで組み合わせ可能。出典: README と [Scalr: Atlantis + OpenTofu](https://scalr.com/learning-center/atlantis-and-opentofu-building-the-future-of-open-source-infrastructure-automation/)。

## getting-started メモ (write 段階用)

- Docker で素早く試すなら公式イメージ `ghcr.io/runatlantis/atlantis`。ローカルバイナリは `make build-service` で `./atlantis` 生成、`./atlantis server --help` でフラグ確認。
- お試し用に `atlantis testdrive` サブコマンドあり (`main.go:50`、`testdrive/` ディレクトリ)。ngrok でローカルを公開し GitHub webhook を張る対話フロー。
- 最小構成: `--gh-user` / `--gh-token` / `--gh-webhook-secret` / `--repo-allowlist` / `--atlantis-url`。VCS 側に webhook (PR open, comment) を設定。
