# Eraser

> Eraser は Kubernetes クラスタの全ノードから、非実行のコンテナイメージを指定リストに沿って削除する。Trivy でスキャンして脆弱なイメージを自動削除もできるが、実行中コンテナが依存するイメージには決して手を出さない。

- **カテゴリ**: Security & Compliance
- **CNCF 成熟度**: Sandbox (2023-06-30 受理)
- **言語**: Go (`go 1.24.0`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [eraser-dev/eraser](https://github.com/eraser-dev/eraser)
- **ドキュメント基準コミット**: `20576a24` (`git describe` = `v1.5.0-beta.0-57-g20576a24`)

## 何をするものか

Eraser はクラスタノードからコンテナイメージを削除する Kubernetes コントローラである。kubelet は pull したイメージをすべてキャッシュし、その組み込みイメージ GC はディスク使用率の閾値でしか発火しない。キャッシュ済みイメージが脆弱かどうか、不要かどうかは一切見ない。既知の CVE を持つ古いイメージはノードに残り続け、容量を食い、攻撃面を広げる。Eraser はディスク圧迫ではなくポリシーに基づいてイメージを消すことで、この穴を埋める (`src/README.md:11`)。

動作は 2 モードある。マニュアルモードでは、管理者が削除したいイメージを `ImageList` カスタムリソースに列挙し、Eraser はそれを、対象がどのコンテナにも使われていない各ノードから削除する。スキャンモードでは、Eraser が定期的に全ノードのイメージを収集し、Trivy でスキャンし、脆弱性が閾値を超える非実行イメージを削除する。スキャンをオフにすると、単なる定期イメージクリーナとして動く (`src/README.md:11`)。両モードに共通する 1 つのルールが、実行中コンテナが参照するイメージは決して削除しないことであり、この保証は kubelet を信用するのではなく CRI の実データから構築される。

Eraser は、ノードのイメージ衛生をクラスタ全体のポリシーとして扱いたいプラットフォーム/セキュリティチーム向けである。侵害されたタグを一括で全ノードから消す、あるいは kubelet が残してしまう脆弱なレイヤを継続的に刈り込む、といった用途になる。各ノードに常駐するエージェントではなく、コントローラとノード単位の短命ワーカー Pod として動く。

## いつ使うか

- 特定のイメージ (侵害されたタグ、漏洩したビルド) をクラスタ全ノードから削除し、実行していないノードで消えたことを確認したい。
- ディスクが埋まったときだけでなく、スキャナの判定に基づいて脆弱なイメージを継続的に刈り込みたい。
- スキャンを無効にし、ノード横断で未使用イメージの定期クリーンアップだけをしたい。
- 削除を安全に行いたい。実行中コンテナが使うイメージは放置しなければならない。
- 単にディスク容量を回収したいだけなら適さない。それは kubelet 自身のイメージ GC が閾値ですでにやっている。
- スキャナでもランタイムの admission ゲートでもない。Eraser はノードに既に存在するイメージを削除するだけで、脆弱なイメージの pull やスケジュールを止めはしない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとクリーンアップの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動くクリーンアップ。

## 出典

1. [eraser-dev/eraser (GitHub)](https://github.com/eraser-dev/eraser) (参照 2026-07-08)
2. [CNCF プロジェクトページ: Eraser](https://www.cncf.io/projects/eraser/) (参照 2026-07-08)
3. [pinned commit 20576a24 の Eraser ソース](https://github.com/eraser-dev/eraser/tree/20576a24c512feb83c26ed867353d4143717d798) (参照 2026-07-08)
4. [CNCF Sandbox 申請: Eraser (cncf/sandbox issue #24)](https://github.com/cncf/sandbox/issues/24) (参照 2026-07-08)
5. [KubeCon NA 2023: Eraser: Cleaning up Vulnerable Images from Kubernetes Nodes](https://kccncna2023.sched.com/event/1R2q9/) (参照 2026-07-08)
6. [トークアーカイブ: Eraser (Peter Engelbert & Ashna Mehrotra)](https://talks.container-security.site/kubecon%20+%20cloudnative%20north%20america%202023/Eraser-Cleaning-up-Vulnerable-Images-from-Kuberne/) (参照 2026-07-08)
7. [Open at Microsoft: Cleaning Your Kubernetes Clusters](https://learn.microsoft.com/en-us/shows/open-at-microsoft/cleaning-your-kubernetes-clusters) (参照 2026-07-08)
8. [Use Image Cleaner on Azure Kubernetes Service (AKS)](https://learn.microsoft.com/en-us/azure/aks/image-cleaner) (参照 2026-07-08)
