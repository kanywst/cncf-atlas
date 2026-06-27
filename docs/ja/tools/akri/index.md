# Akri

> Akri はエッジの leaf device (IP カメラ、USB 周辺機器、OPC UA サーバ) を発見し、Kubernetes クラスタにスケジュール可能なリソースとして公開する。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Sandbox
- **言語**: Rust
- **ライセンス**: Apache-2.0
- **リポジトリ**: [project-akri/akri](https://github.com/project-akri/akri)
- **ドキュメント基準コミット**: `604bdcb` (タグ v0.13.8 の近傍)

## 概要

Akri (名称は "A Kubernetes Resource Interface" の略) は、Kubernetes ノードになれないデバイスを扱うために Kubernetes の device plugin framework を拡張する。小さな IP カメラや USB センサには kubelet を動かす計算資源がなく、デバイスはそれを広告するノードのローカルにあると仮定する標準の device plugin モデルではエッジ群にうまく合わない。

Akri はエッジ固有の 3 つの課題を解く。プラグイン可能なプロトコルハンドラで leaf device を発見し、発見した各デバイスをリソースとしてクラスタに広告し、デバイスに到達できるノードへワークロード (「broker」) をスケジュールする。複数ノードから見えるデバイス (ネットワークカメラなど) が見つかると、Akri はそれを単一の共有リソースとして表現し、複数ノードが設定された capacity の範囲でアクセスを調整できるようにする。

このプロジェクトは Microsoft DeisLabs から生まれ、2021 年 9 月に CNCF Sandbox に入った。2 つの常駐ワークロード (Agent DaemonSet と Controller) に加え、一連の Discovery Handler から成り、すべて 2 つの CustomResourceDefinition (CRD) で設定する。

## 使いどころ

- 既存の Kubernetes クラスタをエッジで運用しており、ノードでないデバイス (カメラ、シリアル/USB 周辺機器、OPC UA エンドポイント) をクラスタリソースとして公開したい場合。
- 同一の物理デバイスが複数ノードから到達可能で、それを 1 つの論理リソースとして capacity 制限付きで共有したい場合。
- 独自プロトコル用の discovery プラグインを書き、完全な device plugin を書かずに Akri にデバイスごとの broker をスケジュールさせたい場合。
- デバイス自体が Kubernetes を動かせる場合 (通常のノードにする) や、デバイスをノード化する完全なエッジ制御面が必要な場合 (KubeEdge や OpenYurt が適する) には向かない。

## この deep-dive の構成

- [歴史](./history): 起源、マイルストーン、存在理由。
- [アーキテクチャ](./architecture): 構成要素とリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が運用し、周辺に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動作構成。

## 出典

1. project-akri/akri README とリポジトリメタデータ: <https://github.com/project-akri/akri>
2. Akri プロジェクトページ、CNCF (Sandbox 受理日とライセンス): <https://www.cncf.io/projects/akri/>
3. SANDBOX PROJECT ONBOARDING: Akri、cncf/toc issue 719: <https://github.com/cncf/toc/issues/719>
4. Akri a Year Later、DeisLabs: <https://deislabs.io/posts/akri-a-year-later/>
5. Kubernetes Podcast episode 132、Akri、with Kate Goldenring: <https://kubernetespodcast.com/episode/132-akri/>
6. Akri docs、Getting Started: <https://docs.akri.sh/user-guide/getting-started>
7. Kubernetes at the edge with Akri、InfoWorld: <https://www.infoworld.com/article/2260916/kubernetes-at-the-edge-with-akri.html>
