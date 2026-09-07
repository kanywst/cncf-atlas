# 内部実装

> コミット `34b4535c` のソースを読んで書いた。ここでの主張はすべてファイルと行を指す。

## コードマップ

テストを除く Go は 117 ファイル、およそ 17,000 行。CNCF incubating のプロジェクトとしては異例に小さく、半日あれば端から端まで読める。

| パス | 責務 |
| --- | --- |
| `main.go` | オペレータのエントリポイントと manager のセットアップ |
| `api/v1beta1/` | 旧 API グループ `k8gb.absa.oss` (`groupversion_info.go:31`) |
| `api/v1beta1io/` | 正準 API グループ `k8gb.io` (`groupversion_info.go:32`) |
| `controllers/gslb_controller_reconciliation.go` | 主たる reconcile ループ |
| `controllers/gslb_migration_controller.go`, `conversion_k8gbio.go` | 旧グループから正準グループへの片方向ブリッジ |
| `controllers/providers/k8gbendpoint/` | `DNSEndpoint` レコードの構築。クラスタ間の問い合わせもここ |
| `controllers/providers/dns/` | DNS バックエンド (external-dns と Infoblox) |
| `controllers/refresolver/` | `Gslb` が指す Ingress / Service の解決と、自クラスタの公開 IP |
| `controllers/resolver/` | 設定と戦略の定数 |
| `controllers/zones/`, `zone_delegation_reconciliation.go` | 委譲ゾーン |
| `adr/` | アーキテクチャ決定記録 |

## 中核のデータ構造

`Strategy` (`api/v1beta1/gslb_types.go:31-42`) がユーザーに見えるポリシーのすべて。`Type`、リージョンから重みへの map の `Weight`、`PrimaryGeoTag`、`DNSTtlSeconds`、`SplitBrainThresholdSeconds`。フィールドは 5 つで、システム全体の挙動はここから導かれる。

戦略の名前は `controllers/resolver/` の定数。`GeoStrategy = "geoip"` が `resolver_spec.go:33` にあり、`RoundRobinStrategy` と `FailoverStrategy` が並ぶ。分岐するのはちょうど 2 か所、`controllers/runtime_shared.go:41-45` と `controllers/providers/k8gbendpoint/applicationDNSEndpoint.go:122-156`。

`Targets` (`controllers/providers/k8gbendpoint/target.go`) は geo タグから IP の集合への map で、`Append` (`:42`)、`AppendTargets` (`:50`)、`GetIPs` (`:33`)、`Sort` (`:56`) を持つ。リストに平坦化せず geo タグでキーを持つからこそ、フェイルオーバーの判断が「primary クラスタがこの中に居るか」を別の照合なしに問える。

出力の型は k8gb 自身のものではない。`DNSEndpoint` は external-dns 由来で、オペレータの仕事はそれを 1 つ書いて終わる。

## 追う価値のあるパス

答えるべき問いはこうだ。バージニアの Kubernetes API への接続を持たないフランクフルトのクラスタが、どうやってバージニアで健全なエンドポイントを知るのか。

**バージニアの DNS サーバに聞く。**

`GetDNSEndpoint` (`controllers/providers/k8gbendpoint/applicationDNSEndpoint.go:82`) が 1 つの `Gslb` のレコードを組み立てる。ホスト名ごとに 2 つのことをする。

1 つ目は、このクラスタが提供できるものを、接頭辞付きの名前で公開すること。

```text
applicationDNSEndpoint.go:98   getLocalTargetsHost(host)   -> "localtargets-<host>"
                               (接頭辞は dns_validation.go:27)
applicationDNSEndpoint.go:106  このクラスタのアプリが healthy なら:
                    :107         自分の IP を自分の geo タグで finalTargets に足す
                    :108-114      localtargets-<host> の A レコードを出す
```

この `localtargets-` レコードが、そのクラスタによる「自分の健全なエンドポイントはこれだ」という公開表明になる。自分の CoreDNS が応答し、委譲されたゾーンを引ける者なら誰でも取得できる。

2 つ目は、他クラスタの表明を読むこと。`GetExternalTargets` (`:202`)。

```text
:204  ResolveAuthoritativeServersFromZoneDelegations(host)
        -> このホストのゾーンの NS レコード。k8gb クラスタごとに 1 つ
:211  GetExternalAuthoritativeServers()  -> 自分を除き、ピアだけ残す
各ピアについて:
  :217  nameServersToUse = ピアの IP。親ゾーンのサーバをフォールバックに
  :226  queryService.Query("localtargets-<host>", nameServersToUse)
  :236  ExtractARecords(応答)
  :238  targets[ピアの GeoTag] = その IP 群
```

226 行目がクラスタ間機構のすべて。ピアクラスタの CoreDNS に直接投げる DNS クエリで、対象はピアの `localtargets-` 名。ゾーンがすべての k8gb クラスタに委譲されているので、このクエリに特別な経路も資格情報も要らず、委譲以外の取り決めも要らない。**DNS が状態のチャネル**になっている。

そのうえで戦略が、公開レコードの中身を決める (`:122-156`)。

```text
switch strategy.Type:
  roundRobin, geoip  (:123-124)
      finalTargets = 自分のターゲット + 外部ターゲットすべて
  failover           (:125-155)
      isPrimary = strategy.PrimaryGeoTag == このクラスタの geo タグ   (:103)
      isPrimary なら:
          healthy   -> 自分のターゲットだけ (何も足さない)
          unhealthy -> 外部ターゲットで丸ごと置き換え                  (:130-131)
      そうでないなら:
          externalTargets に primary が居る -> それだけ返す           (:143-145)
          primary が居ない                  -> すべて返す             (:147)
```

上から読めばフェイルオーバーの意味が全部わかる。健全な primary は自分だけを広告するので、トラフィックはそこに集まる。secondary もまた、primary が見えている間は primary だけを広告する。だからリゾルバがどのクラスタの DNS サーバに当たっても集約が崩れない。primary が `localtargets-` レコードを出さなくなると、各 secondary はそれぞれ独立にその不在に気づき、残りのクラスタを広告し始める。

`roundRobin` と `geoip` の場合、レコードには健全なエンドポイントがすべて載り、分配はリゾルバに委ねられる。round robin なら応答の並び、geoip なら前段の地理対応 DNS サーバが決める。

最後にレコードが書かれ (`:169-183`)、戦略がラベルとして記録される。reconciler が `DNSEndpoint` を保存し (`controllers/gslb_controller_reconciliation.go:212`)、`k8s_crd` プラグイン入りの CoreDNS がそれを提供する。

## 意外だったこと

**合意形成の機構が無いし、作ろうともしていない。** 各クラスタは上記のコードを自分のタイマーで自分の視点に対して回す。2 つのクラスタが「誰が健全か」について別の意見を持つことはあり、ネットワーク分断中には実際にそうなる。`SplitBrainThresholdSeconds` (`api/v1beta1/gslb_types.go:41`) が、古い見解をどれだけ信じるかの上限を与える。障害の現れ方が「数 TTL のあいだトラフィックが少し違う場所へ行く」で済む系にとっては妥当な取引だが、難しい部分を作らないという明確な選択でもある。

**ピアに届かないことはエラーではなく警告。** ピアへの DNS クエリが失敗すると、コードは警告を出して次のピアへ進む (`applicationDNSEndpoint.go:227-235`)。到達できないピアは「健全なエンドポイントを持たないピア」とまったく同じ扱いになる。たいていは正しい答えだが、ときどきそうではない。

**CoreDNS は事実上フォークされている。** k8gb はクラスタ既存の CoreDNS を設定するのではなく、`DNSEndpoint` カスタムリソースをゾーンデータとして読むプラグイン入りの独自イメージ `registry.k8gb.io/k8gb-io/k8s_crd` (`chart/k8gb/values.yaml:119`) を配る。「オペレータがオブジェクトを書く」と「DNS の応答が変わる」の間から reload の段が消えるのはこのため。

**IPv6 は入口で断られ、その理由がコードに書いてある。** `CLUSTER_EXPOSED_IPS` の help 文 (`controllers/resolver/config.go:59`) が、`localtargets-*` レコードも最終レコードも A レコードしか出さないため IPv6 を拒否すると明記している。reconciler はアドレスを分けて IPv4 だけ残すことでそれを守る (`gslb_controller_reconciliation.go:173`、ヘルパーは `:235`)。

**API グループが 2 つ、1 つのバイナリにコンパイルされている。** `api/v1beta1` (`k8gb.absa.oss`) と `api/v1beta1io` (`k8gb.io`) が両方あり、間に移行コントローラが居る。ADR-0002 の決定によるもので、[歴史](./history) で述べた。その背景を知らずにツリーを読むと、この重複は事故に見える。
