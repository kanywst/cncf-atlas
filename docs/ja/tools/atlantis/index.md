# Atlantis

> Pull Request のコメントから Terraform と OpenTofu を実行するサーバ。インフラ変更をマージ前に公開の場で plan / apply する。

- **カテゴリ**: App Definition & GitOps
- **CNCF 成熟度**: Sandbox
- **言語**: Go
- **ライセンス**: Apache-2.0
- **リポジトリ**: [runatlantis/atlantis](https://github.com/runatlantis/atlantis)
- **ドキュメント対象コミット**: `b7cea53` (main, 2026-06-25; リリース `v0.44.0` の直後)

## 概要

Atlantis はバージョン管理システム (VCS) と Terraform / OpenTofu バイナリの間に立つ、セルフホスト型の HTTP サーバである。GitHub・GitLab・Gitea・Bitbucket・Azure DevOps からの webhook を待ち受ける。誰かが Pull Request を開いたり `atlantis plan` / `atlantis apply` のようなコメントを書くと、Atlantis はリポジトリを clone し、対応する Terraform コマンドを自身のディスク上で実行し、出力を Pull Request のコメントとして書き戻す。

実行モデルはサーバサイドである。Terraform の state はユーザが既に構成済みの backend (例: S3 バケットや remote backend) に残り、Atlantis 自身はロックと plan メタデータのみを永続化する。これが「apply before merge」(マージ前 apply) のワークフローをチームにとって安全にする仕組みだ。plan は Pull Request 上でレビューされ、変更がまだオープンなうちに実インフラに対して apply が走り、ロックが 2 つの Pull Request が同じプロジェクトに同時に触れることを防ぐ。

Atlantis は、Terraform を既に Git で管理していて、全エンジニアに本番クレデンシャルを渡さずに共有・監査可能な形で Terraform を実行したいチーム向けである。state backend でも、module registry でも、マネージド SaaS でもない。Pull Request のコメントを Terraform 実行に変換する自動化レイヤである。

## こんなときに使う

- Terraform / OpenTofu を Git で管理していて、plan と apply を Pull Request 上でチームがレビューする形で実行したい。
- クレデンシャルと Terraform バイナリを各開発者のノート PC ではなく 1 台のサーバに集約したい。
- 同じプロジェクトとワークスペースに対して 2 つの Pull Request が同時に実行されないようロックが必要。
- 自動化を自前でホストし、state はベンダーではなく自分の backend に残したい。

state ストレージ・drift detection・ポリシーエンジンをすべて内蔵したマネージドサービスが欲しい場合は不向きで、商用の TACOS (Terraform Automation and Collaboration Software) 製品の方が合う。トリガーモデルが完全に webhook とコメント駆動のため、サポート対象の VCS を使っていない場合も対象外である。

## この deep-dive の構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントとリクエストの流れ。
- [採用とエコシステム](./adoption): 誰が運用し、何が周辺にあるか。
- [内部実装](./internals): ソースから読んだ、重要なコードパス。
- [Getting Started](./getting-started): インストールと最初の動作構成。

## 出典

1. runatlantis/atlantis ソース、pin commit `b7cea53`: <https://github.com/runatlantis/atlantis>
2. Introducing Atlantis (Luke Kysow, Medium): <https://medium.com/runatlantis/introducing-atlantis-6570d6de7281>
3. Moving Atlantis to runatlantis/atlantis (Medium): <https://medium.com/runatlantis/moving-atlantis-to-runatlantis-atlantis-on-github-4efc025bb05f>
4. Sandbox 申請、cncf/sandbox#60: <https://github.com/cncf/sandbox/issues/60>
5. TAG App Delivery レビュー、cncf/tag-app-delivery#474: <https://github.com/cncf/tag-app-delivery/issues/474>
6. Atlantis CNCF プロジェクトページ: <https://www.cncf.io/projects/atlantis/>
7. Atlantis ドキュメントサイト: <https://www.runatlantis.io>
8. ADOPTERS.md (pin `b7cea53`): <https://github.com/runatlantis/atlantis/blob/main/ADOPTERS.md>
9. Spacelift: Atlantis alternatives: <https://spacelift.io/blog/atlantis-alternatives>
10. Digger: why OpenTaco: <https://digger.dev/whyopentaco>
