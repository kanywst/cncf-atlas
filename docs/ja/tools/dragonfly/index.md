# Dragonfly

> コンテナイメージ・ファイル・AI モデルの配信を、大規模クラスタ全体でピアツーピア (P2P) で高速化する配布システム。

- **カテゴリ**: Runtime
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [dragonflyoss/dragonfly](https://github.com/dragonflyoss/dragonfly)
- **ドキュメント基準コミット**: `0041afa` (main, 2026-06-22)

## 何をするものか

Dragonfly は、消費者そのものを配布者に変えることで大きな成果物を配る。多数のマシンが同じコンテナイメージ・ファイル・モデル重みを必要とするとき、各コピーをオリジンから直接引くとレジストリとネットワークが飽和する。Dragonfly では各ノードが、すでにそのピースを持つピアから取得し、必要なときだけオリジンにフォールバックする。結果としてオリジンはノード数ぶんではなく少数回だけデータを供給する。

このリポジトリには 2 つの Go 製コントロールプレーンサービス、manager と scheduler が入っている。manager (`manager/`) は動的設定・クラスタ状態・コンソール UI・アクセス制御を担う。scheduler (`scheduler/`) は各ダウンロードについて、あるノードがどのピアからピースを引くべきかを決める。実データ転送は別のクライアント (`dfdaemon`/`dfget`) が行い、これは `dragonflyoss/client` リポジトリで Rust で実装されている。scheduler は gRPC で指示を返すだけだ。

Dragonfly は Alibaba Cloud のイメージ高速化システムとして始まり、その後 Hugging Face や ModelScope のモデルファイルを含む任意の成果物を配れるよう拡張された。コンテナランタイムの下にレジストリミラー兼プル高速化レイヤとして位置し、ワークロードはイメージの参照方法を変えずに Dragonfly 経由でプルする。

## いつ使うか

- 同じイメージやファイルを繰り返しプルする大規模クラスタを運用しており、レジストリやリージョン間帯域がボトルネックになっている。
- AI/ML のモデル重みを多数のノードへ配り、全ノードがオブジェクトストレージを叩く代わりにピア共有させたい。
- 単一ランタイムに縛られず、複数レジストリや任意のファイル URL に効くレジストリミラーが欲しい。
- 小規模クラスタやプルが稀な環境には不向き。manager・scheduler・seed peer などの構成要素は規模が出て初めて見合う運用コストを足す。
- クラスタローカルな containerd ミラーを最小構成で済ませたいだけなら、より軽量なステートレス系の方が向くこともある。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [dragonflyoss/dragonfly リポジトリ](https://github.com/dragonflyoss/dragonfly) (README, ADOPTERS, LICENSE, ソース)、参照日 2026-06-22。
2. [固定コミット `0041afa`](https://github.com/dragonflyoss/dragonfly/commit/0041afa00d64585052476d99b4b00a62111a88ed)、参照日 2026-06-22。
3. [CNCF projects: Dragonfly](https://www.cncf.io/projects/dragonfly/)、参照日 2026-06-22。
4. [CNCF blog: TOC votes to move Dragonfly into CNCF incubator](https://www.cncf.io/blog/2020/04/09/toc-votes-to-move-dragonfly-into-cncf-incubator/)、参照日 2026-06-22。
5. [The New Stack: CNCF Dragonfly Speeds Container, Model Sharing with P2P](https://thenewstack.io/cncf-dragonfly-speeds-container-model-sharing-with-p2p/)、参照日 2026-06-22。
6. [The New Stack: Dragonfly Brings Peer-to-Peer Image Sharing to Kubernetes](https://thenewstack.io/dragonfly-brings-peer-to-peer-image-sharing-to-kubernetes/)、参照日 2026-06-22。
7. [Alibaba Cloud: P2P-Based Intelligent Image Acceleration System of Dragonfly](https://www.alibabacloud.com/blog/p2p-based-intelligent-image-acceleration-system-of-dragonfly_599645)、参照日 2026-06-22。
8. [CNCF blog: Peer-to-Peer acceleration for AI model distribution with Dragonfly](https://www.cncf.io/blog/2026/04/06/peer-to-peer-acceleration-for-ai-model-distribution-with-dragonfly/)、参照日 2026-06-22。
9. [Dragonfly Kubernetes quick start](https://d7y.io/docs/getting-started/quick-start/kubernetes/)、参照日 2026-06-22。
