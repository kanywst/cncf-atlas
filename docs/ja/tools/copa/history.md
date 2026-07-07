# 歴史

## 起源

Copacetic は Microsoft 発で、Microsoft Open Source チームが維持している ([Microsoft Open Source ブログ, 2024-09-18](https://opensource.microsoft.com/blog/2024/09/18/project-copacetic-quick-and-efficient-container-image-patching/))。GitHub リポジトリの作成は 2023-01-11 (GitHub の `createdAt`)。解こうとした課題は、CVE が上流で修正されてから、その修正が稼働中のイメージに届くまでのラグである。従来の答えは新しいベースイメージを待って再ビルドすることだが、それはイメージの利用者が制御できない。Copa は、イメージを発行した側だけでなく運用する側が、パッケージ修正を直接適用できるように作られた。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2023 | リポジトリ作成 (2023-01-11)。CNCF Sandbox に応募・受理 (2023-09-19 受理) |
| 2024 | Docker Desktop Extension を発表し、コマンドライン未経験者にも scan/tag/patch を開放 |
| 2026 | `v0.14.x` 系でローカル OCI 出力 (`--oci-dir`)、EOL チェック (`--exit-on-eol`)、再パッチ時のレイヤー単一化を追加 |

## どう進化したか

プロジェクトは 2023 年に CNCF Sandbox 入りした。応募は [cncf/sandbox issue #41](https://github.com/cncf/sandbox/issues/41) として提出され、オンボーディングは [issue #152](https://github.com/cncf/sandbox/issues/152) で追跡された。同 issue には元の名称 Copacetic とともに短縮名 Copa も記録されている。リポジトリは今も `copacetic` を使い、CNCF の掲載は Copa を用いる ([CNCF プロジェクトページ](https://www.cncf.io/projects/copa/))。

2024 年には Docker Desktop Extension を追加し、スキャン・タグ付け・パッチを CLI なしで行えるようにして、コマンドライン利用者を超えて対象を広げた ([Microsoft Open Source ブログ](https://opensource.microsoft.com/blog/2024/09/18/project-copacetic-quick-and-efficient-container-image-patching/))。より新しい `v0.14.x` 系のリリースは、当初のレポート駆動・単一イメージのフローを超えて進んだ。`--oci-dir` はパッチ後のイメージをコンテナランタイムではなくローカル OCI レイアウトに書き出し、`--eol-api-url` と組み合わせた `--exit-on-eol` は EOL のディストリビューション上に構築されたイメージを検出し、既にパッチ済みのイメージの再パッチはレイヤーを積み重ねる代わりに単一レイヤーへまとまる ([releases](https://github.com/project-copacetic/copacetic/releases))。

## 現在地

Copacetic は Microsoft Open Source の管理下にある活動中の CNCF Sandbox プロジェクトで、リポジトリにオープンなガバナンスモデルを持つ。ドキュメント基準コミット `0f6f0ab` (2026-06-24) は、直近のタグ付きリリース `v0.14.1` (2026-05-18) より先の `main` 上にあり、Go 1.25 を対象とし、OpenSSF Best Practices と Scorecard のバッジを掲示している (`src/README.md:5-6`)。開発はマルチプラットフォームのパッチと、実験的な言語パッケージのパッチで継続している ([内部実装](./internals) 参照)。
