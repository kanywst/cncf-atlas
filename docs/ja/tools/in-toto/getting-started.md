# はじめに

> in-toto 3.x (ドキュメント基準コミット `a8ce9ee`) で検証済み。コマンドは Python 3.9 以上の Unix シェルを想定。

## 前提

- Python >=3.9 (pyproject.toml:13)
- インストール用の `pip`

## インストール

in-toto は PyPI にあり pip で入る (README.md:22)。

```bash
pip install in-toto
```

これで 6 本のコマンドが PATH に入る: `in-toto-run`, `in-toto-record`, `in-toto-verify`, `in-toto-sign`, `in-toto-mock`, `in-toto-match-products` (pyproject.toml:50-56)。

## 最初の動く構成

鍵を扱わずに中核挙動を最速で確認するには `in-toto-mock` を使う。これはコマンドに対して署名なしの link メタデータを生成する (in_toto/in_toto_mock.py:49-51)。以下の例はツール自身のヘルプの例に従う (in_toto/in_toto_mock.py:64-77)。

1. ステップを in-toto の下で実行する。ここではファイル `bar` を作る作業を記録する。

   ```bash
   in-toto-mock --name foo -- touch bar
   ```

これは `touch bar` を実行し、コマンド・products・byproducts を記述した署名なし link ファイル `foo.link` を書き出す。

1. 記録された link を確認する。中身は素の JSON。

   ```bash
   cat foo.link
   ```

1. 本物の署名付きステップでは、代わりに署名鍵付きの `in-toto-run` を使う。functionary はステップ名を付け、materials と products を列挙し、鍵を渡す (in_toto/in_toto_run.py:86-91):

   ```bash
   in-toto-run --step-name build --products bar --signing-key key_file -- touch bar
   ```

1. プロジェクトオーナーは、署名付き layout と検証鍵に照らして最終成果物を検証する (in_toto/in_toto_verify.py:101):

   ```bash
   in-toto-verify --layout root.layout --verification-keys key_file.pub
   ```

## 動作確認

`in-toto-verify` は成功で終了コード 0、検証失敗で 1、引数不正で 2 を返す (in_toto/in_toto_verify.py:90)。実行後に確認する:

```bash
in-toto-verify --layout root.layout --verification-keys key_file.pub
echo $?
```

`0` なら記録されたチェーンが layout に一致した。成功時にはツールが `The software product passed all verification.` をログ出力する (in_toto/verifylib.py:1637)。

## 次に読むもの

README は layout の書き方、artifact rule 言語、run から verify までの一連の流れを解説する (README.md)。完全な実例は [demo layout creation example](https://in-toto.readthedocs.io/en/latest/layout-creation-example.html) と [in-toto/demo](https://github.com/in-toto/demo) リポジトリを参照。鍵の配布・失効は in-toto 自体のスコープ外なので、TUF や Sigstore と組み合わせる。
