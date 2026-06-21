# 内部実装

> コミット `9a3c304` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `tuf/api/metadata.py` | 署名済みペイロードを包む `Metadata[T]` ラッパ ([metadata.py:81](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/metadata.py#L81)) |
| `tuf/api/_payload.py` | ロールのペイロード型と署名検証プリミティブ (最大ファイル) |
| `tuf/api/serialization/json.py` | 組み込みの JSON (デ)シリアライザ |
| `tuf/api/dsse.py` | DSSE 封筒対応 |
| `tuf/ngclient/updater.py` | `Updater`、detailed client workflow |
| `tuf/ngclient/_internal/trusted_metadata_set.py` | `TrustedMetadataSet`、信頼集合の状態機械 |
| `tuf/ngclient/urllib3_fetcher.py` | `FetcherInterface` の既定 HTTP フェッチャ |
| `tuf/repository/_repository.py` | `Repository(ABC)`、リポジトリツールの基底クラス |

## 中核データ構造

ロール型は `tuf/api/_payload.py` にある。`Signed` は全ロールメタデータの抽象基底で、`version` / `spec_version` / `expires` と `is_expired()` を持つ ([_payload.py:84](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L84), [_payload.py:251](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L251))。

- `Root` ([_payload.py:507](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L507)) と `Targets` ([_payload.py:1686](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1686)) はいずれも `_DelegatorMixin` を継承し、委譲先を検証できる「委譲者」。`Root` はどの keyid としきい値が各ロールに必要かを示す `keys` と `roles` のマップを保持する。
- `Timestamp` ([_payload.py:924](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L924)) と `Snapshot` ([_payload.py:992](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L992)) は下位メタの `MetaFile` 情報を持つ ([_payload.py:799](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L799))。snapshot は全ターゲットメタのバージョン表。
- `DelegatedRole` ([_payload.py:1062](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1062))、`SuccinctRoles` ([_payload.py:1236](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1236))、`Delegations` ([_payload.py:1384](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1384)) がターゲット委譲のグラフを成す。`Delegations.get_roles_for_target()` はパスやハッシュビンに対しどの委譲ロールを辿るかを返す ([_payload.py:1512](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1512))。
- `TargetFile` ([_payload.py:1533](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1533)) は配布ファイルの length と hashes を持つ。`MetaFile` と `TargetFile` はどちらも `BaseFile` 由来 ([_payload.py:713](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L713))。

## 追う価値のあるパス

timestamp ロールについて、メタデータ検証パスを端から端まで追う。

ステップ 1、受け口。取得した bytes はロール別の更新メソッドに渡る。timestamp では `TrustedMetadataSet.update_timestamp()` ([trusted_metadata_set.py:204](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L204))。まず final root が期限切れでないかを確認する ([trusted_metadata_set.py:230](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L230))。

ステップ 2、デシリアライズと署名検証。`_load_data` に委譲し、封筒タイプで分岐する。従来メタデータは `_load_from_metadata()` ([trusted_metadata_set.py:457](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L457))、DSSE は `_load_from_simple_envelope()` ([trusted_metadata_set.py:484](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L484))。両者とも `delegator.verify_delegate(role_name, signed_bytes, signatures)` を呼ぶ ([trusted_metadata_set.py:479](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L479))。

ステップ 3、しきい値署名検証。核心は `_DelegatorMixin.get_verification_result()` ([_payload.py:429](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L429)):

```python
sig = signatures[keyid]
try:
    key.verify_signature(sig, payload)
    signed[keyid] = key
except sslib_exceptions.UnverifiedSignatureError:
    unsigned[keyid] = key
    logger.info("Key %s failed to verify %s", keyid, delegated_role)

return VerificationResult(role.threshold, signed, unsigned)
```

結果が `verified` になるのは `len(self.signed) >= self.threshold` のとき ([_payload.py:355](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L355))。しきい値未達なら `verify_delegate()` が `UnsignedMetadataError` を送出する ([_payload.py:500](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L500))。

ステップ 4、rollback と順序の強制。ここが状態機械の肝。timestamp では、新バージョンが信頼済みより小さければ `BadVersionNumberError`、等しければ旧を維持するため `EqualVersionNumberError` を送出する ([trusted_metadata_set.py:242](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L242))。snapshot 更新は timestamp の `snapshot_meta` に記録されたハッシュと長さで照合し、削除済みやバージョン後退したターゲットメタを拒否する ([trusted_metadata_set.py:341](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L341))。ターゲット本体はダウンロード後に `TargetFile.verify_length_and_hashes()` で検証する ([_payload.py:1661](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/api/_payload.py#L1661))。

## 読んで驚いた点

状態機械は「中間 (intermediate)」メタデータを、期限切れやバージョン不一致でも一旦ロードできるようにし、後で例外を投げる。`update_timestamp` は新しい timestamp をロードしてから `_check_final_timestamp()` を呼んで期限切れで送出する ([trusted_metadata_set.py:259](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L259), [trusted_metadata_set.py:270](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L270))。インラインコメントが明言している:

```python
# expiry not checked to allow old timestamp to be used for rollback
# protection of new timestamp: expiry is checked in update_snapshot()
```

期限切れを即拒否する素朴な実装だと、rollback 検出に必要な基準そのものを捨ててしまう。`update_snapshot` も同じパターンで `_check_final_snapshot()` を使い ([trusted_metadata_set.py:357](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/_internal/trusted_metadata_set.py#L357))、中間 root は期限切れでも受け入れ、final root の期限だけ `update_timestamp` 内で強制する。
