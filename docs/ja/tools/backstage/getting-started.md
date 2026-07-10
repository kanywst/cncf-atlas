# はじめに

> version `1.53.0-next.0` (pin したコミット `bccd96d`) で検証。コマンドは Unix 系シェルを想定。

これは公式 scaffolder から単体の Backstage アプリを作る手順で、モノレポのクローンではない。モノレポは Backstage 自体を開発するためのもので、採用者は自分のアプリを生成する。

## 前提

- Node.js。モノレポの root `package.json` は `engines.node` を `22 || 24` と宣言しているので、Node 22 か 24 を使う。
- Yarn。リポジトリは Yarn `4.4.1` を pin しており、生成されるアプリも Yarn を使う。
- ネイティブモジュール用の C コンパイラツールチェーンと Git。

## インストール

アプリは 1 回限りのコマンドで生成されるので、事前にグローバルインストールするものはない。

```bash
npx @backstage/create-app@latest
```

## 最初の動く構成

1. create-app コマンドを実行し、アプリ名のプロンプトに答える。フロントエンド (`packages/app`) とバックエンド (`packages/backend`) を含む新しいディレクトリが scaffold される。

   ```bash
   npx @backstage/create-app@latest
   ```

1. 生成されたディレクトリに入り、フロントエンドとバックエンドを一緒に起動する。

   ```bash
   cd my-backstage-app
   yarn start
   ```

1. フロントエンドはポート `3000`、バックエンドはポート `7007` で動く。ブラウザで `http://localhost:3000` を開く。

既定ではアプリはインメモリの SQLite データベースを使うので、外部サービスなしで動く。テンプレートに同梱されたサンプルカタログ entity がすぐに Catalog ページに表示される。

## 動作確認

バックエンドの catalog エンドポイントを叩き、entity が返ることを確認する。

```bash
curl http://localhost:7007/api/catalog/entities
```

健全なバックエンドは entity の JSON 配列を返す (seed されたサンプルコンポーネント、ゲストユーザなど)。ブラウザでは `http://localhost:3000/catalog` の Catalog ページに同じ entity が並ぶはずだ。

## 次に読むもの

本番運用は create-app の既定値ではなく公式ドキュメントに従うこと。データベースを PostgreSQL に切り替え、guest provider の代わりに auth provider を設定し、TechDocs のストレージを用意する。デプロイ・バックエンドシステム・プラグイン開発は [Backstage ドキュメント](https://backstage.io/docs/overview/what-is-backstage/) を参照。
