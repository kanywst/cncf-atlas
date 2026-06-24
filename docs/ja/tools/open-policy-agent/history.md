# 歴史

## 起源

OPA は 2016 年、Tim Hinrichs・Torin Sandall・Teemu Koponen が創業した Styra 社で始まった。狙いは、認可ロジックを個々のアプリから引き剥がし、単一の宣言的ポリシー層の背後に統一すること。ポリシーがサービスコードに散らばるのではなく、それ自体が独立した成果物として存在する状態を目指した ([Styra OPA 101](https://www.styra.com/blog/open-policy-agent-101-a-beginners-guide/))。

ポリシー言語は Rego (「ray-go」と発音)。階層的な構造化データに対する宣言的クエリ言語である。OPA は Rego を評価し、組み込みライブラリ・サイドカー・スタンドアロンのデーモンとして動ける ([openpolicyagent.org docs](https://www.openpolicyagent.org/docs))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | Styra 社内で開発開始。 |
| 2018 | CNCF Sandbox プロジェクトとして受け入れ (2018-03-29)。 |
| 2019 | CNCF Incubating へ昇格 (2019-04-02)。 |
| 2021 | CNCF を Graduated (2021-01-29、発表 2021-02-04)。15 番目の graduate。 |
| 2024 | OPA 1.0 リリース。言語の破壊的変更とサーバ既定値の変更。 |
| 2025 | 創設者 3 名と Styra エンジニア数名が Apple へ移籍。プロジェクトは CNCF ガバナンス下のまま。 |

## どう進化したか

CNCF の受け入れは通常の 3 段階で進んだ。2018 年 Sandbox、2019 年 Incubating、2021 年 1 月 Graduated。graduation 発表は OPA を「認可に特化した最初の CNCF graduate」と位置づけ、maintainer は Google・Microsoft・VMware・Styra の 4 社だとした ([CNCF graduation 発表](https://www.cncf.io/announcements/2021/02/04/cloud-native-computing-foundation-announces-open-policy-agent-graduation/)、[InfoQ](https://www.infoq.com/news/2021/02/opa-cncf-graduation/))。

OPA 1.0 は最初の commit から 8 年後の 2024 年 12 月にリリースされ、5,000 を超える commit と 400 名超の contributor が報告された。破壊的変更として、ルール定義で `if`/`contains` キーワードが必須化、`every`/`in` が明示 import 不要に、そしてサーバが既定で localhost にバインドする (ポリシーの誤った露出対策) ようになった。`rego.v1` import は 1.0 以降 no-op となった ([OPA 1.0 ブログ](https://blog.openpolicyagent.org/opa-1-0-is-coming-heres-what-you-need-to-know-c8fb0d258368)、[v1.0.0 release notes](https://github.com/open-policy-agent/opa/releases/tag/v1.0.0))。

## 現在地

2025 年 8 月、創設者 3 名 (Teemu Koponen・Tim Hinrichs・Torin Sandall) と Styra エンジニア数名が Apple へ移籍した。実質 acquihire で、Styra 社は wind down、正式買収の公開 filing はない。創設者らはコミュニティ向けノートで、OPA 自体は CNCF ガバナンス下のままで maintainer リストも変わらないと明言した。Styra の商用資産 (Enterprise OPA、OPA Control Plane、Regal linter、各 SDK) は OSS 化された ([創設者のコミュニティノート](https://blog.openpolicyagent.org/note-from-teemu-tim-and-torin-to-the-open-policy-agent-community-2dbbfe494371)、[Cloud Native Now](https://cloudnativenow.com/features/apple-buys-styra-brains-opa-remains-open/)、[Open Source For You](https://www.opensourceforu.com/2025/08/apple-acquires-open-policy-agent-developers-while-cncf-retains-control-of-open-source-project/))。

ガバナンスは組織投票 (organizational voting) モデルに従う。1 org = 1 票で、単一企業が領域を支配しないようにする。maintainer は area of expertise (リポジトリやサブツリー) 単位で、新任は既存 maintainer の推薦と組織の 2/3 多数で承認され、1 年で期限切れ (更新可) となる ([GOVERNANCE.md](https://github.com/open-policy-agent/opa/blob/main/GOVERNANCE.md)、[MAINTAINERS.md](https://github.com/open-policy-agent/opa/blob/main/MAINTAINERS.md))。pin したソースは開発版バージョンを `1.18.0-dev` (`v1/version/version.go:13`) と報告しており、リリース済みの v1.17.1 と次のマイナーの間に位置する。
