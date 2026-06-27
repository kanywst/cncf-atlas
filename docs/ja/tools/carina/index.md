# Carina

> Carina は、各 Kubernetes ノードのローカルディスクをボリュームとして切り出す CSI (Container Storage Interface) ドライバで、ローカルディスクの生性能で動くデータベースを狙う。

- **カテゴリ**: Storage & Database
- **CNCF 成熟度**: Sandbox
- **言語**: Go 1.19
- **ライセンス**: Apache License 2.0
- **リポジトリ**: [carina-io/carina](https://github.com/carina-io/carina)
- **ドキュメント基準コミット**: `aec3a9f` (2025-04-15)

## 何をするものか

Carina はローカルストレージ向けの CSI (Container Storage Interface、Kubernetes のストレージプラグイン規格) ドライバである。ディスクをネットワーク越しにプールせず、各ノードに接続されたベアディスクを LVM (Logical Volume Manager、Linux の論理ボリューム層) で管理し、Pod が動くノード上に存在するボリュームを払い出す。CSI ドライバ名は `carina.storage.io` である (`constants.go:23`)。

このプロジェクトは、データベースやミドルウェアのように自前でデータをレプリケーションするステートフルワークロードを対象にする。README の Background は、分散ストレージはデータベースが既に行っているレプリケーションと整合性を二重に行い、容量を無駄にしレイテンシを足すと論じる。Carina は逆の立場を取り、ストレージ層を薄く保ってアプリにローカルディスクの生性能を渡す。

3 つのコンポーネントが仕事を分担する。クラスタ単位のコントローラが各 PVC (PersistentVolumeClaim) を custom resource に変換し、ノード単位のエージェントが実際のディスク操作を行い、スケジューラプラグインが空き容量のあるノードに Pod を配置する。Kubernetes API server がそれらの間のメッセージバスになる。

## いつ使うか

- 自前でレプリケーションを行うデータベースやミドルウェアを運用し、データパスに分散ストレージ層を挟まずローカルディスク性能が欲しい場合。
- LVM ボリューム、raw ディスクパーティション、ホストディレクトリを同じ StorageClass 群から 1 つのドライバで提供したい場合。
- 低速ディスクと高速ディスク (ハードディスクドライブとソリッドステートドライブ) を bcache で 1 つのボリュームの裏に自動階層化したい場合。
- ノード障害に耐える、あるいはノード間を移動するボリュームが必要な場合は不向き。データは 1 ノードに固定されるため、ノード障害はそのノードが戻るまでボリューム利用不可を意味する。
- ReadWriteMany が必要な場合も不向き。許可されるアクセスモードは `SINGLE_NODE_WRITER` のみである (`pkg/csidriver/driver/controller.go:109`)。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. carina-io/carina ソース・README・deploy マニフェスト: <https://github.com/carina-io/carina>
2. Carina CNCF プロジェクトページ (Sandbox、2022-12-14 受理): <https://www.cncf.io/projects/carina/>
3. carina-io/carina リリース (最新 v0.14.0、2025-04-16): <https://github.com/carina-io/carina/releases>
4. cncf/toc #974、Carina Sandbox オンボーディング: <https://github.com/cncf/toc/issues/974>
5. cncf/sandbox #204、Carina オンボーディング: <https://github.com/cncf/sandbox/issues/204>
6. carina-io/carina の GitHub REST API (スター・フォーク・ライセンス・push): <https://api.github.com/repos/carina-io/carina>
