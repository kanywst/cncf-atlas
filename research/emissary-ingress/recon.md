# recon: Emissary-Ingress

調査メモ。自分用の密度。出典は URL か `file:line` を必ず添える。`src/` は clone (gitignored)。

## 基本情報

- repo: [emissary-ingress/emissary](https://github.com/emissary-ingress/emissary)
- pinned commit: `65b0dd9ae34e76ac21d0598398a55e015416d6ea` (2026-05-01, `main` HEAD) / 近いタグ: `v4.0.1` (`git describe` = `v4.0.1-22-g65b0dd9ae`)
- 最新リリース: `v4.1.0` (2026-05-19, `gh api releases/latest`)
- 言語 / ビルド: Go (`go 1.24.0`, `go.mod:1` module は `github.com/emissary-ingress/emissary/v3`) + Python (`python/ambassador`, diagd) / `make` (`Makefile`)。コンテナは Envoy バイナリ同梱 (`docker/emissary/Dockerfile:8,100`)
- ライセンス: Apache-2.0 (`LICENSE` 冒頭 "Apache License Version 2.0"、`gh` の `spdx_id=Apache-2.0` と一致)
- CNCF 成熟度: Incubating (2021-04-13 に Sandbox を飛ばして Incubating で受理)
- カテゴリ (報告用、固定): API Gateway
- メインエントリ: `cmd/busyambassador/main.go:34` (BusyBox 方式で `os.Args[0]` ディスパッチ。`entrypoint` / `kubestatus` / `version` を持つ)

## 歴史の素材

- 2014 年に Datawire (現 Ambassador Labs) で誕生。元の名前は Ambassador API Gateway。Envoy 作者 Matt Klein の Microservices Practitioner Summit 講演に触発され、その 3-4 ヶ月後に Envoy ベースで立ち上げたと CEO Richard Li が証言。出典: [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)。
- v1.0 は 2020-01 リリース。出典: [CNCF blog 2021-04-13](https://www.cncf.io/blog/2021/04/13/emissary-ingress-formerly-ambassador-is-now-a-cncf-incubating-project/)。
- 2021-04-13 に CNCF へ寄贈、同時に Ambassador から Emissary-Ingress へ改名。商標 (会社名) を CNCF に全面譲渡できなかったため改名したと Li が説明 ("emissary" は別種の "ambassador")。Sandbox を経ずいきなり Incubating で受理されたのは、既に著名な Ambassador の改名だったため。Contour に次ぐ CNCF で 2 つ目の ingress controller。出典: [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)、[CNCF project page](https://www.cncf.io/projects/emissary-ingress/)。
- OSS の Emissary-Ingress は商用 Ambassador Edge Stack のコア。Edge Stack は ACME/TLS 自動化、OAuth/OIDC、レート制限、Developer Portal 等を上乗せ。出典: [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)。
- 親会社 (Ambassador Labs) は直接関与から手を引き、コミュニティ運営色が強まっている。出典: [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)。

## アーキテクチャの素材

3 プロセス + 1 サイドカー Envoy という構成。設計図はコード内コメントにそのまま書かれている (`cmd/entrypoint/entrypoint.go:26-78` の "Dataflow Diagram")。

- 1 つのコンテナ内で `entrypoint` (Go) が `diagd` (Python) と `envoy` を子プロセスとして起動し、`ambex` (Go) を goroutine として動かす。`cmd/entrypoint/entrypoint.go:148-191` (`group.Go("diagd"...)`, `group.Go("ambex"...)`, `group.Go("envoy"...)`, `group.Go("watcher"...)`)。
- いずれか 1 つでも死ぬと全体を落とす shared-fate 設計。Kubernetes に再起動を委ねる。`cmd/entrypoint/entrypoint.go:74-78` のコメント。
- データは Kubernetes が source of truth。専用 DB を持たない。出典: [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)。
- 入力ソースは 3 つ: Kubernetes / Consul / filesystem。watcher がこれを束ねて 1 個の一貫した snapshot にする。`cmd/entrypoint/watcher.go:171-200` の長文コメント (収束性・ソース間の独立性に関する注意書き) が設計判断の根拠。

データフロー (`entrypoint.go:38-61` のコメントを実装で裏取り):

```text
K8s/Consul watch -> entrypoint[watcher] --(Snapshot,POST)--> diagd
  --(envoy config files + SIGHUP)--> entrypoint[ambex] --(ADS gRPC)--> envoy
```

## 内部実装の素材 (代表オペレーションの end-to-end トレース)

題材: 「Mapping CRD が Envoy のルートになるまで」。

1. 起動。`busyambassador` が `entrypoint.Main` をディスパッチ (`cmd/busyambassador/main.go:34` -> `cmd/entrypoint/entrypoint.go:80`)。`WaitForApiext` で CRD 変換 webhook の準備を待ち (`entrypoint.go:96`)、diagd / envoy / ambex / watcher / snapshot_server / healthchecks を `dgroup` の goroutine 群として起動 (`entrypoint.go:148-205`)。
2. watcher。`WatchAllTheThings` (`cmd/entrypoint/watcher.go:26`) が `kates` クライアントで K8s を watch。監視対象は `GetInterestingTypes` (`cmd/entrypoint/interesting_types.go`) で決まり RBAC でフィルタされる。`watchAllTheThingsInternal` (`watcher.go:201`) が K8s/Consul/filesystem の更新を 1 個の `snapshot.Snapshot` に組み立てる。
3. 通知。snapshot が `SnapshotReady` (`watcher.go:106-115` の enum) になると `notify` クロージャが `notifyReconfigWebhooks` を呼ぶ (`watcher.go:62-67`)。実体は `notifyWebhookUrl(ctx, "diagd", "<event>?url=<snapshot>")` で diagd に POST (`cmd/entrypoint/notify.go:42,69`)。
4. URL。POST 先は `http://localhost:8004/_internal/v0/watt?url=<snapshot url>`。`GetEventUrl` が `_internal/v0/watt` を組む (`cmd/entrypoint/env.go:233,244-245`)、diagd ポート 8004 は `env.go:153` (`AMBASSADOR_DIAGD_BIND_PORT`)。
5. diagd 受信。Flask の `handle_watt_update` (`python/ambassador-diag/src/ambassador_diag/diagd.py:914-927`) が `?url=` を取り `app.watcher.post("CONFIG", ("watt", url))` を呼ぶ。
6. パース。`load_config_watt` (`diagd.py:1539`) が snapshot を fetch し disk に保存、`ResourceFetcher.parse_watt` で `Config` (aconf) に流し込む (`diagd.py:1563-1570`)。
7. コンパイル (heavy lifting)。`_load_ir` (`diagd.py:1585`): `aconf.load_all` -> `IR.check_deltas` で complete か incremental か判定 (`diagd.py:1608`) -> `IR(aconf, ...)` 構築 (`diagd.py:1616`) -> `EnvoyConfig.generate(ir)` (`diagd.py:1628`) -> `econf.split_config()` で bootstrap/ads/clustermap に分割 (`diagd.py:1639`)。Mapping は `MappingFactory.load_all` (`python/ambassador/src/ambassador/ir/irmappingfactory.py:28`) で `IRHTTPMapping` 群 -> `IRBaseMappingGroup` -> `IRCluster` に変換される。
8. 検証。`validate_envoy_config` (`diagd.py:1645`) が生成 ADS config を本物の `envoy --mode validate` に通す。invalid なら 500 を返し現行 config を維持 (`diagd.py:1657-1683`)。設定バグでユーザのトラフィックを壊さないための関門。
9. 配信。検証済み config がファイルとして書かれ SIGHUP / fastpath 経由で ambex が拾う。ambex は go-control-plane の `SnapshotCache` に config を積み (`pkg/ambex/main.go:6-40` のヘッダコメントが SnapshotCache/Server/ADS の関係を解説)、Envoy が張った ADS gRPC ストリーム (`127.0.0.1:8003`, `entrypoint.go:166`) に push する。Envoy がここで初めて新ルートを反映。

中核データ構造 (3-5 個):

- `snapshot.Snapshot` / `KubernetesSnapshot` (Go)。watcher が組み立てる「世界の状態」一式。Mappings/Hosts/Listeners/Services/Endpoints/Secrets/Gateway API 等を全部抱える。`pkg/snapshot/v1/types.go:23` と `:57`。
- `IR` (Python)。中間表現。`clusters: Dict[str, IRCluster]`, `groups: Dict[str, IRBaseMappingGroup]`, `listeners: Dict[str, IRListener]`, `hosts`, `filters`, `resolvers` などの辞書群。`python/ambassador/src/ambassador/ir/ir.py:90-118`。
- `EnvoyConfig` (Python)。IR から生成され `split_config()` で bootstrap config / ADS config / clustermap に割れる。`diagd.py:1628,1639`、生成器は `python/ambassador/src/ambassador/envoy/v3/`。
- `FastpathSnapshot` (Go)。`ecp_v3_cache.Snapshot` + `*Endpoints`。endpoint だけの変更を Python を経由せず ambex に直送する経路の運搬物。`pkg/ambex/fastpath.go:8-11`。
- `MappingSpec` CRD (Go, v3alpha1)。ユーザ向けルーティングリソース。`prefix` 必須など。`pkg/api/getambassador.io/v3alpha1/crd_mapping.go` (`type MappingSpec struct`)。

非自明な設計判断:

- endpoint fastpath。Pod の出入り (EDS の endpoint 変化) はルーティング構造を変えないので、Python の IR 再コンパイル (重い) を丸ごとスキップする。entrypoint が `fastpathCh chan *ambex.FastpathSnapshot` で ambex に直送し (`cmd/entrypoint/entrypoint.go:164-167` で生成・受け渡し)、ambex は EDS だけを差し替える。`pkg/ambex/fastpath.go:8`。Pod churn の激しい環境でリコンフィグ嵐を避けるための分離。
- 補強として、生成 config を「実際の Envoy に validate させてから」swap する (`diagd.py:1645`)。Emissary 自身のバグで本番トラフィックを壊さない保険。
- CRD は `v1`/`v2`/`v3alpha1` の多バージョン併存で、in-cluster の変換 webhook (`emissary-apiext`, `cmd/apiext/main.go:1`, `pkg/apiext`) が常駐し、Python エンジンが見るのは常に `v3alpha1` に正規化された形。これにより config エンジン側はバージョン差を意識しない。`pkg/api/getambassador.io/{v1,v2,v3alpha1}/crd_mapping.go`。

## 採用事例の素材 (出典付きのみ)

- Ticketmaster / Chick-fil-A / AppDirect が本番利用と報告。ピーク 500,000 req/s、ユーザ数が 10 分弱で 500 万→1500 万に跳ねた事例に言及。出典: [The New Stack 2021](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/) (Ambassador Labs 由来の数値)。repo 内に `ADOPTERS.md` は無いので、これ以上の固有名は付けない。
- GitHub シグナル (2026-06-24, `gh api repos/emissary-ingress/emissary`): stars 4,509 / forks 707 / open issues 427。contributors は `contributors` API のページングで 192 (非匿名 login ベース)。

## 代替・エコシステム

- 統合先: Envoy Proxy (基盤)。観測は Prometheus / Grafana / Datadog、tracing は Zipkin/Jaeger 系 (`IRTracing`)。service mesh は Linkerd / Istio / Consul と接続可。Knative serverless、Gateway API (`KubernetesSnapshot` に `Gateways`/`HTTPRoutes`/`GatewayClasses`)。出典: [CNCF blog](https://www.cncf.io/blog/2021/04/13/emissary-ingress-formerly-ambassador-is-now-a-cncf-incubating-project/)、`pkg/snapshot/v1/types.go:84-87`。
- 代替と本質的な差:
  - Contour (CNCF, 同じ Envoy ベース)。Contour は `HTTPProxy` CRD + 単一 Go バイナリでシンプル志向。Emissary は Mapping/Host/Listener の独自 CRD 群 + Python config エンジンで API Gateway 機能 (認証・レート制限・トラフィック制御) が厚い。Emissary は Contour に次ぐ CNCF 2 番目の ingress。出典: [The New Stack](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)。
  - Istio ingress gateway / Gateway API 実装系。Istio はメッシュ前提で重い。Emissary はメッシュ非依存の edge gateway として単独で立つ。
  - ingress-nginx。NGINX ベースで枯れているが Envoy の xDS 動的更新や L7 制御の細かさは Emissary 側に分がある。
  - 商用上位の Ambassador Edge Stack は同じコアに ACME/OIDC/Developer Portal を足したもの。

## ビルド / 最小構成

Helm (公式推奨, 3.10 系の例)。CRD チャートを先に入れ、本体を入れる。出典: [getambassador.io install/helm](https://www.getambassador.io/docs/emissary/latest/topics/install/helm)。

```bash
helm install emissary-crds \
  --namespace emissary --create-namespace \
  oci://ghcr.io/emissary-ingress/emissary-crds-chart --version=3.10.0 \
  --set enableLegacyVersions=false --wait

helm install emissary \
  --namespace emissary \
  oci://ghcr.io/emissary-ingress/emissary-ingress --version=3.10.0 \
  --set waitForApiext.enabled=false --wait
```

旧手順 (3.6-3.9 系) は CRD を `kubectl apply` し、`emissary-apiext` (変換 webhook) の起動を待ってから本体。`kubectl apply -f https://app.getambassador.io/yaml/emissary/<version>/emissary-crds.yaml` の後 `kubectl wait ... deployment emissary-apiext -n emissary-system`。出典: [getambassador.io yaml-install](https://www.getambassador.io/docs/emissary/latest/topics/install/yaml-install)。最小ルーティングは `Listener` (待受ポート) + `Host` + `Mapping` (host/path -> service) を `getambassador.io/v3alpha1` で apply する。出典: [Quick Start](https://emissary-ingress.dev/docs/3.10/quick-start/)。

## タグライン

- EN: Kubernetes-native API gateway and ingress built on Envoy Proxy, driven entirely by CRDs.
- JA: Envoy Proxy を基盤に、CRD だけで設定する Kubernetes ネイティブな API ゲートウェイ兼 Ingress。
