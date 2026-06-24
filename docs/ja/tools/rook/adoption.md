# 採用事例・エコシステム

## 誰が使っているか

プロジェクトの [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) には、本番利用を公開した組織だけが記載される。以下はそこから挙げた採用企業である。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Calit2 | 既知最大級の Rook 本番クラスタの 1 つを運用 | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| NAV (Norwegian Labour and Welfare Administration) | ノルウェー国家予算の約 1/3 を担う公的機関。Rook で Ceph 運用を簡素化 | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| Replicated | OSS の kURL インストーラの標準アドオンとして Rook を同梱 | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| Discogs | 世界最大級の音楽データベース/マーケットプレイスの裏で Rook を運用 | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| Gini | 冗長な S3 互換ストレージのために Ceph を Rook で利用 | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |
| Alauda | コンテナプラットフォーム製品 (ACP) のデータサービスに Rook Ceph を利用 | [ADOPTERS.md](https://github.com/rook/rook/blob/master/ADOPTERS.md) |

ADOPTERS.md には Finleap Connect・CENGN・Avisi・Cloudways などさらに多くの組織が記載されている。

## 採用のシグナル

2026-06-22 に GitHub API から計測: スター約 13,553、fork 2,827、コントリビュータ約 384 (コントリビュータ数は `per_page=1` クエリの最終ページから算出) ([rook/rook](https://github.com/rook/rook))。Rook は 2020 年に block・file・object ストレージで初の CNCF Graduated に到達した ([CNCF 卒業発表](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/))。

## エコシステム

Rook は [ceph-csi](https://github.com/ceph/ceph-csi) を deploy し、これに依存する。ceph-csi は払い出されたボリュームの実データパスを担う CSI ドライバである。インストールは 2 チャート構成で、`rook-ceph` Helm chart がオペレータを、`rook-ceph-cluster` chart がクラスタを作る。どちらも `deploy/charts` 配下にある ([Getting Started](https://rook.github.io/docs/rook/latest-release/Getting-Started/intro/))。Rook は Ceph mgr の exporter を通じて Prometheus と連携し、CSI スナップショットに対応する。CRD を通じて RBD (ブロック)・CephFS (ファイル)・RGW (S3 互換オブジェクト) を単一製品から提供し、加えて NFS・NVMe-of・object bucket・COSI も扱う。

## 代替候補

Rook と Ceph はブロック・ファイル・オブジェクトストレージを 1 つのシステムから提供する。代償は運用面にある。CRUSH map、placement group、そして軽量な代替より高い CPU・メモリのフットプリントだ ([onidel 比較](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025), [darumatic 比較](https://darumatic.com/blog/2025-k8s-storage-showdown))。

| 代替 | 違い |
| --- | --- |
| Longhorn | edge や中規模クラスタ向けのシンプルなブロックストレージ。学習コストがはるかに低いが、オブジェクト/ファイルを 1 製品で出せない ([onidel](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025)) |
| OpenEBS | Mayastor エンジンは高速な NVMe-of を狙い、cStor・Jiva エンジンは簡易構成を狙う ([onidel](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025)) |
| Portworx | アプリケーション認識スナップショットと DR を備えた商用製品 ([darumatic](https://darumatic.com/blog/2025-k8s-storage-showdown)) |
