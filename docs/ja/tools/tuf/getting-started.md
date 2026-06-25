# はじめに

> `tuf` v7.0.0 で検証済み。コマンドは Python >=3.10 と POSIX シェルを想定。

## 前提

- `pip` 付きの Python >=3.10。
- 通信先の TUF リポジトリ。以下の手順ではソースツリー同梱のリポジトリ example を使う。これはメタデータとターゲットを HTTP で配信する。

## インストール

```bash
python -m pip install tuf
```

## 最初の動く構成

ソースツリーの client と repository の example が、エンドツーエンドで動かす最短経路。リポジトリ example はインメモリのリポジトリを配信し、起動ごとに再生成される。そのためリポジトリを再起動するたびに client は `tofu` (trust-on-first-use) を実行する必要がある。

1. ソースを clone し、example リポジトリを起動して動かしたままにする。

```bash
git clone https://github.com/theupdateframework/python-tuf
cd python-tuf/examples/repository
./repo
```

1. 別のターミナルで、client を trust-on-first-use で初期化する。初期 root をダウンロードし、`Updater` を構築する。

```bash
./examples/client/client tofu
```

期待される出力:

```text
Trust-on-First-Use: Initialized new root in /home/you/.local/share/tuf-example/<hash>
```

1. ターゲットファイルをダウンロードする。client はトップレベルメタデータをリフレッシュし、ターゲットを引き、ローカルキャッシュを確認し、必要ならダウンロードする。

```bash
./examples/client/client download file1.txt
```

期待される出力:

```text
Target downloaded and available in ./downloads/file1.txt
```

example の中核 API は小さい。本番では埋め込み root のバイト列を `bootstrap` に渡し、`refresh()` / `get_targetinfo()` / `download_target()` を呼ぶ:

```python
from tuf.ngclient import Updater

updater = Updater(
    metadata_dir=metadata_dir,
    metadata_base_url=f"{base_url}/metadata/",
    target_base_url=f"{base_url}/targets/",
    target_dir="./downloads",
    bootstrap=root_bytes,
)
updater.refresh()
info = updater.get_targetinfo("file1.txt")
if info is not None:
    path = updater.find_cached_target(info) or updater.download_target(info)
```

## 動作確認

`download` が成功するとターゲットの書き込み先パスが表示され、`./downloads` 配下にファイルが現れる。信頼済みローカル root が無い場合、client は `tofu` を実行するか、信頼済み `root.json` をメタデータディレクトリにコピーするよう促すメッセージを表示する ([examples/client/client](https://github.com/theupdateframework/python-tuf/blob/9a3c304/examples/client/client))。

## 次に読むもの

- 同梱の `examples/manual_repo` スクリプトは、Metadata API で root/timestamp/snapshot/targets メタデータを直接組み立てる方法を示す (hashed および succinct hash bin delegation を含む)。
- 本番デプロイでは trust-on-first-use に頼らず、埋め込み root メタデータのバイト列を `bootstrap` で渡す ([tuf/ngclient/updater.py:115](https://github.com/theupdateframework/python-tuf/blob/9a3c304/tuf/ngclient/updater.py#L115))。
- TUF 仕様と公式 python-tuf ドキュメントが、リポジトリ運用・鍵管理・委譲を詳しく扱う。
