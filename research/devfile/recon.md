# recon: devfile

調査メモ。自分用の密度。出典は `sources.md` に URL。AI 臭い水増しはしない。

## 基本情報

- repo: devfile/api (正規リポジトリ。`devfile/devfile` は存在しない。spec + Go ライブラリの本体がここ)
- pinned commit: `368ea4e93a4c9b772240eefc80b2ac24e42c5ee2` / 近いタグ: `v2.3.0` (`git describe` = `v2.3.0-17-g368ea4e`)
- 言語 / ビルド: Go (go 1.24) / `bash ./docker-run.sh ./build.sh` でコード生成、`go test -v` でテスト
- ライセンス: Apache-2.0
- CNCF 成熟度: Sandbox (2022-01-11 受理)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Developer Tools

補足: devfile はプロジェクト全体としては複数リポジトリの集合 (`devfile` org)。`api` が API/spec の中核で、
関連に `library` (パーサ), `registry` / `registry-support` (スタックのレジストリ), `devworkspace-operator`
(DevWorkspace CRD を実行する OpenShift/Kubernetes オペレータ), `alizer` (言語検出) がある。内部読解は `api` を対象にする。

### devfile とは何か

devfile はクラウド開発ワークスペースを YAML で宣言する「開発環境 as code」の標準。開発者が使うツール群・
コンテナ・ソース取得元・コマンド (build/run/debug) を 1 つの `devfile.yaml` に書き、対応ツール
(Eclipse Che / OpenShift Dev Spaces / odo / Amazon CodeCatalyst 等) がそれを解釈して再現可能な
開発環境を立ち上げる。`api` リポジトリはこの仕様そのものを Go の型として定義し、そこから CRD・JSON schema・
TypeScript モデルを機械生成する。README 冒頭が明言している通り、真実の源は
`pkg/apis/workspaces/v1alpha2/devworkspace_types.go` の Go コードで、他の成果物はそこから生成される。

## 歴史の素材

- 2019-12-05: `devfile/api` リポジトリ作成 (GitHub API `created_at`)。当初は Red Hat / Eclipse Che 陣営が
  `DevWorkspace` Kubernetes API を定義する場として発足。
- devfile フォーマット自体はこれ以前、Eclipse Che の workspace 定義 (devfile 1.0) が起源。2.0 で Kubernetes-native な
  `DevWorkspace` API と一体化して再設計された (README「Devfile 2.0.0 file format」節が DevWorkspace API のサブセット =
  devfile 2.0 と説明)。
- 2021-01-18: `v2.0.0` リリース (GitHub Releases)。以降 `v2.1.0` (2021-05), `v2.2.0` (2022-10),
  `v2.2.1` (2023-10), `v2.2.2` (2023-11), `v2.3.0` (2024-06)。
- 2022-01-11: CNCF Sandbox として受理 (cncf.io プロジェクトページ)。
- 現行 pinned commit (2025-09-09) 時点で JSON schema バージョンは 2.3.0、Kubernetes API バージョンは v1alpha2
  (`schemas/latest/jsonSchemaVersion.txt`, `schemas/latest/k8sApiVersion.txt`)。

主要マイルストーンの日付出典はすべて `sources.md` 参照。

## アーキテクチャの素材

`api` リポジトリの本質は「Go 型を単一の真実として、複数の成果物を marker (コメントアノテーション) 駆動で生成する」
コード生成パイプライン + ランタイムライブラリ (パーサではなく、override/merge/validation ユーティリティ) の 2 層。

### トップレベルのコンポーネント

- `pkg/apis/workspaces/v1alpha2/` — API 型の定義本体。`DevWorkspace` CRD、`DevWorkspaceTemplate` CRD、
  devfile 2.x フォーマットの構造がすべてここの Go struct。`v1alpha1` は旧版で `*_conversion.go` により変換される。
- `pkg/apis/workspaces/v1alpha2/zz_generated.*.go` — 生成コード (deepcopy, getters, union/keyed 定義,
  parent/plugin overrides の型)。8 ファイル。手書きしない。
- `generator/` — controller-tools ベースの独自コードジェネレータ群。`main.go` が cobra CLI で、
  `overrides` / `interfaces` / `crds` / `deepcopy` / `schemas` / `validate` / `getters` の 7 ジェネレータを登録
  (`generator/main.go:46-54`)。marker (`+devfile:jsonschema:generate` 等) を読んで成果物を吐く。
- `pkg/utils/overriding/` — parent devfile / plugin の override と merge を行うランタイムライブラリ。
- `pkg/utils/unions/` — union 型 (discriminated union) の normalize/simplify。
- `pkg/validation/` — devfile 内容の意味検証 (command/component/project/endpoint の参照整合や重複)。
- `pkg/attributes/` — 自由形式 YAML 属性 (`map[string]apiext.JSON`) と変数展開のヘルパ。
- `schemas/` `crds/` `samples/` — 生成された JSON schema / CRD YAML / サンプル devfile。
- `build/typescript-model/` — kubernetes-client/gen で JSON schema から `@devfile/api` npm パッケージを生成。

### 中核データ構造

- `DevWorkspace` (`pkg/apis/workspaces/v1alpha2/devworkspace_types.go:90-101`) — CRD のトップ型。
  `Spec.Template` が `DevWorkspaceTemplateSpec`。
- `DevWorkspaceTemplateSpec` (`devworkspacetemplate_spec.go:22-27`) — `Parent *Parent` +
  インライン `DevWorkspaceTemplateSpecContent`。この Content が devfile 2.x の本体。
- `DevWorkspaceTemplateSpecContent` (`devworkspacetemplate_spec.go:30-107`) — Variables / Attributes /
  Components / Projects / StarterProjects / DependentProjects / Commands / Events を持つ。
  各フィールドの marker が挙動を決める: `+devfile:toplevellist` (マージ対象のトップレベルリスト),
  `+patchMergeKey=name|id` (strategic merge の突合キー), `+devfile:overrides:include:...`
  (parent/plugin override 型に含めるか、plugin では省くか)。
- `Component` / `ComponentUnion` (`components.go:45-78`) — Container/Kubernetes/Openshift/Volume/Image/Plugin/Custom
  の discriminated union。`componentType` が discriminator。

### 代表操作: parent/plugin の override 適用を端から端まで

devfile は他 devfile を `parent` として継承したり `plugin` を取り込んだりでき、そのとき override を strategic
merge patch で適用する。この経路が `api` のランタイムライブラリで最も面白い。

1. 入口: `OverrideDevWorkspaceTemplateSpecBytes(originalBytes, patchBytes)`
   (`pkg/utils/overriding/overriding.go:40`)。YAML を JSON 化し、original を
   `DevWorkspaceTemplateSpecContent`、patch を `ParentOverrides` (生成型) にアンマーシャル
   (`overriding.go:41-61`)。
2. 本体: `OverrideDevWorkspaceTemplateSpec(original, patch)` (`overriding.go:75`)。
   - `ensureOnlyExistingElementsAreOverridden` (`overriding.go:133`) で「override は既存要素にしか当たらない」を検証。
     新規キーを override 側に足すのは不正。
   - `unions.Normalize(&original)` / `unions.Normalize(&patch)` (`overriding.go:79-84`) で union の
     discriminator を確定させ、曖昧な union はエラーに。
   - original/patch を JSON にマーシャルし直し、`strategicpatch.NewPatchMetaFromStruct(original)` で
     struct タグから patch メタ (merge key など) を構築 (`overriding.go:100-103`)。
   - `strategicpatch.StrategicMergeMapPatchUsingLookupPatchMeta` で Kubernetes の strategic merge patch を実行
     (`overriding.go:105-108`)。ここが肝: devfile は独自マージを実装せず k8s の SMP 機構を再利用している。
   - 結果を再び `DevWorkspaceTemplateSpecContent` にアンマーシャルし `unions.Simplify` で discriminator を落として返す
     (`overriding.go:110-129`)。
3. 継承チェーンを平坦化した後、`MergeDevWorkspaceTemplateSpec(main, parentFlattened, plugins...)`
   (`pkg/utils/overriding/merging.go:40`) が main + parent + plugin をまとめる。トップレベルリストは reflect で
   フィールド名から動的に取得して連結し (`merging.go:73-108`)、main 側の `plugin` component は結果から除外する
   (`merging.go:96-99`。plugin は既に平坦化済みとして渡ってくる前提)。重複キーは
   `ensureNoConflictWithParent` / `ensureNoConflictsWithPlugins` で弾く (`merging.go:53-68`)。

### 実在する設計判断

- 「Go 型が単一の真実、他は生成物」。README 冒頭と `generator/main.go` の 7 ジェネレータ構成がそれを体現。
  CRD・JSON schema・TS モデル・deepcopy・getters・overrides 型・validation schema がすべて同じ Go 型から出る。
- override マージを自前実装せず Kubernetes strategic merge patch に委譲 (`overriding.go:105`)。
  `+patchStrategy=merge` / `+patchMergeKey` marker が struct タグとして残り、SMP がそれを読む。
- discriminated union を Kubernetes の KEP (union types) に沿って実装 (`union.go:22-36` がその KEP を参照)。
  normalize (単一値→discriminator 補完 / discriminator に合わない値の除去) と simplify (discriminator 除去) の
  2 操作を `reflectwalk` でツリー全体に適用 (`pkg/utils/unions/normalize.go`)。
- override 型 (`ParentOverrides` / `PluginOverrides`) を手書きせず生成し、`omitInPlugin` marker で
  plugin では上書き不可なフィールド (variables/projects 等) を型レベルで除外
  (`devworkspacetemplate_spec.go` の各 `+devfile:overrides:include:omitInPlugin=true`)。

## 内部実装の素材

### 効くディレクトリ

- `pkg/apis/workspaces/v1alpha2/` — 手書き型 + 生成型。手書きは約 30 ファイル、生成は `zz_generated.*` 8 ファイル。
- `generator/*/gen.go` — 各ジェネレータの実装 (`overrides`, `schemas`, `crds`, `validate`, `getters`,
  `interfaces`)。`generator/genutils/` に marker 定義や JSON schema 後編集 (`json_schema_edit.go`)、
  patch strategy 抽出 (`patch_strategy.go`) 等の共通処理。
- `pkg/utils/overriding/` — override/merge の中核 (上でトレースした経路)。
- `pkg/utils/unions/normalize.go` — union の normalize/simplify を `reflectwalk.Struct` フックで木全体に適用。

### 中核データ構造 (もう一段)

- `Union` interface (`pkg/apis/workspaces/v1alpha2/union.go:24-36`): `discriminator() *string`, `Normalize()`,
  `Simplify()`。各 union 型 (ComponentUnion 等) の具体実装は `zz_generated.union_definitions.go` と
  `union_implementation.go`。
- `Attributes` (`pkg/attributes/attributes.go:30`): `map[string]apiext.JSON`。CRD 側では
  `+kubebuilder:pruning:PreserveUnknownFields` + `Schemaless` で自由形式を許す
  (`devworkspacetemplate_spec.go` の Attributes フィールド marker)。
- getter 群 (`zz_generated.getters.go`): bool ポインタ等の optional フィールドに対し、`devfile:default:value`
  marker で宣言したデフォルトを返す `GetXxx()` を生成 (例 `GetDedicatedPod`, `GetAutoBuild`)。
  未設定 (nil) とデフォルトの区別を型で保ちつつ、利用側にはデフォルト適用済みの値を渡す狙い。

### 追う価値のあるパス (再掲・要点)

override の入口 `overriding.go:40` → 検証 `overriding.go:133` → union normalize `overriding.go:79` →
k8s SMP `overriding.go:105` → simplify `overriding.go:127`。自前ロジックは「既存要素チェック」と
「union の正規化」だけで、マージ本体は k8s に丸投げというのが読みどころ。

### 驚き / 非自明な点

- パーサ (YAML→構造体 + 継承解決 + レジストリ取得) の本体は `api` ではなく別リポジトリ `devfile/library`。
  `api` が提供するのは型と override/merge/validation の部品まで。deep-dive で「devfile を読む」流れを描くときは
  この境界に注意。
- `generator/` は自身が `go.mod` / `vendor/` を分離した独立モジュール (別ディレクトリで vendored)。
  controller-tools を拡張した独自ジェネレータで、CRD 生成は controller-gen そのままではない。
- `v1alpha1` → `v1alpha2` の変換コード (`*_conversion.go`) が手書きで存在し、CRD には両ストレージ版が出る
  (`crds/` に `.v1beta1.yaml` と通常版)。

## 採用事例の素材 (出典必須・捏造禁止)

named adopter (いずれも出典あり):

- Amazon CodeCatalyst Dev Environments — devfile で Dev Environment を構成 (AWS 公式ドキュメント)。
  注: CodeCatalyst は新規受付を終了しているが既存利用は継続 (同ドキュメント/AWS 告知)。
- Red Hat OpenShift Dev Spaces / Eclipse Che — 開発環境を devfile フォーマットで as-code 定義
  (Red Hat Developer 製品ページ)。DevWorkspace オペレータ (`devfile/devworkspace-operator`) が Che の基盤。
- odo (Red Hat の CLI) — devfile 駆動の開発ツール。devfile 2.2.0 相当をサポート (devfile.io ドキュメント)。
- JetBrains Space Cloud Dev — Git リポジトリに紐づくリモート開発環境を devfile 仕様でセットアップ
  (devfile.io ドキュメント)。

企業コントリビュータ (devfile.io トップ「Contributors」に掲載): AWS, IBM, JetBrains, Red Hat。
MAINTAINERS.md の所属も Red Hat と AWS (`MAINTAINERS.md`)。

GitHub シグナル (`gh api repos/devfile/api`, 観測日 2026-07-08):

- stars: 340 / forks: 77 / open issues: 26
- contributors: 30 (`gh api --paginate repos/devfile/api/contributors` で login 数え上げ)
- CNCF プロジェクトページ表記では contributing org 46 (前年比 -30%、2026-07-08 観測)

注: star 数は控えめ。devfile は「単一リポの人気」より「複数の商用 IDE/クラウドが実装する仕様」という性格で、
採用の重心は spec 実装側 (Che/Dev Spaces/CodeCatalyst/odo) にある。deep-dive の adoption はこの構図で書く。

## 代替・エコシステム

- エコシステム (同 org): `library` (Go パーサ), `registry` + `registry-support` + `registry-viewer`
  (devfile スタック/サンプルの公開レジストリ), `devworkspace-operator` (DevWorkspace を Kubernetes で実行),
  `alizer` (ソースから言語/フレームワークを検出して devfile を提案), `@devfile/api` (npm の TS モデル)。
- 実在する代替 (開発環境 as code):
  - Development Containers (devcontainer.json, Microsoft) — VS Code / GitHub Codespaces が使う事実上の標準。
    devfile と同じ「コンテナで開発環境を宣言」だが、Kubernetes-native な CRD ではなく VS Code 中心。
  - Gitpod の `.gitpod.yml` — Gitpod 独自のワークスペース定義。
  - DevPod (Loft) — devcontainer.json をベースにプロバイダ非依存で環境を立てる。
  - Nix / devbox / flox — 宣言的開発環境だが層が違う (パッケージ/シェル環境の再現。IDE ワークスペースの
    オーケストレーションではない)。
  差の本質: devfile は Kubernetes CRD (`DevWorkspace`) と一体で、クラウド IDE 側 (Che/Dev Spaces/CodeCatalyst)
  がサーバ上で環境を起動する「リモート開発ワークスペース」志向。devcontainer はローカル/Codespaces 中心の
  コンテナ定義。両者は競合しつつ領域が重なる。

## 分類の根拠

- category: Developer Tools。devfile は開発ワークスペースを宣言する開発者向け標準で、GitOps/デプロイ定義ではない。
  App Definition & GitOps とも取れるが、対象は「アプリのデプロイ」ではなく「開発環境の再現」なので Developer Tools が適切。
- maturity: Sandbox (CNCF, 2022-01-11 受理。cncf.io プロジェクトページ)。
