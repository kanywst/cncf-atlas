# 歴史

## 起源

Eraser は Microsoft、それも Azure Kubernetes Service チームから始まった。リポジトリは 2021-05-28 に `Azure/eraser` として作成され (GitHub `createdAt`)、最初のコミット群は 2021-06-01 に入った。作られた理由は具体的である。kubelet のイメージ GC はディスク使用率の閾値でキャッシュイメージを消し、その脆弱性状態を一切知らないため、既知の CVE を持つイメージが攻撃面としてノードに残り続ける。CNCF Sandbox の申請文はこれを動機として明記している ([cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | リポジトリ作成 (2021-05-28) `Azure/eraser`、最初のコミット 2021-06-01 |
| 2023 | AKS の「Image Cleaner」マネージドアドオンとして提供; CNCF Sandbox 受理 (2023-06-30) |
| 2023 | KubeCon NA 2023 で「Eraser: Cleaning up Vulnerable Images from Kubernetes Nodes」を発表 |
| 2025 | `v1.4.1` リリース (2025-12-02); その後 `v1.5.0-beta.0` プレリリース |

## どう進化したか

Eraser は 2023 年前半、Azure Kubernetes Service を通じてより広い層に届いた。AKS は Eraser をマネージドの「Image Cleaner」アドオンとしてパッケージし、同じ `eraser-controller-manager` と collector / scanner / remover コンテナをデプロイする ([AKS Image Cleaner ドキュメント](https://learn.microsoft.com/en-us/azure/aks/image-cleaner))。Sandbox 申請文は、OSS プロジェクトとマネージドアドオンが別々のロードマップで運用されると明言しており、上流が AKS 製品に駆動されるわけではない ([cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24))。

プロジェクトは 2023-06-30 に CNCF Sandbox 入りした ([CNCF プロジェクトページ](https://www.cncf.io/projects/eraser/)、[cncf/sandbox issue #24](https://github.com/cncf/sandbox/issues/24))。KubeCon NA 2023 では、メンテナの Peter Engelbert と Ashna Mehrotra が設計と、ノードから脆弱なイメージを刈り込む意義を発表した ([セッション情報](https://kccncna2023.sched.com/event/1R2q9/)、[トークアーカイブ](https://talks.container-security.site/kubecon%20+%20cloudnative%20north%20america%202023/Eraser-Cleaning-up-Vulnerable-Images-from-Kuberne/))。リポジトリはその後 `Azure/eraser` から `eraser-dev/eraser` へ移り、Azure 所有よりコミュニティ所有を掲げた Sandbox 申請の方針に合わせた。git remote と README ロゴは現在 `eraser-dev` を使う (`src/README.md:9`)。

内部では、CRD API が `v1alpha1`、`v1alpha2`、`v1alpha3` を経て育ちつつ、`v1` を storage version として保持し、生成された変換コードでバージョン間を移行する (`api/` に各バージョンと `zz_generated.conversion.go` が置かれる)。CRD 自体は `ImageList` と `ImageJob` の 2 つで、これが API のスコープの全体である。

## 現在地

Eraser は `eraser-dev/eraser` で開発が続く活発な CNCF Sandbox プロジェクトで、CNCF 行動規範を採用している (`src/README.md:35`)。直近の安定版は `v1.4.1` (2025-12-02)。ドキュメント基準コミット `20576a24` はその後の `main` 上にあり、git は `v1.5.0-beta.0-57-g20576a24` と表す。Go 1.24 をターゲットとし、README に OpenSSF Best Practices と Scorecard のバッジを掲げる (`src/README.md:5-7`)。開発は collector / scanner / remover パイプラインと、差し替え可能なスキャナインターフェースを中心に続いている ([内部実装](./internals) 参照)。
