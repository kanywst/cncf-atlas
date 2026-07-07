# Chaosblade

> バージョン付きの YAML 実験スペックをドメイン別の executor バイナリへ振り分けることで、ホスト・JVM・C++・コンテナ・Kubernetes をまたいで障害を注入する単一のコマンドラインツール。

- **カテゴリ**: Chaos Engineering
- **CNCF 成熟度**: Sandbox
- **言語**: Go (`blade` CLI 本体。別の Python 製 AI レイヤが `blade-ai/` に存在)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [chaosblade-io/chaosblade](https://github.com/chaosblade-io/chaosblade)
- **ドキュメント基準コミット**: `39a0c02` (2026-06-18、タグ `blade-ai-v0.5.0` 付近)

## 何をするものか

Chaosblade は Alibaba 発のカオスエンジニアリングツールである。カオスエンジニアリングとは、制御された障害をシステムに注入し、障害下での挙動を学ぶ実践を指す。中核となる成果物は `blade`、すなわち Go 製のコマンドラインインターフェース (CLI) であり、CPU 負荷・ネットワーク遅延・ディスク逼迫・プロセス kill といった障害注入実験を作成・照会・破棄する。

設計の中心は実験モデルである。すべてのシナリオは「target + action + フラグ」であり、ハードコードではなくバージョン付きの YAML で定義される。`blade` 自身は障害を注入しない。YAML を解釈し、実験レコードを組み立て、実際の作業を行う別バイナリ (例: `chaos_os`) を子プロセスとして起動する。この分離により、CLI は各実装を知らないまま、ホスト・Java 仮想マシン (JVM)・C++・Docker・Container Runtime Interface (CRI)・Kubernetes・クラウドプロバイダを横断できる。

状態はローカルの SQLite ファイルに保持されるため、単一ホストであれば実行中の実験を追跡・回復するのに外部データベースを必要としない。

## いつ使うか

- 種類の異なるターゲット (ベアホスト・JVM アプリ・コンテナ・Kubernetes Pod) をまたいで、レイヤごとに別ツールを使うのではなく、一貫した 1 つの CLI と実験文法で障害を注入したいとき。
- ネットワークやノードレベルのツールでは届かない、JVM のメソッド例外や C++ の行レベル障害といったアプリケーション層の障害注入が必要なとき。
- 実験を自己回復させたいとき。`timeout` フラグが自動 destroy をスケジュールするため、消し忘れた実験が残り続けない。
- 主要インターフェースとして完全宣言的・Kubernetes ネイティブ・カスタムリソース駆動のワークフローが欲しい場合は不向き。その用途には operator (`chaosblade-operator`) や Chaos Mesh / LitmusChaos がクラスタに近い。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. chaosblade-io/chaosblade リポジトリと README: <https://github.com/chaosblade-io/chaosblade>
2. Chaosblade CNCF プロジェクトページ (Sandbox、2021-04-28 受理): <https://www.cncf.io/projects/chaosblade/>
3. ChaosBlade, An Open-Source Chaos Engineering Tool by Alibaba: <https://www.alibabacloud.com/blog/chaosblade---an-open-source-chaos-engineering-tool-by-alibaba_594850>
4. ChaosBlade: From the Chaos Engineering Experiment Tool to the Chaos Engineering Platform: <https://www.alibabacloud.com/blog/chaosblade-from-the-chaos-engineering-experiment-tool-to-the-chaos-engineering-platform_598663>
5. ChaosBlade-Box, a New Version of the Chaos Engineering Platform Has Released: <https://chaosblade.io/en/blog/2022/06/24/ChaosBlade-Box-a-New-Version-of-the-Chaos-Engineering-Platform-Has-Released/>
6. ChaosBlade ドキュメント: <https://chaosblade.io/en/docs/>
7. LFX Insights, ChaosBlade: <https://insights.linuxfoundation.org/project/chaosblade>
8. Chaos Engineering in the Wild: Findings from GitHub (arXiv 2505.13654): <https://arxiv.org/html/2505.13654>
9. コミット `39a0c02e5f34af980f561440c0f1c218a3cde821` のローカルクローン: <https://github.com/chaosblade-io/chaosblade/tree/39a0c02e5f34af980f561440c0f1c218a3cde821>
