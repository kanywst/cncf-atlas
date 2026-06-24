# containerd

> コンテナのライフサイクル全体を管理する OCI 準拠のコンテナランタイムデーモン。Kubernetes や Docker の下回りのランタイム層を担う。

- **カテゴリ**: Container Runtime
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [containerd/containerd](https://github.com/containerd/containerd)
- **ドキュメント基準コミット**: `e96fd14b8` (2026-06-19、`v2.3.0` 近傍)

## 何をするものか

containerd は単一ホスト上でコンテナを管理するデーモンである。レジストリからイメージを pull し、ファイルシステムのレイヤに展開し、メタデータを保存し、runc などの OCI ランタイム経由でコンテナを実行する。サービスは gRPC で公開され、既定では UNIX ソケット `/run/containerd/containerd.sock` で待ち受ける。

多くの人が直接触るツールの一段下に位置する。Docker はコンテナのライフサイクルを containerd に委譲し、Kubernetes は CRI (Container Runtime Interface) プラグイン経由で containerd と話す。containerd 自身はイメージのビルドはせず、CNI プラグインが提供する以上のネットワーク管理もしない。コンテナを実行し、その状態を追跡する。

内部はプラグインの集合体である。各サブシステム (コンテンツストア、snapshotter、CRI、gRPC サービス) は `plugin.Registration` として登録され、デーモン起動時に依存順で配線される。これにより核を小さく保ち、snapshotter や OCI ランタイムといった部品を差し替えられる。

## いつ使うか

- Kubernetes を運用し、GKE・EKS・AKS が既定とする CRI ランタイムが欲しいとき。
- Kubernetes 専用ではなく、プラットフォームの土台にできる安定した汎用ランタイム API が欲しいとき。
- Docker engine 全体ではなく、Docker の下回りのランタイムだけが欲しいとき。
- VM 隔離や Wasm ワークロードを作っており、標準ランタイムにカスタム shim を差し込みたいとき。

daemonless で rootless を第一とする単一ホスト向けツールが欲しい場合は不向きで、その用途は Podman が向く。イメージのビルドだけが目的なら過剰で、それは BuildKit や nerdctl が containerd の上で担う。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [containerd/containerd (GitHub)](https://github.com/containerd/containerd)
2. [ADOPTERS.md](https://github.com/containerd/containerd/blob/main/ADOPTERS.md)
3. [containerd / CNCF プロジェクトページ](https://www.cncf.io/projects/containerd/)
4. [CNCF announces containerd graduation (2019-02-28)](https://www.cncf.io/announcements/2019/02/28/cncf-announces-containerd-graduation/)
5. [containerd Project Journey Report (CNCF)](https://www.cncf.io/reports/containerd-project-journey-report/)
6. [containerd 公式サイト](https://containerd.io/)
7. [containerd vs. Docker (Docker ブログ)](https://www.docker.com/blog/containerd-vs-docker/)
8. [Containerd vs Docker: Understanding Container Runtimes (DataCamp)](https://www.datacamp.com/blog/containerd-vs-docker)
9. [GitHub REST API repos/containerd/containerd](https://api.github.com/repos/containerd/containerd)
10. [runtime-v2 (shim API) README](https://github.com/containerd/containerd/blob/main/core/runtime/v2/README.md)
