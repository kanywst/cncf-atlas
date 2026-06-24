# 採用事例・エコシステム

## 誰が使っているか

以下は公式の Istio ケーススタディがある組織。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| eBay | 本番類似の隔離テスト環境基盤 "Isolates" を Istio で支える。数十万コンテナ規模 | [case study](https://istio.io/latest/about/case-studies/ebay/) |
| Airbnb | 内部トラフィックの大半を Istio で処理。external control plane モデルを採用し 5 年間本番運用 | [case study](https://istio.io/latest/about/case-studies/airbnb/) |
| Salesforce | Envoy と自作 control plane から Istio へ pivot。end user かつ contributor | [case study](https://istio.io/latest/about/case-studies/salesforce/) |
| T-Mobile | 100+ クラスタ、fraud detection / billing / sales / API 向けに 100+ Istio インスタンス | [case study](https://istio.io/latest/about/case-studies/t-mobile/) |

## 採用のシグナル

- GitHub: stars 38,237、forks 8,329、open issues 471 (gh API, 2026-06-22)。
- コントリビュータ: anon を含め 1,400 超 (contributors API, last page 1432, 2026-06-22)。
- CNCF サーベイで最も採用されているサービスメッシュと報告されている ([CNCF blog](https://www.cncf.io/blog/2022/09/28/istio-sails-into-the-cloud-native-computing-foundation/))。
- 制御プレーンとサイドカーのコンテナイメージはそれぞれ Docker Hub で 10B+ download と公式が記載 ([Happy 7th Birthday](https://istio.io/latest/blog/2024/happy-7th-birthday/))。
- リリースは定期的なマイナーライン。ドキュメント基準コミット時点の直近タグは 1.30.1。

## エコシステム

Istio は CNCF プロジェクト群のスタックに座る。Envoy がデータプレーンプロキシ。SPIFFE が証明書の裏にあるワークロード ID モデル。Kubernetes Gateway API は Istio のトラフィック管理モデルから生まれた。Prometheus・Grafana・Jaeger がメッシュの吐くメトリクス・ダッシュボード・トレースを担う。Tetrate と Solo.io の商用ディストリは FIPS などのコンプライアンス向けパッケージングを足す。

## 代替候補

Istio の強みは、最も成熟した L7 トラフィック管理 (header routing、fault injection、mirroring、rate limit)、サイドカーレスと L7 オプトインを両立する ambient、SPIFFE ベースの ID。主要な代替とのトレードオフ:

| 代替 | 違い |
| --- | --- |
| [Linkerd](https://www.solo.io/topics/istio/linkerd-vs-istio) | 専用の Rust micro-proxy。control plane が軽量 (istiod の 1-2GB に対し 200-300MB) だがサイドカー方式のまま。2024 の Buoyant ライセンス変更で OSS 運用が混乱 |
| [Cilium](https://istio.io/latest/blog/2024/ambient-vs-cilium/) | eBPF でカーネル内処理、CNI と一体。L4 はカーネル、Istio ambient は user-space の ztunnel。Istio 自身のベンチは L7/暗号化を入れると user-space が勝ちうると主張するが vendor ベンチである点に注意 |
| Consul Connect | Kubernetes を超えたマルチプラットフォーム到達性と強い service discovery。データプレーンは既定で Envoy |
