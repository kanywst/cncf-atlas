# 歴史

## 起源

Kubescape はイスラエル・テルアビブの ARMO が開発し、2021 年 8 月に OSS 化した。GitHub リポジトリの作成日は 2021-08-12 ([リポジトリ](https://github.com/kubescape/kubescape))。きっかけは NSA / CISA の Kubernetes Hardening Guidance で、ARMO はこのガイダンスへの準拠をテストする初の OSS ツールとして Kubescape を位置づけた ([Business Wire](https://www.businesswire.com/news/home/20211012005814/en/ARMO-Launches-Expanded-Version-of-Kubescape-Worlds-First-Open-Source-Kubernetes-Testing-Tool-Compliant-with-NSA-CISA-Hardening-Guidance), [ARMO の Medium](https://medium.com/@jonathan_37674/kubescape-one-year-anniversary-open-source-announcment-armo-a1c25a44c054))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021-08 | ARMO が Kubescape を OSS 化。NSA/CISA Kubernetes Hardening Guidance をテストする初のツール。 |
| 2021-10 | MITRE ATT&CK フレームワークと無料 SaaS バックエンドを追加する大型アップデート。 |
| 2022 | ARMO が「完全 OSS の Kubernetes セキュリティプラットフォーム」を掲げ Series A で $30M 調達。 |
| 2022-11/12 | Kubescape が CNCF Sandbox 入り。CNCF プロジェクトページは採択日を 2022-12-13 と記載。 |
| 2025-01 | CNCF TOC が 2025-01-13 に Kubescape を Incubating として採択。 |
| 2026-03 | KubeCon EU 2026 で Kubescape 4.0 を発表。Runtime Threat Detection と Kubescape Storage が GA。 |

## どう進化したか

Kubescape は 1 つの公開標準を対象にした posture スキャナとして始まり、その後 MITRE ATT&CK と CIS までルール範囲を広げつつ、画像脆弱性スキャンを追加した ([Business Wire](https://www.businesswire.com/news/home/20211012005814/en/ARMO-Launches-Expanded-Version-of-Kubescape-Worlds-First-Open-Source-Kubernetes-Testing-Tool-Compliant-with-NSA-CISA-Hardening-Guidance))。一貫した設計判断として、control ルールはスキャナの外、`kubescape/regolibrary` リポジトリに置かれる。これにより新しい CLI を出さずにルールセットを変更できる。

4.0 リリースは記録上もっとも大きなスコープ変更だ。Runtime Threat Detection と Kubescape Storage レイヤを GA に上げ、in-cluster の host-sensor (pop-up DaemonSet) を廃止して node-agent に統合し、AI エージェント向けスキャンと KAgent プラグインを追加した ([CNCF ブログ](https://www.cncf.io/blog/2026/03/26/announcing-kubescape-4-0-enterprise-stability-meets-the-ai-era/), [InfoQ](https://www.infoq.com/news/2026/03/kubescape-40/))。Sandbox 入りの日付は出典で割れている。[CNCF プロジェクトページ](https://www.cncf.io/projects/kubescape/) は 2022-12-13 と記し、[incubation ブログ](https://www.cncf.io/blog/2025/02/26/kubescape-becomes-a-cncf-incubating-project/) は 2022 年 11 月に Sandbox 入りしたと記す。両方を調整せずそのまま記録する。

バージョンの細かい点: Go module path は今も `github.com/kubescape/kubescape/v3` (`go.mod:1`) だが、リリースタグは `v4.0.x` まで進んでいる。このコミットではメジャーリリースタグと Go module のメジャー版が一致していない。

## 現在地

CNCF Incubating プロジェクトである ([CNCF projects](https://www.cncf.io/projects/kubescape/))。執筆時点の最新リリースは `v4.0.9` で 2026-05-29 に公開された ([リポジトリ](https://github.com/kubescape/kubescape))。メンテナは CLI に加えて in-cluster コンポーネント群 (operator、脆弱性スキャナ、node-agent、storage) を Helm チャートで配布しており、4.0 のアナウンスは Ben Hirschberg をコアメンテナとして挙げている ([CNCF ブログ](https://www.cncf.io/blog/2026/03/26/announcing-kubescape-4-0-enterprise-stability-meets-the-ai-era/))。4.0 で示された方向性は、既存の posture / 脆弱性スキャンに加えてランタイムセキュリティと AI 時代のワークロード向けスキャンである ([CNCF ブログ](https://www.cncf.io/blog/2026/03/26/announcing-kubescape-4-0-enterprise-stability-meets-the-ai-era/), [InfoQ](https://www.infoq.com/news/2026/03/kubescape-40/))。
