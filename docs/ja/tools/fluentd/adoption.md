# 採用事例・エコシステム

## 誰が使っているか

リポジトリの `ADOPTERS.md` はプロジェクトの testimonials ページ ([出典 7](https://www.fluentd.org/testimonials)) へのリンクのみで、具体名は載せていない。2019-04-11 の CNCF graduation 発表は以下の組織を明記している ([出典 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/))。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Atlassian | 大規模なログ収集 | [CNCF graduation 発表](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| Amazon Web Services | 大規模なログ収集 | [CNCF graduation 発表](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| Change.org | 大規模なログ収集 | [CNCF graduation 発表](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| CyberAgent | 大規模なログ収集 | [CNCF graduation 発表](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| LINE Corp | 大規模なログ収集 | [CNCF graduation 発表](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| Nintendo | 大規模なログ収集 | [CNCF graduation 発表](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |
| Microsoft | 大規模なログ収集 | [CNCF graduation 発表](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/) |

## 採用のシグナル

2019 年の graduation 時点で、5,000 を超えるコミュニティ利用者が報告された ([出典 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/))。2026-06-22 取得の GitHub シグナル ([出典 8](https://api.github.com/repos/fluent/fluentd)):

- Stars: 13,546
- Forks: 1,392
- Open issues: 136
- コントリビュータ: およそ 285 名 (GitHub contributors API、匿名含む)

## エコシステム

Fluentd の最大の資産はプラグインカタログである。`fluent-gem` で管理される、500 を超えるコミュニティ製の入力・出力・フィルタ・パーサ・フォーマッタ・バッファプラグインがある ([出典 1](https://github.com/fluent/fluentd))。コアの周りには `fluent-operator` (Kubernetes オペレータ)、Helm チャート、C 実装の姉妹プロジェクト Fluent Bit があり、いずれも `fluent` GitHub organization の下にある ([出典 1](https://github.com/fluent/fluentd))。

## 代替候補

Fluentd の本質的な差別化は、最大級のプラグインエコシステム、ベンダー中立な CNCF ガバナンス、バッファ抽象を伴うタグベースのルーティングである。弱点はフットプリントで、Ruby コアは C や Rust の代替よりメモリと CPU が重い ([出典 6](https://www.cncf.io/blog/2022/02/10/logstash-fluentd-fluent-bit-or-vector-how-to-choose-the-right-open-source-log-collector/))。

| 代替 | 違い |
| --- | --- |
| Fluent Bit | C 実装、サブメガバイト級のフットプリント、エッジや Kubernetes サイドカー向け。作者陣は同じ |
| Logstash | JVM ベース、強力な grok/dissect 変換と ELK 連携、最も重いフットプリント |
| Vector | Rust、VRL 変換言語による高スループット、中庸なフットプリント |
