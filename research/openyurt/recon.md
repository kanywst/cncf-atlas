# recon: OpenYurt

調査メモ。エンジニア自分用、密度優先。出典は URL 付き、コードは `path:line` で固定。

## 基本情報

- repo: [openyurtio/openyurt](https://github.com/openyurtio/openyurt)
- pinned commit: `f01cbf5655383d1c695cfb72097827bc9d22fb8b` (2026-06-22) / 近いタグ: `v1.7.0` (2026-05-06、HEAD はその 1 リリース先)
- 言語 / ビルド: Go (`go 1.25.0`, `go.mod:3`) / `make build` (Makefile)、コンテナは `make docker-build`
- ライセンス: Apache License 2.0 (`LICENSE:1` にフルテキスト、`gh` の `licenseInfo.key=apache-2.0` で確認)
- CNCF 成熟度: Incubating (2025-07-02 昇格、後述)
- カテゴリ (tools.ts の CATEGORY_ORDER から): Orchestration & Scheduling
- メイン entrypoint: `cmd/yurthub/yurthub.go:27` の `app.NewCmdStartYurtHub(...)` から `cmd.Execute()`。他に `cmd/yurt-manager`, `cmd/yurtadm`, `cmd/yurt-tunnel-server|agent`, `cmd/yurt-iot-dock`, `cmd/yurt-node-servant` の計 7 バイナリ
- 一行要約 (en): Extend a vanilla Kubernetes control plane to edge nodes with offline autonomy, keeping the upstream API intact.
- 一行要約 (ja): 素の Kubernetes をそのまま使い、エッジノードにオフライン自律と地域分割を足すクラウドエッジ基盤。

## 歴史の素材

- 2020-05、Alibaba Cloud が OSS 化。最初のリリースは 2020-05-29 の `v0.1.0-beta.1` (`README.md:16-17`)。出典: [CNCF blog (2025-07-02)](https://www.cncf.io/blog/2025/07/02/openyurt-becomes-a-cncf-incubating-project/) は "Originally open-sourced by Alibaba Cloud in May 2020" と記載。
- 2020-09、CNCF Sandbox 入り。出典: [CNCF project page](https://www.cncf.io/projects/openyurt/)、上記 CNCF blog (Sandbox entry September 2020)。
- 2025-07-02、CNCF Incubating に昇格。出典: [CNCF blog: OpenYurt Becomes a CNCF Incubating Project](https://www.cncf.io/blog/2025/07/02/openyurt-becomes-a-cncf-incubating-project/)。
- 現行は `v1.7.0` (2026-05-06、`README.md:5` バッジ + `README.md:15`)。Kubernetes は v1.34 まで認証済み (`README.md:53`)。
- マイルストーン: edge autonomy (YurtHub ローカルキャッシュ) が初期の中核。後に NodePool / YurtAppSet による region-aware deployment、Raven による edge-edge L3 接続、YurtIoTDock による EdgeX 連携、直近で NodePool 単位の leader YurtHub による pool-scope metadata 共有を追加。

## アーキテクチャの素材

クラシックな cloud-edge 構成。クラウドに通常の Kubernetes control plane を置き、エッジノード群を管理する。エッジノードは物理リージョン単位でまとまり、これを `Pool` と呼ぶ (`README.md:31-34`)。

主要コンポーネント (`README.md:42-50`):

- YurtHub: 各 worker ノードで static pod として動くノードサイドカー。kubelet / kube-proxy 等から kube-apiserver への全リクエストを横取りするリバースプロキシ兼ローカルキャッシュ。`pkg/yurthub/` 配下。
- Yurt-Manager: エッジ向け controller と webhook の集合。`pkg/yurtmanager/controller/` に nodepool / yurtappset / nodelifecycle / csrapprover / raven / platformadmin / hubleader など。
- Raven-Agent: edge-edge / edge-cloud の L3 接続。`pkg/apis/raven/` の Gateway CRD で駆動。
- YurtIoTDock: NodePool ごとに 1 つ、EdgeX Foundry をブリッジしデバイスを CRD 管理。`pkg/apis/iot/`。

YurtHub のリクエストフロー (中核オペレーションを end-to-end で追う):

1. `cmd/yurthub/yurthub.go:27` でコマンド起動、`cmd/yurthub/app/start.go:94` の `Run` がキャッシュ・証明書・ヘルスチェッカ・プロキシハンドラを組み立てる。`start.go:128` で `cachemanager.NewCacheManager(...)`、`start.go:172` で `proxy.NewYurtReverseProxyHandler(...)`、`start.go:184` で `server.RunYurtHubServers(...)`。
2. 受信は `pkg/yurthub/proxy/proxy.go:149` の `ServeHTTP`。先頭で readiness check (`proxy.go:152-162`)。
3. 通常リクエスト (`proxy.go:212` の `default`) は `p.loadBalancer.PickOne(req)` で健全なクラウド apiserver backend を取る (`proxy.go:214`)。取れれば `backend.ServeHTTP` でクラウドへ転送。取れない (オフライン) なら `proxy.go:217` で `p.localProxy.ServeHTTP` に落ち、ローカルキャッシュから応答する。これが edge autonomy。
4. クラウドへ転送した場合、応答は `pkg/yurthub/proxy/remote/loadbalancer.go:352` の `modifyResponse` フックを通る。2xx なら必要に応じて response filter を適用し (`loadbalancer.go:387-407`)、`loadbalancer.go:409-412` で `cacheResponse` を呼ぶ。
5. `loadbalancer.go:431` の `cacheResponse` が肝。`hubutil.NewDualReadCloser` (`pkg/yurthub/util/util.go:284`) でレスポンスボディを tee し、片方をクライアントへ素通し、もう片方を goroutine (`loadbalancer.go:437-442`) で `localCacheMgr.CacheResponse` に流してディスクへ保存。
6. 転送中にエラーが起きると `loadbalancer.go:333` の `errorHandler` が動き、get/list なら `localCacheMgr.QueryCache(req)` でキャッシュを返す (`loadbalancer.go:343-346`)。

設計判断 (非自明): pool-scope metadata の leader YurtHub 共有。`services` と `discovery.k8s.io/endpointslices` はデフォルトで pool scope 扱い (`cmd/yurthub/app/options/options.go:126-129`)。全ノードの YurtHub が個別にこれらを cloud apiserver から list/watch すると WAN 越しに負荷が爆発するため、NodePool ごとに leader YurtHub を選出し (`pkg/yurtmanager/controller/hubleader/`, `pkg/yurthub/proxy/multiplexer/`)、leader だけがクラウドから取得、follower は `loadBalancerForLeaderHub` 経由で leader hub から取る (`proxy.go:171-189`)。`multiplexer` がプール内で一本の list/watch を多重化する。普通の per-node キャッシュと違い、エッジ WAN を意識した最適化になっている。

## 内部実装の素材

中核データ構造:

- `storage.KeyBuildInfo` (`pkg/yurthub/storage/key.go:25-32`): キャッシュキーの素。`Component`, `Namespace`, `Name`, `Resources`, `Group`, `Version`。
- ディスク上のキー生成 `diskStorage.KeyFunc` (`pkg/yurthub/storage/disk/key.go:47`)。レイアウトはコメント (`key.go:42-44`) と実装 (`key.go:64-77`) で `<Component>/<Resource.Version.Group>/<Namespace>/<Name>` (namespaces リソースは name のみ)。コンポーネント別ディレクトリに per-object ファイルとして保存。`Store` インタフェースは `pkg/yurthub/storage/store.go:31` で `Create/Delete/Get/List/Update/KeyFunc/ReplaceComponentList`。
- `dualReadCloser` (`pkg/yurthub/util/util.go:295-336`): `io.Pipe` を内部に持ち、`Read` (`util.go:306`) で読んだバイトをそのまま pipe writer にも書く tee。キャッシュ書き込みがクライアント応答をブロックしない設計の核。
- `NodePoolSpec` (`pkg/apis/apps/v1beta2/nodepool_types.go:42`): `Type` (`Edge`/`Cloud`, `nodepool_types.go:24-31`), `HostNetwork`, `Labels`, `Taints` など。Pool = 物理リージョン抽象。
- `GatewaySpec` (`pkg/apis/raven/v1beta1/gateway_types.go:64`): Raven の L3 トンネル設定。`Endpoints []Endpoint`, 各 Endpoint に `NodeName` (`gateway_types.go:80-81`)、`Subnets []string` (pod IP range, `gateway_types.go:104-105`)。

CRD グループ: `apps` (NodePool/YurtAppSet, v1alpha1/v1beta1/v1beta2)、`iot` (PlatformAdmin/Device, v1alpha1/v1alpha2/v1beta1)、`network` (PoolService)、`raven` (Gateway)、`calico`。`pkg/apis/` 配下。

CacheManager 本体: `pkg/yurthub/cachemanager/cache_manager.go:112` `CacheResponse` (decode して `saveOneObject` at `:136/:567`)、`:140` `QueryCache`。`CanCacheFor` でキャッシュ対象か判定。

追う価値のあるパス: オフライン時の get/list 復元 (`loadbalancer.go` の `errorHandler` + `local` proxy)、404 時の CRD ローカル削除 (`loadbalancer.go:413-427`)、watch の `Transfer-Encoding: chunked` 再付与 (`loadbalancer.go:364-370`)。

## 採用事例の素材

- 出典 [CNCF blog (2025-07-02)](https://www.cncf.io/blog/2025/07/02/openyurt-becomes-a-cncf-incubating-project/): maintainer が 3 から 9 に増加、所属は Microsoft, Alibaba, VMware, Intel, Inspur, Sangfor, Tongji University。contributors 170。"adoption from startups to major carriers" とあるが blog 本文に具体企業名の列挙はなし。
- GitHub 統計 (2026-06-25, `gh repo view openyurtio/openyurt`): stars 1968, forks 427, primaryLanguage Go。contributors は GitHub API のページネーション (`repositories/265800635/contributors?per_page=1&anon=true` の last page=153) から anon 込みで約 150 強。
- 具体的な named adopter はメイン repo の root に `ADOPTERS.md` が無く、blog も企業名を挙げないため、捏造せず未確認とする。community repo / website の ADOPTERS を別途確認する余地あり。

## 代替・エコシステム

- 直接の代替: [KubeEdge](https://kubeedge.io) (CNCF Incubating)。両者ともエッジ向け Kubernetes だが、KubeEdge は CloudCore/EdgeCore の独自プロトコル + MQTT デバイス層で control plane を再実装気味。OpenYurt は upstream Kubernetes を改変せず YurtHub サイドカー + controller の付加で済ます non-intrusive 路線が本質的な差 (`README.md:24-25` の "preserves intact Kubernetes API compatibility")。
- 他の隣接: [SuperEdge](https://superedge.io)、[k3s](https://k3s.io) (軽量ディストロ、エッジ自律とは方向が別)。
- エコシステム/統合: EdgeX Foundry (YurtIoTDock 経由のデバイス管理)、Raven による L3 メッシュ、Helm chart 同梱 (`charts/yurt-manager`, `charts/yurthub`, `charts/yurt-iot-dock`)、`yurtadm` でノード join/reset/token/renew (`pkg/yurtadm/cmd/`)。CNI は flannel 等を `HostNetwork` オプションで許容 (`nodepool_types.go:47-51`)。

## install + 最小構成

1. 既存の Kubernetes クラスタ (cloud control plane) を用意。OpenYurt は v1.34 まで認証 (`README.md:53`)。
2. Helm で制御系を入れる。`charts/yurt-manager` と `charts/yurthub` が同梱で、`helm install yurt-manager ...` / `helm install yurthub ...` 相当。
3. エッジノードを参加させる。`yurtadm join <apiserver>:<port> --token=<token> --node-type=edge ...` (`pkg/yurtadm/cmd/join`)。離脱は `yurtadm reset`。
4. 公式手順は [openyurt.io installation](https://openyurt.io/docs/installation/summary) の Part 2 Join Nodes (`README.md:57`)。
