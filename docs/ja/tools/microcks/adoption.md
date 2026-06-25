# 採用事例・エコシステム

## 誰が使っているか

以下の組織はすべてプロジェクトの `ADOPTERS.md` か CNCF ブログに出典を持つ。公開出典の無い採用企業は載せない。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| J.B. Hunt | Microcks のモックで開発を 7 ヶ月短縮 | [blog post](https://microcks.io/blog/jb-hunt-mock-it-till-you-make-it/) |
| Société Générale | クラウドネイティブ API の多プロトコルモック/テスト | [Red Hat Summit 2019](https://www.redhat.com/files/summit/session-assets/2019/T8B6B4.pdf) |
| BNP Paribas | 2022 からレガシー基幹/メインフレーム API のモック | [ADOPTERS.md](https://github.com/microcks/microcks/blob/main/ADOPTERS.md) |
| Lombard Odier | mock-as-a-service / APIOps | [APIdays Paris 2022](https://speakerdeck.com/apidays/apidays-paris-2022-adding-a-mock-as-a-service-capability-to-your-api-strategy-portfolio-ludovic-pourrat-lombard-odier) |
| Amadeus | shift-left のモック/契約テスト | [Riviera DEV 2025](https://www.slideshare.net/slideshow/how-to-secure-your-apis-without-compromising-the-developer-experience-pdf/281499574) |
| GSMA | CAMARA API / Open Gateway のサンドボックス | [ADOPTERS.md](https://github.com/microcks/microcks/blob/main/ADOPTERS.md) |
| Deloitte | REST/SOAP 170+ API のバックエンドモック | [ADOPTERS.md](https://github.com/microcks/microcks/blob/main/ADOPTERS.md) |

`ADOPTERS.md` には出典付きの採用企業がさらに並ぶ。Nordic Semiconductor (nRFCloud.com)、Bitso (gRPC コントラクトテスト)、TransferGo、Michelin、GetYourGuide、Amway、Banco PAN (外部 Kafka 連携) など。他の OSS も Microcks を組み込む: Traefik (API サンドボックス製品に組込み)、AsyncAPI Generator (CI の acceptance test)、Fluent CI (出典 5)。

## 採用のシグナル

- GitHub: 1,969 stars / 341 forks (2026-06-24 時点) (出典 1)。
- CNCF の incubation ブログ (2026-05-07) は累計 645 contributors、2025 年のコンテナイメージ DL 250 万超 (2024 の 3 倍)、公開 adopter 34 組織 (2025 に 13 増)、直近 365 日中 342 日アクティブを報告 (出典 2)。
- contributor と活動の指標は [microcks.devstats.cncf.io](https://microcks.devstats.cncf.io/) で追跡されている (出典 10)。

## エコシステム

Microcks の GitHub 組織はコアサーバ周辺のプロジェクトを提供する: CLI (`microcks-cli`)、Testcontainers モジュール、Docker Desktop 拡張、Kubernetes Operator、各言語のクライアントライブラリ。CI/CD 連携は CLI 経由で GitHub Actions、Jenkins、Tekton と行う。必要なミドルウェアは永続化の MongoDB と認証の Keycloak で、async プロトコルを使う場合は Kafka 他ブローカーが加わる。新しめのサーフェスとして、モックを Model Context Protocol サーバとして公開する `McpController` と、OpenAI 連携の AI Copilot (`AICopilotController`) がある。

## 代替候補

Microcks は仕様駆動である。API アーティファクトに既にある example からモックを生成し、同じアセットをコントラクトテストにも再利用する。主要な代替はこの軸で異なる (出典 7, 8)。

| 代替 | 違い |
| --- | --- |
| WireMock / MockServer | config / code 駆動でスタブを手書きする。複雑な状態遷移や否定系テストに強いが、仕様への追従は手動 |
| Prism (Stoplight/SmartBear) | OpenAPI 専用の仕様駆動だが CLI のみで UI なし・単一プロセス。Microcks は UI・サーバ・複数プロトコル・契約テストを足す |
| Mountebank / Mockoon / Hoverfly | それぞれ多プロトコルプロキシ / デスクトップ GUI / レコード&リプレイ。Microcks は REST + SOAP + GraphQL + gRPC + AsyncAPI イベントを 1 つの Kubernetes ネイティブプラットフォームに統合し CNCF が後ろ盾 |
