# 歴史

## 起源

Chaos Mesh は PingCAP 社内で、分散 SQL データベース TiDB の耐障害性をテストするためのカオスエンジニアリングプラットフォームとして始まった。チームが挙げた課題は、決定論的で事前にスクリプト化された障害テストが、Kubernetes 上で動く分散システムの障害モードにもはや合わなくなったことだった。PingCAP は 2019-12-31 にプロジェクトを OSS 化し、7 か月でおよそ 2,000 stars / 44 contributors に達したと報告している (Announcing Chaos Mesh as a CNCF Sandbox Project, PingCAP)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | PingCAP が 2019-12-31 に OSS 化。 |
| 2020 | 2020-02-21 に CNCF へ提案 (cncf/tag-app-delivery issue #23)、2020-07-14 に Sandbox として受理。 |
| 2021 | Chaos Mesh 2.0 GA (9 月)。Workflow と Schedule を追加し、カオスエンジニアリングのエコロジーへと再定義。 |
| 2022 | 2022-02-16、TOC 投票で CNCF Incubating に昇格。 |
| 2026 | 直近リリース v2.8.3 が 2026-06-10。 |

## どう進化したか

1.x 系列は障害プリミティブに集中していた。Pod・ネットワーク・IO・ストレス・時刻・カーネル・DNS のカオスを CRD で表現するものだ。2021 年 9 月の 2.0 GA はスコープを単一障害からオーケストレーションへ広げ、Workflow (実験の連鎖) と Schedule (cron 風の繰り返し) を追加した。CNCF はこれをカオスエンジニアリングのエコロジーへの移行と表現している (Chaos Mesh 2.0 GA, CNCF)。

Incubating 昇格を告げる CNCF ブログは、Sandbox 入り以降にプロジェクトが v1.0・v2.0 に加え 30 のマイナーリリースを出したこと、TiKV に次いで PingCAP 発の 2 つ目の CNCF プロジェクトであることを記している (Chaos Mesh moves to the CNCF Incubator)。

## 現在地

プロジェクトは 2.x 系列でリリースを続けており、v2.8.3 は 2026-06-10 付。開発は `main` で進む。ここで基準とするコミット `8c13a9f` は、開発ブランチ上で v2.8.3 の後ろに位置する。ガバナンスは meritocratic かつ consensus ベースで、メンテナはリポジトリの MAINTAINERS ファイルに記載される。

## 出典

1. Announcing Chaos Mesh as a CNCF Sandbox Project (PingCAP): <https://www.pingcap.com/press-release/announcing-chaos-mesh-as-a-cncf-sandbox-project/>
2. cncf/tag-app-delivery issue #23 (sandbox proposal): <https://github.com/cncf/tag-app-delivery/issues/23>
3. Chaos Mesh 2.0 GA to a Chaos Engineering Ecology (CNCF): <https://www.cncf.io/blog/2021/09/01/chaos-mesh-2-0-ga-to-a-chaos-engineering-ecology/>
4. Chaos Mesh moves to the CNCF Incubator: <https://www.cncf.io/blog/2022/02/16/chaos-mesh-moves-to-the-cncf-incubator/>
5. GitHub Releases, 直近 v2.8.3: <https://github.com/chaos-mesh/chaos-mesh/releases>
