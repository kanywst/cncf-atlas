# 歴史

## 起源

Carvel は、モノリシックな Kubernetes デプロイツールへの反動として始まった。Dmitriy Kalinin と Nima Kaviani は、既存ツールが fetch・templating・apply を 1 つの不透明な流れに束ねているせいでデバッグしづらいことに不満を持った。彼らは代わりに UNIX 哲学を適用した。すなわち、それぞれが 1 つのことをうまくやる小さなツールを作り、パイプで組み合わせる。この設計はプロジェクト自身の [Introduction to Carvel](https://carvel.dev/blog/introduction-to-carvel-blog-post/) に述べられている。

名前も同じ発想を反映している。"Carvel" は、船体の板を重ねずに横並びに張って滑らかな船体を作る造船技法で、焦点を絞ったツールを滑らかな全体に繋ぎ合わせる比喩として使われた。命名とスポンサーの経緯は [Carvel Sets Sail for the CNCF Sandbox](https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/) に記録されている。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2018-2019 | 個々のツール (`ytt`・`kapp`・`kbld`・`imgpkg`・`vendir`) が "k14s" の名で順次公開される。 |
| 2019 | `kapp-controller` リポジトリが作成され (2019-11-06)、ツール群にクラスタ内調整器が加わる。 |
| 2020 | プロジェクトが "k14s" から "Carvel" へリブランド。VMware (Tanzu) がスポンサーに。 |
| 2022 | Carvel が 2022-09-14 に CNCF Sandbox へ受理される。 |

## どう進化したか

ツール群は当初 "Kubernetes Tools" として生まれ、"k14s" に短縮され、2020 年 8 月に "Carvel" へリブランドされた。組織の所在地もそれに伴い移った。`github.com/k14s` から `vmware-tanzu/carvel`、そして現在の `carvel-dev` へと。その歴史の痕跡は生成されるリソースに今も残っており、API グループやアノテーションには `k14s.io` の接尾辞が付いたままだ。たとえば `App` カスタムリソースは `kappctrl.k14s.io/v1alpha1` で提供される。この経緯は [VMware OSS ブログ](https://blogs.vmware.com/opensource/2022/10/25/carvel-sets-sail-for-the-cncf-sandbox/) に記録されている。

2022 年の CNCF への寄贈は、[CNCF プロジェクトページ](https://www.cncf.io/projects/carvel/) と、プロジェクト自身の発表 [Project Carvel has joined the CNCF](https://carvel.dev/blog/carvel-cncf-sandbox/) の双方に記録されている。

## 現在地

Carvel は CNCF Sandbox プロジェクトである。umbrella リポジトリ `carvel-dev/carvel` はドキュメントとコミュニティ向けの素材を保持し、実装は個々のツールリポジトリに置かれている。`kapp-controller` はその中で最もアーキテクチャ的に厚く、本ディープダイブの対象である。本ディープダイブはリリース v0.60.3 (コミット `be1faef`) に固定している。リポジトリは 2026 年も活発で、2026-06-26 に GitHub API で確認した時点での最終 push は 2026-06-22 であった。
