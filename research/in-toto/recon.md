# recon: in-toto

調査メモ。in-toto/in-toto は in-toto 仕様の Python リファレンス実装。仕様本体は in-toto/docs と in-toto/attestation に分かれる。ここで読んだのは Python 実装。

## 基本情報

- repo: in-toto/in-toto (Python リファレンス実装)
- pinned commit: `a8ce9ee2125ae5a4b041a4e37cc1cf10eed0da6b` (2026-05-19) / 近いタグ: v3.1.0 (`c82fe5d21aaa61c7f1a213db20a46f10bb3f411a`)。HEAD は v3.1.0 の後ろ、develop ブランチ先端。`in_toto/__init__.py` の `__version__` は文字列 "3.0.0" のままだが pyproject は `dynamic = ["version"]` で hatchling 管理なので配布版とはずれる。
- 言語 / ビルド: Python (>=3.9) / hatchling (`pip install in-toto`、または `pip install .`)。主依存は `securesystemslib[crypto]~=1.0`, `attrs`, `iso8601`, `pathspec`, `python-dateutil`。
- ライセンス: Apache-2.0。`LICENSE` は Apache License 2.0 全文 (冒頭 "Copyright 2018 New York University")、`pyproject.toml` も `license = "Apache-2.0"`。GitHub API は `NOASSERTION` を返すが実体は Apache-2.0 で確定。
- CNCF 成熟度: Graduated。
- カテゴリ (tools.ts の CATEGORY_ORDER から): Supply Chain
- エントリポイント: CLI 6 本 (`pyproject.toml` の `[project.scripts]`)。`in-toto-run`, `in-toto-record`, `in-toto-verify`, `in-toto-sign`, `in-toto-mock`, `in-toto-match-products`。検証の本丸は `in-toto-verify`。

## 歴史の素材

- 2015 年、NYU Tandon の Secure Systems Lab で開始。Justin Cappos 指導の下、当時学生の Santiago Torres-Arias らが NJIT の協力を得て開発。名前はラテン語 "in toto" (全体で) に由来し、サプライチェーン全工程を端から端まで検証する思想を表す。出典: [Sbomify](https://sbomify.com/2024/08/14/what-is-in-toto/), [NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/)。
- 学術的裏付けは USENIX Security 2019 の論文 "in-toto: Providing farm-to-table guarantees for bits and bytes" (Torres-Arias ら)。Datadog 本番デプロイの記述もここ。出典: [USENIX paper PDF](https://www.usenix.org/system/files/sec19-torres-arias.pdf)。
- CNCF の歩み: Sandbox 受理 2019-08-14 → Incubating 2022-03-10 → Graduated。Graduated は TOC 投票が 2025-02-10、CNCF 公式アナウンスが 2025-04-23。仕様 v1.0 は 2023-06。出典: [CNCF project page](https://www.cncf.io/projects/in-toto/), [CNCF incubator blog 2022](https://www.cncf.io/blog/2022/03/10/supply-chain-security-project-in-toto-moves-to-the-cncf-incubator/), [CNCF graduation announcement](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/), [InfoQ](https://www.infoq.com/news/2025/06/cncf-intoto/)。
- Cappos が率いる CNCF graduated 2 つ目 (1 つ目は TUF、2019 graduated)。資金は NSF / DARPA / AFRL。出典: [NYU CCS](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/)。

## アーキテクチャの素材

2 つの登場人物で全部説明できる。**Layout** (サプライチェーンのポリシー = 期待される手順) と **Link** (各手順を実行した証拠メタデータ)。生成側 (`runlib`) が Link を作り、検証側 (`verifylib`) が Layout に照らして Link 群を突き合わせる。

トップレベル構成 (`in_toto/`):

- CLI 層: `in_toto_run.py` / `in_toto_record.py` (証拠生成), `in_toto_verify.py` (検証), `in_toto_sign.py` (署名), `in_toto_mock.py` (鍵なし試走), `in_toto_match_products.py`。いずれも薄く、argparse して lib を呼ぶだけ。
- `runlib.py` (39k): 証拠生成エンジン。`record_artifacts_as_dict` (runlib.py:69) で materials/products をハッシュ化、`execute_link` (runlib.py:293) でコマンドを subprocess 実行、`in_toto_run` (runlib.py:406) / `in_toto_record_start` (runlib.py:622) / `in_toto_record_stop` (runlib.py:791) が Link を組み立て署名。
- `verifylib.py` (56k): 検証エンジン。`in_toto_verify` (verifylib.py:1484) がオーケストレータ。各ルール検証関数 (`verify_match_rule` ほか) を持つ。
- `rulelib.py`: artifact rule の文字列をパースする `unpack_rule`。MATCH/CREATE/DELETE/MODIFY/ALLOW/DISALLOW/REQUIRE の 7 種。
- `models/`: `layout.py` (Layout, Step, Inspection, SupplyChainItem), `link.py` (Link), `metadata.py` (Metadata 抽象 + DSSE Envelope + 旧 Metablock), `_signer.py`, `common.py`。
- `resolver/_resolver.py`: artifact をハッシュする URI スキーマ別リゾルバ。`RESOLVER_FOR_URI_SCHEME` dispatch で `FileResolver` (scheme "file", 既定), `OSTreeResolver` ("ostree"), `DirectoryResolver` ("dir")。`Resolver.for_uri` (resolver/_resolver.py:28) が未知スキーマを file にフォールバック。

### 中核オペレーションを端から端まで: `in-toto-verify`

1. CLI `in_toto_verify.py:222` で `Metadata.load(args.layout)` が layout を読み込み、`:233` で検証鍵をロード、`:236` で `verifylib.in_toto_verify(layout, layout_key_dict, link_dir, ...)` を呼ぶ。
2. `verifylib.in_toto_verify` (verifylib.py:1484) が docstring 通り 11 段を順に実行 (verifylib.py:1495-1511 にリスト)。
   - `:1584` `verify_metadata_signatures` (layout 署名を検証鍵で検証)
   - `:1590` `metadata.get_payload()` で署名コンテナから Layout 本体を取り出す
   - `:1593` `verify_layout_expiration` (有効期限)
   - `:1601` `load_links_for_layout` (`STEP-NAME.KEYID-PREFIX.link` 形式の Link を disk から)
   - `:1604` `verify_link_signature_thresholds` (各 step につき閾値ぶんの正当な functionary 署名)
   - `:1607` `verify_sublayouts` (sublayout があれば再帰検証)
   - `:1612` `verify_all_steps_command_alignment` (報告コマンドと期待コマンドの照合。**不一致でも失敗せず warning のみ**。仕様準拠)
   - `:1615` `verify_threshold_constraints` → `:1616` `reduce_chain_links`
   - `:1622` `verify_all_item_rules(layout.steps, ...)` (step の artifact rule)
   - `:1625` `run_all_inspections` (inspection コマンドを実行し Link 生成)
   - `:1634` `verify_all_item_rules(layout.inspect, ...)` (inspection の artifact rule)
   - `:1642` `get_summary_link` を返す (サプライチェーン全体の materials/products 要約。親 layout に埋め込む sublayout 検証で効く)
3. artifact rule の中核 `verify_item_rules` (verifylib.py:1014)。全 materials か products を「キュー」に入れ、ルールを順に適用してマッチしたものをキューから消費する (verifylib.py:1089, 1148 `artifacts_queue -= consumed`)。MATCH は `verify_match_rule` (verifylib.py:645) で他 step の Link の同名 artifact とハッシュ一致を確認 (verifylib.py:759 `if source_artifact != dest_artifact: continue`)。

## 内部実装の素材

中核データ構造:

1. **Layout** (`in_toto/models/layout.py:65`, `@attr.s`)。フィールドは `_type`("layout"), `steps`, `inspect`, `keys` (functionary 公開鍵 dict), `expires`, `readme`。期限未指定なら 1 か月後を既定にする (layout.py:111-112)。
2. **SupplyChainItem** / **Step** / **Inspection** (`layout.py:477` / `:565` / `:661`)。Step は期待される手順、Inspection はクライアント側で実行する検査。`expected_materials` / `expected_products` に artifact rule を、Step は `pubkeys` と `threshold`、`expected_command` を持つ。
3. **Link** (`in_toto/models/link.py:36`, `@attr.s`)。ファイル名形式 `FILENAME_FORMAT = "{step_name}.{keyid:.8}.link"` (link.py:29)。中身は `materials`/`products` (パス→ハッシュ dict), `byproducts` (stdout/stderr/retval), `command`, `environment`。
4. **Metadata 抽象** (`in_toto/models/metadata.py:50`)。`Envelope` (DSSE, metadata.py:144) と旧 `Metablock` (独自 JSON エンベロープ, metadata.py:220) が両方 `Metadata` を継承。`Metadata.from_dict` (metadata.py:54) が `"payload"` キー有→DSSE、`"signed"` キー有→Metablock とディスパッチ。
5. **Artifact rules** (`rulelib.py`)。`unpack_rule` が rule 文字列を dict 化。MATCH は `pattern`/`source_prefix`/`dest_prefix`/`dest_name`/`dest_type` を持つ。

非自明な設計判断 (コードを読まないと見えないもの):

- **artifact rule はファイアウォール式**。`verify_item_rules` の docstring (verifylib.py:1022-1032) が明言。全 artifact をキューに入れ、ルール適用でマッチを消費するが消費自体は無害。未消費を罰するのは後続の DISALLOW ルールだけ、足りないものを罰するのは REQUIRE だけ。`for rule in rules` で逐次処理し各反復で `artifacts_queue -= consumed` (verifylib.py:1100-1148)。
- **step ルールを inspection 実行より先に検証する** (verifylib.py:1618-1627)。コメント (verifylib.py:1618-1620) が理由を書く: inspection コマンドが改竄済みファイル上で走るのを防ぐため。ただし副作用として step の match rule は inspection の artifact を参照できない、というトレードオフ。
- **検証は完全に隔離**。鍵の生成時刻・失効状態・用途フラグなど外部情報を一切見ない (verifylib.py:1513-1521, in_toto_verify.py:85-88)。鍵を失効させたければ supply chain owner が新しい layout に署名し直す、というモデル。
- **コマンド不一致は警告どまり** (verifylib.py:1611-1612 + 1504-1507)。仕様 (in-toto-spec 4.3.1) に従い `expected_command` のズレは soft fail。

## 採用事例の素材

出典付きのみ列挙。フラッグシップ採用は Datadog。

- **Datadog**: agent とその integration (プラグイン) の CI/CD を in-toto で保護。鍵配布・失効・ローテーションは TUF と併用。tag step はハードウェアドングルで署名、CI はオンライン鍵。出典: [USENIX Security 2019 論文](https://www.usenix.org/system/files/sec19-torres-arias.pdf), [in-toto/friends](https://github.com/in-toto/friends)。
- **Debian / Reproducible Builds**: `rebuilderd` が再現ビルド結果を in-toto link として記録し、`apt-transport-in-toto` がパッケージ導入時に k-of-n rebuilder のメタデータを検証。`dnf-plugin-in-toto` も。出典: [in-toto/friends](https://github.com/in-toto/friends), [reproducible-builds.org tools](https://reproducible-builds.org/tools/)。
- **Sigstore / cosign**: keyless 署名で in-toto メタデータに署名、cosign の SLSA Provenance 生成で使用。出典: [in-toto/friends](https://github.com/in-toto/friends)。
- **Tekton Chains**: TaskRun を観測して in-toto attestation を生成。出典: [in-toto/friends](https://github.com/in-toto/friends)。
- **GitHub**: artifact attestations が SLSA build provenance と SBOM の in-toto predicate type を扱う。出典: [in-toto/friends](https://github.com/in-toto/friends)。
- **GUAC / Grafeas**: GUAC は SLSA / in-toto ITE6 attestation を取り込む。Grafeas は in-toto link メタデータをサポート。出典: [in-toto/friends](https://github.com/in-toto/friends)。
- **Lockheed Martin**: friends レジストリに採用組織として記載。出典: [in-toto/friends](https://github.com/in-toto/friends)。

採用シグナル (in-toto/in-toto Python repo): GitHub stars 1,009 / forks 155 / watchers 35 (API 取得 2026-06-22)、created 2016-05-24。仕様・他言語実装 (Go/Java/Rust) を含むエコシステム全体はこれより広い。出典: [GitHub API repo](https://api.github.com/repos/in-toto/in-toto)。

## 代替・エコシステム

「競合」というより層が違う。in-toto = フォーマット (attestation の封筒)、SLSA = 要求仕様 (in-toto の上に乗る opinionated 層)、Sigstore = 署名・透明性ログ。典型的なパイプラインは 3 つを併用する。

- **in-toto Attestation Framework (ITE-6)**: statement type / subject / predicate の 3 部からなる汎用エンベロープ。SLSA Provenance はこの上の predicate type として表現される。出典: [AquilaX](https://aquilax.ai/blog/supply-chain-artifact-signing-slsa), [SLSA FAQ](https://slsa.dev/spec/v1.1/faq)。
- **SLSA** (Linux Foundation, Google 発): in-toto attestation を Provenance 表現の vehicle として推奨。L2/L3 で署名済み provenance を要求。out: [SLSA FAQ](https://slsa.dev/spec/v1.1/faq)。
- **Sigstore** (OpenSSF): OIDC 由来の短命証明書 + Rekor 透明性ログで鍵管理問題を解消。SLSA の署名要件を埋める。出典: [AquilaX](https://aquilax.ai/blog/supply-chain-artifact-signing-slsa)。
- **TUF** (CNCF graduated, 同じく Cappos): 配布チャネルの侵害耐性。in-toto と相補的 (Datadog は両方使う)。出典: [USENIX paper](https://www.usenix.org/system/files/sec19-torres-arias.pdf)。
- 隣接: Grafeas (メタデータ API), GUAC (attestation 集約), SBOM 標準 (SPDX/CycloneDX) と連携。

最小セットアップ: `pip install in-toto`。owner が `in-toto-verify -l root.layout --verification-keys key.pub` で検証、functionary が `in-toto-run -n <step> -k key -m <materials> -p <products> -- <cmd>` で Link を生成。鍵なしで試すなら `in-toto-mock`。出典: [in_toto_verify.py:96-119 の EXAMPLE USAGE](https://github.com/in-toto/in-toto), pyproject `[project.scripts]`。
