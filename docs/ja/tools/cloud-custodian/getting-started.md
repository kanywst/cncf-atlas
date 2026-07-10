# はじめに

> `0.9.51` リリース系列で検証済み。コマンドは Python 3.10.2 以降と、環境に用意された AWS 認証情報を想定する。

## 前提

- Python `>=3.10.2, <4.0.0` (`pyproject.toml`)。
- boto3 が到達できる AWS 認証情報 (環境変数または名前付きプロファイル)。
- 仮想環境を作れるシェル。

## インストール

```bash
python3 -m venv custodian
source custodian/bin/activate
pip install c7n
```

## 最初の動く構成

最短で役立つポリシーは起動中の EC2 インスタンスを列挙するものである。既定の `pull` モードを使うため、アクションを足さない限り照会とレポートだけを行う。

1. ポリシーを `custodian.yml` に書く:

   ```yaml
   policies:
     - name: my-first-policy
       resource: aws.ec2
       filters:
         - "State.Name": running
   ```

1. 検証する。検証は `run` 時にも自動で走る:

   ```bash
   custodian validate custodian.yml
   ```

1. ドライランする。リソースを照会するがアクションは実行しない:

   ```bash
   custodian run --dryrun -s out custodian.yml
   ```

1. 本番実行する:

   ```bash
   custodian run -s out custodian.yml
   ```

これらのコマンドは README のクイックスタートに対応する ([README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md))。

## 動作確認

`-s out` フラグは出力ディレクトリである。実行後、マッチしたリソースは `PullMode` によって `out/<policy-name>/resources.json` に書かれる (`c7n/policy.py:351`)。このファイルを確認する:

```bash
cat out/my-first-policy/resources.json
```

マッチしたインスタンスの JSON 配列が出ればポリシーは動いてマッチした。空配列なら照会は走ったがフィルタに何も合致しなかったことを意味する。

## 次に読むもの

- Docker: 同じコマンドを `cloudcustodian/c7n` イメージから実行できる。ポリシーファイルと出力ディレクトリをマウントし、認証情報を環境変数で渡す ([README.md](https://github.com/cloud-custodian/cloud-custodian/blob/master/README.md))。
- サーバレス・マルチアカウント運用、他プロバイダ、通知、フィルタ・アクションの完全なリファレンスは公式ドキュメントにある ([cloudcustodian.io](https://cloudcustodian.io/))。
