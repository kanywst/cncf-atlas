# はじめに

> コミット `0f6f0ab` (タグ `v0.14.1` 近傍) のソースで検証済み。コマンドは動作する Docker か BuildKit、そしてレポート駆動フローでは Trivy を想定する。

## 前提

- Docker (BuildKit 有効) かスタンドアロンの BuildKit。Copa はパッチを BuildKit のビルドとして解くため。
- Trivy。指摘されたパッケージだけをパッチするレポート駆動フローを使う場合。
- pull して再タグできるコンテナイメージ。

## インストール

Homebrew の場合:

```bash
brew install copa
```

ソースから (Go 1.25 が必要):

```bash
git clone https://github.com/project-copacetic/copacetic
make -C copacetic build
```

## 最初の動く構成

Trivy でイメージをスキャンし、指摘された OS パッケージだけをパッチし、再スキャンで確認する。

1. イメージをスキャンし、修正可能な OS 脆弱性の JSON レポートを書き出す。

   ```bash
   export IMAGE=docker.io/library/nginx:1.21.6
   trivy image --vuln-type os --ignore-unfixed -f json -o nginx-report.json "$IMAGE"
   ```

1. レポートを使ってイメージをパッチする。Copa は新しいタグを作りローカルランタイムへロードする。

   ```bash
   copa patch -i "$IMAGE" -r nginx-report.json -t 1.21.6-patched
   ```

1. パッチ済みタグを再スキャンし、指摘された CVE が消えたことを確認する。

   ```bash
   trivy image --vuln-type os --ignore-unfixed "${IMAGE%:*}:1.21.6-patched"
   ```

レポート無しで古いパッケージをすべてパッチするには `-r` を省く。Copa は古い OS パッケージをすべて更新する:

```bash
copa patch -i docker.io/library/nginx:1.21.6
```

## 動作確認

既定で Copa は `-patched` サフィックスの新しいタグをローカルランタイムへ書き込むので、`docker images` に元のタグと並んでパッチ済みタグが現れる。本当の確認は手順 3 の再スキャンである。更新で修正された CVE が現れなくなっているはずだ。レポートが適用可能な更新を生まない場合、Copa は失敗せず exit 0 で終え、更新が見つからなかったと表示する (`src/main.go:58-61`)。

## 次に読むもの

マルチプラットフォームイメージ、設定ファイルによるバッチパッチ、`--oci-dir` によるローカル OCI レイアウトへの書き出し、`--exit-on-eol` による EOL チェック、実験的な `COPA_EXPERIMENTAL` の言語パッケージパッチについては、公式ドキュメント <https://project-copacetic.github.io/copacetic/website/> を参照。[quick start](https://project-copacetic.github.io/copacetic/website/quick-start) と [installation](https://project-copacetic.github.io/copacetic/website/installation) のページがプラットフォーム別のセットアップを扱い、[copa-action](https://github.com/project-copacetic/copa-action) は同じフローを GitHub Actions に組み込む。
