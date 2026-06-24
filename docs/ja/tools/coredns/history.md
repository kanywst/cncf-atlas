# 歴史

## 起源

CoreDNS は 2016 年 3 月、Google の SRE である Miek Gieben が始めた。彼はそれ以前に、サービスディスカバリ向けの DNS サーバ SkyDNS と、広く使われている Go の DNS ライブラリ `miekg/dns` を書いていた。CoreDNS は SkyDNS への不満から生まれた。SkyDNS はモノリシックで拡張しづらく、BIND9・NSD・Knot のような従来サーバは etcd などを backend にできなかった。狙いは、複数の backend (etcd、Consul、Kubernetes) と話せて拡張も容易な、汎用 DNS サーバだった ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/))。

アーキテクチャは Caddy web server から取った。Caddy の middleware を連鎖させるパターンを DNS に転用したため、初期は "Caddy DNS" と呼ばれた。CoreDNS は今も Caddy の fork に依存しており、`github.com/coredns/caddy` として import している (`src/core/dnsserver/register.go:8`)。自身を Caddy の server type として登録するので、Corefile は Caddyfile として parse される ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/)、[O'Reilly](https://www.oreilly.com/library/view/learning-coredns/9781492047957/ch01.html))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | Miek Gieben がプロジェクト開始。リポジトリ作成は 2016-03-18 (Caddy の設計から派生)。 |
| 2017 | CNCF が CoreDNS の steward に (2017-03-02)、Sandbox 相当。 |
| 2018 | CNCF Incubating に昇格。Kubernetes 1.11 でクラスタ DNS add-on として利用可能に。 |
| 2018 | Kubernetes 1.13 でデフォルトのクラスタ DNS に昇格し、kube-dns スタックを置き換え。 |
| 2019 | 2019-01-24 に CNCF を Graduated。その年最初の graduation。 |
| 2026 | `v1.14.4` リリース (2026-06-09)。Go 1.25.0 を要求。 |

## どう進化したか

最大の転換点は Kubernetes への採用だった。CoreDNS は Kubernetes 1.11 でクラスタ DNS add-on として使えるようになり、1.13 でデフォルトに昇格して kube-dns スタック (dnsmasq と補助コンテナ) を置き換えた。これは一部、当該スタックの脆弱性への対応でもあった ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/))。これによって CoreDNS はほぼすべての Kubernetes クラスタの DNS 層になった。

CNCF の成熟度も同時期に進んだ。2017 年 3 月に steward、2018 年に Incubating、2019-01-24 に Graduated ([CNCF steward 発表](https://www.cncf.io/blog/2017/03/02/cloud-native-computing-foundation-becomes-steward-service-naming-discovery-project-coredns/)、[CNCF graduation 発表](https://www.cncf.io/announcements/2019/01/24/coredns-graduation/))。graduation 時点で 100 人超の contributor と 16 人の active maintainer を公表していた ([InfoQ](https://www.infoq.com/news/2019/02/coredns-graduates-cncf/))。

## 現在地

CoreDNS は定期的にタグ付きリリースを出しており、`v1.14.4` は 2026-06-09 に公開された。コードベースは新しい Go バージョンを追随し、直近 2 つの Go リリースをサポートする。現状の最低要件は Go 1.25.0 (`src/go.mod:5`)。機能は肥大化するコアではなく in-tree / out-of-tree のプラグインで提供され続けており、Kubernetes のデフォルトのクラスタ DNS であり続けている。
