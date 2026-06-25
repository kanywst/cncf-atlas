# 歴史

## 起源

Alibaba Cloud が 2020 年 5 月に OpenYurt を OSS 化した。最初のリリース `v0.1.0-beta.1` は 2020 年 5 月 29 日に出た (`README.md:15-17`)。CNCF ブログは「2020 年 5 月に Alibaba Cloud が originally open-sourced した」と記録している。出発点の課題は Kubernetes 上のエッジコンピューティングだ。単一のクラウドコントロールプレーンが接続を失うサイトのノードを管理する必要があり、チームは upstream Kubernetes を fork せずにこれを実現したかった。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | 初回リリース `v0.1.0-beta.1` (5 月 29 日)、CNCF Sandbox 入り (9 月) |
| 2025 | CNCF Incubating に昇格 (7 月 2 日) |
| 2026 | `v1.7.0` リリース (5 月 6 日)、Kubernetes 1.34 まで認証 |

## どう進化したか

最初はエッジ自律だった。YurtHub のローカルキャッシュにより、エッジノードはクラウド切断を生き延びられた。その後にリージョン対応を加えた。物理リージョン単位の配置のための NodePool と YurtAppSet、エッジ間・エッジクラウド間の L3 接続のための Raven、EdgeX Foundry デバイスを Kubernetes CRD に橋渡しする YurtIoTDock だ (`README.md:42-50`)。

より新しい転換は WAN コストへの対処だ。`services` や `discovery.k8s.io/endpointslices` などの pool-scope リソースは、いまや各ノードが個別にクラウド apiserver を list/watch するのではなく、NodePool ごとに選出された leader YurtHub を通して共有される (`cmd/yurthub/app/options/options.go:126-129`)。

## 現在地

現行リリースは `v1.7.0` (2026 年 5 月 6 日) で、Kubernetes 1.34 まで認証されている (`README.md:53`)。CNCF Incubating 到達時、CNCF ブログはメンテナが 3 人から 9 人に増えたと報告した。所属は Microsoft、Alibaba、VMware、Intel、Inspur、Sangfor、Tongji University で、コントリビュータは約 170 人。プロジェクトの掲げる方向性は一貫している。API を侵さずに素の Kubernetes をエッジへ拡張することだ。
