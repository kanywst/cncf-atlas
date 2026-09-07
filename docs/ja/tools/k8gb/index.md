# k8gb

> Kubernetes クラスタをまたぐグローバル負荷分散。アプライアンスもコントロールプレーンも使わず、DNS の委譲と CoreDNS だけで組み立てる。

- **カテゴリ**: Service Mesh & Networking
- **CNCF 成熟度**: Incubating (sandbox 2021-03-30、incubating 2026-07-18)
- **言語**: Go 1.26.5
- **ライセンス**: Apache-2.0
- **リポジトリ**: `k8gb-io/k8gb`
- **記述時のコミット**: `34b4535c` (2026-09-03、`v1.0.0` の 4 コミット先)

## 何をするものか

1 つの Kubernetes クラスタの中で Pod にトラフィックを振り分けるのは Service と Ingress の仕事。クラスタをまたぐと話が変わる。同じアプリケーションがフランクフルトとバージニアで動いていて、公開ホスト名は 1 つ、クライアントには健全なクラスタ、できれば近いほうへ届いてほしいし、落ちたクラスタへは届かなくなってほしい。これを Global Server Load Balancing (GSLB) と呼び、伝統的には F5 や Infoblox のアプライアンス、あるいはクラウド事業者自身の DNS ルーティングの領分だった。

k8gb はこれを Kubernetes のオペレータと DNS でやる。各クラスタにインストールし、DNS のゾーンをそれらのクラスタが動かす CoreDNS に委譲したうえで、やりたいことをカスタムリソース 1 つで書く。

```yaml
apiVersion: k8gb.io/v1beta1
kind: Gslb
metadata:
  name: test-gslb-failover
  namespace: test-gslb
spec:
  resourceRef:
    apiVersion: networking.k8s.io/v1
    kind: Ingress
    name: test-gslb-failover
  strategy:
    type: failover
    primaryGeoTag: eu-west-1
```

各クラスタのオペレータは自分のアプリケーションを監視し、自分から見える健全なエンドポイントを DNS レコードとして公開し、他クラスタが何を出しているかを DNS で問い合わせて知る。中央のコントローラも、クラスタ間の API アクセスも、共有データストアも無い。設計上の帰結は [内部実装](./internals) で扱うが、要は **DNS がトラフィックの経路であると同時に、クラスタ間で状態を共有する手段でもある**。

プロジェクトは南アフリカの銀行 Absa の中で生まれ、最初の本番利用はリージョン間データセンター構成だった (`ADOPTERS.md`)。

## いつ使うか

- 同じアプリケーションを複数の Kubernetes クラスタで動かしていて、その前に 1 つのホスト名を置き、自動フェイルオーバーさせたい。
- クラスタが複数の事業者にまたがる、あるいはクラウドとオンプレの混在で、単一のクラウド DNS ルーティングでは全部を覆えない。
- グローバルなトラフィックポリシーを、別のアプライアンスの設定ではなく、他と同じレビューと RBAC の下にある Kubernetes オブジェクトにしたい。
- クラスタ同士をネットワーク層で接続できない、あるいはしたくない。k8gb が求めるのは DNS ゾーンの委譲だけ。

向かないケース:

- すべてが 1 つのクラウドにある。Route 53 のレイテンシ / フェイルオーバールーティング、Azure Traffic Manager、Google Cloud Load Balancing のほうが運用は軽い。
- リクエスト単位の制御が要る。DNS が決めるのは名前解決の時点で、クライアントもリゾルバもキャッシュする。`Gslb` の strategy にある `dnsTtlSeconds` が唯一のレバーで、低い TTL が守られるかは相手次第。
- IPv6 が要る。k8gb は A レコードしか出さず、IPv6 は明示的に拒否する (`controllers/resolver/config.go:59`)。

## このディープダイブの構成

- [歴史](./history): どこから来て、なぜ存在するのか。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールして最初の構成を動かす。

## 出典

1. [K8gb becomes a CNCF incubating project](https://www.cncf.io/announcements/2026/08/05/k8gb-becomes-a-cncf-incubating-project/), CNCF, 2026-08-05.
2. [cncf/landscape `landscape.yml`](https://github.com/cncf/landscape/blob/master/landscape.yml) (sandbox / incubating の日付の一次データ).
3. [Millennium bcp case study](https://www.cncf.io/case-studies/millennium-bcp/), CNCF.
4. [k8gb project page](https://www.cncf.io/projects/k8gb/), CNCF.
5. [k8gb documentation](https://www.k8gb.io/), k8gb.io.
6. [k8gb DevStats](https://k8gb.devstats.cncf.io/), CNCF.
7. [CLOMonitor: K8GB](https://clomonitor.io/projects/cncf/k8gb), CNCF.
