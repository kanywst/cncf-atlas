# bootc

> ホスト OS 全体を OCI (Open Container Initiative) イメージとして配送し、トランザクショナルに in-place 更新する。

- **カテゴリ**: Runtime
- **CNCF 成熟度**: Sandbox
- **言語**: Rust
- **ライセンス**: MIT OR Apache-2.0 (デュアル)
- **リポジトリ**: [bootc-dev/bootc](https://github.com/bootc-dev/bootc)
- **ドキュメント基準コミット**: `a7f95e7` (タグ v1.16.2 付近)

## 何をするものか

bootc はコンテナイメージから Linux ホストを起動し、更新する。ブート可能な OS を、アプリコンテナとまったく同じ手順で作る。`Containerfile` を書き、`podman build` し、レジストリへ push する。bootc はそのイメージをディスクへインストールし、同じタグの新しいバージョンを in-place で適用する。README はゴールを端的に述べている。Docker のレイヤモデルをブート可能なホストシステムに適用し、標準の OCI/Docker コンテナをベース OS 更新の transport (配送) フォーマットとして使う、というものだ (`README.md:8-12`)。

bootc システムは実行時にはコンテナではない。コンテナイメージは `/usr/lib/modules` 配下に Linux カーネルを含み、それが起動に使われる。起動後、ベースのユーザ空間はコンテナの中では動かない。systemd が通常どおり pid1 として動き、外側のプロセスは存在しない (`README.md:14-17`)。コンテナはあくまでパッケージング・配送フォーマットにすぎない。

bootc は ostree と rpm-ostree の後継インターフェースである。いずれも Red Hat 由来の同じ系譜を持つ。bootc はホスト状態を Kubernetes 風の宣言的オブジェクトとしてモデル化し、更新を A/B 方式で適用するので、不正な更新はロールバックできる。

## いつ使うか

- フリート内のホストを不変イメージとして定義し、アプリコンテナと同じようにレジストリのタグを変えるだけで更新したい。
- `apt` や `dnf` によるパッケージ単位の更新ではなく、ロールバックスロットを保証したアトミックな in-place OS 更新が必要。
- 既存の OCI ツール (`podman`、`buildah`、Dockerfile) でベースイメージをビルドしており、ホスト OS も同じパイプラインに乗せたい。
- 実行中のルートファイルシステムを自由に書き換えたい場合には向かない。デプロイ済みの `/usr` は設計上 read-only だからだ。
- OS の上で動くアプリケーションワークロードを管理するツールではない。bootc が管理するのは OS そのものである。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと upgrade の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動く構成。

## 出典

1. [bootc-dev/bootc リポジトリ](https://github.com/bootc-dev/bootc)
2. [bootc ソース (コミット a7f95e7)](https://github.com/bootc-dev/bootc/tree/a7f95e743aa54a2f966edc1a0417ef6d509df9af)
3. [bootc CNCF プロジェクトページ](https://www.cncf.io/projects/bootc/)
4. [Making containers bootable for fun and profit (LWN)](https://lwn.net/Articles/979182/)
5. [Changes/OstreeNativeContainerStable (Fedora Project Wiki)](https://fedoraproject.org/wiki/Changes/OstreeNativeContainerStable)
6. [bootc 公式サイト・ドキュメント](https://bootc.dev/bootc/)
