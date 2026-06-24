# Helm

> Helm は Kubernetes のパッケージマネージャ。関連する Kubernetes リソースをチャートという 1 つの単位にまとめ、バージョン管理し、インストールする。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Graduated
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [helm/helm](https://github.com/helm/helm)
- **ドキュメント基準コミット**: `74fa4fce` (タグ v4.2.2 付近、2026-06-20)

## 何をするものか

Helm は一連の Kubernetes マニフェストを、テンプレートとデフォルト値からなるバージョン管理・配布可能なディレクトリ (チャート) としてパッケージ化する。`helm install` を実行すると、ユーザが与えた値でテンプレートを描画し、できたオブジェクトをクラスタへ適用し、その結果をリリースとして記録する。アップグレード・ロールバック・アンインストールはすべてこのリリース履歴に対して動く。

テンプレート層は Go `text/template` なので、チャートは任意のマニフェストの任意のフィールドをパラメータ化できる。チャートは他のチャート (サブチャート) に依存でき、アプリケーションと依存物を一緒にインストールできる。配布は HTTP リポジトリ、または Helm 3.8 以降は OCI レジストリ経由。

Helm はクライアントサイドの CLI として動く。Helm 3 以降は呼び出し元の kubeconfig を使って Kubernetes API を直接叩き、各リリースを対象 namespace の Secret として保存する。専用のサーバサイドコンポーネントは持たない。

## いつ使うか

- 公式チャートを公開している既製アプリ (データベース、Ingress コントローラ、可観測性スタックなど) をインストール・アップグレードしたいとき。
- dev / staging / production へ別々の値で展開する、1 つのパラメータ化されたパッケージが欲しいとき。
- ロールバック付きのバージョン管理されたリリースが欲しく、まずいアップグレードを前のリビジョンへ戻したいとき。
- 自分のソフトウェアを配布し、ユーザに 1 コマンドでインストールさせたいとき。

少数の静的マニフェストにパッチを当てたいだけなら Kustomize の overlay の方が単純で、Helm は向かない。文字列テンプレートではなく型付きの設定言語とドリフト検出が欲しい場合も合わない。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [helm/helm ソース、`74fa4fce` でピン留め](https://github.com/helm/helm)
2. [The History of the Project (Helm)](https://helm.sh/community/history/)
3. [Helm 3 Preview pt1: A History of Helm](https://helm.sh/blog/helm-3-preview-pt1/)
4. [CNCF Announces Helm Graduation](https://www.cncf.io/announcements/2020/04/30/cloud-native-computing-foundation-announces-helm-graduation/)
5. [Helm now a CNCF graduated project (Microsoft OSS)](https://opensource.microsoft.com/blog/2020/05/01/helm-package-manager-kubernetes-now-cncf-graduated-project)
6. [Helm 3 Preview: Alpha release and what's next (CNCF)](https://www.cncf.io/blog/2019/05/16/helm-3-preview-helm-3-alpha-release-available-and-whats-next/)
7. [Helm installation guide](https://helm.sh/docs/intro/install/)
8. [Timoni: Compared to other tools](https://timoni.sh/comparison/)
9. [Kustomize vs. Helm (IBM)](https://www.ibm.com/think/insights/kustomize-vs-helm)
10. [ADOPTERS.md (helm/helm)](https://github.com/helm/helm/blob/main/ADOPTERS.md)
