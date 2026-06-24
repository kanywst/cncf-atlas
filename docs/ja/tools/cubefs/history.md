# 歴史

## 起源

CubeFS は 2017 年に JD.com (京东) 社内で、当初 ChubaoFS (中国語の「储宝」Chǔbǎo に由来) という名前の内製ファイルシステムとして始まりました。創設者でリードメンテナは Haifeng Liu です (S5, S6)。設計は SIGMOD 2019 で「CFS: A Distributed File System for Large Scale Container Platforms」(Liu et al., DOI 10.1145/3299869.3314046、プレプリント arXiv 1911.03001) として発表されました (S7, S8)。動機はコンテナ基盤での compute/storage 分離です。compute Pod はステートレスにし、耐久性のある状態は共有ファイルシステムに置きます。論文は対象ワークロードにおいてメタデータ操作のスループットが Ceph の約 3 倍だと主張しています (S7)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2017 | JD.com 社内で ChubaoFS として誕生 |
| 2019 | SIGMOD 論文発表。JD.com が ChubaoFS を CNCF へ寄贈。2019-12-16 に Sandbox 受理 (S3, S4, S7) |
| 2020 | OPPO がプロモータ/コントリビュータとして参加 (S5) |
| 2022 | incubation 時に ChubaoFS から CubeFS へリネーム。2022-07-03 に Incubating 昇格 (S4, S5) |
| 2024 | CNCF TOC が 2024-12-11 に卒業を承認 (S3, S4) |
| 2025 | 2025-01-21 に卒業を公式発表 (S3, S4) |

## どう進化したか

最も目立つ転換はリネームです。2022 年の incubation 申請時に、メンテナは ChubaoFS が英語で発音しづらいと判断し CubeFS に改名しました (S5)。旧名の痕跡は、`chubao-fs` や `clomonitor.io/projects/cncf/chubao-fs` を参照するリポジトリのバッジ URL に残っています。

命名以外では、単一の複製エンジンから 2 つのストレージエンジンへ拡張しました。BlobStore (`blobstore/`) は、元からある強整合な multi-replica パスに加えて、超大規模・低コストの容量を狙うイレイジャーコーディングのパスを追加しました。補助ロールも順次追加されました。認証の AuthNode、Web UI の Console、ライフサイクルの lcnode、flashnode と flashgroupmanager から成る分散キャッシュです。これらはいずれも同じ `cfs-server` バイナリのロールです (`cmd/cmd.go:71-93`)。

## 現在地

CubeFS は 2025 年 1 月時点で CNCF Graduated プロジェクトです (S3)。CNCF は、Sandbox から卒業までの期間で採用組織が約 10 から 200 超に増え、発表時点で約 350 PB を管理していると報告しています (S3, S4)。CNCF が報告するコントリビュータ数は 42 社にまたがり 27 から 379 へ増加しました (S3, S4)。ドキュメント基準コミット時点での最新リリースは 2025-12-23 付の v3.5.3 です (S10)。ここで扱う master HEAD はそのタグより先にあります。
