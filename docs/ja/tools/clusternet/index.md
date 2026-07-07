# Clusternet

> Clusternet は、ひとつの親クラスタから多数の子クラスタを管理する Kubernetes アドオン。まるでインターネットを見るように、子クラスタへ到達しデプロイできる。

- **カテゴリ**: Orchestration & Scheduling
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [clusternet/clusternet](https://github.com/clusternet/clusternet)
- **ドキュメント基準コミット**: `e8b5a0c` (2026-05-10、タグ `v0.18.1` より先の `main`)

## 何をするものか

Clusternet はマルチクラスタ管理アドオンである。コントロールプレーンをひとつの Kubernetes クラスタ (親) で動かし、任意の数の他クラスタ (子) を登録すると、以降はそのすべてにアプリをスケジュールし、各クラスタを通常の `kubectl` で操作できる。名前は「Cluster Internet」の略で、各クラスタがどこにあろうとひとつの場所から到達できる、インターネットのようにクラスタ群を扱うことを狙う。

差別化する設計判断が 2 つある。親側の shadow API により、普通の `kubectl apply -f deployment.yaml` を投げるだけで Clusternet がそれをマルチクラスタ配布の素材に変換するので、始めるのに新しいリソース型を覚える必要がない。reverse WebSocket トンネルにより、NAT (Network Address Translation) やファイアウォールの内側にいる子に対しても親から `kubectl` を実行できる。子が親へ dial-out し、親がそのトンネル越しにリクエストを re-dial するためである。

これはディストリビューションでもホスト型コントロールプレーンでもなく、軽量なアドオンである。親クラスタは 4 つのコンポーネントを動かす。aggregated API server、scheduler、controller manager、そして各子で動く agent である。Subscription、Base、Description といった CRD (Custom Resource Definition) が配布パイプラインをモデル化する。

## いつ使うか

- 複数の Kubernetes クラスタを運用し、同じワークロードを多数のクラスタへ、クラスタごとに完全コピーするか容量で分割するか、ひとつの場所からデプロイしたい。
- 一部のクラスタが NAT やファイアウォールの内側にあり、それでも中央のクラスタから `kubectl` / `client-go` でアクセスしたい。
- 新しいアプリケーションモデルを採用せず、既存のマニフェスト・Helm チャート・`kubectl` をそのまま使い続けたい。
- 単一クラスタしか持たない場合や、単一ベンダのマネージドフリートが既にクロスクラスタデプロイを提供していて proxy も shadow API も不要な場合は、適合度は低い。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [clusternet/clusternet](https://github.com/clusternet/clusternet) (README、コア機能、コントリビュータ)。
2. [Clusternet 公式サイト](https://clusternet.io)。
3. [Introduction: 4 コンポーネント構成](https://clusternet.io/docs/introduction/)。
4. [CNCF Projects: Clusternet](https://www.cncf.io/projects/clusternet/) (Sandbox、2023-03-07 受理)。
5. [cncf/sandbox 提出 issue #10](https://github.com/cncf/sandbox/issues/10)。
6. [GitHub REST API: clusternet/clusternet](https://api.github.com/repos/clusternet/clusternet)。
7. [GitHub Releases](https://api.github.com/repos/clusternet/clusternet/releases)。
8. [GitHub Contributors](https://api.github.com/repos/clusternet/clusternet/contributors)。
9. [LICENSE (Apache-2.0)](https://github.com/clusternet/clusternet/blob/main/LICENSE)。
10. [MAINTAINERS.md](https://github.com/clusternet/clusternet/blob/main/MAINTAINERS.md)。
11. [Palark: CNCF Sandbox projects 2023 H1](https://palark.com/blog/cncf-sandbox-2023-h1/)。
12. [rancher/remotedialer](https://github.com/rancher/remotedialer)。
