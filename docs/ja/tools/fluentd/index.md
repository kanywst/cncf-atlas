# Fluentd

> ログ収集を統一するオープンソースのデータコレクタ。多様な入力からイベントを集め、タグでルーティングし、バッファリングして多様な出力へ送り出す。

- **カテゴリ**: Observability
- **CNCF 成熟度**: Graduated
- **言語**: Ruby (コア) と依存 gem 経由の C 拡張
- **ライセンス**: Apache-2.0
- **リポジトリ**: [fluent/fluentd](https://github.com/fluent/fluentd)
- **ドキュメント基準コミット**: `729eb32` (2026-06-19、v1.19.2 以降の master)

## 何をするものか

Fluentd は、イベントを生み出すものと、それを保存・分析するシステムとの間に位置するロギングエージェントである。入力と出力の組み合わせごとに専用の転送ツールを書く代わりに、入力を Fluentd に向け、各イベントにタグを付け、タグ付きイベントを出力へ送るルーティングルールを書く。これを「Unified Logging Layer (統合ロギング層)」と呼ぶ ([出典 3](https://www.fluentd.org/architecture/))。

コアは Ruby で書かれている。性能が効く部分は msgpack などの依存 gem 経由で C 拡張を使う。イベントはタグ、ナノ秒精度のタイムスタンプ、レコード本体を持つ MessagePack エンコードのレコードとして流れる。バッファリング、指数バックオフ付きの再送、ルーティングはコアに組み込まれており、個々のプラグインは小さく保たれる。Ruby は `>= 3.2` を要求する (`fluentd.gemspec:28`)。

コア以外はほぼすべてがプラグインである。入力・出力・フィルタ・パーサ・フォーマッタ・バッファバックエンドはすべて差し替え可能で、コミュニティが数百を提供している。Fluentd は CNCF Graduated プロジェクトである ([出典 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/))。

## いつ使うか

- 異種混在のソースからログを集め、1 か所でタグ付け・フィルタ・複数バックエンドへの分配を行いたいとき。
- バッファと再送による信頼性の高い配送が必要なとき。再起動を生き延びるファイルバッファも含む。
- 統合を自作する代わりに、既製の入力・出力プラグインの大規模なカタログが欲しいとき。
- Kubernetes 上で、オペレータや Helm チャートに囲まれたベンダー中立のコレクタを動かしたいとき。

向かないのは、すべてのエッジノードでサブメガバイト級のメモリフットプリントが必要な場合である。Ruby コアは数十 MB 級で動き、その用途は姉妹プロジェクトの Fluent Bit が担う ([出典 3](https://www.fluentd.org/architecture/))。単一ソースが単一バックエンドへルーティングなしで送るだけなら、Fluentd は過剰である。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとイベントの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [fluent/fluentd (GitHub)](https://github.com/fluent/fluentd)
2. [Fluentd LICENSE (Apache-2.0)](https://github.com/fluent/fluentd/blob/master/LICENSE)
3. [What is Fluentd? (architecture)](https://www.fluentd.org/architecture/)
4. [CNCF announces Fluentd graduation (2019-04-11)](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/)
5. [Fluentd (Wikipedia)](https://en.wikipedia.org/wiki/Fluentd)
6. [Logstash, Fluentd, Fluent Bit, or Vector? (CNCF)](https://www.cncf.io/blog/2022/02/10/logstash-fluentd-fluent-bit-or-vector-how-to-choose-the-right-open-source-log-collector/)
7. [Fluentd testimonials](https://www.fluentd.org/testimonials)
8. [gh API repos/fluent/fluentd](https://api.github.com/repos/fluent/fluentd)
