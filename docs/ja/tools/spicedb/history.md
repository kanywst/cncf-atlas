# 歴史

## 起源

SpiceDB は、Google が 2019 年夏に論文を公開したグローバル分散認可システム Google Zanzibar の直系である。AuthZed の創業者は、Red Hat に買収された CoreOS の出身だった。彼らは 2020 年 8 月に Red Hat を離れ、翌月、API の最初の完全実装を Python で書いた (コードネーム Arrakis)。2021 年 3 月に Go へ書き直し (コードネーム Caladan)、2021 年 9 月にオープンソースの SpiceDB として公開した。GitHub リポジトリは 2021-08-16 に作成され、オープンソース公開のアナウンスは 2021 年 9 月末に続いた。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | Google が SpiceDB の実装元となる Zanzibar 論文を公開。 |
| 2020 | AuthZed 創業者が Red Hat を離れる。最初の API 実装 (Python、"Arrakis")。 |
| 2021 | Go へ書き直し ("Caladan")。リポジトリ作成 2021-08-16。9 月に SpiceDB として OSS 化。 |
| 2026 | `main` で活発に開発中。基準コミット時点の最新リリースタグは `v1.54.0`。 |

## どう進化したか

SpiceDB は Zanzibar の中核モデル (関係、スキーマから導出する権限、一貫性トークン) を保ちつつ、自前ホスト可能な OSS 製品に合うかたちで逸脱した。Google Spanner だけでなく複数のストレージバックエンドに対応し、user を特別扱いの ID ではなく通常のオブジェクト型として扱い、New Enemy 問題には ZedToken (Zanzibar の Zookie 相当) と設定可能な consistency で対処し、Caveats (関係に付随する CEL ベースの条件) を追加した。

大きめの機能の一部はコントリビュータ経由で入った。GitHub の認可チームが MySQL データストアを実装して寄贈し、Netflix の認可チームが Caveats のスポンサー兼設計パートナーを務めた。

## 現在地

開発は `main` ブランチで活発で、基準コミット `4bb1d7b3` はリリースタグ `v1.54.0` のすぐ先にある。プロジェクトは Apache-2.0 で、AuthZed が保守し、マネージド版も提供する。SpiceDB は CNCF プロジェクトではない (最も近い Zanzibar 系の競合 OpenFGA は CNCF Incubating)。
