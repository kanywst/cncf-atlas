# 採用事例・エコシステム

## 誰が使っているか

`operator-sdk` リポジトリには `ADOPTERS.md` も `USERS.md` も同梱されていない。そのため本ディープダイブでは個別の採用組織名を挙げない。挙げれば捏造になる。

出典を示せる最も確実な採用シグナルは Red Hat だ。Operator Framework は CoreOS と Red Hat で生まれ、OLM は OpenShift の一部として同梱される。つまり OpenShift では Operator 配布の製品化された基盤になっている。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Red Hat / OpenShift | フレームワークの起源。OLM を OpenShift の Operator インストール・更新層として同梱 | <https://www.redhat.com/en/blog/introducing-operator-framework-building-apps-kubernetes> |

## 採用のシグナル

`operator-framework/operator-sdk` に対し `gh` で 2026-06-24 に実測:

- スター数: 7,658。
- フォーク数: 1,775。
- コントリビュータ数: 326。
- 最新リリース: v1.42.2 (2026-03-19)。

org 横断では `operator-lifecycle-manager` が 1,859 スター、`java-operator-sdk` が 931 スター。CNCF は Operator Framework を Incubating プロジェクトとして掲載しており、受理は 2020-07-09 だ。

## エコシステム

フレームワークは単一リポジトリではなくプロジェクト群だ:

- OLM v0 (`operator-lifecycle-manager`): 元のインストール・更新ランタイム。現在は maintenance mode。
- OLM v1 (`operator-controller`): ライフサイクルランタイムの再設計中バージョン。
- `operator-registry`: File-Based Catalog ツールと `opm`。SDK が依存する bundle / catalog ライブラリ (`operator-registry v1.59.0`, `go.mod:20`)。
- OperatorHub.io: Operator bundle を公開する公開カタログ。
- `java-operator-sdk`: 2023 年にフレームワークへ合流した Java の作成パス。

上流では SDK は kubebuilder の上に直接構築されており、kubebuilder が Go のスキャフォルディングエンジンを提供する。SDK は実質その上に OLM 連携と Ansible / Helm サポートを足したスーパーセットだ。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Kubebuilder | SDK が取り込むスキャフォルディングエンジン本体。OLM・Ansible・Helm サポートが不要で Go コントローラだけが欲しいなら直接使う。 |
| KUDO | コンパイル済み Go コントローラではなく宣言的な Operator 定義。 |
| Metacontroller | Operator のパッケージング層なしで、任意言語の webhook としてコントローラを書ける。 |
| Crossplane | CRD 駆動だが、アプリケーション Operator のパッケージングではなくインフラのプロビジョニング・composition が狙い。 |
| kopf | Operator を書く Python フレームワーク。OLM の bundle 化・配布層は持たない。 |

Go・Ansible・Helm を 1 つの CLI で扱い、コードから scorecard 検証・bundle 化・OLM インストールまでを一本道で通したいなら Operator SDK を選ぶ。コントローラ生成だけが必要なら kubebuilder 単体を選ぶ。

## 出典

1. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
2. Operator Framework project page, CNCF: <https://www.cncf.io/projects/operator-framework/>
3. Introducing the Operator Framework, Red Hat / CoreOS: <https://www.redhat.com/en/blog/introducing-operator-framework-building-apps-kubernetes>
4. Java Operator SDK is joining Operator Framework: <https://www.cncf.io/blog/2023/04/18/java-operator-sdk-is-joining-operator-framework/>
5. operator-framework/operator-lifecycle-manager: <https://github.com/operator-framework/operator-lifecycle-manager>
6. operator-framework/operator-controller: <https://github.com/operator-framework/operator-controller>
