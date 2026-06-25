# OpenYurt

> 素の Kubernetes コントロールプレーンをそのまま使い、エッジノードにオフライン自律を足す。upstream の API は無改変のまま。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [openyurtio/openyurt](https://github.com/openyurtio/openyurt)
- **ドキュメント基準コミット**: `f01cbf5` (2026-06-22)

## 何をするものか

OpenYurt は標準の Kubernetes クラスタを拡張してエッジノードを管理する。コントロールプレーンはクラウドに置き、無改変の upstream Kubernetes を動かしたまま、不安定または断続的なネットワークの先にあるエッジノードを管理する。エッジノードは物理リージョン単位でまとまり、OpenYurt はこれを `Pool` と呼ぶ (`README.md:31-34`)。

決定的な選択は非侵襲性だ。OpenYurt は Kubernetes コントロールプレーンを fork も再実装もしない。各ノードのリバースプロキシ (YurtHub)、コントローラと Webhook の集合 (Yurt-Manager)、そしてリージョン間ネットワークと IoT デバイス連携のためのオプションエージェントを足すだけだ。プロジェクトはこれを「Kubernetes API 互換性を無傷で保つ」と表現する (`README.md:24-25`)。

実用上の見返りはエッジ自律だ。エッジノードがクラウドの apiserver へのリンクを失っても、YurtHub がローカルディスクのキャッシュから応答を返すため、kubelet と kube-proxy は動き続け、ワークロードも止まらない。

## いつ使うか

- クラウドに 1 つの Kubernetes コントロールプレーンを置き、小売・工場・通信エッジなど遠隔サイトのノードを不安定なリンク越しに管理したいとき。
- クラウド接続が切れてもエッジノードでワークロードを動かし続けたいとき。
- Kubernetes コントロールプレーンを書き換えずにリージョン対応の配置をしたいとき。
- 全ノードがコントロールプレーンと信頼できる LAN を共有する構成では弱い。自律やプールの仕組みがほとんど効かない。
- 軽量 Kubernetes ディストロではない。エッジで小さな単一バイナリのクラスタが必要なら、k3s のようなディストロは別の問題を解く。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [openyurtio/openyurt リポジトリ](https://github.com/openyurtio/openyurt)
2. [OpenYurt Becomes a CNCF Incubating Project (CNCF ブログ, 2025-07-02)](https://www.cncf.io/blog/2025/07/02/openyurt-becomes-a-cncf-incubating-project/)
3. [CNCF プロジェクトページ: OpenYurt](https://www.cncf.io/projects/openyurt/)
4. [OpenYurt README](https://github.com/openyurtio/openyurt/blob/master/README.md)
5. [OpenYurt LICENSE (Apache 2.0)](https://github.com/openyurtio/openyurt/blob/master/LICENSE)
6. [OpenYurt docs: YurtHub コアコンセプト](https://openyurt.io/docs/next/core-concepts/yurthub)
7. [OpenYurt docs: インストール概要](https://openyurt.io/docs/installation/summary)
8. [KubeEdge](https://kubeedge.io)
