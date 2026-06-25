# Lima

> Lima は macOS / Linux / Windows 上で Linux 仮想マシンを起動し、ファイル共有とポートフォワードを自動で行う。もとは Mac で containerd と nerdctl を動かすために作られた。

- **カテゴリ**: Runtime
- **CNCF 成熟度**: Incubating
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [lima-vm/lima](https://github.com/lima-vm/lima)
- **ドキュメント基準コミット**: `9a3f1c4` (タグ v2.1.3 の後, 2026-06-23)

## 何をするものか

Lima は Linux ゲストを仮想マシンで動かし、ホストに統合してローカルのように感じさせる。インスタンスを起動すると、ホストのディレクトリをゲストにマウントし、ゲストのポートをホストへ転送し、1 コマンドで VM の中のシェルに入れる。プロジェクト自身は「macOS 版 WSL2」と説明するが、Linux / NetBSD / Windows ホストでも動く。

当初の目的は、ネイティブに Linux コンテナを動かす手段がなかった macOS 開発者に containerd と nerdctl を届けることだった。その後スコープは Docker / Podman / Kubernetes、そして汎用 Linux VM へと広がった。VM は 1 枚の YAML テンプレートから構成されるため、開発環境は再現可能でバージョン管理できる。

Lima はプラグイン可能なドライバ層を通して VM を駆動する。QEMU、Apple Virtualization.framework (vz)、WSL2、krunkit がサポートされるバックエンドで、out-of-tree のドライバを別プロセスの gRPC として差し込める。ホスト側のデーモンが各インスタンスの SSH・マウント・ポートフォワード・DNS を管理する。

## いつ使うか

- macOS や Windows で開発していて、商用 Desktop 製品なしに本物の Linux コンテナ (containerd, Docker, Podman) が必要なとき。
- YAML で定義した再現可能な Linux 開発 VM がほしく、ホストのフォルダとポートを自動共有したいとき。
- AI コーディングエージェントを VM 内に隔離し、ホストのファイルやコマンドに直接届かないようにしたいとき (v2.0 以降の重点領域)。
- 向かないのは、最初から洗練された GUI とバンドル機能がほしい場合や、サポート付きの単一ベンダー商用製品がほしい場合。Desktop 製品や OrbStack の方が合う。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと `limactl start` の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [lima-vm/lima README](https://github.com/lima-vm/lima) (Adopters, Homebrew インストール), 参照 2026-06-24。
2. [Pin コミット `9a3f1c4`](https://github.com/lima-vm/lima/commit/9a3f1c443389c673eb619f7b1922b1a4d8e4fd16), 参照 2026-06-24。
3. [リリース v2.1.3](https://github.com/lima-vm/lima/releases/tag/v2.1.3), 参照 2026-06-24。
4. [Lima becomes a CNCF incubating project](https://www.cncf.io/blog/2025/11/11/lima-becomes-a-cncf-incubating-project/), CNCF, 2025-11-11。
5. [CNCF プロジェクトページ: Lima](https://www.cncf.io/projects/lima/), 参照 2026-06-24。
6. [Lima v2.0: New features for secure AI workflows](https://www.cncf.io/blog/2025/12/11/lima-v2-0-new-features-for-secure-ai-workflows/), CNCF, 2025-12-11。
7. [Lima v2.1: macOS guests and enhanced AI agent safety](https://www.cncf.io/blog/2026/03/25/lima-v2-1-macos-guests-and-enhanced-ai-agent-safety/), CNCF, 2026-03-25。
8. [Lima ドキュメント](https://lima-vm.io/docs/), 参照 2026-06-24。
9. [GitHub REST API: repos/lima-vm/lima](https://api.github.com/repos/lima-vm/lima), 参照 2026-06-24。
