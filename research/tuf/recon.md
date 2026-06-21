# recon: The Update Framework (TUF) / python-tuf

調査メモ。python-tuf はリポジトリ/鍵が侵害されてもソフトウェア更新を守る TUF 仕様のリファレンス実装。

## 基本情報

- repo: theupdateframework/python-tuf
- pinned commit: `9a3c3046d6ffdc9d90ec21ce5237721bcd985652` (2026-06-16, develop ブランチ) / 近いタグ: v7.0.0 (2026-05-18)
- 言語 / ビルド: Python (>=3.10) / hatchling (`build-backend = "hatchling.build"`, `pyproject.toml:1-3`)。`pip install tuf` で配布
- ライセンス: Apache-2.0 OR MIT のデュアル (`pyproject.toml:9-10`)。リポジトリに `LICENSE` (Apache 2.0) と `LICENSE-MIT` の両方あり。MIT の著作権表記は "Copyright (c) 2010 New York University"
- CNCF 成熟度: Graduated (2019-12-18 卒業)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Supply Chain
- 依存: `securesystemslib~=1.0` (鍵・署名), `urllib3<3,>=1.21.1` (HTTP)。`pyproject.toml:43-46`
- エントリポイント: CLI バイナリは無い。ライブラリとして使う。公開 API は `tuf.ngclient` (`tuf/ngclient/__init__.py` が `Updater` / `UpdaterConfig` / `FetcherInterface` / `Urllib3Fetcher` / `TargetFile` をエクスポート)。バージョンは `tuf/__init__.py:7` の `__version__ = "7.0.0"`

## 歴史の素材

- 起源: 基礎技術は 2009 年に University of Washington で Justin Samuel と Justin Cappos が開発。Tor の Thandy アップデータの改良から派生し、Tor の Nick Mathewson / Roger Dingledine と共著で学術論文として発表 (出典: Wikipedia, NYU Tandon)。
- 2011 年に Cappos が NYU (Polytechnic, 後の NYU Tandon) に移り、Secure Systems Lab で開発継続。Trishank Karthik Kuppusamy, Vladimir Diaz, Sebastien Awwad, Lukas Puehringer らが関与 (出典: Wikipedia)。
- 派生・採用の流れ: 2014 Flynn が最初に独自 Go 実装で採用、2015 Docker が Notary を公開、2016 から NYU/UMTRI/SWRI が車載 OTA 向けの Uptane を開発 (出典: Wikipedia)。
- CNCF: 2017-10-24 に Incubating で受理、2019-12-18 に Graduated に昇格 (出典: cncf.io プロジェクトページで確認済み)。CNCF で 9 番目の卒業プロジェクトであり、最初の「仕様」かつ最初のセキュリティ特化、かつ大学発で初の卒業プロジェクト (出典: CNCF/PRNewswire, NYU Tandon)。開発は NSF と DHS の公的資金が支援。
- python-tuf 自体の節目: 1.0.0 でメタデータ API (`tuf.api`) と新クライアント `tuf.ngclient` が安定化。PEP 458 の Warehouse 実装は 1.0.0 で PR が開かれ、後に 2.0.0 へ更新、TAP15 の succinct hash bin delegation でメタデータ量を削減 (出典: VMware OSS blog)。pin 時点の最新リリースは v7.0.0 (2026-05-18)。

## アーキテクチャの素材

python-tuf は大きく 3 つのパッケージに分かれる。

- `tuf/api` (Metadata API): 低レベル。TUF メタデータ (root/timestamp/snapshot/targets) のシリアライズ・デシリアライズと署名検証のプリミティブ。`metadata.py` の `Metadata[T]` ラッパ (`tuf/api/metadata.py:81`)、各ロールのペイロード型は `tuf/api/_payload.py` (1871 行、最大ファイル)。シリアライザは `tuf/api/serialization/json.py` のみ。DSSE 封筒対応は `tuf/api/dsse.py`。
- `tuf/ngclient` (クライアント): 高レベル。TUF 仕様の "Detailed client workflow" を実装する `Updater` (`tuf/ngclient/updater.py:78`)。信頼集合の状態機械 `TrustedMetadataSet` は内部実装 `tuf/ngclient/_internal/trusted_metadata_set.py`。HTTP 取得は `FetcherInterface` 抽象 (`fetcher.py`) と既定実装 `Urllib3Fetcher` (`urllib3_fetcher.py`)。`requests_fetcher.py` は deprecated。
- `tuf/repository` (リポジトリ側ヘルパ): 抽象基底 `Repository(ABC)` (`tuf/repository/_repository.py:35`)。`open`/`close`/`edit`/`do_snapshot`/`do_timestamp` などを定義し、リポジトリ運用ツールの土台にする (例: examples/repository, RSTUF)。

クライアント側の更新の流れ (`Updater.refresh()`, `updater.py:174-177`):

```text
root -> timestamp -> snapshot -> targets -> (delegated targets)
```

各段は「ローカルキャッシュを試し、ダメなら remote から取得し検証して永続化」という形。`get_targetinfo()` 呼び出し時に `refresh()` が未実行なら暗黙的に実行され (`updater.py:213-214`)、委譲ターゲットは `_preorder_depth_first_walk()` で必要時に解決する (`updater.py:500`)。

設計判断のひとつ: 信頼アンカーの渡し方。`Updater.__init__` の `bootstrap` 引数はキーワード必須 (`*, bootstrap: bytes | None`, `updater.py:114-115`)。埋め込み root のバイト列を渡して安全初期化するのが既定で、`bootstrap=None` のときだけキャッシュ済み `root.json` を信頼アンカーに使う (`updater.py:139-141`)。これにより「TOFU 的にキャッシュを信じる」挙動を呼び出し側に明示的にオプトインさせている。

## 内部実装の素材

代表的なコア操作 = クライアントの「メタデータ検証パス」を端から端まで追う。

ステップ1 (受け口): 取得した bytes はロール別更新メソッドに渡る。例として timestamp は `TrustedMetadataSet.update_timestamp()` (`trusted_metadata_set.py:204`)。まず final root の期限切れを確認する (`trusted_metadata_set.py:230-231`)。

ステップ2 (デシリアライズ + 署名検証): `_load_data` に委譲する。封筒タイプで分岐し、従来メタデータは `_load_from_metadata()` (`trusted_metadata_set.py:457`)、DSSE は `_load_from_simple_envelope()` (同 484)。両者とも delegator が渡されれば `delegator.verify_delegate(role_name, signed_bytes, signatures)` を呼ぶ (`trusted_metadata_set.py:479` / `:507`)。

ステップ3 (しきい値署名検証): 核心は `_DelegatorMixin.verify_delegate()` (`tuf/api/_payload.py:475`)。実体は `get_verification_result()` (`_payload.py:429`)。

```python
for keyid in role.keyids:
    ...
    sig = signatures[keyid]
    try:
        key.verify_signature(sig, payload)
        signed[keyid] = key
    except sslib_exceptions.UnverifiedSignatureError:
        unsigned[keyid] = key
return VerificationResult(role.threshold, signed, unsigned)
```

`VerificationResult.verified` は `len(self.signed) >= self.threshold` (`_payload.py:355-357`)。threshold 未達なら `verify_delegate` が `UnsignedMetadataError` を送出する (`_payload.py:500-504`)。

ステップ4 (ロールバック/順序の強制): ここが状態機械の肝。timestamp 更新では新バージョンが旧より小さければ `BadVersionNumberError`、等しければ `EqualVersionNumberError` で旧を維持する (`trusted_metadata_set.py:239-248`)。snapshot 更新は timestamp の `snapshot_meta` のハッシュ/長さで照合し (`:320-321`)、既存 snapshot 内の各メタの削除禁止・バージョン後退禁止をチェックする (`:329-344`)。ターゲット本体は `TargetFile.verify_length_and_hashes()` (`_payload.py:1661`, 基底 `MetaFile` の同名は `:907`) でダウンロード後に検証する (`updater.py:300`)。

中核データ構造 (`tuf/api/_payload.py`):

- `Signed` (`:84`): 全ロールメタデータの抽象基底。`version` / `spec_version` / `expires` と `is_expired()` (`:251`) を持つ。
- `Root` (`:507`) と `Targets` (`:1686`): いずれも `_DelegatorMixin` を継承し `verify_delegate()` を提供する「委譲者」。Root は `keys` と `roles` (どの keyid がどのロールに必要かと threshold) を保持する。
- `Timestamp` (`:924`) / `Snapshot` (`:992`): それぞれ下位メタの `MetaFile` 情報 (`MetaFile`, `:799`) を保持する。snapshot は全ターゲットメタのバージョン表。
- `DelegatedRole` (`:1062`) / `SuccinctRoles` (`:1236`) / `Delegations` (`:1384`): ターゲット委譲のグラフ。`Delegations.get_roles_for_target()` (`:1512`) がパス/ハッシュビンからどの委譲ロールを辿るか返す。
- `TargetFile` (`:1533`): 配布対象ファイルの length と hashes。`MetaFile`/`TargetFile` ともに `BaseFile` (`:713`) 由来。

非自明な設計判断 (コードを読まないと見えない): "intermediate metadata" を意図的に許容する。`update_timestamp` / `update_snapshot` は期限切れやバージョン不一致でも一旦ロード「できる」ようにしてから `_check_final_timestamp` / `_check_final_snapshot` で例外を投げる (`trusted_metadata_set.py:259-274`, `346-367`)。docstring (`:204-225`, `:276-305`) が明言する通り、これは「期限切れの古い timestamp/snapshot をロールバック保護用の基準として残しつつ、より新しい版のロードを止めない」ため。素朴な実装だと期限切れを即拒否してロールバック検出の機会を失う。root も同様で、中間 root は期限切れでも有効、final root の期限だけ `update_timestamp` 内で見る (`update_root` docstring `:166-180`, `_load_root` の連番ロード `updater.py:384-418`)。

最小利用 (examples/client より): `Updater(metadata_dir, metadata_base_url, target_dir, target_base_url, bootstrap=<root bytes>)` を作り、`refresh()` -> `get_targetinfo(path)` -> `find_cached_target()` か `download_target()` の順で使う。`pip install tuf` で導入。

## 採用事例の素材

python-tuf を「クライアントエンジン/CLI」として直接使う、出典のある事例。

- PyPI / Warehouse (PEP 458): PyPI ダウンロードを署名付きリポジトリメタデータで守る提案。実装は python-tuf に依存し、1.0.0 で Warehouse 開発環境への PR、後に 2.0.0 へ更新、TAP15 succinct hash bin delegation を活用 (出典: PEP 458, VMware OSS blog 2022-09)。
- Sigstore (sigstore-python): Sigstore の信頼ルート (`trusted_root.json`) を TUF で配布。sigstore-python は python-tuf を TUF クライアントエンジンとして依存し、埋め込み root をアンカーに Sigstore TUF CDN から検証取得する。`offline` フラグでリフレッシュ挙動を制御 (出典: Sigstore blog, sigstore-python releases)。
- RSTUF (Repository Service for TUF): PEP 458 設計を一般リポジトリ向けにサービス化したもの。OpenSSF sandbox 受理。python-tuf 上に構築 (出典: VMware OSS blog)。

注意: 「Amazon, VMware, Google, IBM, Red Hat, Datadog, DigitalOcean」等は TUF (仕様/設計) の本番採用として CNCF/報道が挙げるが、これらが python-tuf 実装そのものを使うとは限らない (Notary や Go 実装など別実装の場合がある)。python-tuf 固有の出典がある採用は上記 3 件。

## 代替・エコシステム

- 別言語の TUF 実装: go-tuf (Go, Notary/Sigstore 周辺で多用), rust-tuf, tuf-js / @sigstore/tuf (JS), RubyGems 向け移植 (Square)。python-tuf は「リファレンス実装」の位置づけで仕様準拠の基準になる。
- 派生仕様: Uptane (車載 OTA, TUF 拡張), TAP (TUF Augmentation Proposal, 例 TAP15 succinct hash bin)。
- 隣接の supply-chain プロジェクト: in-toto (同じ Secure Systems Lab 発, ビルド来歴の保証で TUF と補完関係), Sigstore (署名・透明性ログ。信頼ルート配布に TUF を使う), Notary v2 / Notation。
- 本質的な差: TUF は「リポジトリ/鍵が侵害されても被害を限定し回復できる」compromise-resilience を、ロール分離・しきい値署名・オフライン鍵・鍵失効・rollback/freeze 攻撃対策で実現する点が核。単なる署名検証 (GPG 等) と違い、メタデータの鮮度 (expiry)・順序・バージョン後退まで状態機械で強制する。
