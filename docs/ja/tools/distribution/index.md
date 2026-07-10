# Distribution

> Distribution は、コンテナイメージやその他の OCI アーティファクトを保存・配信するオープンソースのレジストリであり、多くの公開レジストリが土台とするコアライブラリである。

- **カテゴリ**: Container Registry
- **CNCF 成熟度**: Sandbox (2021-01-26 採択)
- **言語**: Go (`go 1.25.0`)
- **ライセンス**: Apache-2.0
- **リポジトリ**: [distribution/distribution](https://github.com/distribution/distribution)
- **ドキュメント基準コミット**: `472c9d38` (main, 2026-06-19, タグ `v3.1.1` の 1 コミット後)

## 何をするものか

Distribution はコンテナレジストリ、すなわちコンテナイメージやその他の OCI アーティファクトを保存し、HTTP でクライアントに渡すサーバである。`docker pull` や `docker push` がレジストリと話すとき、そのクライアントが話すプロトコルこそ本プロジェクトが実装するものだ。`registry` コンポーネントは OCI Distribution Specification の実装であり、この仕様は以前の Docker Registry HTTP API V2 から発展した標準である (README、OCI Distribution Specification)。

本プロジェクトはサーバであると同時にライブラリでもある。README はこれを、Docker Hub・GitHub Container Registry・GitLab Container Registry・DigitalOcean Container Registry、加えて CNCF Harbor プロジェクトと VMware Harbor Registry を含む多くのレジストリオペレータのコアライブラリだと述べる (README)。コードは、より大きなレジストリ製品をこの上に構築できるように構造化されている。ストレージバックエンド、HTTP レイヤ、ストレージドライバは 1 枚岩ではなく分離可能な部品だ。

単体では、Distribution は意図的に薄い。コンテンツを保存・配信し、それを安全かつ省スペースにするための content-addressable な帳簿付けを行う。本格的な認証システム、脆弱性スキャン、Web UI は同梱しない。Harbor のような製品がそれらを上に足す。Distribution はそのスタックの最下層、実際にバイト列を保持する部分に位置する。

## いつ使うか

- 自分のイメージを保存・配信するプライベートレジストリが必要で、素の `docker run` で動かし、ファイルシステムやオブジェクトストア (S3・GCS・Azure Blob) を裏に置きたい。
- レジストリ製品やサービスを構築中で、OCI Distribution プロトコルを自前で実装する代わりに、仕様準拠のコアを土台にしたい。
- 大規模配信でイメージをオブジェクトストレージから直接配りたい。レジストリが全バイトを中継する代わりに、クライアントを裏のストアへリダイレクトさせたい。
- ただし単体では、組み込みの RBAC・脆弱性スキャン・署名ポリシー・レプリケーション・UI が必要なら不向き。その場合は (Distribution の上に構築された) Harbor やマネージドレジストリを選ぶ。

## このディープダイブの構成

- [歴史](./history): 起源・マイルストーン・存在理由。
- [アーキテクチャ](./architecture): コンポーネントと pull の流れ。
- [採用事例・エコシステム](./adoption): 誰が動かし、周囲に何があるか。
- [内部実装](./internals): ソースから読んだ重要なコードパス。
- [はじめに](./getting-started): インストールと最初の動くレジストリ。

## 出典

1. [distribution/distribution README](https://github.com/distribution/distribution/blob/main/README.md) (参照 2026-07-08)
2. [Distribution プロジェクトページ (CNCF)](https://www.cncf.io/projects/distribution/) (参照 2026-07-08)
3. [Donating Docker Distribution to the CNCF (Docker ブログ)](https://www.docker.com/blog/donating-docker-distribution-to-the-cncf/) (参照 2026-07-08)
4. [Docker Distribution Gets a Home at the CNCF (The New Stack)](https://thenewstack.io/this-week-in-programming-docker-distribution-gets-a-home-at-the-cncf/) (参照 2026-07-08)
5. [OCI Distribution Specification](https://github.com/opencontainers/distribution-spec) (参照 2026-07-08)
6. [HTTP API V2 (CNCF Distribution ドキュメント)](https://distribution.github.io/distribution/spec/api/) (参照 2026-07-08)
7. [Distribution Registry ドキュメント](https://distribution.github.io/distribution/) (参照 2026-07-08)
8. [goharbor/harbor](https://github.com/goharbor/harbor) (参照 2026-07-08)
9. [distribution ソース (固定コミット 472c9d38)](https://github.com/distribution/distribution/tree/472c9d38c9fc523599f37ca3207279e5ab10f74f) (参照 2026-07-08)
10. [distribution/distribution GitHub リポジトリのシグナル](https://github.com/distribution/distribution) (参照 2026-07-08)
