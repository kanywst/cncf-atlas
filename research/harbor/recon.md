# recon: Harbor

調査メモ。OCI レジストリに RBAC・脆弱性スキャン・レプリケーション・署名検証を足した「企業向けクラウドネイティブレジストリ」。コードは Go、`distribution/distribution` の前段に立つ reverse proxy + コントローラ群という構造。

## 基本情報

- repo: `goharbor/harbor`
- pinned commit: `687298935db944c5df68e0c3b14b410ba005cbe2` (main, 2026-06-22 09:54:35 +0000)
- 近いタグ: `VERSION` ファイルは `v2.16.0` (開発中)。GA 最新は `v2.14.4` (2026-05-11)、`v2.15.1` も tag 済み。main は全リリースブランチより先行しているため shallow clone では `git describe` 不可。
- 言語 / ビルド: Go 1.26.3 (`src/go.mod:3`) / `make compile` が `compile_core` `compile_jobservice` `compile_registryctl` を束ねる (`Makefile:411`)。`make build` で Docker イメージ群を作る (`Makefile:427`)。ビルドベースは `golang:1.26.3` (`Makefile:182`)。
- ライセンス: Apache-2.0 (`LICENSE` 冒頭で確認、各 Go ファイルヘッダも Apache-2.0)。`gh api` の `license.spdx_id` も `Apache-2.0`。
- CNCF 成熟度: Graduated (2020-06-15 に Graduated。CNCF プロジェクトページで確認)
- カテゴリ (本エンジンのバケット): Supply Chain (レジストリ = サプライチェーンの成果物保管・署名・スキャンの中枢)。CNCF landscape 上の分類は Runtime (Container Registry)。

## 歴史の素材

- 2014: VMware の中国 R&D 組織で社内プロジェクトとして発足。コンテナ利用者向けのイメージ保管課題に対応 ([InfoQ](https://www.infoq.com/news/2020/06/harbor-graduation-michael/), [CNCF blog 2025-12-08](https://www.cncf.io/blog/2025/12/08/harbor-enterprise-grade-container-registry-for-modern-private-cloud/))。
- 2016-03: VMware がオープンソース化。Kubernetes の普及と並走して伸びた ([CNCF blog 2025-12-08](https://www.cncf.io/blog/2025/12/08/harbor-enterprise-grade-container-registry-for-modern-private-cloud/))。
- 2018-07-31: CNCF へ donate (Sandbox 受理)。README にも CNCF Sandbox 受理アナウンスへのリンクあり (`README.md:28`) ([CNCF project page](https://www.cncf.io/projects/harbor/))。
- 2018-11-14: Incubating へ昇格 ([CNCF project page](https://www.cncf.io/projects/harbor/))。
- 2020-06-15: Graduated。OSS レジストリとして初の CNCF Graduated、かつ CNCF 初の「中国生まれ」プロジェクト。アナウンスは 2020-06-23 ([CNCF announcement](https://www.cncf.io/announcements/2020/06/23/cloud-native-computing-foundation-announces-harbor-graduation/))。
- v2.15.0 から release artifact を Cosign で署名 (`README.md:65`)。

## アーキテクチャの素材

3 つの独立バイナリ (= main entrypoint) に分かれる。

- `src/core/main.go` (`package main`, `src/core/main.go:15`): API サーバ本体。Beego v2 web フレームワーク上 (`github.com/beego/beego/v2/server/web`, `src/core/main.go:30`)。OCI registry ルート + REST API + token service + 認証バックエンド (db/ldap/oidc/uaa/authproxy を blank import で登録、`src/core/main.go:42-46`) をホストする。
- `src/jobservice/main.go`: 非同期ジョブ (レプリケーション・GC・スキャン・retention) のワーカ。Redis ベースのジョブキュー。
- `src/registryctl/main.go`: 下層 distribution レジストリの制御 (GC 起動など) を担うサイドカー的コントローラ。
- `src/cmd/exporter/main.go`: Prometheus exporter。`src/cmd/standalone-db-migrator/main.go`: DB マイグレータ。

レイヤ構成: `server/` (HTTP ルーティング + middleware) → `controller/` (ビジネスロジック束ね) → `pkg/` (ドメインごとの manager + `dao/` で DB アクセス)。`portal/` は Angular の UI。

中核の設計: Harbor 自身はバイナリ blob/manifest を保存しない。下層の `distribution/distribution` (Docker Registry) に reverse proxy し、その前段で認可・クォータ・immutable・署名・スキャンゲートを差し込む。proxy 実体は `httputil.NewSingleHostReverseProxy` 1 個 (`src/server/registry/proxy.go:29-42`)。Director で下層レジストリへの basic auth を付与する (`src/server/registry/proxy.go:44-52`)。

OCI v2 ルート定義は `src/server/registry/route.go:34-129`。全 `/v2` 配下に `v2auth.Middleware()` を噛ませ (`route.go:37`)、操作ごとに middleware を積む。例: manifest PUT は immutable → quota → cosign 署名 → subject → blob と直列 (`route.go:74-84`)。

## 内部実装の素材

### 代表操作: イメージ pull (GET `/v2/<repo>/manifests/<ref>`) を端から端まで

1. ルート登録: `src/server/registry/route.go:52-59`。middleware chain は `metric` → `repoproxy.ManifestMiddleware` (proxy-cache プロジェクト用) → `contenttrust.ContentTrust` (署名必須ポリシー) → `vulnerable.Middleware` (脆弱性ゲート) → `HandlerFunc(getManifest)`。

2. 認可: `/v2` ルート共通の `v2auth.Middleware()` が先に走る (`route.go:37`)。`reqChecker.check` (`src/server/middleware/v2auth/auth.go:46-81`) が security context を取り、repo 名から project ID を引き (`auth.go:83-90`)、`rbac_project.NewNamespace(pid).Resource(ResourceRepository)` に対し `securityCtx.Can(action, resource)` で RBAC 判定 (`auth.go:74-77`)。未認証 CLI には Bearer challenge を返して token service へ誘導する (`auth.go:92-116`)。失敗時は `Www-Authenticate` を付けて 401 (`auth.go:177-186`)。

3. ハンドラ `getManifest` (`src/server/registry/manifest.go:52-140`):
   - `repository` と `reference` を URL から取得し、`artifact.Ctl.GetByReference(ctx, repository, reference, nil)` で DB 上の artifact を引く (`manifest.go:55`)。先に DB で存在確認してから proxy する設計。
   - reference が tag なら DB 上の digest に URL を書き換える (`manifest.go:62-66`)。これにより下層レジストリへは常に digest で問い合わせる。
   - `If-None-Match` が DB の digest と一致すれば proxy せず 304 (`manifest.go:42-49`, `manifest.go:71-74`)。
   - cache 有効時は `pkg.ManifestMgr.Get(ctx, digest)` から manifest 本体を返す。miss なら proxy 後に write-back (`manifest.go:82-124`)。
   - cache miss/無効なら `proxy.ServeHTTP(buffer, req)` で下層へ委譲 (`manifest.go:107-109`)。`lib.NewResponseBuffer` でレスポンスを一旦バッファ。
   - 成功時、HEAD でなく replication 由来でもなければ `PullArtifactEventMetadata` を発火 (`manifest.go:127-139`)。pull_time 更新や webhook 通知のトリガ。

4. `GetByReference` 本体 (`src/controller/artifact/controller.go:306-342`): reference が digest parse できなければ tag 扱いで `getByTag` → `repoMgr.GetByName` → `tagCtl.List` で tag から artifactID を解決 → `Get` (`controller.go:323-341`)。digest なら `getByDigest` → `artMgr.GetByDigest` (`controller.go:315-321`)。

### 非自明な設計判断

tag を下層レジストリに保存しない。manifest PUT (`putManifest`, `src/server/registry/manifest.go:175-238`) では reference が tag のとき body を読んで `digest.FromBytes(data)` を計算し、proxy 先 URL を tag から digest に差し替えてから下層へ送る (`manifest.go:192-206`)。tag から digest の対応は Harbor の DB 側だけが持つ。コメント (`manifest.go:189-191`) いわく「下層ストレージに tag を残さず、Harbor が tag-to-digest マッピングを DB で管理する」。これで immutable tag / retention / tag 単位の RBAC を下層レジストリの制約から独立に実装できる。

### 中核データ構造

- `artifact.Artifact` (business object, `src/pkg/artifact/model.go:31-48`): Harbor が管理する抽象成果物。image/chart/その他 OCI を統一ビューで表す。`Type` `MediaType` `ManifestMediaType` `ArtifactType` `Digest` `Size` `References []*Reference` (index の子参照) など。`IsImageIndex()` で index 判定 (`model.go:64-68`)。
- `dao.Artifact` (DB row, `src/pkg/artifact/dao/model.go:31-47`): Beego orm タグ付き。`ExtraAttrs` は json 文字列カラム、`Annotations` は `jsonb`。テーブル名 `artifact` (`dao/model.go:50-52`)。business object とは `From()` (`model.go:71` 以降) で変換。
- `model.RepoRecord` (`src/pkg/repository/model/model.go:33-42`): repository 行。`Name` `ProjectID` `PullCount` `StarCount` など。pull 統計を持つ。
- `v2auth.reqChecker` / `access` (`src/server/middleware/v2auth/auth.go:42-44`): リクエストを (target, name, action) の access リストに分解して RBAC 判定する内部構造。
- `lib.ResponseBuffer` (`src/server/registry/manifest.go:76` で使用): 下層 proxy のレスポンスを一旦溜め、成功時のみ flush + cache write-back する。pull/push 両方の中核。

### 追う価値のあるパス

- middleware ディレクトリ (`src/server/middleware/`): `immutable` `quota` `cosign` `contenttrust` `vulnerable` `repoproxy` (pull-through cache) など、Harbor の付加価値が全部ここに middleware として載っている。
- `controller/` 配下: `replication` `scan` `gc` `retention` など。ジョブ起動は jobservice に投げる。

## 採用事例の素材

ADOPTERS.md (`src/ADOPTERS.md`) に「production で公開許諾済み」の組織のみ記載。Success Stories セクション (`ADOPTERS.md:44-92`) に具体記述あり。

- JD.com: JDOS プラットフォームのレジストリ。2 年以上 production、数万ノード・数百万イメージ (`ADOPTERS.md:46-48`)。
- China Mobile: 1 年以上 production、1,000+ ノード・約 20,000 イメージ (`ADOPTERS.md:50-51`)。
- 360 Total Security: イメージ配布・アクセス管理。replication を多用、約 800 ノード・約 20,000 イメージ (`ADOPTERS.md:53-57`)。
- Union Pay: 200+ ノードのイメージ管理。RBAC + 脆弱性スキャン強制 (`ADOPTERS.md:69-71`)。
- DE-CIX: 旧 Docker registry を Harbor に置換。OIDC グループマッピングと robot account、脆弱性スキャナ活用 (`ADOPTERS.md:92`)。
- ロゴ掲載: JD.com, Trend Micro, DataYes, Rancher, Pivotal, Netease Cloud, Anchore, Dynatrace, CERN, Nederlandse Spoorwegen, DE-CIX など (`ADOPTERS.md:12-42`)。

## 代替・エコシステム

- 下層依存: `distribution/distribution` (旧 Docker Registry / CNCF) を blob/manifest ストアとして同梱。Harbor はその前段。
- スキャナ: Trivy (デフォルト同梱) ほか pluggable scanner adapter (Clair は廃止)。
- 署名: Cosign (sigstore) を manifest PUT 時に検証 (`cosign.SignatureMiddleware`, `route.go:81`)。旧来は Notary v1 (Docker Content Trust, `README.md:39`) だが Notary は非推奨化方向。
- 周辺リポジトリ: `goharbor/harbor-helm` (K8s デプロイ), `goharbor/harbor-operator`, `goharbor/harbor-cli`, `goharbor/terraform-provider-harbor`, `goharbor/website`。
- 代替: Docker Distribution 単体 (機能薄)、CNCF Dragonfly (P2P 配布、補完関係)、Quay (Red Hat)、JFrog Artifactory (商用)、GitLab Container Registry、各クラウドの ECR/ACR/GCR/Artifact Registry。Harbor の本質的差は「セルフホスト前提で RBAC + マルチテナント project + replication + スキャン + 署名検証 + クォータ + immutable/retention を一体で持ち、下層レジストリ非依存に tag を DB 管理する」点。
- インストール最小構成: Linux ホストに docker 20.10.10-ce+ と docker-compose 1.18.0+、release から offline/online installer を落として `install.sh` (`README.md:57-59`)。K8s なら `harbor-helm` (`README.md:61`)。
