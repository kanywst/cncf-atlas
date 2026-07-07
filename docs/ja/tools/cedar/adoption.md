# 採用事例・エコシステム

## 誰が使っているか

リポジトリにはドキュメント基準コミット時点で `ADOPTERS` ファイルが無い (確認済み)。下の組織名はすべて、Cedar の CNCF Sandbox 参加を告知した AWS Open Source Blog の記事に由来する。同記事は現在の adopters と maintainers を挙げている (src 3)。

| 組織 | ユースケース | 出典 |
| --- | --- | --- |
| Amazon Web Services | Amazon Verified Permissions と AWS Verified Access のエンジン。Amazon Bedrock AgentCore Policy と AWS Systems Manager でも利用 | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/using-open-source-cedar-to-write-and-enforce-custom-authorization-policies/) (src 5), [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| Cloudflare | CNCF Sandbox 告知で挙げられた adopter | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| MongoDB | CNCF Sandbox 告知で挙げられた adopter | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| StrongDM | CNCF Sandbox 告知で挙げられた adopter | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| Cloudinary | CNCF Sandbox 告知で挙げられた adopter | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |
| Linux Foundation Janssen Project | CNCF Sandbox 告知で挙げられた統合 | [AWS Open Source Blog](https://aws.amazon.com/blogs/opensource/cedar-joins-cncf-as-a-sandbox-project/) (src 3) |

## 採用のシグナル

2026-06-27 に GitHub API 経由で観測した時点で、`cedar-policy/cedar` は 1,571 スター、160 フォーク、61 名の非匿名コントリビュータを持つ (src 1)。リリースは頻繁で、`v4.11.2` は 2026-06-22 に公開された (src 8)。Cedar は 2025-10-08 に CNCF Sandbox へ受理された (src 2)。これらは初期段階のシグナルである。Cedar は Sandbox プロジェクトであり、Incubating でも Graduated でもない。

## エコシステム

周辺のエコシステムには次がある。Cedar 上に構築されたマネージドサービス Amazon Verified Permissions (src 5)。`cedar-examples` リポジトリと、その HTTP リクエストを Cedar が認可するデモアプリ TinyTodo (README:132)。エディタ補完と診断のための `cedar-language-server` (README:45)。JavaScript / TypeScript 向けの `cedar-wasm` バインディング (README:46)。Linux Foundation Janssen Project の統合 (src 3)。そして CNCF Sandbox 告知で言及されたコミュニティの Kubernetes 統合 Kubernetes-Cedar-Authorizer (src 3)。CNCF ブログは Cedar を、admission と authorization のための Kubernetes ポリシー管理の新手法として位置づけている (src 6)。

## 代替候補

| 代替 | 違い |
| --- | --- |
| Open Policy Agent (OPA) / Rego | 汎用ポリシーエンジン。Cedar の言語は健全・完全・決定可能な符号化を許すよう制限され、記号コンパイラで解析できる。OPA はより広いポリシーロジックを扱うが、その自動証明は提供しない (src 3) |
| OpenFGA | Zanzibar 系の関係ベースアクセス制御で、関係グラフ中心。Cedar は RBAC・ABAC・ReBAC を 1 つのポリシー言語で表現する (src 6) |
| SpiceDB | データベースとして提供される Zanzibar 系 ReBAC。Cedar は関係ストアではなく、リクエスト単位の決定を返す組み込みエンジン (クレート・wasm・CLI) である (src 6) |

きめ細かな認可を小さく組み込めるエンジンで行いたく、ポリシーの静的解析を重視するなら Cedar を選ぶ。Cedar の言語で表現できない汎用ルールロジックが必要なら OPA を選ぶ。大きく変化し続ける関係グラフをデータとして保存・問い合わせたいモデルが中心なら OpenFGA や SpiceDB を選ぶ。
