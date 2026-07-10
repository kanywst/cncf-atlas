# はじめに

> コミット `0d888c2` (タグ `v0.21.2` の近傍) のソースで検証済み。コマンドは BuildKit 付きの Docker と、リポジトリのローカルクローンを想定する。

## 前提

- BuildKit 付きの Docker (現代の Docker では既定)。`docker build` がカスタムフロントエンドを実行できること。
- `ghcr.io` から Dalec フロントエンドイメージを pull できるネットワークアクセス。
- 同梱の例を取得するための `git`。

Dalec 自体にインストール作業はない。フロントエンドはコンテナイメージであり、`docker build` が spec 冒頭の `# syntax=` 行から自動で pull する (`docs/examples/hello.inline.yml:1`)。実運用では `latest` ではなくリリース済みタグに固定すること。

## インストール

例の spec を得るためにリポジトリをクローンする。

```bash
git clone https://github.com/project-dalec/dalec.git
cd dalec
```

例の 1 行目が、これを Dalec ビルドにするフロントエンド参照だ。

```yaml
# syntax=ghcr.io/project-dalec/dalec/frontend:latest
```

## 最初の動く構成

`docs/examples/hello.inline.yml` は最小の実 spec である。インラインの C ソース、`gcc` によるビルド、インストールされるバイナリ、それを走らせるテストからなる。`--target` に続くターゲットが、distro と出力の種別の両方を選ぶ。

1. Azure Linux 3 向けの RPM をビルドし、ローカルディレクトリへ書き出す。`azlinux3/rpm` ターゲットがパッケージを生成し、`--output` が `_output` へエクスポートする。

   ```bash
   docker build -f docs/examples/hello.inline.yml --target=azlinux3/rpm --output=_output .
   ```

1. 代わりに、パッケージをインストールした最小コンテナをビルドする。`azlinux3` ターゲット (`/rpm` サフィックスなし) がイメージを生成し、`hello-inline:dev` としてタグ付けする。

   ```bash
   docker build -f docs/examples/hello.inline.yml --target=azlinux3 -t hello-inline:dev .
   ```

1. 生成イメージを実行し、インストールされたバイナリが動くことを確かめる。

   ```bash
   docker run --rm hello-inline:dev
   ```

## 動作確認

1 つ目のコマンドの後、RPM が `_output/` 配下に現れる。

```bash
ls _output
```

2 つ目と 3 つ目のコマンドの後、コンテナはインストール済みバイナリを実行して出力を表示する。spec は Dalec がビルド中に走らせるテストも宣言しているので (`Tests []*TestSpec`、`spec.go:103`)、`docker build` が成功したということは、パッケージがビルド・インストールされ、宣言されたチェックを 1 回のパスで通ったことを意味する。

## 次に読むもの

署名、SBOM・provenance の attestation、ソース generator (gomod・cargohome・pip)、DEB ターゲット (Debian・Ubuntu)、Windows ターゲットについては、公式ドキュメント <https://project-dalec.github.io/dalec/> を参照。リポジトリの `docs/examples/` ディレクトリには、Git/HTTP ソース・パッチ・複数成果物ビルドなど、さらに多くの spec があり、複製の出発点にできる。
