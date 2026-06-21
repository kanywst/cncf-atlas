# 歴史

## 起源

Authelia は Clément Michaud が作った。リポジトリが GitHub で最初に公開されたのは 2016-12-07。バージョン 3 までの最初の実装は Node.js と TypeScript のアプリで、当時は LDAP・TOTP・U2F を使う NGINX 向けの二要素シングルサインオンサーバと説明されていた。レガシーの npm パッケージにその名残が残り、v3 系の最終リリースは 2019 年ごろ。

## Go への書き直し

歴史上の決定的な転換点はバージョン 4、Node.js から Go への全面書き直しで、最初の公開は 2019 年 10 月ごろ。これは言語の変更だけではなかった。ローカルストレージを SQLite に置き換え、MongoDB を非推奨にして SQL バックエンド（MySQL / PostgreSQL）に寄せ、Material UI と TypeScript のフロントエンドを導入し、マルチアーキテクチャのコンテナイメージを出し、`v3` から `v4` への移行コマンドを加えた。同時にライセンスを MIT から Apache-2.0 に変更した。本ディープダイブで扱うのはすべて v4 のコードベース。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | リポジトリ作成。Node.js / TypeScript 実装が始まる。 |
| 2019 | v4 で Go へ書き直し。SQL ストレージ、新フロントエンド、Apache-2.0 へ再ライセンス。 |
| 2021 | v4.29 で OpenID Connect 1.0 プロバイダをベータ導入。 |
| 2022 | v4.34 で WebAuthn を FIDO U2F の置き換えとして導入。 |
| 2025 | v4.38 で Pushed Authorization Requests、v4.39 でデバイスコードフロー・JWE トークン・パスキー。 |

## どう進化したか

書き直し後、プロジェクトは 2 つの軸で育った。1 つはプロキシ統合の面で、対応は NGINX から Traefik・Caddy・Envoy・HAProxy・Skipper へ広がった。いずれもそのプロキシが備える forward-auth または外部認可の仕組みを通す。もう 1 つは OpenID Connect プロバイダで、v4.29 のベータから始まりリリースごとに作り込まれてきた。v4.39 時点でいくつかのプロファイルで OpenID Certified を取得しているが、公式にはまだベータ扱いで、チームはその解除に向けて作業している。

WebAuthn は v4.34 で旧来の U2F 第二要素を置き換えた（2022 年に Chrome が U2F API を削除したことも一因）。v4.39 ではパスワードレスログイン用のパスキーが加わった。

## 現在地

現在の安定版は 4.39.20。小さなコアチーム（Clément Michaud、Amir Zarrinkafsh、James Elliott）と 100 名超のコントリビュータによって独立に保守されている。資金は Open Collective と現物提供のスポンサーシップで、セキュリティ監査に充てられている。どの財団にも属していない。リリースは、機能系列の中で頻繁にパッチを出し、機能（マイナー）リリースは年に 1 回程度、という形。

## 出典

- [Authelia リポジトリ](https://github.com/authelia/authelia)
- [authelia/v4 Go モジュール](https://pkg.go.dev/github.com/authelia/authelia/v4)
- [npm: authelia（レガシー v3）](https://www.npmjs.com/package/authelia)
- [WebAuthn ロードマップ項目](https://www.authelia.com/roadmap/complete/webauthn/)
- [OpenID Connect プロバイダ ロードマップ](https://www.authelia.com/roadmap/active/openid-connect-1.0-provider/)
- [4.39 リリースノート](https://www.authelia.com/blog/4.39-release-notes/)
