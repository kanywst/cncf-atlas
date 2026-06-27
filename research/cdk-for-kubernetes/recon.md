# recon: cdk8s (CDK for Kubernetes)

調査メモ。出典は各所に URL を付ける。path:line は `research/cdk-for-kubernetes/src/` の clone を実際に開いて確認済み。

## 基本情報

- repo: `cdk8s-team/cdk8s-core` ([GitHub](https://github.com/cdk8s-team/cdk8s-core))
- pinned commit: `558f788bc27873892bce99c7def33106861a2324` (2026-06-25)。shallow clone のためタグ無し。直近リリースは `v2.70.80` (2026-06-23 公開、GitHub Releases API)
- npm パッケージ名: `cdk8s` (package.json の `name` は `cdk8s`)。リポジトリ名は `cdk8s-core` だが配布物は `cdk8s` という歴史的経緯
- 言語 / ビルド: TypeScript / projen + jsii。`npm run build` は `projen build`。jsii (JavaScript Interop Interface) で TS を npm / PyPI / Maven Central / NuGet / Go へ多言語パッケージ化 (package.json の `jsii: 5.8.x`, `package:python|java|dotnet|go`)
- main entrypoint: `lib/index.js` (package.json `main`)。型は `lib/index.d.ts`。ソースは `src/index.ts` が全モジュールを re-export (src/index.ts:1-16)
- ランタイム依存: `constructs ^10` (peerDependency), `yaml 2.9.0`, `fast-json-patch ^3.1.1`, `follow-redirects ^1.16.0` (いずれも bundledDependencies)
- ライセンス: Apache-2.0。LICENSE は Apache 2.0 全文、GitHub API の `license.spdx_id` も `Apache-2.0`、README にも明記。検証済み
- CNCF (Cloud Native Computing Foundation) 成熟度: Sandbox。2020-11-10 受理 ([CNCF プロジェクトページ](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/))
- カテゴリ: App Definition & GitOps

### リポジトリの位置づけ (重要)

CDK8s は単一リポジトリではなく `cdk8s-team` org に分割されている。

- `cdk8s-team/cdk8s`: アンブレラ repo。website (cdk8s.io)、横断 issue、ドキュメント。コア実装は入っていない。star 数 4830 はここに付く (2026-06-26, GitHub API)
- `cdk8s-team/cdk8s-core`: 合成エンジン本体。npm `cdk8s` として配布。本 deep-dive が読むべき実装はここ。README 冒頭が「This repository is the "core library" of cdk8s」と明言
- `cdk8s-team/cdk8s-cli`: `cdk8s init` / `cdk8s synth` の CLI (Command Line Interface)
- `cdk8s-plus`: Pod / Deployment 等の高レベル intent API

実装を追うなら `cdk8s-core` が正解。star 等の採用シグナルはアンブレラ `cdk8s` を見る。

## 歴史の素材

- 2020-05: AWS が cdk8s を発表。作者は Elad Ben-Israel (AWS CDK / jsii / projen の作者) ([AWS containers blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/))
- 2020-07: 高レベル API `cdk8s+` (cdk8s-plus) のベータ
- 2020-11-10: CNCF Sandbox に受理 ([CNCF](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/))
- 2021-10: GA (General Availability) 宣言。AWS Labs org から専用 org `cdk8s-team` へ移管。Go サポート追加 ([AWS What's New](https://aws.amazon.com/about-aws/whats-new/2021/10/cdk-kubernetes-cdk8s-available/))
- 背景思想: Construct Programming Model (CPM)。同じモデルで AWS CDK (CloudFormation)、CDKTF (Terraform)、cdk8s (Kubernetes) を記述する。多言語化は jsii が担う ([AWS blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/))

## アーキテクチャの素材

cdk8s は「コードで construct ツリーを組み立て、合成 (synth) で素の Kubernetes YAML を吐く」フレームワーク。クラスタには一切接続しない。出力 YAML を `kubectl apply` するのは利用者の責務。

ツリーは 3 階層。いずれも `constructs` ライブラリの `Construct` を継承する。

- `App`: ルート。scope を持たない唯一の construct (src/app.ts:87、constructor が `super(undefined as any, '')` src/app.ts:170)
- `Chart`: 1 chart が 1 マニフェストファイルの単位 (src/chart.ts:36)
- `ApiObject`: 1 Kubernetes リソース (Pod, Service, ...) (src/api-object.ts:52)

### 代表的なコア操作: `app.synth()` を端から端まで (FILE_PER_CHART)

`App.synth()` (src/app.ts:182) が出力ディレクトリへマニフェストを書き出すエントリ。FILE_PER_CHART がデフォルト (src/app.ts:173、enum 定義 src/app.ts:12)。

1. `fs.mkdirSync(this.outdir)` で出力先作成 (src/app.ts:184)。
2. `validate(this, cache)` で全 construct の `node.validate()` を集め、エラーがあれば throw (src/app.ts:190、関数本体 src/app.ts:298)。
3. `resolveDependencies(this, cache)` が暗黙の construct 依存から chart 間 / ApiObject 間の明示的依存を導出 (src/app.ts:194、本体 src/app.ts:325)。戻り値 `hasDependantCharts` でファイル名に index を付けるか決まる。
4. `this.charts` getter が `DependencyGraph(this.node).topology()` で chart をトポロジカルソート (src/app.ts:158-163)。
5. FILE_PER_CHART 分岐 (src/app.ts:212): 各 chart に `SimpleChartNamer` / `IndexedChartNamer` で名前を付け、`chart.toJson()` の結果を `Yaml.save` (src/app.ts:216-217)。
6. `Chart.toJson()` は `App._synthChart(this)` に委譲 (src/chart.ts:147-148)。
7. `App._synthChart` (src/app.ts:101) が再度 `resolveDependencies` (src/app.ts:109) と `validate` (src/app.ts:114) を呼び、`chartToKube(chart).map(obj => obj.toJson())` を返す (src/app.ts:116)。
8. `chartToKube` (src/app.ts:372) は `DependencyGraph(chart.node).topology()` を `ApiObject` かつ「最も近い親 chart がこの chart」のものに絞る (src/app.ts:373-376)。`Chart.of(x) === chart` で入れ子 chart の二重出力を防ぐ (src/app.ts:375)。
9. `ApiObject.toJson()` (src/api-object.ts:200) が 1 リソースを JSON 化する。`{...this.props, metadata: this.metadata.toJson()}` を組み (src/api-object.ts:203-206)、`resolve([], data, this)` でトークン解決 (src/api-object.ts:209、本体 src/resolve.ts:116)、`sanitizeValue(..., {sortKeys})` でキーソート (src/api-object.ts:209)、`JsonPatch.apply` で RFC-6902 パッチ適用 (src/api-object.ts:210)、先頭キーを `apiVersion`, `kind`, `metadata` の順へ並べ替え (src/api-object.ts:215)。
10. `Yaml.save` から `Yaml.stringify` が `yaml` ライブラリで複数ドキュメントを `---\n` 区切りに直列化 (src/yaml.ts:30, src/yaml.ts:44)。YAML schema は 1.1 固定で PyYAML 等との後方互換と 8 進数解釈を担保 (src/yaml.ts:12)。

`synthYaml()` (src/app.ts:269) はファイルに書かず YAML 文字列を返す別経路。`App._synthChart` は internal だが Chart 単位の合成を外から呼べる唯一の口。

### トークン解決 (resolve) の仕組み

`resolve(key, value, apiObject)` (src/resolve.ts:116) はオブジェクトを再帰降下し、各値に resolver チェーンを適用する。

- `App` の constructor で resolver 配列を構築する。ユーザ resolver の後に `LazyResolver`, `ImplicitTokenResolver`, `NumberStringUnionResolver` を追加 (src/app.ts:174)。
- 各値ごとに `ResolutionContext` を作り (src/resolve.ts:8)、resolver を順に呼ぶ。最初に `context.replaceValue` を呼んだ resolver で打ち切り、置換後の値を再帰的に resolve し直す (src/resolve.ts:126-132、first resolver wins)。
- `LazyResolver` は `Lazy` インスタンスを `produce()` で遅延評価 (src/resolve.ts:61-69)。`ImplicitTokenResolver` は `.resolve()` メソッドを持つ任意オブジェクトを解決 (src/resolve.ts:74-85)。

## 内部実装の素材

### 中核データ構造

1. construct ツリー: `App` (src/app.ts:87) / `Chart` (src/chart.ts:36) / `ApiObject` (src/api-object.ts:52)。全て `constructs` の `Construct` 派生で、`node.scope` / `node.children` / `node.dependencies` を共有する。
2. `DependencyGraph` と `DependencyVertex` (src/dependency.ts:17, src/dependency.ts:98)。construct の依存からグラフを組み、`topology()` が DFS でトポロジカル順を返す (src/dependency.ts:134)。`addChild` がサイクルを検出して throw する (src/dependency.ts:163、エラー src/dependency.ts:168)。
3. resolver チェーン: `IResolver` (src/resolve.ts:49) と `ResolutionContext` (src/resolve.ts:8)。プラグイン可能な値変換層。
4. `ApiObjectMetadataDefinition` (src/metadata.ts、ApiObject が保持 src/api-object.ts:128) と JSON-Patch 配列 `patches` (src/api-object.ts:133)。`addJsonPatch` で push し toJson 時に適用 (src/api-object.ts:190, src/api-object.ts:210)。
5. `SynthRequestCache` (src/app.ts:70): `node.findAll()` の結果を Map にメモ化。合成中に全 construct 走査が多数回起きるための最適化。

### 非自明な設計判断

`instanceof` を信用しない型判定。`Chart.isChart` / `ApiObject.isApiObject` は `Symbol.for('cdk8s.Chart')` などのマーカー属性を attribute detection で見る (src/chart.ts:6, src/chart.ts:42、ApiObject は src/api-object.ts:50, src/api-object.ts:61)。さらに `static [Symbol.hasInstance]` を override して `x instanceof Chart` 自体をこの静的メソッドへ委譲する (src/chart.ts:52, src/api-object.ts:71)。理由はコメント通り「`instanceof` を確実には使えない」: jsii の多言語境界や、依存解決で同一ライブラリの複数コピーがディスク上に存在しうるため prototype 同一性が崩れる。マーカー属性なら別コピー間でも判定が一致する。

副次的に面白い点。

- 名前生成のハッシュ: `Names.toDnsLabel` (src/names.ts:68) は DNS_LABEL (RFC-1123, 63 文字) 準拠名を生成し、末尾に 8 文字ハッシュを付ける (src/names.ts:7)。ハッシュは既定で `node.addr` の先頭 8 文字 (constructs のアドレス)、`CDK8S_LEGACY_HASH` が立つと path の sha256 へ切替 (src/names.ts:195-203)。
- 同期 HTTP: `Yaml.load` の URL 取得は子プロセス (`_loadurl.mjs`) を `execFileSync` で起動し、同期的に HTTP を行う (src/yaml.ts:105-111)。同期 API を保つための回避策。
- `apiGroup` 解析: `apiVersion` を `/` で割り、要素 1 個なら `core` グループ (src/api-object.ts:229-242)。

## 採用事例の素材

- 出典付きで名指しできる採用組織は `cdk8s-core` / アンブレラ repo に ADOPTERS ファイルが見当たらず、確証ある named adopter は今回特定できなかった。捏造しない。
- GitHub シグナル (2026-06-26, GitHub API): アンブレラ `cdk8s-team/cdk8s` が star 4830 / fork 313。実装 repo `cdk8s-core` は star 86 / fork 33 / contributors 約 59 (anon 含む、`contributors?per_page=1` の last page で概算)。
- 起源が AWS であり、AWS が公式ブログで GA とユースケースを継続的に発信 ([AWS containers blog](https://aws.amazon.com/blogs/containers/announcing-the-general-availability-of-cdk8s-and-support-for-go/))。CNCF Sandbox 在籍 ([CNCF](https://www.cncf.io/projects/cdk-for-kubernetes-cdk8s/))。

## 代替・エコシステム

- Helm: テンプレート (Go template) で YAML を生成。cdk8s は汎用言語の型と制御構文で組む点が本質差。cdk8s 側は `helm.ts` (src/helm.ts) で Helm chart を取り込む統合も持つ。
- Kustomize: 既存 YAML へのパッチ重ね。cdk8s は YAML を 0 から合成する。
- jsonnet / ytt (carvel): データテンプレート言語。cdk8s は汎用言語 (TypeScript / Python / Java / Go / C#) を使う。
- Pulumi: 同じく汎用言語で IaC (Infrastructure as Code)。Pulumi は適用 (apply) まで自前で行うが、cdk8s は合成のみで apply は kubectl 等に委ねる。
- 統合: `cdk8s-plus` (高レベル API)、`cdk8s-cli` (`init` / `import` で CRD/API から型生成、`synth`)、`cdk8s-cdktf-resolver` (CDKTF 連携)、`cdk8s-operator`。同じ `constructs` ライブラリ上に AWS CDK / CDKTF が乗る。

## 導入と最小構成

CLI (`cdk8s-cli`) 経由が公式の最短路。`cdk8s synth` の出力先と `App` の `outdir` は一致させる必要がある (src/app.ts:24-37 の doc コメント)。

```bash
npm install -g cdk8s-cli
mkdir hello && cd hello
cdk8s init typescript-app
# main.ts を編集して Chart に ApiObject を足す
cdk8s synth
# dist/*.k8s.yaml が生成される。kubectl apply -f dist/ で適用
```

ライブラリ (`cdk8s`) を直接使う最小コードは `new App()`、`new Chart(app, 'id')`、`ApiObject` を足す、`app.synth()` の順。`app.synth()` はデフォルトで `dist/` に chart ごとの `.k8s.yaml` を書く (src/app.ts:171-173, src/app.ts:182)。

## カテゴリ判断

App Definition & GitOps。cdk8s はワークロードの「定義」を担う (マニフェスト生成)。スケジューリングもネットワークもしない。Developer Tools も近いが、成果物が Kubernetes アプリ定義そのものなので App Definition & GitOps が最適。CNCF Landscape でも App Definition 系に置かれる。

## taglines

- EN: Define Kubernetes manifests in real programming languages and synthesize them into plain YAML.
- JA: Kubernetes マニフェストを汎用プログラミング言語で記述し、素の YAML へ合成するフレームワーク。
