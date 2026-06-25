# Emissary-Ingress

> Envoy Proxy を基盤に、CRD だけで設定する Kubernetes ネイティブな API ゲートウェイ兼 Ingress。

- **カテゴリ**: API Gateway
- **CNCF 成熟度**: Incubating
- **言語**: Go と Python
- **ライセンス**: Apache-2.0
- **リポジトリ**: [emissary-ingress/emissary](https://github.com/emissary-ingress/emissary)
- **ドキュメント基準コミット**: `65b0dd9ae` (タグ `v4.0.1` 付近、2026-05-01)

## 何をするものか

Emissary-Ingress は Kubernetes 向けの Ingress コントローラ兼 API ゲートウェイである。データプレーンとして Envoy Proxy を動かし、それを Kubernetes のカスタムリソースから設定する。ルーティングは `Listener`・`Host`・`Mapping` リソースで宣言し、Emissary がそれを Envoy 設定に変換する。source of truth は Kubernetes であり、専用のデータベースは持たない。

1 つのコンテナの中で 4 つの要素が協調して動く。Go の `entrypoint` プロセス、Python の `diagd` 設定エンジン、Envoy プロセス、そして `ambex` という Go の ADS サーバである。Go 側がクラスタを watch して snapshot を組み立て、Python 側がその snapshot を Envoy 設定にコンパイルし、`ambex` が結果を xDS の集約ディスカバリサービス (ADS) で Envoy に流す。

OSS のこのプロジェクトは商用 Ambassador Edge Stack のコアであり、Edge Stack は同じエンジンの上に ACME/TLS 自動化、OAuth/OIDC、レート制限、開発者ポータルを追加する。

## いつ使うか

- アノテーションではなく CRD で宣言的に設定する Envoy ベースの edge ゲートウェイが欲しいとき。
- プレーンな NGINX Ingress より細かい L7 制御 (ヘッダベースのルーティング、トラフィック分割、レート制限フック) が必要なとき。
- 大量のリクエストを捌き、プロキシを再起動せずに Envoy の動的な xDS 更新を使いたいとき。
- すでに独自ゲートウェイを同梱するサービスメッシュを運用している場合や、最小限の単一 Ingress バイナリで足りる場合は向かない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [emissary-ingress/emissary (GitHub)](https://github.com/emissary-ingress/emissary)
2. [emissary-ingress (formerly Ambassador) is now a CNCF incubating project (CNCF)](https://www.cncf.io/blog/2021/04/13/emissary-ingress-formerly-ambassador-is-now-a-cncf-incubating-project/)
3. [CNCF Adopts Ambassador's API Gateway, Emissary Ingress (The New Stack)](https://thenewstack.io/cncf-adopts-ambassadors-api-gateway-emissary-ingress/)
4. [Emissary-Ingress (CNCF projects)](https://www.cncf.io/projects/emissary-ingress/)
5. [Quick Start (emissary-ingress.dev 3.10)](https://emissary-ingress.dev/docs/3.10/quick-start/)
6. [Install with Helm (getambassador.io)](https://www.getambassador.io/docs/emissary/latest/topics/install/helm)
7. [Install manually / yaml-install (getambassador.io)](https://www.getambassador.io/docs/emissary/latest/topics/install/yaml-install)
