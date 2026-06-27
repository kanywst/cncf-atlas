# 採用事例・エコシステム

## 誰が使っているか

リポジトリには 1 組織を記した `ADOPTERS.md` が同梱されている。プロジェクトを始めた会社である BoCloud が本番採用組織として自身を挙げ、顧客が Carina を本番・テスト環境で何年も、典型的にはクラウドネイティブミドルウェア向けに動かしてきたと述べている (`ADOPTERS.md:9`)。そこに他の組織の記載はなく、独立した CNCF ケーススタディも存在しないため、公開された採用リストは短く自己申告である。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| BoCloud (BeyondCent) | ローカルディスク上のクラウドネイティブミドルウェア、本番・テスト | [ADOPTERS.md](https://github.com/carina-io/carina/blob/main/ADOPTERS.md) |

## 採用のシグナル

採用組織リストが薄いため、GitHub シグナルがより有用な尺度になる。2026-06-26 時点で GitHub REST API はおよそ 724 スター、86 フォーク、約 20 コントリビュータ、40 のオープン issue を報告する。最新リリースは v0.14.0 (2025-04-16) で、最終 push も同じ週、2025 年 4 月以降コミットが止まっており、メンテナンスの鈍化を示す。プロジェクトは OpenSSF (Open Source Security Foundation) Best Practices バッジプログラムに project 6908 として登録し、FOSSA ライセンススキャンバッジを掲示する。いずれも README からリンクされている。

## エコシステム

- **標準 CSI (Container Storage Interface)**: ボリュームは `provisioner: carina.storage.io` の通常の StorageClass で要求する (`deploy/kubernetes/storageclass-lvm.yaml:6`)。
- **kube-scheduler フレームワーク**: スケジューラプラグインは別スケジューラではなく `Filter`・`Score` 拡張として統合する。
- **Prometheus**: メトリクスは `pkg/metrics` にあり、ServiceMonitor マニフェストは `deploy/kubernetes/prometheus-service-monitor.yaml` にある。
- **Linux ストレージスタック**: LVM2 (Logical Volume Manager) と、階層化のための bcache カーネルモジュールの上に直接構築される。

## 代替候補

Carina は LVM ベースのローカル CSI 系統に属する。最も近い同類は各ノードのローカルディスクを管理する。下記の分散システムはネットワーク越しのレプリケーションという別アプローチを取る。

| 代替 | 違い |
| --- | --- |
| TopoLVM | Carina が従う、CRD 仲介・スケジューラ拡張のローカル LVM CSI の原型。Carina は raw パーティションとホストパスのボリュームタイプ、bcache 階層化を追加する。 |
| OpenEBS LocalPV-LVM | 同じく LVM ベースのローカルプロビジョニングで、広い OpenEBS スイートの一部。Carina はより狭くデータベース特化。 |
| HwameiStor | もう 1 つのローカルディスク CSI 系統。OpenEBS・Carina・TopoLVM を同カテゴリに並べる比較表を公開している。 |
| Rook/Ceph、Longhorn、CubeFS | 可用性のためネットワーク越しにレプリケーションする分散ストレージ。Carina はローカルの生性能のためあえてデータを 1 ノードに置く。 |
