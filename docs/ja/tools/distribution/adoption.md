# 採用事例・エコシステム

## 誰が使っているか

Distribution に `ADOPTERS.md` は無い。誰が動かしているかを示せる証拠は、自身の README と Docker の寄贈発表であり、表はこの 2 つの出典が実際に主張する内容を記録する。企業ごとの内部実装を推測しない。README は Distribution が以下のレジストリオペレータのコアライブラリだと述べ (README)、寄贈ブログは Docker が CNCF にプロジェクトを譲ったときにメンテナを供出したオペレータを挙げている (Docker ブログ)。

| 組織 | 関係 (引用出典による) | 出典 |
| --- | --- | --- |
| Docker (Docker Hub) | 原著者。README は Docker Hub をこのコードで構築されたレジストリオペレータとして列挙 | [README](https://github.com/distribution/distribution/blob/main/README.md), [Docker ブログ](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) |
| GitHub (Container Registry) | README は GitHub Container Registry をコアライブラリの利用者として列挙。寄贈時にメンテナを供出 | [README](https://github.com/distribution/distribution/blob/main/README.md), [Docker ブログ](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) |
| GitLab (Container Registry) | README は GitLab Container Registry をコアライブラリの利用者として列挙。寄贈時にメンテナを供出 | [README](https://github.com/distribution/distribution/blob/main/README.md), [Docker ブログ](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) |
| DigitalOcean (Container Registry) | README は DigitalOcean Container Registry をコアライブラリの利用者として列挙。寄贈時にメンテナを供出 | [README](https://github.com/distribution/distribution/blob/main/README.md), [Docker ブログ](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) |
| CNCF Harbor / VMware Harbor Registry | README は Harbor をこのコードで構築されたものとして列挙。Harbor は寄贈時にメンテナを供出 | [README](https://github.com/distribution/distribution/blob/main/README.md), [goharbor/harbor](https://github.com/goharbor/harbor) |

明言すべき留保が 1 つある。これらの関係の根拠は README と 2021 年の寄贈記事だ。各オペレータの現行の本番レジストリが今も Distribution 由来かどうかは、本稿がその企業の一次ソースに照らして確認したものではない。したがって表は、引用した 2 文書が述べる範囲にとどめる。

## 採用のシグナル

2026-07-08 時点で、GitHub リポジトリは stars 10,503 / forks 2,756 を示し、作成日は 2014-12-22、最新リリースは `v3.1.1` (2026-05-01) だ (GitHub リポジトリ)。最も明確なシグナルは star 数ではなく寄贈そのものだ。Docker がこのプロジェクトを CNCF に譲ったのは、まさにそれが既に多くの大規模レジストリの共有土台だったからで、それらのオペレータからメンテナを募った (Docker ブログ)。プロジェクトは OCI Distribution Specification の適合性スイートを CI で回しており、これは人気ではなくプロトコルの正しさに関するシグナルである (README)。

## エコシステム

Distribution は土台の層であり、エコシステムはその上または隣に構築されるものが中心だ。**Harbor** (CNCF Graduated) は Distribution をレジストリコアに使い、その周りに RBAC・脆弱性スキャン・署名・レプリケーションを足す (goharbor/harbor)。**OCI Distribution Specification** は本プロジェクトの API が発展して標準になったものなので、適合するクライアントはこれに対して動き、適合するレジストリは同じプロトコルを話す (OCI Distribution Specification)。ストレージ側では、in-tree のドライバ (`filesystem`・`s3-aws`・`gcs`・`azure`・`inmemory`) が一般的なオブジェクトストアに接続するので、下側のエコシステムはオペレータが既に運用しているバックエンドが何であれそれになる。

## 代替候補

レジストリ選びは通常、ストレージコアの上にどれだけ載せるかを選ぶことだ。Distribution は薄く仕様準拠の土台で、代替はより多くを同梱する。

| 代替 | 違い |
| --- | --- |
| Harbor | Distribution の上に構築されるが、RBAC・Trivy スキャン・署名・レプリケーションを同梱。素のコアではなくフルのエンタープライズレジストリが必要なら選ぶ (goharbor/harbor) |
| Zot | 同じ OCI Distribution Specification に適合する、別実装の OCI ネイティブレジストリ。この上の層ではなく別コードベース |
| Quay | Clair スキャンを統合した Red Hat の独立レジストリ。構築用ライブラリではなく製品 |
| マネージドレジストリ (ECR・Google Artifact Registry・Azure Container Registry・GitHub Container Registry) | ホスト型サービス。サーバを運用する代わりに OCI/Docker V2 API を消費するので、クライアント互換は保てるが自己ホストは手放す |
