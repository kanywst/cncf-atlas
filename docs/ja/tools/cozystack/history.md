# 歴史

## 起源

Cozystack は Andrei Kvapil (@kvaps) が始め、当初は彼が創業したコンサル企業 Ænix が開発・スポンサーした (README, 出典 2)。GitHub リポジトリの作成は 2023-11-21 (GitHub API, 出典 8)。Kvapil はこのプロジェクトを、独自スタックではなくオープンソースの Kubernetes 部品から自分のクラウドを作るという長年の目標の結実だと述べている (Ænix ブログ, 出典 6)。

解こうとした課題は具体的だった。自前のハードで マネージド Kubernetes・仮想マシン・データベースを提供したいホスティング事業者やプラットフォームチームは、多数の別プロジェクトを継ぎ合わせ、それぞれを運用する必要があった。Cozystack はその継ぎ合わせを、単一 API を持つ意見の入ったプラットフォームとしてパッケージ化する。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2023 | リポジトリ `cozystack/cozystack` を 2023-11-21 に作成 (出典 8)。 |
| 2024 | ADOPTERS.md に初期の本番採用が登場。最初は Ænix で 2024-02-14 (出典 3)。v0.8.0 系で FluxCD operator・E2E テスト・ARM 対応を追加 (出典 6)。 |
| 2025 | CNCF TOC が 2025-02-28 に Sandbox 受理を可決。CNCF が 2025-04-28 に公式アナウンス (出典 5, 6)。 |
| 2026 | 2026-06-24 に `v1.5.1` をリリース。プロジェクトは 1.5 系にある (出典 1)。 |

## どう進化したか

CNCF に移った理由の 1 つはライセンスの持続性だった。Kvapil は MongoDB・Redis・Terraform・Vault が行ったライセンス変更を引き合いに出し、CNCF への寄贈を Cozystack が Apache-2.0 のままであることの保証と位置づけた (Ænix ブログ, 出典 6)。Sandbox 申請自体は CNCF のプロセスに記録が残る。sandbox 提案 issue `cncf/sandbox#322` と TAG App Delivery レビュー `cncf/tag-app-delivery#719` だ (CNCF 側の出典)。

技術的には、マニフェストのバンドルからコントローラ駆動のプラットフォームへと成長した。v0.8.0 系で専用の FluxCD operator と E2E テストを導入し、以降のリリースで `packages/apps/` のマネージドサービスカタログと `packages/system/` のシステムコンポーネント群を広げた。API 層は [アーキテクチャ](./architecture) と [内部実装](./internals) で述べる集約 apiserver モデルに落ち着いた。ユーザ向けの kind は `ApplicationDefinition` リソースで定義され、ハードコードではなく動的に提供される。

## 現在地

Cozystack は CNCF Sandbox プロジェクト (出典 4) で、`cozystack` GitHub organization の下で開発され、ガバナンスとメンテナはリポジトリの GOVERNANCE.md と MAINTAINERS.md に記載される (出典 1)。リリースはタグ付きバージョンとして切られ、執筆時点の最新は 2026-06-24 の `v1.5.1` だ (出典 1)。メンテナ層は Ænix を超えて広がり、採用企業である Urmanac や Hidora の人物も含む (出典 3)。プロジェクトは README から参照される OpenSSF Best Practices バッジを取得している (出典 2)。
