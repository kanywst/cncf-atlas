# 歴史

## 起源

KubeVela は Open Application Model (OAM) から生まれた。OAM は Alibaba Cloud と Microsoft Azure が 2020 年に共同提唱したアプリ配信モデルで、KubeVela はその最初の実装だ。`oam-kubernetes-runtime` プロジェクトから派生し、Alibaba Cloud・Microsoft・Upbound など 8 組織以上のブートストラップ貢献で立ち上がった ([CNCF blog 2023-03-31](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/))。

解こうとした課題は、出荷するものを記述したい開発者と、その下の Kubernetes プリミティブを所有するプラットフォームチームの間のギャップだ。OAM はこれを Component (ワークロード) と Trait (コンポーネントに付与する運用能力) に分割し、抽象層を CUE で表現する ([CNCF blog 2023-03-31](https://www.cncf.io/blog/2023/03/31/kubevela-the-road-to-cloud-native-application-and-platform-engineering/))。この系譜の痕跡は今もコードに残っており、リポジトリは `kubevela/kubevela` 配下にあるのに Go module 名は `github.com/oam-dev/kubevela` のままだ (`src/go.mod:1`)。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | OAM を Alibaba Cloud と Microsoft Azure が提唱。KubeVela を 11 月に OAM 最初の実装として OSS 公開 ([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/)) |
| 2021 | 4 月に v1.0 リリース。2021-06-22 に CNCF Sandbox プロジェクトとして受理 ([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/)) |
| 2023 | 2023-02-27 に CNCF Incubating へ昇格 ([CNCF project page](https://www.cncf.io/projects/kubevela/)) |

## どう進化したか

初期から方向性を決めた設計判断は、抽象層を Go コードではなく CUE template に置いたことだ。ComponentDefinition と TraitDefinition は CUE で書かれ reconcile 時に評価されるため、新しいコンポーネント型・トレイト型はコントローラを再ビルドせず追加できる (`src/pkg/appfile/appfile.go:553`)。これによりスコープは単一のアプリモデルから、workflow 実行とマルチクラスタ配置も扱う配信 control plane へと広がった。

CNCF incubation レビュー時点で、プロジェクトは contributor 90+ から 290+ へ、GitHub star 1,900+ から 4,700+ へ、貢献組織 20+ から 70+ へ成長していた ([CNCF blog 2023-02-27](https://www.cncf.io/blog/2023/02/27/kubevela-brings-software-delivery-control-plane-capabilities-to-cncf-incubator/))。

## 現在地

安定版最新タグは `v1.10.8`、プレリリース最新は `v1.11.0-alpha.3` (2026-04-13)。ここで参照するコミットはそれらより先の `master` 上にある。ガバナンスは `kubevela/community` リポジトリに集約され、リポジトリ内の `GOVERNANCE.md` はそこへのポインタだ。意思決定は maintainer の super-majority 投票で、1 週間の非公開投票期間を持つ。6 か月以上不活発な maintainer は自動 removal され (super-majority で延長可)、CNCF Code of Conduct に準拠する ([GOVERNANCE.md](https://github.com/kubevela/community/blob/main/GOVERNANCE.md))。
