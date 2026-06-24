# 歴史

## 起源

2016 年、Kubernetes は Container Runtime Interface (CRI) を導入した。kubelet を再コンパイルせずに別のランタイムを差せるプラグイン境界だ。CRI-O はその境界を最小限の Kubernetes 専用ランタイムで埋めるプロジェクトとして始まった。当初は OCID という名前で、Red Hat の開発者が Kubernetes incubator で Google のコントリビュータと共に主導した ([CNCF graduation announcement](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)、[Red Hat blog](https://www.redhat.com/en/blog/red-hat-contributes-cri-o-cloud-native-computing-foundation))。GitHub リポジトリは 2016-09-09 に作成された。

名前の `o` と初期の pod ツールは libpod に由来する。libpod は CRI-O 内に置かれ、Docker CLI 風の体験を提供していた。このコードは後に Podman へ育ち、CRI-O は CRI 本体へと絞り込まれた ([CNCF announcement](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2016 | Kubernetes が CRI を導入。プロジェクトは OCID として始まり、その後 CRI-O に改名 ([CNCF](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)) |
| 2019 | CNCF TOC が 2019-04-08 に CRI-O を Incubating として受け入れ ([CNCF](https://www.cncf.io/blog/2019/04/08/cncf-to-host-cri-o/)) |
| 2023 | CRI-O が 2023-07-19 に CNCF から graduate ([CNCF](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)) |
| 2026 | リリース済み線は `v1.36.1` (2026-06-03)、`main` は `1.37.0` を報告 (`internal/version/version.go:6`) |

## どう進化したか

2019 年に CNCF が CRI-O を Incubating として受け入れたとき、メンテナは Red Hat・Intel・SUSE 出身で、初期の利用者には Lyft・Red Hat・SUSE がいた ([CNCF](https://www.cncf.io/blog/2019/04/08/cncf-to-host-cri-o/))。incubation 期間に 11 のマイナーバージョン、約 100 のパッチリリース、4000 を超える commit を重ね、数万規模のクラスタに達した ([CNCF](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/)、[InfoQ](https://www.infoq.com/news/2023/09/cncf-crio-graduation/))。

2023 年の graduation には CNCF の成熟度作業一式が必要だった。ガバナンス更新、Code of Conduct、セキュリティ開示プロセス、そして CNCF と OSTIF が調整した Ada Logics によるサードパーティセキュリティ監査、加えてエンドユーザの確保とインタビューだ ([CNCF](https://www.cncf.io/announcements/2023/07/19/cloud-native-computing-foundation-announces-graduation-of-cri-o/))。

設計上の不変点はスコープだった。CRI-O は Kubernetes とバージョンを揃える。CRI-O の `1.x` リリースは Kubernetes `1.x` を対象とする。README は今も境界を明示し、実行・イメージ・ストレージ・ネットワークを抱え込まず他コンポーネントに委譲する (`README.md:102-119`)。

## 現在地

CRI-O は Kubernetes のリリースサイクルに合わせ、直近のマイナー線を維持する (recon メモによれば `ReleaseMinorVersions = {1.36, 1.35, 1.34}`)。pinned コミット時点の最新リリースタグは `v1.36.1` (2026-06-03) で、`main` は `1.37.0` の開発線上にある (`internal/version/version.go:6`)。CNCF Graduated プロジェクトである ([CNCF projects](https://www.cncf.io/projects/cri-o/))。
