# 歴史

## 起源

Fluentd は 2011 年、Treasure Data の共同創業者である古橋貞之 (Sadayuki "Sada" Furuhashi) が社内ツールとして作った。GitHub リポジトリは 2011-06-19 に作成され、2011 年 10 月に OSS 公開された ([出典 5](https://en.wikipedia.org/wiki/Fluentd))。目的は、多様なデータソースにまたがるログ収集を 1 つの層に統一することで、プロジェクトはこれを「Unified Logging Layer (統合ロギング層)」と呼ぶ ([出典 3](https://www.fluentd.org/architecture/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2011 | Treasure Data で誕生。リポジトリ作成 2011-06-19、10 月に OSS 公開 |
| 2016 | CNCF に Incubating として受理 (2016-11-08) |
| 2019 | 2019-04-11 に CNCF を Graduated |

## どう進化したか

Fluentd は 2016-11-08 に CNCF へ Incubating として参加し、Kubernetes や Prometheus と並ぶ初期のホストプロジェクトの 1 つとなった ([出典 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/))。2019-04-11 に Graduated し、その時点で 5,000 を超えるコミュニティ利用者が報告された ([出典 4](https://www.cncf.io/announcements/2019/04/11/cncf-announces-fluentd-graduation/))。

より軽量な姉妹実装の Fluent Bit は C で書かれ、同じ `fluent` GitHub organization の下にある。Fluentd 自体は Ruby のままで常駐メモリは数十 MB 級だが、Fluent Bit はサブメガバイトのフットプリントが重要なエッジや Kubernetes サイドカー用途を狙う ([出典 3](https://www.fluentd.org/architecture/))。

## 現在地

現在の pin したソースは v1.19.2 リリース以降の master で、バージョン定数は master 開発系列の値として `VERSION = '1.19.0'` を宣言している (`lib/fluent/version.rb:19`)。Ruby 3.2 以降を要求し (`fluentd.gemspec:28`)、文書化された CNCF Graduated のガバナンスモデルで運営される。開発は Bundler と Rake を使い、gem は RubyGems で配布される。
