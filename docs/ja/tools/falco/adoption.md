# Adoption & Ecosystem

## 誰が使っているか

以下の組織はプロジェクトの `ADOPTERS.md` に説明付きで掲載されている (出典 8)。卒業告知ではさらに Cisco, Shopify, Skyscanner, Vinted が adopter として挙げられた (出典 1, 4)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Booz Allen Hamilton | Kubernetes 上の CD DevSecOps パイプラインでの挙動検証。KubeCon NA 2019 で発表 | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| GitLab | GitLab Ultimate に Falco を統合しコンテナアプリのランタイム防御に使用 | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| Coveo | Falco アラートを SIEM に集約しコンテナ内可視化に使用 | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| Secureworks | Taegis XDR プラットフォームの Kubernetes デプロイ保護と顧客の Linux/コンテナ環境保護に使用 | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| gVisor | gVisor ランタイム実行データの上で Falco の脅威検知エンジンを使い異常検知 | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |
| MathWorks | Kubernetes の脅威検知。KubeCon NA 2020 で発表 | [ADOPTERS.md](https://github.com/falcosecurity/falco/blob/master/ADOPTERS.md) |

`ADOPTERS.md` には Fairwinds, Giant Swarm, Logz.io, Qonto, Replicated, Deckhouse も説明付きで掲載されている (出典 8)。

## 採用シグナル

2026-06-22 に GitHub API から観測 (出典 2):

- Stars: 9,071、forks: 1,032、watchers: 125。
- Contributors: 約 266 名 (contributors API を `per_page=1` で引いた last page)。
- 最新リリース: `0.44.1`、2026-06-11 (出典 3)。

CNCF と Sysdig の卒業関連資料では、1 億回超のダウンロード、30 以上の self-declared adopter、そして Incubation 移行後のアクティブコントリビュータ 400% 増・ダウンロード総数 526% 増が報告されている (出典 1, 4)。

## エコシステム

以下は同じ `falcosecurity` org 配下で、コアエンジンを取り囲むプロジェクトである (出典 6, 7):

- `falcosidekick`: Falco の出力を 60+ の外部ツール (Slack, Loki, Elasticsearch, CloudWatch ほか) へ fan-out し、Web UI も提供する。
- `falcoctl`: ルールとプラグインを artifact / index として管理する CLI。Helm チャートでは `falcoctl-artifact-install` init コンテナと `falcoctl-artifact-follow` sidecar として動く。
- `falco-operator`: Falco インスタンスと周辺コンポーネントのライフサイクルを管理する Kubernetes Operator。
- プラグインフレームワーク: syscall 以外のソース (Kubernetes audit, CloudTrail, GitHub, Okta) を共有ライブラリで追加する。プラグインは実行可能オブジェクトなので auto-install は非推奨。

## 代替

| 代替 | 本質的な違い |
| --- | --- |
| Tetragon (Cilium) | eBPF ベースでカーネル内 enforcement (プロセス kill、コネクション drop) を持ち、CPU オーバーヘッドが最小。Falco は検知とアラートに軸足があり基本 enforcement しない (出典 9, 10) |
| Tracee (Aqua) | eBPF ベースのランタイムセキュリティ/フォレンジック。MITRE ATT&CK 整合の検知に強いが、リソース消費は大きめ (出典 9, 10) |

これらの比較における Falco の差別化点 (出典 9, 10): CNCF Graduated として最も成熟した選択肢、整備されたルールライブラリ、syscall 以外のソースをプラグインで取り込むモジュール性、そして Tetragon や Tracee が新しめのカーネルを要する傾向に対し古いカーネル向けにカーネルモジュールへフォールバックできる点。ある比較では Falco のメモリ消費が 3 ツール中最小とも報告されている。
