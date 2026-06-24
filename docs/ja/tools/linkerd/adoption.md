# 採用事例・エコシステム

## 誰が使っているか

以下の採用企業は、Linkerd 自身の adopters ページ (出典 7)、リポジトリ内の `ADOPTERS.md` (出典 8)、2025 年のケーススタディ (出典 14) から引用した。リストは大きいので、これは全体ではなく一部のサンプルである。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Adidas | Kubernetes 上の本番サービスメッシュ | [ADOPTERS.md](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md) |
| AT&T | 本番採用 | [ADOPTERS.md](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md) |
| Docker | 本番採用 | [ADOPTERS.md](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md) |
| Xbox Cloud Gaming | adopters ページのケーススタディ | [Adopters](https://linkerd.io/community/adopters/) |
| Nordstrom | adopters ページのケーススタディ | [Adopters](https://linkerd.io/community/adopters/) |
| DB Schenker AG | adopters ページのケーススタディ | [Adopters](https://linkerd.io/community/adopters/) |
| Imagine Learning | コンピュート要件を 80% 超削減、2024 年にメッシュ関連 CVE を 97% 削減と報告 | [InfoQ](https://www.infoq.com/news/2025/09/linkerd-cost-savings/) |
| H-E-B | CNCF 卒業アナウンスに登場したリファレンス顧客 | [CNCF](https://www.cncf.io/announcements/2021/07/28/cloud-native-computing-foundation-announces-linkerd-graduation/) |

## 採用のシグナル

`linkerd/linkerd2` リポジトリで 2026-06-22 に観測 (出典 5): GitHub stars 約 11,421、forks 1,354、open issues 214。リポジトリは 2017-12-04 作成、主言語は Go。GitHub contributors API はおよそ 377 名のコントリビュータを列挙する。CNCF は、Linkerd が 2021 年に欧州・北米で 118% 成長し、それらの地域で Istio の採用を上回ったと報告した (出典 9)。

## エコシステム

Linkerd は Kubernetes Gateway API と統合し、`viz` 拡張を通じて Prometheus と Grafana でメトリクスを扱う (出典 12)。`linkerd` CLI、または `linkerd-crds` と `linkerd-control-plane` の Helm チャートでインストールでき、Flux や Argo による GitOps デリバリでよく配信される。Buoyant は商用ディストリビューション Buoyant Enterprise for Linkerd とマネジメントプレーン Buoyant Cloud を提供する。第三者セキュリティ監査が 2024 年に実施され、2025 年に公開された (出典 10)。

## 代替候補

Linkerd の決定的な差はデータプレーンにある。Envoy ではなく専用の Rust 製マイクロプロキシ (`linkerd2-proxy`) を使い、低レイテンシ・低メモリ・メモリ安全を狙い、mTLS をデフォルトで有効にし、CLI 主導で運用する (出典 12, 13)。

| 代替 | 違い |
| --- | --- |
| Istio | データプレーンに Envoy (C++) を使い、機能セットが最も豊富。運用は重い。近年の ambient モード (ztunnel + waypoint) は Pod ごとのサイドカーから離れる (出典 12)。 |
| Cilium Service Mesh | eBPF でカーネル内処理し、多くのケースでサイドカー不要。L7 では node ごとに Envoy を動かす (出典 12)。 |
| Consul Connect | HashiCorp のメッシュ。マルチプラットフォーム (非 Kubernetes) に届く (出典 12)。 |
| Kuma / Kong Mesh | Kong エコシステム由来の Envoy ベースメッシュ (出典 12)。 |

## 出典

- 出典 1: [CNCF Announces Linkerd Graduation](https://www.cncf.io/announcements/2021/07/28/cloud-native-computing-foundation-announces-linkerd-graduation/)
- 出典 5: [linkerd/linkerd2 (control plane and CLI)](https://github.com/linkerd/linkerd2)
- 出典 7: [Linkerd 2.x Adopters & Case Studies](https://linkerd.io/community/adopters/)
- 出典 8: [ADOPTERS.md (linkerd2)](https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md)
- 出典 9: [Linkerd surpasses Istio adoption with 118% growth in 2021](https://www.cncf.io/blog/2022/03/04/linkerd-surpasses-istio-adoption-in-europe-and-north-america-with-118-growth-in-2021/)
- 出典 10: [Linkerd 2024 Security Audit](https://linkerd.io/2025/02/18/linkerd-2024-security-audit/)
- 出典 12: [Linkerd vs Istio (Buoyant)](https://www.buoyant.io/linkerd-vs-istio)
- 出典 13: [What is a service mesh? (linkerd.io)](https://linkerd.io/what-is-a-service-mesh/)
- 出典 14: [Imagine Learning highlights Linkerd cost savings (InfoQ)](https://www.infoq.com/news/2025/09/linkerd-cost-savings/)
