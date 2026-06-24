# recon: istio

調査メモ。istiod (Go 制御プレーン) を中心に実コードを読んだ。出典は URL を添える。path:line は pinned commit 基準。

## 基本情報

- repo: `istio/istio` (<https://github.com/istio/istio>)
- pinned commit: `58e9892e6a60d635c1f661c95f0004f52867b379` (2026-06-20, master)
- 近いタグ: 直近リリースタグは `1.30.1`。pin は master HEAD で `VERSION` ファイルは `1.31` (開発中、未リリース)。
- 言語 / ビルド: Go (`go 1.26.0`, `go.mod:3`) / `make build` (`Makefile.core.mk:240`)。データプレーン proxy は Envoy (C++)、ambient の ztunnel は Rust で別リポ `istio/ztunnel`。
- ライセンス: Apache-2.0。`LICENSE` 冒頭が `Apache License Version 2.0` (`LICENSE:1`)、`gh api` の `spdx_id` も `Apache-2.0`。
- CNCF 成熟度: Graduated (2023-07-12)。
- カテゴリ: Service Mesh & Networking。
- 主要バイナリ (`Makefile.core.mk:211-228`): `pilot-discovery` (= istiod 本体), `pilot-agent` (sidecar 内エージェント), `istioctl` (CLI), `istio-cni`。entrypoint は `pilot/cmd/pilot-discovery/main.go:27` から `app.NewRootCommand()` (`pilot/cmd/pilot-discovery/app/cmd.go:41`)。
- 採用規模: GitHub stars 38,237 / forks 8,329 / open issues 471 (gh api, 2026-06-22)。contributors は anon 含め 1,400 超 (contributors API `anon=true` の last page=1432)。

## 歴史の素材

- 2016 に Google が自社の本番通信パターンを基に、IBM の OSS のトラフィック管理と Lyft の Envoy proxy を組み合わせて開発開始。Envoy が先に OSS 化され Google が採用 (当初は Nginx 想定だった)。出典: Tetrate "How the Istio Service Mesh Became Critical Infrastructure" (<https://tetrate.io/blog/how-the-istio-service-mesh-became-critical-infrastructure-for-cloud-native-applications>)。
- 2017-05 に Google / IBM / Lyft が Istio 0.1 を公開。sidecar 方式の traffic management と policy と observability を service mesh として確立。
- 2018-07 に 1.0。
- 2022-09-28 に CNCF Incubating として受理。Google が donate したのは graduation の約1年前で、Kubernetes と比べ donate が遅かった点が当時話題に。出典: CNCF blog "Istio sails into the CNCF" (<https://www.cncf.io/blog/2022/09/28/istio-sails-into-the-cloud-native-computing-foundation/>)。
- 2023-07-12 に CNCF Graduated。Kubernetes / Prometheus / Linkerd と並ぶ最高成熟度に。出典: CNCF announcement (<https://www.cncf.io/announcements/2023/07/12/cloud-native-computing-foundation-reaffirms-istio-maturity-with-project-graduation/>), TechCrunch (<https://techcrunch.com/2023/07/12/istio-graduates/>)。
- 2022 以降 sidecarless の ambient mesh を導入、2025 に GA。ztunnel (Rust, per-node L4) と waypoint (任意の per-namespace/service Envoy で L7) の二層。出典: Istio blog "Istio: The Highest-Performance Solution for Network Security" (<https://istio.io/latest/blog/2025/ambient-performance/>)。
- 名前はギリシャ語で「帆」。Kubernetes 海事テーマの流れ。

## アーキテクチャの素材

二層構成。control plane = istiod、data plane = Envoy sidecar (または ambient の ztunnel/waypoint)。istiod が k8s API や設定 CRD を監視し、Envoy 用設定を xDS (gRPC) で配信する。

トップレベル (`research/istio/src` 直下):

- `pilot/` … istiod 本体。設定モデル、service registry、xDS 生成・配信。
- `istioctl/` … CLI。install / analyze / proxy-config など。
- `security/` … CA (Citadel 相当)、SPIFFE ベースの workload 証明書発行。
- `cni/` … sidecar/ambient 用のトラフィックリダイレクトを設定する CNI plugin。
- `operator/`, `manifests/` … Helm chart と install 用 manifest/profile。
- `pkg/` … 共有ライブラリ (kube client, xDS サーバ骨格 `pkg/xds/server.go` など)。
- `architecture/` … 設計ドキュメント (ambient, networking, security, environments)。

代表オペレーション「設定変更から全 Envoy への xDS push」を end-to-end で追った (`pilot/pkg/xds`)。

1. 設定変更 (k8s の VirtualService 等) が controller 経由で `DiscoveryServer.ConfigUpdate(req)` を呼ぶ。`req` を `pushChannel` に流すだけ (`pilot/pkg/xds/discovery.go:323-343`)。Endpoints 以外なら理由をログ。Address kind なら xDS cache を clear。
2. `handleUpdates` が `debounce()` に委譲 (`discovery.go:350-352`)。debounce は連続イベントを最小静穏時間 `DebounceAfter` と最大遅延 `debounceMax` の窓で1本に集約し、複数の `PushRequest` を merge する (`discovery.go:355-400`)。thundering herd 回避の要。
3. 集約後 `s.Push(req)` (`discovery.go:288-307`)。旧 `PushContext` を退避し `NextVersion()` で版を採番、`initPushContext` で新しい不変スナップショット `PushContext` を構築。`req.Push` に載せて `AdsPushAll(req)`。
4. `AdsPushAll` から `StartPush` が接続中の全 client を走査し `pushQueue.Enqueue(p, req)` (`pilot/pkg/xds/ads.go:566-593`)。
5. 別 goroutine の `sendPushes` から `doSendPushes` が `concurrentPushLimit` セマフォで同時 push 数を絞りつつ queue から取り出す (`discovery.go:547-549`, `discovery.go:481`)。
6. 各接続で `pushConnection(con, ev)` (`ads.go:478-503`)。`computeProxyState` で proxy 状態更新後、`ProxyNeedsPush` で「この proxy に push 不要なら skip」を判定 (sidecar scope による絞り込み)。必要なら watched resource を `PushOrder` (CDS から EDS, LDS, RDS, SDS の順, `ads.go:505-518`) で `pushXds`。
7. `pushXds(con, w, req)` (`pilot/pkg/xds/xdsgen.go:112-195`) が TypeUrl に対応する generator を `findGenerator` で引き、`gen.Generate(proxy, w, req)` で Envoy リソース生成。delta なら subscribed 分のみ生成。`DiscoveryResponse` を組み (VersionInfo = PushVersion, Nonce = PushVersion + uuid) `xds.Send(con, resp)` で gRPC stream に書き込む。

ACK/NACK は逆方向。Envoy が nonce 付き request を返し `processRequest` (`ads.go:139`) から `Stream` (`ads.go:187`) で処理。`WatchedResource.NonceSent`/`NonceAcked` で同期状態を判定する。

## 内部実装の素材

中核データ構造:

- `DiscoveryServer` (`pilot/pkg/xds/discovery.go:65`) … xDS サーバ本体。`Generators map[string]XdsResourceGenerator`, `pushChannel`, `pushQueue *PushQueue`, `adsClients map[string]*Connection` + mutex, `Cache model.XdsCache`, `Env *model.Environment`, `concurrentPushLimit chan struct{}`, `DebounceOptions`。debounce 入口と push 出口を分離する設計がここに集約。
- `PushContext` (`pilot/pkg/model/push_context.go:205`) … 1回の push 用の不変スナップショット。`ServiceIndex`, `virtualServiceIndex`, `destinationRuleIndex`, `gatewayIndex`, `sidecarIndex`, `AuthnPolicies`, `AuthzPolicies`, `Telemetry`, `Mesh` などを索引化して保持。設定変更ごとに丸ごと作り直す。
- `PushRequest` (`push_context.go:359-389`) … push の単位。`ConfigsUpdated sets.Set[ConfigKey]` (空なら全 proxy 対象、非空なら依存 proxy のみ = 絞り込み最適化)、`Push *PushContext`, `Reason ReasonStats`, `Delta ResourceDelta`, `Forced bool`。debounce 時に merge される。
- `Proxy` (`pilot/pkg/model/context.go:312`) … 接続中の Envoy 1個の表現。`Type`, `IPAddresses`, `ID`, `Locality`, `ConfigNamespace`, `Labels`, `Metadata *NodeMetadata`, `SidecarScope *SidecarScope` (= この proxy が見える設定の範囲)。
- `WatchedResource` (`pkg/xds/server.go:58-96`) … TypeUrl ごとの購読状態。`ResourceNames sets.String`, `Wildcard`, `NonceSent`/`NonceAcked` (ACK 同期), `AlwaysRespond` (istiod 再接続時の warming 用)。

非自明な設計判断: 設定変更ごとに `PushContext` を丸ごと再構築する不変スナップショット方式。`Push()` は `oldPushContext` を退避して `initPushContext` で新版を作り (`discovery.go:288-306`)、以後の per-proxy 計算は全てこの単一スナップショットを読む。これにより push 中に設定が動いて proxy 間で整合が崩れることを防ぎ、版 (PushVersion) を Envoy へ伝播できる。コストは毎回のインデックス再構築だが、その手前に debounce を置いて頻度を抑える二段構えになっている。さらに `ProxyNeedsPush` と `PushRequest.ConfigsUpdated` で変更に依存しない proxy をスキップする scope 最適化が効く。eBay のような数十万 proxy 規模での convergence time や CPU/memory 問題への直接的な答えがこの設計。出典: Istio eBay case study (<https://istio.io/latest/about/case-studies/ebay/>)。

ambient は別系統。L4 は per-node の ztunnel (Rust, 別リポ `istio/ztunnel`) が mTLS とルーティングを共有処理し、L7 が要る時だけ waypoint (Envoy) を namespace/service 単位で立てる。istiod は同じ xDS で ztunnel/waypoint も駆動する (TypeUrl に `WorkloadType`/`AddressType` 等が追加、`ads.go:511-518`)。

## 採用事例の素材

公式 case studies (<https://istio.io/latest/about/case-studies/>) に掲載され、個別ページが URL で引けるもののみ:

- eBay … 数十万コンテナ規模。"Isolates" という本番類似の隔離テスト環境基盤に Istio を使用。<https://istio.io/latest/about/case-studies/ebay/>
- Airbnb … 内部トラフィックの大半を Istio で処理。external control plane モデルを採用し5年間使用。<https://istio.io/latest/about/case-studies/airbnb/>
- Salesforce … Envoy と自作 control plane から Istio に pivot。end user かつ contributor。<https://istio.io/latest/about/case-studies/salesforce/>
- T-Mobile … 100+ クラスタ、fraud detection / billing / sales / API 向けに 100+ Istio インスタンス。<https://istio.io/latest/about/case-studies/t-mobile/>

CNCF annual survey で最も採用されている service mesh とされる (出典: CNCF blog 2022)。Docker Hub での control plane / sidecar image はそれぞれ 10B+ download との記載 (公式 7th birthday blog: <https://istio.io/latest/blog/2024/happy-7th-birthday/>)。

## 代替・エコシステム

統合・周辺:

- Envoy (data plane proxy)、SPIFFE (workload identity)、Kubernetes Gateway API (Istio の traffic 管理モデルが起源)、Prometheus / Grafana / Jaeger (observability)。CNCF graduation 時に Box が「Istio を支える Kubernetes / Envoy / Prometheus / SPIFFE と並んだ」と発言。

主な代替と本質的な差:

- Linkerd … 専用 Rust micro-proxy `linkerd2-proxy`。istiod が 1-2GB に対し control plane 200-300MB と軽量。ただし sidecar 方式のまま。2024 に Buoyant のライセンス変更で OSS 運用に混乱。出典: Solo.io "Linkerd vs Istio" (<https://www.solo.io/topics/istio/linkerd-vs-istio>)。
- Cilium … eBPF でカーネル内処理、CNI と一体。L4 はカーネル、Istio ambient は user-space の ztunnel。Istio の 2024/2025 ベンチは L7/暗号化を入れると Cilium が失速、user-space の方が速い場合があると主張するが vendor ベンチである点に注意。出典: Istio blog "Ambient vs Cilium" (<https://istio.io/latest/blog/2024/ambient-vs-cilium/>)。
- Consul Connect (HashiCorp) … k8s 外も含むマルチプラットフォームと service discovery が強み。data plane は既定で Envoy。
- Istio の差別化: 最も成熟・高機能な L7 traffic management (header routing, fault injection, mirroring, rate limit)、ambient による sidecarless と L7 オプトインの両立、SPIFFE/外部 IdP 連携、FIPS 等のコンプライアンス向け商用ディストリ (Tetrate/Solo) の存在。

install / 最小構成 (公式 getting started: <https://istio.io/latest/docs/setup/getting-started/>):

```bash
istioctl install --set profile=demo -y
kubectl label namespace default istio-injection=enabled
# 以後 default namespace に deploy した pod に Envoy sidecar が自動注入される
```
