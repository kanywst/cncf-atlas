# Rook

> Ceph ストレージシステムを Kubernetes のカスタムリソースに変換するオペレータ。ブロック・ファイル・オブジェクトストレージを、他の Kubernetes オブジェクトと同じように宣言し reconcile する。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [rook/rook](https://github.com/rook/rook)
- **ドキュメント基準コミット**: `63eed4e` (2026-06-19, `master`)

## 何をするものか

Rook は [Ceph](https://ceph.io) を Kubernetes 上で動かすためのオペレータである。ストレージエンジンを自前で実装しているわけではない。実績のある分散ストレージシステムである Ceph をパッケージ化し、CRD (Custom Resource Definition) を通じて駆動する。管理者は望むクラスタ構成を YAML で宣言し、Rook は稼働中の Ceph デーモンをその状態へ向けて reconcile する。

プロジェクト全体は `rook` という単一の Go バイナリとして出荷される。その `ceph operator` サブコマンドがオペレータ本体を動かし、それ以外のサブコマンドは pod 内のヘルパとして機能する (`cmd/rook/main.go:27`)。オペレータはストレージの概念ごとに 1 つずつコントローラ (pool、filesystem、object store など) を登録し、各カスタムリソースを Ceph の monitor・manager・OSD と、実データパスを担う CSI ドライバへ翻訳する。

位置づけはクラスタのストレージ層である。アプリケーションが PersistentVolumeClaim を要求すると、Ceph CSI ドライバが Rook の構成したプールからそれを払い出し、Rook はノードやディスクの増減に合わせて下層の mon/mgr/OSD トポロジを健全に保つ。

## いつ使うか

- ブロック・ファイル・S3 互換オブジェクトストレージを単一システムから、すべて Kubernetes 内で払い出したいとき。
- Ceph を動かしたいが、そのデーモン・keyring・アップグレードを手で管理したくないとき。
- マネージドストレージが使えないオンプレや複数クラウドノードで、ステートフルなワークロードを動かすとき。
- ボリューム種別が 1 つで足り、運用のシンプルさを優先したいときは避ける。Longhorn のような軽量プロジェクトの方が、Ceph の CRUSH map や placement group の学習コストよりずっと安い。
- Ceph の CPU・メモリオーバーヘッドが利得を上回るような極小クラスタでは避ける。

## このディープダイブの構成

- [歴史](./history): Upbound での起源、CNCF への移行、Ceph への収斂。
- [アーキテクチャ](./architecture): オペレータ、そのコントローラ群、CephCluster の reconcile。
- [採用事例・エコシステム](./adoption): 出典のある採用企業、シグナル、代替候補。
- [内部実装](./internals): ソースから読んだ CephCluster の reconcile パス。
- [はじめに](./getting-started): オペレータのインストールと最初のクラスタ作成。

## 出典

1. [rook/rook GitHub repository](https://github.com/rook/rook)
2. [Rook Ceph Documentation (Getting Started)](https://rook.github.io/docs/rook/latest-release/Getting-Started/intro/)
3. [CNCF to host the Rook project](https://www.cncf.io/blog/2018/01/29/cncf-host-rook-project-cloud-native-storage-capabilities/)
4. [CNCF Announces Rook Graduation](https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/)
5. [Rook Expands Support, Ceph Moves to Stable (Upbound)](https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable)
6. [Rook.io homepage](https://rook.io/)
7. [Longhorn vs OpenEBS vs Rook-Ceph 2025 (onidel)](https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025)
8. [Kubernetes Storage Showdown 2025 (darumatic)](https://darumatic.com/blog/2025-k8s-storage-showdown)
9. [ADOPTERS.md (rook/rook)](https://github.com/rook/rook/blob/master/ADOPTERS.md)
10. [OWNERS.md / GOVERNANCE.md (rook/rook)](https://github.com/rook/rook/blob/master/OWNERS.md)
