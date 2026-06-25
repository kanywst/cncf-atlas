# OpenKruise

> Kubernetes 標準ワークロードを拡張し、Pod を再作成せずにコンテナイメージだけを差し替える Kubernetes コントローラ群。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [openkruise/kruise](https://github.com/openkruise/kruise)
- **ドキュメント基準コミット**: `439d98db` (master、`v1.9.0` 直後、2026-06-21)

## 何をするものか

OpenKruise は Kubernetes 組み込みのワークロードコントローラを置き換え・拡張する一連のコントローラと CRD の集合。CloneSet、Advanced StatefulSet、Advanced DaemonSet は上流の Deployment / StatefulSet / DaemonSet の上位互換で、in-place なコンテナイメージ更新、partition ベースのカナリア、Pod ごとの PVC テンプレート、並列更新ウィンドウ、削除コスト制御を足す。

看板機能は in-place update。ワークロードの変更がコンテナの `image` フィールドだけ (v1.8 以降は resize subresource 経由の resource 要求も) に収まるとき、Pod を削除・再作成せずに走っている Pod を patch する。kubelet は再スケジュールせずにコンテナを再起動するので、変更は scheduler / CNI / CSI をスキップし PVC の再バインドも避けられる。Pod の入れ替えが高コストになる大規模環境で効いてくる。

実体は 2 つのデプロイ単位に分かれる。コントローラ群と admission webhook を 1 バイナリに同居させた中央の `kruise-manager` と、各ノードに常駐する `kruise-daemon` DaemonSet で、後者はイメージの事前 pull、ランタイムのコンテナ meta 報告、コンテナ再作成、Pod probe を担う (`cmd/daemon/main.go:85`)。in-place update はこの 3 者が協調して初めて成立し、コントローラ単独では成り立たない。

## いつ使うか

- イメージ更新のたびに Pod を再作成するのが遅すぎる・破壊的すぎる大規模フリートを運用している。
- 別のプログレッシブデリバリツールを足さずに、partition や priority で制御するカナリアが欲しい。
- メインコンテナのライフサイクルから切り離した sidecar 注入・独立アップグレード (SidecarSet) が欲しい。
- 上流に無いワークロードプリミティブが要る: broadcast job、advanced cron job、イメージ事前 pull job、namespace 横断の resource 配布。
- プログレッシブデリバリエンジンではない。メトリクス解析付きカナリアやトラフィックシフトを伴う blue-green が目的なら Argo Rollouts や Flagger が別レイヤを担う (Argo Rollouts は CloneSet を対象にできる)。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [openkruise/kruise (GitHub)](https://github.com/openkruise/kruise)
2. [ソース tree (v1.9.0、pinned `439d98db`)](https://github.com/openkruise/kruise/tree/v1.9.0)
3. [OpenKruise becomes a CNCF incubating project (CNCF blog)](https://www.cncf.io/blog/2023/03/02/openkruise-becomes-a-cncf-incubating-project/)
4. [OpenKruise (CNCF projects page)](https://www.cncf.io/projects/openkruise/)
5. [OpenKruise: The Cloud-Native Platform for Alibaba's Double 11 (Alibaba Cloud)](https://www.alibabacloud.com/blog/openkruise-the-cloud-native-platform-for-the-comprehensive-process-of-alibabas-double-11_596966)
6. [OpenKruise v1.0, reaching new peaks of application automation (CNCF)](https://www.cncf.io/blog/2021/12/23/openkruise-v1-0-reaching-new-peaks-of-application-automation/)
7. [InPlace Update (OpenKruise docs)](https://openkruise.io/docs/core-concepts/inplace-update)
8. [CloneSet (OpenKruise docs)](https://openkruise.io/docs/user-manuals/cloneset)
9. [SidecarSet (OpenKruise docs)](https://openkruise.io/docs/user-manuals/sidecarset)
10. [Installation (OpenKruise docs)](https://openkruise.io/docs/installation)
11. [OpenKruise v1.7: SidecarSet Supports Native Kubernetes Sidecar Containers (Alibaba Cloud)](https://www.alibabacloud.com/blog/openkruise-v1-7-sidecarset-supports-native-kubernetes-sidecar-containers_601775)
12. [GitHub REST API repos/openkruise/kruise](https://api.github.com/repos/openkruise/kruise)
13. [Releases (v1.9.0、2026-06-21)](https://github.com/openkruise/kruise/releases)
