# 歴史

## 起源

最初のコンテナレジストリは Docker のもので、Python 製だった。その初代 Registry は content-addressable storage を使っておらず、重複排除や整合性チェックが扱いにくかった。それを書き直して Distribution になったのが Go 版であり、拡張可能なライブラリとして再構成された。単一の固定サーバではなく、バックエンドやサブシステムを差し替えられる土台だ。これは Docker Distribution、あるいは Registry v2 として知られていたコードベースである (Docker ブログ、The New Stack)。

実装したプロトコルは Docker Registry HTTP API V2 だった。この API は後に Open Container Initiative へ移り、OCI Distribution Specification の下敷きになった。現在の README は、`registry` コンポーネントがその OCI 仕様の実装であると明記している (README、HTTP API V2 ドキュメント)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2014 | リポジトリ作成 (2014-12-22)。Docker の Python 製レジストリを Go で書き直したもの |
| 2021 | CNCF に Sandbox レベルで受理 (2021-01-26)。Docker が寄贈を公式発表 (2021-02-04)。`docker/distribution` から `distribution/distribution` へ改称 |
| 2025 | `v3.0.0` が GA に到達 |
| 2026 | `v3.1.1` リリース (2026-05-01)。本稿はその 1 コミット後の `472c9d38` を基準にする |

## どう進化したか

決定的な出来事は 2021 年の CNCF への寄贈だった。Docker は、これほど多くのレジストリを支えるコードをより広い集団で維持できるように、プロジェクトを財団へ譲ると発表した。掲げられた課題は分断だった。共有の土台が単一ベンダーの手元にあったせいで、小さな fork や未還元の変更が積み上がっていた。中立な財団へ移すのがその対処だった (Docker ブログ、The New Stack)。

寄贈にはメンテナ募集が伴った。Docker は、すでにこのコードに依存していた大口オペレータからメンテナを募り、Docker・GitHub・GitLab・DigitalOcean・Mirantis・Harbor・OCI を挙げた。移行の一環として `docker/distribution` から `distribution/distribution` へ改称された (Docker ブログ)。CNCF は受理を 2021-01-26 の Sandbox として記録している (CNCF プロジェクトページ)。

寄贈後、バージョン系列は長寿命だった v2 系 (v2.8.x が最後の v2) から v3 へ進み、v3 は 2025 年に GA に達した。プロジェクトは現在この v3 系にある。

## 現在地

Distribution は活発な CNCF Sandbox プロジェクトである。現行リリースは `v3.1.1` (2026-05-01) で、本稿はその 1 コミット後の `472c9d38` に固定している。このコードがどれほど広く展開されているかを思うと注記に値するが、Sandbox から先へは昇格していない。ここでは成熟度レベルと現実の普及規模は別物だ。プロジェクト自身の位置づけは寄贈時から変わっていない。すなわち、独自の認証・スキャン・UI を持つエンドユーザ製品ではなく、レジストリ製品がその上に構築する仕様準拠で拡張可能な土台である (README、CNCF プロジェクトページ)。
