# 歴史

## 起源

このプロジェクトの源流は、GoDaddy で作られた Kubernetes External Secrets (KES) にある。GoDaddy は EKS と AWS Secrets Manager を運用していたが、そのシークレットをクラスタに引き込む標準的な手段がなく、各チームが独自のつなぎを書いていた。KES は `ExternalSecret` カスタムリソースを追加し、外部シークレットを宣言的に Pod へ注入することでこれを解消し、GoDaddy が OSS 化した ([GoDaddy engineering](https://www.godaddy.com/resources/news/kubernetes-external-secrets), [Container Solutions](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community))。KES は JavaScript で書かれていた。

同じ問題を複数のプロジェクトが並行して解いていた。これらを統合するため、コードは GoDaddy から中立な `external-secrets` GitHub org へ移され、複数の人と組織が既存の成果を土台に単一の External Secrets 解を作るために合流した (`README.md`, [Container Solutions](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community))。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2020 | `external-secrets/external-secrets` リポジトリ作成 (2020-11-17)。External Secrets Operator となる Go リライトが始まる |
| 2022 | CNCF Sandbox 受理 (2022-07-26)。TAG Security のスポンサー |
| 2026 | `go 1.26.4` で活発。チャートリリース `helm-chart-2.7.0` (2026-06-26)。基準コミット `e100613` はその直後 |

## どう進化したか

決定的な転換は、KES を JavaScript から Go へ書き直して External Secrets Operator (ESO) としたことである。メンテナは、Kubernetes の一級 Go SDK サポートと、Kubebuilder / Operator SDK が体現する operator のベストプラクティスを理由に挙げた。最初のプレリリースは 3 つのバックエンド (AWS Secrets Manager、AWS Parameter Store、HashiCorp Vault) と external-secrets.io のドキュメントサイトを備えて公開され、Moritz Johner、Kellin McAvoy、Jonatas Baldin、Markus Maga、Silas Boyd-Wickizer らが貢献した。元の JavaScript 版 KES は deprecated となった ([Container Solutions](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community))。

このリライトはオブジェクトモデルも変えた。KES は「アプリで使うシークレット」と「バックエンドへの認証方法」をすべて 1 つの `ExternalSecret` に詰め込んでいた。ESO はこれを、接続と認証を担う `SecretStore` / `ClusterSecretStore` と、何をどこへ同期するかを担う `ExternalSecret` に分離した。この分離こそが、1 つのストア定義で多数の `ExternalSecret` を支えられる理由である (`apis/externalsecrets/v1/secretstore_types.go`, [Container Solutions](https://blog.container-solutions.com/the-birth-of-the-external-secrets-community))。

## 現在地

ESO は CNCF Sandbox プロジェクト (2022-07-26 受理) であり、中立な `external-secrets` org の下でガバナンスされる。リリースは Helm チャートタグとして切られ、オペレータのバージョンはチャートに追随する。`helm-chart-2.7.0` は 2026-06-26 に公開され、基準コミット `e100613` はその直後にある (`git describe` は `helm-chart-2.7.0-38-ge100613` を返す)。コードベースはツリー内で 41 プロバイダ・17 generator にまで育っている。incubation の申請が挙げられ、CNCF TOC には健全性レビューがオープンしている ([TOC #1819](https://github.com/cncf/toc/issues/1819))。本稿執筆時点で、CNCF プロジェクトページの表記はなお Sandbox である ([CNCF プロジェクトページ](https://www.cncf.io/projects/external-secrets/))。
