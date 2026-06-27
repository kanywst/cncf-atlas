# 採用事例・エコシステム

## 誰が使っているか

以下の採用組織はプロジェクトの `ADOPTERS.md` (出典 [6]) に由来する。これは issue #748 経由の自己申告であり、独立検証されたケーススタディではなく登録した組織の一覧として扱うべきである。最も明確な一次採用者はエンジンが生まれ本番で動いている Baidu である (出典 [2])。ファイルからの代表例を挙げる。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Baidu | BFE の発祥; 本番トラフィックプラットフォーム | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (出典 [6]) |
| Shenzhen Stock Exchange | 一覧記載の採用者 | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (出典 [6]) |
| China Merchants Bank | 一覧記載の採用者 | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (出典 [6]) |
| Postal Savings Bank of China | 一覧記載の採用者 | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (出典 [6]) |
| State Grid | 一覧記載の採用者 | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (出典 [6]) |
| Sichuan Airlines | 一覧記載の採用者 | [ADOPTERS.md](https://github.com/bfenetworks/bfe/blob/develop/ADOPTERS.md) (出典 [6]) |

ファイルにはほかに CCTV、China Life、SPD Bank、Yillion Bank、Duxiaoman Financial、Haier、USTC、360 などの記載がある。

## 採用のシグナル

リポジトリ API による GitHub シグナル、2026-06-26 観測 (出典 [3]):

- Stars: 6,249
- Forks: 942
- Contributors: 非匿名で約 102 (匿名込みで約 115)
- `develop` のコミット数: 約 1,227
- 最新リリース: v1.8.2、2026-05-08 公開

プロジェクトは CNCF Sandbox メンバーで、2020-06-25 受理である (出典 [1])。

## エコシステム

コントロールプレーンと周辺ツールは bfenetworks 組織配下の別リポジトリにある (出典 [7]):

- API-Server: 設定を保存・生成・検証する。
- Conf-Agent: 最新設定を取得し、サーバにリロードを促す。
- Dashboard: 設定管理の GUI。
- ingress-bfe: BFE をバックエンドとする Kubernetes Ingress コントローラ。

README は連携先を挙げる (出典 [2]): ingress-bfe 経由の Kubernetes、組み込みメトリクスの Prometheus、`mod_trace` による分散トレーシングの Jaeger、ログの Fluentd である。BFE は通常 L4 ロードバランサの背後に配置される。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Envoy (CNCF Graduated) | C++ 製; 動的な xDS 設定; サービスメッシュのデータプレーン標準。より広範だが設定が複雑 |
| NGINX / OpenResty | C + Lua スクリプト; 最も普及したプロキシ。BFE は Lua ではなくコンパイル済み Go モジュールで拡張する |
| HAProxy | C 製; L4/L7 プロキシに特化した高性能ロードバランサ |
| Traefik | Go 製; クラウドネイティブな自動ディスカバリ。Go と Kubernetes ユーザにとって最も近い同類 |
| Emissary-ingress / Contour | Envoy ベースの Kubernetes API ゲートウェイ; 最も直接的なクラウドネイティブ比較対象 |

条件として表現する内容ベースのルーティング、コアに組み込まれた GSLB + SLB の二段ロードバランス、Go モジュールでの拡張が欲しいなら BFE を選ぶ。大規模なエコシステムと動的 xDS が必要なら Envoy、単純な静的プロキシで足りるなら NGINX を選ぶ。
