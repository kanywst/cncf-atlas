# 歴史

## 起源

Cartography は Lyft のセキュリティチームの中で始まった。リポジトリ `lyft/cartography` は 2019-02-27 に作成された ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography))。作られた発端は具体的だ。クラウドの IAM (Identity and Access Management) 権限は推論が難しく、チームは攻撃者が管理者権限に到達する最短経路を見つけたかった。資産と関係をグラフとしてモデル化することでその問いがクエリになり、後に同じモデルが防御側にも有用だと分かった ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2019 | リポジトリ `lyft/cartography` を 2019-02-27 に作成 ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography))。 |
| 2023 | Lyft が CNCF への Cartography 寄贈を申請 ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7))。 |
| 2024 | CNCF (Cloud Native Computing Foundation) が 2024-08-23 に Sandbox レベルで受理 ([CNCF project page](https://www.cncf.io/projects/cartography/))。 |
| 2026 | リリース `0.138.1` を 2026-06-19 に公開 ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography))。 |

## どう進化したか

最大の転換はコードではなくガバナンスだった。Lyft は 2023 年に CNCF への寄贈を申請し、CNCF は 2024-08-23 に Sandbox レベルで受理した ([CNCF project page](https://www.cncf.io/projects/cartography/))。寄贈は CNCF Sandbox の申請として追跡された ([cncf/sandbox issue 58](https://github.com/cncf/sandbox/issues/58))。移管による実質的な変化は、Slack ホストが Lyft から CNCF へ移り、GitHub の場所が `cartography-cncf/cartography` へ移った点である ([Lyft Engineering blog](https://eng.lyft.com/cartography-joins-the-cncf-6f6b7be099a7))。

ガバナンス以外では、コネクタを追加して成長してきた。README は現在 30 以上のサポート対象プラットフォームを列挙し (README.md:81-99)、それぞれが `cartography/intel` 配下の intel モジュールとして実装される。メンテナ一覧は MAINTAINERS.md に記録されている。

## 現在地

リリースは頻繁だ。本稿執筆時点の最新リリースは `0.138.1` (2026-06-19) で、このディープダイブは 2026-06-25 の master コミット `cdf66e2` に固定しており、これは同タグより 6 コミット先行している ([GitHub API repo stats](https://api.github.com/repos/cartography-cncf/cartography))。現在も CNCF Sandbox プロジェクトである。ガバナンスは GOVERNANCE.md に、メンテナ一覧は MAINTAINERS.md に記載されている。
