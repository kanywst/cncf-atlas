# 内部実装

> コミット `a8ce9ee` のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `in_toto/in_toto_verify.py` | 検証 CLI。layout と鍵を読み込み `verifylib` を呼ぶ (in_toto/in_toto_verify.py:222) |
| `in_toto/runlib.py` | 証拠生成。artifact をハッシュ化、コマンド実行、link の組み立てと署名 (in_toto/runlib.py:69) |
| `in_toto/verifylib.py` | 検証エンジンと全ルール検査 (in_toto/verifylib.py:1484) |
| `in_toto/rulelib.py` | artifact rule 文字列を dict にパース (in_toto/rulelib.py:43) |
| `in_toto/models/layout.py` | Layout, SupplyChainItem, Step, Inspection (in_toto/models/layout.py:65) |
| `in_toto/models/link.py` | Link メタデータ型とファイル名形式 (in_toto/models/link.py:36) |
| `in_toto/models/metadata.py` | 署名コンテナ抽象。DSSE Envelope と旧 Metablock (in_toto/models/metadata.py:50) |
| `in_toto/resolver/_resolver.py` | artifact ハッシュ化の URI スキーマ別ディスパッチ (in_toto/resolver/_resolver.py:21) |

## 中核データ構造

**Layout** (in_toto/models/layout.py:65) は `attrs` クラスで、`_type` (常に `"layout"`、in_toto/models/layout.py:100)、`steps`、`inspect`、`keys` (functionary 公開鍵)、`expires` を持つ。期限未指定ならコンストラクタが 1 か月後を既定にする (in_toto/models/layout.py:111-112):

```python
self.expires = kwargs.get("expires")
if not self.expires:
    self.set_relative_expiration(months=1)
```

**Step** (in_toto/models/layout.py:565) と **Inspection** (in_toto/models/layout.py:661) はどちらも **SupplyChainItem** (in_toto/models/layout.py:477) を継承する。Step は functionary が実行する期待された手順、Inspection は検証側がローカルで走らせる検査である。両者とも artifact rule を持ち、Step はさらに許可された `pubkeys`、`threshold`、`expected_command` を持つ。

**Link** (in_toto/models/link.py:36) は `materials` と `products` (パス→ハッシュ dict)、`byproducts` (stdout, stderr, 戻り値)、`command`、`environment` を記録する (in_toto/models/link.py:86-90)。ファイル名形式はステップ名を鍵 id プレフィックスに紐づける (in_toto/models/link.py:29):

```python
FILENAME_FORMAT = "{step_name}.{keyid:.8}.link"
```

**Metadata** (in_toto/models/metadata.py:50) は署名コンテナの抽象である。`from_dict` がデータの形でディスパッチし、`"payload"` キーがあれば DSSE `Envelope`、`"signed"` キーがあれば旧 `Metablock` とする (in_toto/models/metadata.py:54-61)。

## 追う価値のあるパス

artifact rule エンジンが検証の心臓部である。`verify_item_rules` (in_toto/verifylib.py:1014) はステップの materials か products をすべてキューに入れ、ルールを順に適用し、各ルールが消費したものをキューから除く。消費自体は無害で、docstring はこれをファイアウォールに喩える (in_toto/verifylib.py:1022-1032):

```text
The mode of operation is similar to that of a firewall:
In the beginning all materials or products ... are placed into
an artifact queue. The rules are then applied sequentially,
consuming artifacts in the queue ...
The consumption of artifacts by itself has no effects ...
Only through a subsequent "DISALLOW" rule, that finds
unconsumed artifacts, is an exception raised.
```

つまり DISALLOW ルールはキューに残ったものを罰し、REQUIRE ルールは見つからないものを罰するが、素の MATCH や ALLOW は消費するだけである。MATCH ルールは `verify_match_rule` (in_toto/verifylib.py:645) が検査し、宛先 link に同じパスかつ同一ハッシュの artifact があるときだけ source artifact を消費する (in_toto/verifylib.py:759):

```python
if source_artifact != dest_artifact:
    # Skip mismatching artifacts
    continue
```

このハッシュ一致が、あるステップの products を次のステップの materials に連結する仕組みである。

## 読んで驚いた点

- **検証は鍵に対する時計を持たない。** 鍵の生成時刻・失効・用途フラグを一切参照しない (in_toto/verifylib.py:1513-1521)。信頼モデルは丸ごと「オーナーが layout に署名する」であり、失効とは新しい layout に署名し直すことを意味する。これにより検証はオフラインで決定的になるが、漏洩した functionary 鍵はオーナーが新しい layout を出すまで有効なままである。
- **空のルール集合はすべてを通す。** ファイアウォールは DISALLOW か REQUIRE でしか失敗しないため、ルールのないステップはあらゆる artifact を許可する。README はまさにこの理由から、多くのステップ定義を `DISALLOW *` で締めることを推奨している。
- **ステップルールと inspection の順序は意図的なトレードオフ。** ステップルールは inspection コマンドより先に走るので inspection が改竄済みファイルに触れることはなく、その代わりステップの MATCH ルールは inspection 出力を参照できない (in_toto/verifylib.py:1618-1620)。
- **誤ったコマンドは警告どまり。** 仕様に従い、記録コマンドと期待コマンドの不一致はログに出して検証を続行する (in_toto/verifylib.py:1504-1507)。
