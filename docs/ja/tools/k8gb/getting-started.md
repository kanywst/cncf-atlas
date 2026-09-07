# はじめに

> コマンドはコミット `34b4535c` 時点の `README.md` と `docs/local.md` に従う。

グローバル負荷分散にはクラスタが最低 2 つと委譲された DNS ゾーンが要るので、1 コマンドで何かを実演できるインストールは存在しない。プロジェクトはこれをローカルの遊び場で解決している。Docker 上の k3s クラスタ 3 つで、1 つが親 DNS、残り 2 つが k8gb を動かす構成。[内部実装](./internals) の仕組みが実際に動くところを見るにはこれが一番速いので、このページもそれを使う。

## 前提

`docs/local.md` より。

- `kubectl`
- Helm 3
- `k3d` (5.3.0 以上) と動作する Docker
- リポジトリの make ターゲットを回すための Go と `make`

## インストール

リポジトリを clone して遊び場を立ち上げる。

```bash
git clone https://github.com/k8gb-io/k8gb
cd k8gb
make deploy-full-local-setup
```

k3d のクラスタが 3 つ作られる。`k3d-edgedns` は BIND を動かし、他の 2 つへ委譲する親ゾーンを持つ。`k3d-test-gslb1` と `k3d-test-gslb2` はそれぞれ k8gb、UDP DNS 用に公開された CoreDNS (ポートはそれぞれ 5053 と 5054)、テスト用アプリケーション、サンプルの `Gslb` リソースを動かす。

実環境ではオペレータは Helm チャートで入れる。

```bash
helm install k8gb oci://ghcr.io/k8gb-io/charts/k8gb --version <version>
```

ただしその場合、各クラスタの CoreDNS を外部の DNS トラフィックに向けて公開し、そのアドレスにゾーンを委譲する作業が別途要る。遊び場が肩代わりしているのはまさにその部分。手順は `docs/exposing_dns.md` と `docs/deploy_*.md` の各プロバイダのページにある。

## 最初に動く構成

遊び場には `Gslb` リソースが最初から適用されているので、面白いのは作ることではなく観察すること。

1. 3 つのクラスタが立ち上がったことを確認する。

```bash
kubectl cluster-info --context k3d-edgedns \
  && kubectl cluster-info --context k3d-test-gslb1 \
  && kubectl cluster-info --context k3d-test-gslb2
```

1. 親 DNS に round robin のホスト名を尋ねる。実際のクライアントが投げるのと同じクエリ。

```bash
dig @localhost -p 1053 roundrobin.cloud.example.com +short +tcp
```

両方のクラスタから、ノードごとに 1 件ずつ A レコードが返るはず。順序は毎回変わる。`docs/local.md` が既定構成での出力例として挙げているのは次のもの。

```text
172.20.0.2
172.20.0.5
172.20.0.4
172.20.0.6
```

1. そのアドレスを実際のクラスタのノードと突き合わせる。

```bash
for c in k3d-test-gslb{1,2}; do
  kubectl get no --context "$c" \
    -o custom-columns="NAME:.metadata.name,IP:status.addresses[0].address"
done
```

DNS の応答にある IP が、両クラスタのノード IP とちょうど一致するはず。ホスト名は 1 つ、エンドポイントは独立した 2 つのクラスタから、そして両方を知っているコンポーネントは存在しない。

## 動作確認

結果だけでなくクラスタ間の仕組みそのものを見たいなら、[内部実装](./internals) で説明した、クラスタが互いのために公開している内部レコードを引く。

```bash
dig @localhost -p 5053 localtargets-roundrobin.cloud.example.com +short +tcp
dig @localhost -p 5054 localtargets-roundrobin.cloud.example.com +short +tcp
```

どちらの CoreDNS も、自分の健全なエンドポイントだけを返す。これがピアのオペレータが reconcile のたびに取りに行くレコードで、2 つの応答を並べれば、公開レコードに両方の集合が載る理由がそのまま見える。

オペレータ自身の見解を見るには次のようにする。

```bash
kubectl get gslb --context k3d-test-gslb1 -n test-gslb -o wide
kubectl get dnsendpoint --context k3d-test-gslb1 -n test-gslb
```

`Gslb` の status にはホスト、計算されたヘルス、最終的に決まったターゲットが載る。`DNSEndpoint` が CoreDNS の提供元になっているオブジェクト。

フェイルオーバーを見たいなら、片方のクラスタでテストアプリケーションを 0 にスケールしてから手順 2 の `dig` をやり直す。レコードが期限切れになった時点で、そのクラスタのアドレスが消えるはず。

## 次に読むもの

遊び場は実環境が解かねばならない 2 つを回避している。他クラスタとリゾルバから届くように CoreDNS を公開すること (`docs/exposing_dns.md`) と、実際に運用している DNS プロバイダからゾーンを委譲すること (`docs/deploy_route53.md` とその兄弟)。戦略の選択・geo タグ・split brain の扱いは[プロジェクトのドキュメント](https://www.k8gb.io/)にある。新規に書くものは API グループ `k8gb.io/v1beta1` を使うこと。`k8gb.absa.oss/v1beta1` もまだ動くが、[歴史](./history) で述べたとおり移行元の旧グループ。
