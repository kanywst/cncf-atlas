# status: NATS

- [x] recon 完了 @ commit `6993500ca20a02d1f42be713ceac3887b3bf819c` (2026-11-16 再 pin。旧 pin `bd058fac3d0c04398698b113e986b35065212fda`)
- [x] sources 整理
- [x] write: en 6 セクション
- [x] write: ja 6 セクション
- [x] tools.ts に登録 (maturity Graduated)
- [x] `npm run docs:build` グリーン
- [x] markdownlint clean

## メモ

- repo 解決: primary implementation は `nats-io/nats-server` (Go)。クライアント 40+ 言語は `nats-io` org の別リポなので deep-dive 本体はサーバで正しい。<https://github.com/nats-io>
- pin はデフォルトブランチ HEAD (VERSION `2.16.0-dev`)。最新リリースタグは v2.15.3 / v2.14.10 (2026-11-11)。<https://github.com/nats-io/nats-server/releases>
- 2026-11-16 再 pin: 旧 pin から 1002 commits。ページが引く `file:line` は全部新 sha で引き直した (行番号はほぼ全部ずれた、中身の主張は queue 選択の重み付け以外そのまま)。<https://github.com/nats-io/nats-server/compare/bd058fac3d0c04398698b113e986b35065212fda...6993500ca20a02d1f42be713ceac3887b3bf819c>
- 再 pin で足した主張: queue グループ選択の重み付き抽選 (`server/sublist.go:731`, `:742`)。commit 89c01e76 で重みぶん展開する方式から置き換わった。<https://github.com/nats-io/nats-server/commit/89c01e76677ec7a9ede6ba2a20b007cdff693892>
- getting-started は v2.15.3 向けに Go 1.26+ へ更新 (go.mod `go 1.26.0`)。コマンド自体は今回の再 pin で走らせていない (sandbox で go install / サーバ起動が許可されず)。<https://github.com/nats-io/nats-server/blob/v2.15.3/go.mod>
- core publish のトレースは L1 結果キャッシュ + sublist 二段キャッシュが肝。Internals 節はここが主役。
- 採用企業は出典付きのみ記載 (The Stack 記事 + cncf/toc#2042)。Mastercard は未確認なので使わない。
- カテゴリは "Messaging & Streaming" 固定。
- graduation 確定: cncf/toc#2042 gitvote passed (2026-11-02 close)、level change cncf/toc#2354 (2026-11-03 close)。<https://github.com/cncf/toc/issues/2042>, <https://github.com/cncf/toc/issues/2354>
