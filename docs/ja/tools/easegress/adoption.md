# 採用事例・エコシステム

## 誰が使っているか

Easegress の採用証跡は薄い。リポジトリに `ADOPTERS.md` は無く、本ディープダイブでは本番で Easegress を動かしている、出典を示せるサードパーティ組織を見つけられなかった。出典のある唯一の利用者は開発元ベンダの MegaEase であり、Easegress を開発し自社製品として紹介していた (MegaEase 製品ページ)。これはベンダの自社利用であって独立した採用ではない。以下の表は外部採用を主張するのではなく、出典のある関係を記録する。

| 組織 | 関係 | 出典 |
| --- | --- | --- |
| MegaEase | Easegress を開発し、製品として紹介 | [MegaEase 製品ページ](https://megaease.com/easegress/) |
| CNCF | 2023-12-19 以降、Sandbox プロジェクトとしてホスト | [CNCF プロジェクトページ](https://www.cncf.io/projects/easegress/) |

## 採用のシグナル

名指しできる外部採用者を示せない以上、測定可能なシグナルがここでは重みを持つ。2026-07-08 時点 (GitHub API): スター 5,873、フォーク 495、コントリビュータおよそ 69。リポジトリ作成は 2021-05-28、この観測時点での最終 push は 2026-07-01。リリース系統は活発で、タグ `v2.11.0` は 2026-03-17 に切られた。Docker Hub には `megaease/easegress` イメージが pulls バッジ付きで公開されている (README)。これらは健全なリポジトリのシグナルだが、あくまでプロジェクト活動の指標であって、名指しの組織での本番利用の証拠ではない。本ページが正直に扱うのはこのギャップである。

## エコシステム

Easegress は単独で完結するより連携するように作られている。Kubernetes Ingress コントローラ (`pkg/object/ingresscontroller`)、`MeshController` によるサービスメッシュモード (EaseMesh サイドカー)、Knative FaaS サポート、そして Eureka・Consul・Nacos・Zookeeper・etcd 向けのサービスレジストリ (`*serviceregistry` オブジェクト) を備える。MQTT を Kafka へブリッジし、`wasmhost` filter で WebAssembly 拡張を扱い、直近では `pkg/object/aigatewaycontroller` で LLM ゲートウェイを追加した。Web UI である Easegress Portal は別リポジトリにある。ポリシー面では OPA filter を持ち、Open Policy Agent Ecosystem にエントリがある (OPA Ecosystem)。

## 代替候補

Easegress は混み合ったゲートウェイ/プロキシ領域で競合する。特徴は result 駆動の filter pipeline と埋め込み etcd クラスタであり、各代替はそのいずれかの軸で異なる。

| 代替 | 違い |
| --- | --- |
| Envoy (CNCF Graduated) | C++ のデータプレーンを Istio などの外部コントロールプレーンが xDS で設定する。Easegress は xDS 駆動ではなく埋め込み etcd による自己設定 |
| Kong | Nginx + Lua (OpenResty) と広いプラグインマーケット。Easegress は Go の filter と WebAssembly で拡張し、C + Lua スタックを設計上避ける |
| Apache APISIX | 同じく Nginx + Lua かつ etcd 連携だが外部 etcd を使う。Easegress は etcd を自身のバイナリ内に埋め込む |
| Traefik | Kubernetes/Docker の自動サービスディスカバリに軸を置く Go プロキシ。Easegress はメッシュ・MQTT・LLM ゲートウェイまで守備範囲が広い |
