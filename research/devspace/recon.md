# recon: DevSpace

調査メモ。自分用の密度。出典は sources.md に URL 付きで対応番号 (S1) 形式で残す。`file:line` は pin commit で確認済み。

## 基本情報

- repo: `devspace-sh/devspace` (git remote が canonical。go.mod の module path は歴史的経緯で `github.com/loft-sh/devspace` のまま残っている) (S1)
- pinned commit: `8ff6260787edacfa2c0d30d1ff62358d36d482bc` / 近いタグ: `v6.4.0-rc.1` (`git describe` = `v6.4.0-rc.1-12-g8ff62607`、タグから 12 コミット先) (S1)
- 言語 / ビルド: Go (`go 1.25.0`, go.mod)。ビルドは `go build`、`hack/` にスクリプト、e2e は `e2e/`。vendored (`vendor/` あり)。
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認) (S1)
- CNCF 成熟度: **Sandbox** (2022-12-13 accept) (S2)(S3)
- カテゴリ (tools.ts CATEGORY_ORDER から): **Developer Tools**
- 一言: クライアントオンリーの CLI。ローカルのコードを Kubernetes 上の Pod に双方向同期し、ホットリロードで「クラスタの中で直接開発」させる開発者ツール。クラスタ側に常駐コンポーネントを入れない (kube-context をそのまま使う、kubectl/helm と同じ流儀)。(S1)(S13)

規模: `vendor/` を除いた Go ファイルは 532 (`find` で計測、pin commit)。中核は `pkg/devspace/` 配下 28 サブパッケージ + `helper/` (コンテナ内で動くサイドバイナリ)。

## 歴史の素材

- 開発元は **Loft Labs** (2019 設立の Kubernetes 開発者ツール企業。vcluster の作者でもある)。DevSpace 自体はそれ以前から存在。GitHub リポジトリ作成は **2018-08-17** (`gh repo view` createdAt)。(S1)(S3)
- 最初の公開リリースは **v1.0.2 (2018-09-17)** (GitHub Releases を日付昇順で確認)。以降 pin 時点まで 312 リリース。(S1)
- 当初のコンセプトから一貫して「Kubernetes 上で直接開発する」ツール。README の売り: declarative な `devspace.yaml` に build/deploy/dev ワークフローを 1 ファイルで宣言し、チームで git 共有。双方向ファイル同期でイメージ再ビルドやコンテナ再起動なしにホットリロード。(S1)
- **v6 (2022) が最大のリライト**。「Pipelines」概念を導入し、config を `v2beta1` に更新。それ以前は dev/build/deploy/purge のパイプラインがハードコードで、hook で無理やり調整していたのを、POSIX シェルスクリプト + 組み込みコマンド (`build_images`, `create_deployments`, `start_dev` 等) で完全に上書き可能にした。同時に imports (別 `devspace.yaml` の取り込み) と SSH server 注入も追加。(S4)(S5)
- **CNCF Sandbox 寄贈: 2022-12-13** (TOC 投票日)。Loft Labs が寄贈。co-founder/CEO Lukas Gentele いわく「主要コントリビュータであり続けつつ、ガバナンスを Linux Foundation / コミュニティに移す」。寄贈当時「K8s 向け開発者ツールは 50 以上あるが CNCF Sandbox にあったのは 1 つだけ」という文脈。(S2)(S6)(S7)
- Go module path が `github.com/loft-sh/devspace` のまま (寄贈後も) なのは import path 破壊を避けるため。GitHub org は `loft-sh` → `devspace-sh` へ移った (remote が示す)。

## アーキテクチャの素材

トップレベル構成:

- `cmd/` — cobra の CLI コマンド (`dev.go`, `deploy.go`, `build.go`, `sync.go`, `enter.go`, `run_pipeline.go` ...)。root は `cmd/root.go`。
- `pkg/devspace/` — 本体ロジック。主要サブパッケージ: `pipeline/` (実行エンジン), `devpod/` (dev 用 Pod のライフサイクル), `sync/` (双方向同期エンジン), `services/` (sync/portforwarding/podreplace/inject/terminal/ssh 等の個別サービス), `build/` (image build: docker/buildkit/kaniko/custom), `deploy/` (helm/kubectl manifests), `config/` (スキーマ・ローダ・バージョン変換), `dependency/` (依存プロジェクト), `hook/`, `plugin/`。
- `helper/` — **コンテナ内に注入されて動くサイドバイナリ** (`devspacehelper`)。sync のサーバ側 (`helper/server/upstream.go`, `helper/server/downstream.go`)、SSH server、tunnel、restart helper を持つ。CLI 本体とは別 main (`helper/main.go`)。
- `pkg/util/` — factory, log, kubectl exec ラッパ等の横断ユーティリティ。
- `ui/` — 旧 localhost UI 資産。`e2e/`, `examples/`, `docs/`。

### 代表オペレーションのエンドツーエンド: `devspace dev`

1. `cmd/dev.go:11` `NewDevCmd` — `RunPipelineCmd{Pipeline: "dev", SkipPushLocalKubernetes: true}` を作る。dev は独立コマンドではなく **pipeline 起動のラッパ**。
2. `cmd/run_pipeline.go:199` `RunPipelineCmd.Run` — config をロードし、名前付き pipeline を解決 (未定義なら default を使う)。
3. default の `dev` pipeline は **POSIX シェルスクリプト** (`pkg/devspace/pipeline/types/default.go:31-38`):

   ```text
   run_dependencies --all
   ensure_pull_secrets --all
   build_images --all
   create_deployments --all
   start_dev --all
   ```

4. このスクリプトは `mvdan.cc/sh/v3` の組み込みシェルインタプリタで実行される (`pkg/devspace/pipeline/engine/engine.go:9-11` で `expand`/`interp`/`syntax` を import、`engine.go:33` `ExecutePipelineShellCommand`)。`build_images` / `create_deployments` / `start_dev` 等は普通のコマンドではなく、カスタム ExecHandler に登録された **DevSpace 組み込みコマンド** (`pkg/devspace/pipeline/engine/pipelinehandler/handler.go:45,48,55`)。これが DevSpace の設計の肝: パイプラインは「シェルスクリプト + 特権コマンド」であり、ユーザーが `devspace.yaml` で丸ごと差し替えられる。
5. `start_dev` → `pkg/devspace/pipeline/engine/pipelinehandler/commands/start_dev.go:26` `StartDev` → 引数 (dev config 名) を解決し、末尾 `start_dev.go:85` `pipeline.DevPodManager().StartMultiple(ctx, args, opts)`。
6. `pkg/devspace/devpod/devpod.go:74` `devPod.Start` → `:123` `startWithRetry` → `:221` `start`。start は必要なら **Pod 置換** (下記) を行い、対象コンテナを選択し、`:319`/`:501` `startServices` を呼ぶ。
7. `startServices` (`devpod.go:501`) は tomb (goroutine 群) で **sync と port-forwarding を並行起動**。`:515` `sync.StartSync(ctx, devPod, selector, parent)`、`:526` `portforwarding.StartPortForwarding`。前後で `dev.beforeSync` / `dev.afterSync` 等の hook を発火。
8. `pkg/devspace/services/sync/sync.go:64` `StartSync` → controller 経由で `pkg/devspace/services/sync/controller.go:270` `startSync` → `:462` `sync.NewSync`。同期開始前に `controller.go:402` `inject.InjectDevSpaceHelper` で `devspacehelper` バイナリをコンテナの `/tmp/devspacehelper` に注入 (`pkg/devspace/services/inject/inject.go:40,43,49`)。
9. controller は `kubectl exec` のストリームを 2 本張る: upstream = `[/tmp/devspacehelper sync upstream <path...>]` (`controller.go:468`)、downstream = `[/tmp/devspacehelper sync downstream ...]` (`controller.go:513`)。それぞれ `io.Pipe` で stdin/stdout を作り (`controller.go:497-498`)、`StartStream` で exec に流し込み、`syncClient.InitUpstream(...)` / `InitDownstream(...)` に配線 (`controller.go:501-507`)。
10. sync エンジン `pkg/devspace/sync/sync.go:166` `Start` → `:209` `mainLoop`: `:232` `startUpstream` は `github.com/loft-sh/notify` の再帰 watch tree でローカル FS を監視 (`sync.go:234` `notify.NewTree()`, `:241` `tree.Watch`)、`:268` `startDownstream` はコンテナ側の変更を取得、`:277` `initialSync` で初回突き合わせ。以降、ローカル編集 → upstream が tar/gzip でコンテナへ、コンテナ側変更 → downstream がローカルへ、を継続。

これで「ローカルで編集 → 走っているコンテナに即反映」のホットリロードが成立する。イメージ再ビルド・再デプロイは介さない。

### 設計判断のポイント

- **クライアントオンリー / クラスタ非常駐**: kube-context をそのまま使い、operator や CRD を入れない。sync のコンテナ側は「その場で注入する使い捨てバイナリ」で常駐しない。(S1)(S13)
- **パイプライン = 差し替え可能なシェルスクリプト**: v6 で「宣言的だがハードコード」から「POSIX スクリプト + 特権コマンド」へ。柔軟性のために hook 地獄を捨てた設計転換。(S4)(S5)
- **Pod 置換方式でホットリロード**: sidecar を足すのではなく対象 Deployment をスケールダウンし、dev 用に改変した Pod (image 差し替え・コマンド上書き・PVC 永続化) を立て、そこへ同期する (`pkg/devspace/services/podreplace/replace.go`)。

## 内部実装の素材

### 重要ディレクトリ

- `pkg/devspace/pipeline/` — 実行エンジン。`engine/` が `mvdan.cc/sh` ラッパ、`engine/pipelinehandler/commands/` に組み込みコマンド実体 (`build_images.go`, `create_deployments.go`, `start_dev.go`, `stop_dev.go`, `run_pipelines.go` ...)、`engine/basichandler/commands/` に汎用の `cat`/`is_equal`/`run_watch`/`xargs` 等。`types/default.go` に 4 つの default pipeline 文字列。
- `pkg/devspace/sync/` — 同期エンジン本体 (下記)。
- `pkg/devspace/services/` — sync/inject/podreplace/portforwarding/ssh/terminal/attach/logs の各サービス。
- `pkg/devspace/config/versions/` — スキーマの世代管理。`v1beta1` 〜 `v1beta11` + `latest` (= `v2beta1`)。旧 config はメモリ内で latest に自動アップグレードされる。
- `helper/` — コンテナ内エージェント。`helper/remote/` に gRPC 定義。

### 中核データ構造・コードパス (sync を深掘り)

- `Sync` 構造体 (`pkg/devspace/sync/sync.go:68,77-78`): `tree notify.Tree` (ローカル watch)、`upstream *upstream`、`downstream *downstream`。`NewSync` (`sync.go:90`) が ignore parser 等を組む。sync log 自体を watch 対象から除外して無限ループを防ぐ (`sync.go:112` のコメント)。
- **upstream (ローカル→コンテナ)** `pkg/devspace/sync/upstream.go`: `newUpstream(reader, writer, sync)` (`upstream.go:71`)。`mainLoop` (`:201`) が `startEventsLoop` (`:157`) で notify イベントを収集し、デバウンスタイマ (`:235`) でまとめてから、変更ファイルを **`archive/tar` + `compress/gzip`** ストリームにして writer (= exec stdin) へ送る (`upstream.go:4,6` の import)。アップロード後に `execCommandsAfterApply` / `RestartContainer` (`:303,331`) で任意の再起動コマンドや `restart.TouchPath` タッチ (`:295-298`) を実行。
- **downstream (コンテナ→ローカル)** `pkg/devspace/sync/downstream.go`: `newDownstream` (`:39`)。コンテナ側 helper と **gRPC** で会話する (`d.client.Changes` / `d.client.ChangesCount`、`downstream.go:98-115,178`)。`mainLoop` (`:158`) はまず `ChangesCount` をポーリングし、変更が溜まった/一定時間経過/25000 件超で `collectChanges` → `applyChanges` (`:190-198`)。gRPC の proto は `helper/remote/remote.proto` (+ 生成物 `remote.pb.go`, `remote_grpc.pb.go`)。
- つまり **同期プロトコルは非対称**: 上りは tar/gzip の生ストリーム、下りは exec のパイプ上に張った gRPC。両方向とも `kubectl exec` の stdin/stdout 1 本の上を通す。

### Pod 置換 (podreplace)

- `pkg/devspace/services/podreplace/replace.go:52` `ReplacePod`。`:129` `updateNeeded` で再作成要否を判定し、`:361` `scaleDownTarget` で元の Deployment/StatefulSet を 0 にスケール、`:209` `replace` で dev 用に改変した Pod を作る。`persist.go:19` `persistPaths` は同期先を PVC で永続化するオプション、`replace.go:236,299` で PVC を作成/更新。`builder.go` が dev container spec を組む。

### 非自明な選択 (コードから見えたもの)

- **notify ライブラリを自前フォーク**: `github.com/loft-sh/notify` を import (`sync.go:17`)。上流 `rjeczalik/notify` をフォークして再帰 watch 等を調整している。ファイル同期の性能・移植性がプロダクトの肝なので watch レイヤを掌握している。
- **シェルインタプリタを内蔵**: 外部シェルに依存せず `mvdan.cc/sh/v3` を組み込むことで、Windows 含め同じ POSIX パイプラインが動く。組み込みコマンドは shell の ExecHandler に横入りして実装 (`pipelinehandler/handler.go:121-135` `ExecHandler`)。
- **config 世代が 12 世代**: `v1beta1`..`v1beta11` + `v2beta1`。後方互換をメモリ内アップグレードで吸収 (`devspace print` で変換後を確認できる)。長寿命 CLI の設定進化がそのまま残っている。(S4)
- **module path と repo org のズレ**: `github.com/loft-sh/devspace` を維持しつつ repo は `devspace-sh/devspace`。import 破壊回避の実務判断。

## 採用事例の素材 (出典必須・捏造禁止)

- **ADOPTERS ファイルは存在しない** (`find` で確認)。CNCF プロジェクトページも named adopter を列挙していない。(S1)(S8)
- 実務者の利用記録として個人技術ブログ (Ugur Elveren) が「大規模チームでの K8s 開発環境として KIND + DevSpace + DevContainers」を推奨・解説している。組織名の採用事例ではない点に注意。(S12)
- → **組織の採用事例は現状 citable なものが薄い**。write 前に second pass が要る (KubeCon 登壇や CNCF ケーススタディを探す価値あり)。

### GitHub / DevStats シグナル (観測日 2026-07-08)

- Stars: **5,080** / Forks: **412** (`gh repo view devspace-sh/devspace`)。(S1)
- Contributors: 約 **124** (`gh api repos/.../contributors?per_page=1&anon=1` の last page = 124)。(S1)
- Releases: **312** (pin 時点、`gh api --paginate`)。最新は `v6.4.0-rc.1` (2026-04-30)。GitHub repo 作成 2018-08-17。(S1)
- CNCF プロジェクトページ (DevStats 由来、観測 2026-07-08) は all-time で contributors 647 / contributing organizations 207 と表示 (前年比 +9% / +11%)。数字の定義が `gh` の contributor 数と異なる点は注記が要る。(S8)
- OpenSSF Best Practices バッジ project #6945 (README のバッジ)。(S1)

## 代替・エコシステム

同カテゴリ (Kubernetes 向け inner-loop 開発ツール):

- **Skaffold** (Google, 非 CNCF): build/deploy/dev のワークフローを宣言 config で回す。file-sync と continuous dev モードを持つ。DevSpace と最も直接の競合。差: Skaffold は build/deploy パイプラインの標準化寄り、DevSpace は「クラスタ内で開発 (Pod 置換 + 双方向同期 + terminal/SSH)」に踏み込む。(S9)
- **Tilt** (非 CNCF): Starlark (`Tiltfile`) でマルチサービスの dev ループを記述し、ライブアップデートと UI に強い。DevSpace はシェルパイプライン + `devspace.yaml`。(S10)
- **Garden** (非 CNCF): テスト/デプロイを含むスタック graph 指向。DevSpace より CI/テスト統合寄り。(S11)
- **Okteto** (非 CNCF、同名の Okteto CLI/Platform): 開発コンテナへコードを同期して「クラスタ内開発」する点が DevSpace に近い直接競合。Okteto はマネージド Platform を持つ。(S9)

エコシステム・統合: build backend として Docker / BuildKit / kaniko / custom を選べる (`pkg/devspace/build/builder/`)。deploy backend は Helm / kubectl manifests / kustomize。開発元 Loft Labs は vcluster (仮想クラスタ) を持ち、DevSpace と組み合わせた「開発者ごとの隔離環境」ユースケースを訴求。(S1)(S3)
