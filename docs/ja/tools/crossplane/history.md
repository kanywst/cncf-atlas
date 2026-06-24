# 歴史

## 起源

Crossplane は 2018 年に Upbound が「universal multicloud control plane」として作成した。GitHub リポジトリの作成は 2018-09-08。狙いは、独立した CLI と state ファイルではなく Kubernetes API を通じてクラウドをまたいでインフラを管理することだった。起源とマイルストーンは [CNCF graduation ブログ](https://blog.crossplane.io/crossplane-cncf-graduation/) に記されている。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2018 | Upbound が作成し OSS 化。リポジトリ作成は 2018-09-08 |
| 2020 | 2020-06-25 に CNCF Sandbox に受理 |
| 2021 | 2021-09-14 に CNCF Incubating へ昇格。v1.0 到達が節目 |
| 2025 | 8 月にアーキテクチャを刷新した v2.0 をリリース |
| 2025 | CNCF が graduated 認定 (2025-10-28 graduated、2025-11-06 公表) |

## どう進化したか

大きなアーキテクチャの転換は 2025 年 8 月の Crossplane v2 である。patch-and-transform composition を削除し、各ステップが gRPC サービスである完全な function ベースの composition にした。v2 は namespaced な composite resource と任意の Kubernetes リソースを composition する機能も追加し、claim を deprecated とした。これらの変更は [What's New in v2](https://docs.crossplane.io/latest/whats-new/) に説明がある。

ガバナンスとプロジェクト基盤もコードと並行して成熟した。graduation には、第三者によるセキュリティ監査 2 回、vendor-neutral なガバナンス、OpenSSF Best Practices badge、LTS ポリシー、リリース基盤の CNCF 所有への移管、そしてコミュニティレジストリ `xpkg.crossplane.io` の開設が要件だった。これらの要件は [CNCF graduation announcement](https://www.cncf.io/announcements/2025/11/06/cloud-native-computing-foundation-announces-graduation-of-crossplane/) と [graduation ブログ](https://blog.crossplane.io/crossplane-cncf-graduation/) に列挙されている。プロセスを追跡した申請は [cncf/toc#1397](https://github.com/cncf/toc/issues/1397) である。

## 現在地

Crossplane は CNCF Graduated プロジェクトである。ドキュメント基準コミット時点の最新安定リリースは `v2.3.2` (2026-06-09)。pin した `main` HEAD はそのリリースの後、`v2.4.0-rc.0` の前に位置する。パッケージ配布は graduation の一環でコミュニティレジストリ `xpkg.crossplane.io` へ移った。成熟度の年表は [CNCF project page](https://www.cncf.io/projects/crossplane/) が追っている。
