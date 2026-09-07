# recon: k8gb

k8gb (Kubernetes Global Balancer) の調査メモ。Internals / Architecture の記述は下記の pinned commit に対してのみ有効。

## 基本情報

- repo: `k8gb-io/k8gb`
- pinned commit: `34b4535c7642f38876d409ae8f1ba8fb9557c60e` (2026-09-03) / 近いタグ: `v1.0.0` (`git describe` = `v1.0.0-4-g34b4535c`)
- 言語 / ビルド: Go 1.26.5 (`go.mod`) / `make` + Helm chart (`chart/k8gb`)。非テストの Go は約 17k 行、117 ファイル。Tekton の 1/7 以下で、読み切れる規模
- ライセンス: Apache-2.0
- CNCF 成熟度: **Incubating**。sandbox 受け入れ 2021-03-30、incubating 昇格 2026-07-18、発表 2026-08-05 [1]
- カテゴリ (tools.ts の CATEGORY_ORDER): **Service Mesh & Networking** (CNCF landscape 上は Orchestration & Management / Coordination & Service Discovery だが、実体はクラスタ横断のトラフィック分散なのでこちらが近い)
- slug: `k8gb` / 表示名: `k8gb`
- 主要依存: `sigs.k8s.io/controller-runtime v0.24.1`、`sigs.k8s.io/external-dns v0.21.0`、`github.com/miekg/dns v1.1.72` (`go.mod`)

## 歴史の素材

- 2019-11-27: 初コミット (Donovan Muller)。最初の 3 コミットが `[WIP] Added initial solution documentation` / `Added more use cases` で、コードより先に設計文書から始まっている
- 生まれは南アフリカの銀行 Absa。`ADOPTERS.md` が "K8GB was created in Absa and had its first production use in cross-regional datacenter context" と書いている。コンテナイメージの歴史的な配布先が Docker Hub の `absaoss/k8gb` である点も同じ出自を示す (`README.md`)
- 2021-03-30: CNCF sandbox 受け入れ [1], [2]
- 2021-05-13: `v0.8.0`
- 2024-09-16: `v0.14.0`
- 2026-03-09: ADR-0002 が accepted。API グループを vendor 固有の `k8gb.absa.oss` から中立な `k8gb.io` へ移す決定 (`adr/0002-migrate-gslb-api-group-to-vendor-neutral-k8gb-io.md`)
- 2026-07-03: `v0.20.0`
- 2026-07-18: CNCF incubating 昇格 [1]
- 2026-09-02: `v1.0.0`。incubating 昇格の 6 週間後、pinned commit のわずか 1 日前

API グループ移行は歴史セクションの良い素材になる。ベンダー中立化がガバナンスの成熟とセットで進んだ実例で、しかも移行方式の選択が ADR に残っている (A: 一斉切り替え / B: 双方向同期 / C: 正準 API への片方向自動移行)。採ったのは C。コード上は `api/v1beta1` (`k8gb.absa.oss`) と `api/v1beta1io` (`k8gb.io`) が両方存在し、`controllers/gslb_migration_controller.go` と `controllers/conversion_k8gbio.go` が橋渡ししている。

## アーキテクチャの素材

### 前提: GSLB とは何か

1 つの Kubernetes クラスタの中でトラフィックを分けるのは Service と Ingress の仕事。**クラスタをまたいで**、地理的に離れたクラスタ間で振り分けたり片方が落ちたら寄せたりするのが GSLB (Global Server Load Balancing)。従来は F5 や Infoblox のような専用アプライアンスの領分だった。k8gb はこれを DNS と Kubernetes の API だけでやる。

### 構成要素

- **operator** (`main.go` + `controllers/`): Gslb CRD を reconcile する
- **CoreDNS**: 各クラスタに k8gb 用の CoreDNS が立つ。`k8s_crd` プラグイン入りの独自ビルドを使う (`chart/k8gb/values.yaml:119` の image `registry.k8gb.io/k8gb-io/k8s_crd`)。このプラグインが external-dns の `DNSEndpoint` CR を直接読んでゾーンを応答する
- **external-dns**: 親ゾーンへの委譲レコード (NS) を書くために使う
- **DNS プロバイダ**: `controllers/providers/dns/factory.go:48` の `Provider()` が切り替える。`DNSTypeExternal` (external-dns 経由。Route53 / Azure / NS1 / Cloudflare / RFC2136 など。`docs/deploy_*.md` に個別手順) と `DNSTypeInfoblox` (専用クライアント `infoblox-client.go`)

### CRD

- `Gslb` (`api/v1beta1io/gslb_types.go`): 保護したいホストと戦略を書く。1 つの CRD で完結するのが売り (`README.md`)
- `ZoneDelegation`: 委譲されたゾーンの表現
- 旧グループ `k8gb.absa.oss` の `Gslb` も残っていて移行対象

`Strategy` (`api/v1beta1/gslb_types.go:31-42`) のフィールド: `Type`、`Weight` (region → weight)、`PrimaryGeoTag`、`DNSTtlSeconds`、`SplitBrainThresholdSeconds`。戦略の種類は `roundRobin` / `geoip` / `failover` (`controllers/resolver/resolver_spec.go:33` 付近、使用箇所は `controllers/runtime_shared.go:41-45`)。

### reconcile の流れ

`controllers/gslb_controller_reconciliation.go:77` `Reconcile`。

1. `:83` クラスタが公開 IP を持っているか確認。無ければ requeue
2. `:105` 戦略の解決
3. `:118-130` `ResourceRef` が空なら Gslb から Ingress を生成する (embedded モード)。既存の Ingress を参照することもできる
4. `:140` 参照先から server 一覧を取る、`:146-151` 委譲済みゾーンで絞る
5. `:165` 自クラスタの公開 IP を解決
6. `:181` アプリの health status を取る
7. `:190-217` external-dns の `DNSEndpoint` CR を組み立てて保存する
8. `:220` Gslb の status 更新、`:231` 一定間隔で requeue

`:227-229` のコメントどおり、イベント駆動ではなく **定期 requeue で外部の状態に追いつく** 設計。TODO も残っている。

## 内部実装の素材

### 目玉: クラスタ間の状態共有が DNS そのもの

k8gb には中央のコントロールプレーンが無く、クラスタ同士が Kubernetes API で会話することもない。**他クラスタの健全なエンドポイントを、普通の DNS クエリで問い合わせて知る。**

仕組みは 2 段。

1. 各クラスタは自分の健全なターゲットを `localtargets-<host>` という A レコードとして、自分の CoreDNS に公開する。`controllers/providers/k8gbendpoint/applicationDNSEndpoint.go:106-115`。名前の組み立ては `dns_validation.go:27` の `localTargetsPrefix = "localtargets-"` と `:32` `getLocalTargetsHost`
2. 他クラスタの分は `:202` `GetExternalTargets` が取りに行く。`:204` で当該ホストの委譲元から権威サーバ一覧を引き、`:211` で自分以外のクラスタを選び、`:226` `d.queryService.Query(lHost, nameServersToUse)` で **その相手クラスタの CoreDNS に対して `localtargets-<host>` を直接 DNS で問い合わせる**。`:236` で A レコードを抜き、`:238` で geo タグ付きのターゲットとして積む

対象ゾーンは各クラスタの CoreDNS に NS 委譲されている (`controllers/providers/k8gbendpoint/delegationDNSEndpoint.go`) ので、この問い合わせは特別な経路を必要としない。つまり **DNS がデータプレーンであると同時に、クラスタ間の状態同期チャネルでもある**。クラスタ間に API 接続も VPN もメッシュも要らないのが、この設計の最大の帰結。

### 戦略が実際に効く場所

`applicationDNSEndpoint.go:122-156` の 1 か所に集約されている。読めば戦略の意味が全部わかる。

- `roundRobin` / `geoip` (`:123-124`): 自分のターゲットに他クラスタのターゲットを足すだけ。あとは DNS 応答の並びと解決側の地理判定に任せる
- `failover` (`:125-155`):
  - 自分が primary (`:103` `PrimaryGeoTag == ClusterGeoTag`) かつ healthy なら、**自分のターゲットだけ**返す (`:127-138` の else 側、何も足さない)
  - 自分が primary で unhealthy なら、外部ターゲットに丸ごと差し替える (`:130-131`)
  - 自分が secondary で primary が生きているなら、**primary のターゲットだけ**返す (`:143-145`)
  - primary が見えないなら全部返す (`:147`)

各クラスタが自分の視点で独立にこの判断をする。合意形成の仕組みは無い。`SplitBrainThresholdSeconds` (`api/v1beta1/gslb_types.go:41`) はその前提で置かれた安全弁。

### 意外だった点

- クラスタ間通信が「相手の CoreDNS に dig する」だけ。分散システムの状態共有としてはかなり大胆だが、GSLB という問題設定では DNS はどのみち経路上にあるので、依存を増やしていないとも言える
- CoreDNS を素で使わず `k8s_crd` プラグイン入りの独自ビルドを配っている (`chart/k8gb/values.yaml:119`)。external-dns の CRD をそのままゾーンデータとして読ませるため
- 新旧 2 つの API グループが両方コンパイルされていて (`api/v1beta1` = `k8gb.absa.oss`、`api/v1beta1io` = `k8gb.io`)、移行コントローラが別に居る。v1.0.0 直前という時期を考えると移行の真っ最中
- IPv6 は意図的に落としている。`localtargets-*` と最終レコードがどちらも A レコード限定であることが `controllers/resolver/config.go:59` の help 文に明記されていて、`gslb_controller_reconciliation.go:173` でも IPv4 だけ拾っている

## 採用事例の素材

repo に `ADOPTERS.md` があり、組織名・連絡先・用途が表になっている。以下はそこからの引用 (`ADOPTERS.md`)。

| 組織 | 用途 |
| --- | --- |
| Absa | k8gb の生まれた場所。最初の本番利用はリージョン間データセンター構成 |
| Millennium bcp | マルチクラウド・マルチリージョンのクラウドネイティブ負荷分散。CNCF ケーススタディあり [3] |
| Eficode | クラウドネイティブ / DevOps コンサルとして顧客案件で利用 |
| Open Systems | プライベート WAN 内のマルチクラスタ負荷分散 |
| PagBank | 複数リージョンをまたぐマルチクラウドのグローバル負荷分散 |
| Darede | クラウドコンサルとして顧客の利用を支援 |
| envio.dev | Envio のブロックチェーンデータエンジンのリージョン横断可用性 |

CNCF の incubating 発表 [1] も「フィンテックとクラウドコンサルでの採用」に触れ、ポルトガル最大の民間銀行 Millennium bcp を名指ししている。

健全性の指標として repo が掲げているもの (`README.md` のバッジ): CLOMonitor、OpenSSF Scorecard、CII Best Practices #4866、FOSSA。DevStats は <https://k8gb.devstats.cncf.io/>。

## 代替・エコシステム

### 統合先

- external-dns (親ゾーンへの委譲レコード書き込み)、CoreDNS (権威応答)
- DNS プロバイダ: Route53 / Azure DNS / NS1 / Cloudflare / Infoblox / Windows DNS / RFC2136 (`docs/deploy_*.md`)
- Admiralty との組み合わせ (`docs/admiralty.md`)、Crossplane の例 (`docs/examples/crossplane`)

### 主な代替

- **クラウドの GSLB マネージドサービス** (Route 53 のレイテンシ / フェイルオーバールーティング、Azure Traffic Manager、Google Cloud Load Balancing): 単一クラウドなら普通はこちらが楽。k8gb の価値はマルチクラウドとオンプレを混ぜたとき、そして設定を Kubernetes の CRD として持てること
- **F5 / Infoblox などの GSLB アプライアンス**: 従来の答え。k8gb は Infoblox については置き換えではなく DNS プロバイダとして統合する道も用意している
- **Submariner**: 同じくクラスタ間だが、レイヤが違う。Submariner は Pod / Service の L3 到達性を作る。k8gb は外から来るトラフィックを DNS でどのクラスタに向けるかを決める。併用しうる
- **サービスメッシュのマルチクラスタ機能** (Istio multi-cluster, Linkerd multi-cluster): メッシュのデータプレーンを前提とする。k8gb はメッシュを要求しない

差の軸は「クラスタ間に何を要求するか」。メッシュや Submariner はネットワーク到達性を要求し、k8gb は DNS の委譲だけを要求する。

## write 段階への申し送り

- Internals の主役は `applicationDNSEndpoint.go:202` `GetExternalTargets`。「他クラスタに dig する」という一点を最初に据える
- 読者は GSLB を知らない前提。Architecture の冒頭で「クラスタ内の LB と何が違うか」を 1 段落置く
- 採用事例は `ADOPTERS.md` の 7 組織のみ。それ以外の名前は足さない
- v1.0.0 が 2026-09-02、pinned commit が 2026-09-03。「出たばかり」という時制の書き方に注意 (相対表現ではなく日付で書く)
- API グループ移行 (`k8gb.absa.oss` → `k8gb.io`) は進行中。Getting Started で例を書くときは新グループ `k8gb.io/v1beta1` を使う
