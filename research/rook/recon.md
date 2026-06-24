# recon: Rook

調査メモ。Rook は Ceph を Kubernetes 上で運用する operator。ストレージ本体は書かず、既存の Ceph を CRD で宣言的にオーケストレーションするのが本質。

## 基本情報

- repo: `rook/rook` (<https://github.com/rook/rook>)
- pinned commit: `63eed4ed473c47f8efc6e26aefcd50ab16fffa3b` (committer date 2026-06-19) / 近いタグ: `v1.20.1` (2026-06-16) より後。master HEAD で graft clone (`--depth 1`)
- 言語 / ビルド: Go (`go 1.25.0`, `go.mod`) / `make build` (`Makefile:153`, 実体は `build/makelib/golang.mk:127` の `go build`)。`src/` は gitignored
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認、`gh api` の `spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Graduated (2020-10-07)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Storage & Database
- main entrypoint: `cmd/rook/main.go:28` の `main()`。単一バイナリ `rook` が cobra で operator / in-pod ヘルパ全コマンドを内包。`ceph operator` サブコマンドが operator 本体

## 歴史の素材

- 2016-07-08: GitHub repo 作成 (`gh api repos/rook/rook` の `created_at`)。創始者は Upbound CEO の Bassam Tabbara。初期スポンサーは Quantum。出典: <https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable>
- 2018-01-29: CNCF が 15 番目のホストプロジェクトとして受理。ストレージ系で初の CNCF プロジェクト。出典: <https://www.cncf.io/blog/2018/01/29/cncf-host-rook-project-cloud-native-storage-capabilities/>
- 設計思想: ストレージを新規実装せず、実績のある Ceph を cloud-native サービス化する方針。出典: 上記 CNCF blog および <https://rook.io/>
- v0.9 以前は Ceph に加え CockroachDB / Minio もサポート。その後 NFS / Cassandra / EdgeFS なども追加されたが、最終的に Ceph 一本へ収斂。Cassandra / NFS provider は別 repo へ分離。出典: <https://blog.upbound.io/rook-expands-support-for-additional-storage-solutions-ceph-support-moves-to-stable> と repo README
- 2020-10-07: CNCF Graduated に昇格。13 番目の卒業プロジェクトで block/file/object ストレージ系初。incubation 中に core repo の contributor が 90 から 279 へ 260% 増。2019-12 に CNCF Security SIG の監査 (High から Low まで 13 findings) を受け対応済み。出典: <https://www.cncf.io/announcements/2020/10/07/cloud-native-computing-foundation-announces-rook-graduation/>

## アーキテクチャの素材

- トップレベル: `cmd/`(CLI エントリ) と `pkg/` (apis / client / clusterd / daemon / operator / util / version)。CRD 型は `pkg/apis/ceph.rook.io/v1`、operator ロジックは `pkg/operator/ceph`
- operator の起動: `cmd/rook/ceph/operator.go:54` `startOperator` が `operator.New(...)` を作り `op.Run()` (`pkg/operator/ceph/operator.go:78`) を呼ぶ
- `Operator.Run` (`pkg/operator/ceph/operator.go:85`): `runCRDManager()` で controller-runtime manager を起動し、無限ループで OS シグナルを待つ。`SIGHUP` を受けると CRD manager 全体を停止して再起動する (`operator.go` の `case <-configChan`)。設定 ConfigMap 変更時に個別 reconciler をホットリロードせず manager ごと作り直すのが特徴
- 登録される controller 群: `pkg/operator/ceph/cr_manager.go:75` の `AddToManagerFuncs` に pool / object / file / nfs / rbd / client / nvmeof / mirror / csi / bucket / cosi など 20 以上。`cluster.Add` (CephCluster) は `cr_manager.go:113` で別途登録。`AddToManagerFuncsMaintenance` (`cr_manager.go:70`) は disruption 用
- 各 CRD ごとに 1 controller。Ceph 操作は Rook 自身が再実装せず、Ceph の mgr / CLI を pod 内で exec する形でオーケストレーションする (operator はコントロールプレーン、データパスは ceph-csi ドライバ)

## 内部実装の素材

代表的コア操作 = CephCluster CR の reconcile (クラスタ作成のエンドツーエンド):

1. `pkg/operator/ceph/cluster/controller.go:311` `ReconcileCephCluster.Reconcile`: controller-runtime からの入口。`RecoverAndLogException` で panic 回収し、内部 `reconcile` を呼び結果を `reporting.ReportReconcileResult` でステータス反映
2. `controller.go:320` `reconcile`: `r.client.Get` で CephCluster を取得 (`controller.go:329`)。`AddFinalizerIfNotPresent` (`:340`) で finalizer 付与。DeletionTimestamp があれば `reconcileDelete` (`:351`, 本体 `:389`) へ。`SkipReconcileLabelKey` ラベルがあればスキップ (`:356`)
3. `controller.go:369` `reconcileCephCluster` (本体 `:456`): `clusterMap` から namespace 毎の `*cluster` を取得/生成 (`newCluster` `cluster.go:78`)、spec を流し込み `initializeCluster` を呼ぶ (`:486`)
4. `pkg/operator/ceph/cluster/cluster.go:98` `reconcileCephDaemons`: オーケストレーション本体。config override ConfigMap 作成 → `preMonStartupActions` (`:110`) → `c.mons.Start(...)` で mon 起動 (`:117`) → cluster identity 確立確認 (`:128`) → `postMonStartupActions` (`:138`) → `mgr.New(...).Start()` で mgr (`:145`-`:146`) → `osd.New(...).Start()` で OSD (`:160`-`:161`) → stretch なら arbiter 設定 (`:168`)。各段階で `controller.UpdateCondition` により CR の status.conditions を `Progressing` に更新

中核データ構造:

- `CephCluster` (`pkg/apis/ceph.rook.io/v1/types.go:50`): トップ CRD。`Spec ClusterSpec` と `Status ClusterStatus`。kubebuilder マーカで shortName `ceph`、printcolumn に Health / FSID
- `ClusterSpec` (`types.go:100`): `CephVersion` / `Storage StorageScopeSpec` / `Network` / `Placement` / `Resources` など宣言的設定の塊
- `ClusterInfo` (`pkg/daemon/ceph/client/info.go:38`): 実行時のクラスタ identity。`FSID` / `MonitorSecret` / `CephCred` / `InternalMonitors map[string]*MonInfo` / `ExternalMons` / `CephVersion`。`Context context.Context` を構造体に埋め込み、reconcile ループのキャンセル判定に使う (`info.go:55-62` のコメント参照)
- `cluster` (`pkg/operator/ceph/cluster/cluster.go:64`): namespace 単位の内部オーケストレーション状態。`ClusterInfo` / `Spec` / `mons *mon.Cluster` / `monitoringRoutines sync.Map` / `observedGeneration`
- `ClusterController` (`pkg/operator/ceph/cluster/controller.go:86`): 全 CephCluster を束ねるコントローラ。`clusterMap` (namespace → `*cluster`) で多クラスタを保持

非自明な設計判断:

- operator は SIGHUP を受けると個別 reconciler を更新せず controller-runtime manager 全体を停止して作り直す (`operator.go:85` の `Run` ループ + `runCRDManager`)。設定 ConfigMap 変更を確実に全 controller へ波及させるため。進行中の orchestration は明示的にキャンセルされる ("cancelling all orchestrations!" ログ)
- `ClusterInfo.Context` を構造体メンバとして持ち回る理由: clusterd の共有 context だとキャンセル後の再生成で既存ループを巻き込むため、キャンセルされても即再生成される ClusterInfo 側に context を載せて reconcile ループ単位の停止判定を成立させる (`info.go:55-62`)

## 採用事例の素材

`ADOPTERS.md` (本番利用を公開した組織のみ記載) より:

- Calit2 (California Institute for Telecommunications and Information Technology): 既知最大級の Rook 本番クラスタの一つを運用。出典: `ADOPTERS.md`
- NAV (Norwegian Labour and Welfare Administration): ノルウェー国家予算の 1/3 を担う公的機関。Ceph クラスタ運用を簡素化。出典: `ADOPTERS.md`
- Replicated: OSS の kURL の標準アドオンとして Rook を同梱。出典: `ADOPTERS.md`
- Discogs: 世界最大級の音楽データベース/マーケットプレイス。出典: `ADOPTERS.md`
- 他に Finleap Connect / CENGN / Avisi / Gini / Cloudways / Alauda など。`ADOPTERS.md` 全件に記載
- 数値シグナル: GitHub stars 13,553 / forks 2,827 / contributors 約 384 (`gh api` 2026-06-22 取得。contributors は `per_page=1` の last page から算出)

## 代替・エコシステム

- 統合先: ceph-csi (実際のデータパス CSI ドライバ、operator が deploy)。Helm chart は `deploy/charts/rook-ceph` と `rook-ceph-cluster` の 2 段構成。Prometheus 連携 (mgr の prometheus exporter)、CSI スナップショット
- 提供プロトコル: RBD (ブロック) / CephFS (ファイル) / RGW (S3 互換オブジェクト) を単一製品で。NFS / NVMe-oF / object bucket / COSI も CRD で対応
- 代替: Longhorn (シンプル、edge/中規模向け)、OpenEBS (Mayastor で NVMe-oF 高速、cStor/Jiva で簡易)、Portworx (商用、アプリ認識スナップショットと DR)。本質的差は「Rook/Ceph はブロック+ファイル+オブジェクトを 1 製品で出せる代わりに CRUSH map や PG 等の学習コストと CPU オーバヘッドが最大」。出典: <https://onidel.com/blog/longhorn-vs-openebs-rook-ceph-2025> / <https://darumatic.com/blog/2025-k8s-storage-showdown>
- governance: GOVERNANCE.md + OWNERS.md。steering committee は Travis Nielsen (Red Hat) と Jared Watts (Independent/Upbound)。maintainer に leseb / BlaineEXE / satoru-takeuchi / subhamkrai / sp98 ら。Red Hat 系の比重が高い (Red Hat OpenShift Data Foundation の基盤)
- 最小セットアップ: `deploy/examples` の `crds.yaml` → `common.yaml` → `operator.yaml` を apply し operator 起動、続いて `cluster.yaml` (テストは `cluster-test.yaml`) で CephCluster を作成。確認は `toolbox.yaml` の pod から `ceph status`。Helm 派は `rook-ceph` chart で operator、`rook-ceph-cluster` chart でクラスタ。出典: <https://rook.github.io/docs/rook/latest-release/Getting-Started/intro/>
