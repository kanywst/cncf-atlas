# 歴史

## 起源

Lima は 2021 年、macOS に containerd と nerdctl を届けるための VM ランチャとして始まった。当時の macOS には Linux コンテナをネイティブに動かす手段がなかった。リポジトリの作成日は 2021-05-14。作者は containerd / nerdctl のメンテナである Akihiro Suda。売りは Linux VM をローカルのように感じさせることで、ホストのディレクトリは自動マウントされ、ゲストのポートはホストへ転送される。これが「macOS 版 WSL2」とよく説明される理由だ。

## 年表

| 年 | マイルストーン |
| --- | --- |
| 2021 | 2021-05-14 にリポジトリ作成。macOS の containerd / nerdctl に注力。 |
| 2022 | 2022-09-14 に CNCF Sandbox 受理。 |
| 2025 | 2025-10-14 の TOC 投票で Incubating 昇格 (告知 2025-11-11)。2025-11-06 に v2.0 を出荷、セキュアな AI ワークフローへフォーカス。 |
| 2026 | v2.1 で macOS ゲスト対応とエージェント安全性強化。2026-06-19 に v2.1.3 リリース。 |

## どう進化したか

スコープは containerd 中心のツールから汎用 VM マネージャへ広がった。Docker / Podman / Kubernetes、そして任意の Linux ディストリビューションをサポートし、ホストは macOS / Linux / NetBSD / Windows に広がった。`templates/` 配下には Ubuntu / Debian / Fedora / Alpine などのすぐ動くテンプレートが含まれる。

v2.0 リリースは Lima をセキュアな AI ワークフロー向けに再定義した。掲げられた用途は、AI コーディングエージェントを VM 内に隔離し、ホストのファイルやコマンドへ直接届かないようにすることだ。v2.1 はその方向を継続し、macOS ゲストとエージェント安全性の追加制御を加えた。これらの転換は CNCF のリリースブログに記録されている。

## 現在地

Lima は CNCF Incubating プロジェクト。執筆時点の最新リリースは v2.1.3 (2026-06-19)。リポジトリには約 215 名のコントリビュータがおり、コードベースは `pkg` と `cmd` で約 50,000 行の Go。ガバナンスとコミュニティプロセスはプロジェクトサイトに記載され、CNCF デューデリジェンス用にユーザーストーリーを集める Discussion (#2390) が開かれている。

## 出典

1. [lima-vm/lima README](https://github.com/lima-vm/lima), 参照 2026-06-24。
2. [Lima becomes a CNCF incubating project](https://www.cncf.io/blog/2025/11/11/lima-becomes-a-cncf-incubating-project/), CNCF, 2025-11-11。
3. [CNCF プロジェクトページ: Lima](https://www.cncf.io/projects/lima/), 参照 2026-06-24。
4. [Lima v2.0: New features for secure AI workflows](https://www.cncf.io/blog/2025/12/11/lima-v2-0-new-features-for-secure-ai-workflows/), CNCF, 2025-12-11。
5. [Lima v2.1: macOS guests and enhanced AI agent safety](https://www.cncf.io/blog/2026/03/25/lima-v2-1-macos-guests-and-enhanced-ai-agent-safety/), CNCF, 2026-03-25。
6. [Discussion #2390: CNCF デューデリジェンス用ユーザーストーリー](https://github.com/lima-vm/lima/discussions/2390), 参照 2026-06-24。
7. [GitHub REST API: repos/lima-vm/lima](https://api.github.com/repos/lima-vm/lima), 参照 2026-06-24。
