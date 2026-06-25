# 歴史

## 起源

Operator パターンは 2016 年に CoreOS が公開した。ステートフルなアプリケーションを運用する知識を Kubernetes コントローラに埋め込み、カスタムリソースを監視して望ましい状態へ収束させる、という設計だ。この系譜は CNCF TAG App Delivery の Operator White Paper に記述がある。

Operator Framework 自体は 2018 年 5 月、CoreOS と Red Hat による発表「Introducing the Operator Framework: Building Apps on Kubernetes」が起点。フレームワークは Operator を書くための Operator SDK と、インストール・更新を担う Operator Lifecycle Manager を束ねていた。`operator-sdk` リポジトリの作成日は 2018-02-07 だ。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | CoreOS が Operator パターンを公開。 |
| 2018 | CoreOS と Red Hat が Operator Framework を発表。`operator-sdk` リポジトリ作成。 |
| 2020 | CNCF TOC が Incubating として受理 (2020-07-09)。 |
| 2023 | Java Operator SDK が Operator Framework に合流。 |
| 2026 | Operator SDK v1.42.2 リリース (2026-03-19)。OLM v0 は maintenance mode、v1 は operator-controller で開発中。 |

## どう進化したか

フレームワークは SDK と OLM の 2 本柱で始まった。SDK 自身のスキャフォルディングの歴史は重要だ。独自のコードジェネレータを保守する代わりに、SDK はスキャフォルディングエンジンとして kubebuilder を採用した。そのため Go Operator の `init` や `create api` は内部的には kubebuilder のコマンドだ。SDK は自身のリリースを特定の kubebuilder / ansible-operator-plugins バージョンに紐づけている。

言語サポートは時間とともに広がった。Go・Ansible・Helm の Operator がいずれも 1 つの CLI から扱える。2023 年 4 月には Java Operator SDK がフレームワークに合流し、org は兄弟プロジェクトとして `java-operator-sdk` をホストしている。

OLM は再設計中だ。v0 系の `operator-lifecycle-manager` は maintenance mode に入り、v1 の設計が `operator-controller` で構築されている。

## 現在地

SDK は定期的にタグ付きリリースを出している。v1.42.2 は 2026-03-19 で、ドキュメント基準コミット `c7f6cde` はそのタグより後の master 上にある。ガバナンスは `operator-framework/community` リポジトリにあり、ワーキンググループとメンテナが置かれ、コントリビューションは Apache-2.0 のもとで two-maintainer LGTM モデルに従う。プロジェクトの方向性は、OLM の将来を v1 の operator-controller 再設計に置きつつ、SDK は引き続き作成・パッケージングのフロントエンドであり続ける、というものだ。

## 出典

1. Operator Framework project page, CNCF: <https://www.cncf.io/projects/operator-framework/>
2. TOC approves Operator Framework as Incubating Project: <https://www.cncf.io/blog/2020/07/09/toc-approves-operator-framework-as-incubating-project/>
3. operator-framework/operator-sdk repository: <https://github.com/operator-framework/operator-sdk>
4. Introducing the Operator Framework, Red Hat / CoreOS: <https://www.redhat.com/en/blog/introducing-operator-framework-building-apps-kubernetes>
5. Java Operator SDK is joining Operator Framework: <https://www.cncf.io/blog/2023/04/18/java-operator-sdk-is-joining-operator-framework/>
6. operator-framework/community governance: <https://github.com/operator-framework/community>
7. CNCF TAG App Delivery Operator White Paper: <https://tag-app-delivery.cncf.io/whitepapers/operator/>
8. operator-framework/operator-lifecycle-manager: <https://github.com/operator-framework/operator-lifecycle-manager>
9. operator-framework/operator-controller: <https://github.com/operator-framework/operator-controller>
10. operator-sdk CONTRIBUTING: <https://github.com/operator-framework/operator-sdk/blob/master/CONTRIBUTING.MD>
