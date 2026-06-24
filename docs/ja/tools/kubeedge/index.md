# KubeEdge

> 信頼できないネットワーク越しに、Kubernetes のコントロールプレーンをエッジノードと IoT デバイスまで延伸するエッジコンピューティングフレームワーク。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [kubeedge/kubeedge](https://github.com/kubeedge/kubeedge)
- **ドキュメント基準コミット**: `864f45eb1` (v1.23.0 の 89 コミット先, 2026-06-22)

## 何をするものか

KubeEdge はクラスタを 2 つのプレーンに分ける。クラウド側は `cloudcore` を動かす。これは通常の Kubernetes API サーバの隣に置くコントロールプレーンプロセスだ。エッジ側は各エッジノードで `edgecore` を動かす。Pod を管理しローカルの IoT デバイスと通信する軽量エージェントだ。両プレーンは単一の WebSocket または QUIC チャネルで接続し、その上でメッセージをやり取りする。

どちらのプロセスも Beehive 上に登録されたモジュールから組み立てられる。Beehive はリポジトリ内蔵のメッセージングフレームワークだ。モジュールは名前・グループ・再起動ポリシーを宣言し、他のモジュールとはメッセージバス経由でのみ通信する。これによりクラウドのコントローラとエッジのエージェントは疎結合に保たれ、両側がそれぞれ異なるモジュール集合を動かせる。

エッジエージェントは desired state をローカルの SQLite データベースに保存する。そのためクラウドへのリンクが切れてもエッジノードはワークロードを動かし続ける (エッジ自律性)。KubeEdge は素のワークロードオーケストレーションの上にデバイス管理を載せる。物理デバイスを Kubernetes のカスタムリソースとしてモデル化し、MQTT ブローカ経由で橋渡しする。

## いつ使うか

- コントロールプレーンへの接続を失うノードで Kubernetes ワークロードを動かし、オフラインでも動作し続けたい場合 (エッジ自律性)。
- IoT や現場のデバイスを管理し、それらを desired/reported のツインを持つ Kubernetes オブジェクトとして扱いたい場合。
- エッジハードウェアがフルの kubelet には非力だが、削ぎ落としたエージェントなら動かせる場合。
- すべてのノードが API サーバへ安定した低レイテンシ接続を持つ場合は不向き。標準クラスタや薄いディストロの方が単純だ。
- 単に小さい Kubernetes が欲しいだけでデバイスやオフライン要件がない場合も不向き。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [kubeedge/kubeedge (GitHub)](https://github.com/kubeedge/kubeedge)
2. [KubeEdge ADOPTERS.md](https://github.com/kubeedge/kubeedge/blob/master/ADOPTERS.md)
3. [CNCF Announces KubeEdge Graduation](https://www.cncf.io/announcements/2024/10/15/cloud-native-computing-foundation-announces-kubeedge-graduation/)
4. [KubeEdge has Graduated within the CNCF](https://kubeedge.io/blog/cncf-graduation-announcement/)
5. [KubeEdge v1.22 is live](https://kubeedge.io/blog/release-v1.22/)
6. [KubeEdge Releases](https://github.com/kubeedge/kubeedge/releases)
7. [Install KubeEdge with keadm](https://kubeedge.io/docs/setup/install-with-keadm)
8. [Huawei Cloud: KubeEdge Becomes a CNCF Graduated Project](https://www.huaweicloud.com/intl/en-us/news/20241018154136583.html)
