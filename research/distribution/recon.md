# recon: distribution

調査メモ。自分用の密度。出典は必ず URL を添える。

## 基本情報

- repo: `distribution/distribution` (git remote origin: `https://github.com/distribution/distribution.git`、go.mod module は `github.com/distribution/distribution/v3`)
- pinned commit: `472c9d38c9fc523599f37ca3207279e5ab10f74f` (2026-06-19) / 近いタグ: `v3.1.1` (HEAD は v3.1.1 の 1 コミット後。`git describe` はこの clone だと届かないが `git rev-list --count v3.1.1..HEAD` = 1 で確認)
- 言語 / ビルド: Go (go 1.25.0, module `.../v3`) / `make` (バイナリ `registry`)、テストは `make test`
- ライセンス: Apache License 2.0
- CNCF 成熟度: **Sandbox** (2021-01-26 受理)。CNCF プロジェクトページで確認 [出典 2]。Graduated ではない点に注意
- カテゴリ (tools.ts の CATEGORY_ORDER から): **Container Registry**
- GitHub シグナル (2026-07-08 時点、`gh repo view`): stars 10,503 / forks 2,756 / created 2014-12-22 / latest release v3.1.1 (2026-05-01) [出典 12]

一言でいうと、コンテナイメージ (と OCI アーティファクト) を保存・配信する OSS レジストリのリファレンス実装。Docker Hub / GitHub Container Registry / GitLab Container Registry / DigitalOcean Container Registry / Harbor がこのコードを土台にしている (README 冒頭に列挙) [出典 1]。

## 歴史の素材

- 前身は Docker の Registry。初代 Registry は Python 製で content-addressable storage を使っていなかった。それを Go で書き直したのが Distribution (旧 Docker Distribution / Registry v2)。拡張可能なライブラリとして設計し直し、バックエンドやサブシステムを差し替えられるようにした [出典 3: Docker donation blog / 出典 5: The New Stack]。
- Docker Registry HTTP API V2 がこの実装のプロトコル。後に OCI へ移り **OCI Distribution Specification** の下敷きになった。現在の README は「registry コンポーネントは OCI Distribution Specification の実装」と明記 [出典 1, 出典 7: HTTP API V2 doc]。
- 2021-02-04、Docker が Distribution を CNCF に寄贈すると公式発表。狙いは「多くのレジストリの土台になっているコードを、広いメンテナ集団で維持する」こと。小さな fork や未還元の変更が乱立していた課題への対処でもあった [出典 3, 出典 4: Slacker News, 出典 5]。
- CNCF 受理は 2021-01-26、Sandbox レベル [出典 2]。寄贈時に大口ユーザー (Docker, GitHub, GitLab, DigitalOcean, Mirantis, Harbor, OCI) からメンテナを募った [出典 3]。プロジェクト名も `docker/distribution` から `distribution/distribution` へ改称 [出典 3]。
- リリース系譜: v2 系 (v2.8.x が最終の v2) を経て、v3.0.0 は 2025 年に GA。pin 時点の最新は v3.1.1 (2026-05-01) [出典 12, git tag]。

## アーキテクチャの素材

トップレベルは「HTTP API レイヤ (`registry/handlers`)」→「ストレージ抽象 (`registry/storage`)」→「ストレージドライバ (`registry/storage/driver/*`)」の 3 層。ルーティングは gorilla/mux。

主要コンポーネント:

- **HTTP ルータ / dispatcher**: `registry/handlers/app.go`。`App` が mux ルータを持ち、ルート名ごとに dispatcher を登録する (`app.go:106-114`)。ルート名は `registry/api/v2/routes.go:12-18` に定義 (`base` / `manifest` / `tags` / `blob` / `blob-upload` / `blob-upload-chunk` / `catalog`)。
- **ハンドラ群**: `registry/handlers/blob.go` (blob GET/HEAD/DELETE)、`blobupload.go` (blob PUT の upload セッション)、`manifests.go` (manifest PUT/GET)、`tags.go`、`catalog.go`。
- **ストレージ抽象**: `registry/storage/`。`blobStore` / `blobStatter` (`blobstore.go`)、`blobServer` (`blobserver.go`)、`linkedBlobStore` (`linkedblobstore.go`)、`manifestStore` (`manifeststore.go`)。
- **ストレージドライバ**: `registry/storage/driver/` に `filesystem` / `inmemory` / `s3-aws` / `gcs` / `azure`。共通インターフェイスは `storagedriver.go:54` の `StorageDriver`。

### 代表操作: blob GET を端から端まで

1. ルート `blob` に `blobDispatcher` を登録 (`registry/handlers/app.go:112`)。
2. `blobDispatcher` はリクエストから digest を取り出し `blobHandler` を組み立て、GET/HEAD を `GetBlob` にマップ (`registry/handlers/blob.go:14`, メソッド割当 `blob.go:34-37`)。
3. `blobHandler.GetBlob` (`blob.go:55`) が `bh.Repository.Blobs(bh)` を取り、`blobs.Stat` で存在確認 (`blob.go:57-58`)、続けて `blobs.ServeBlob` (`blob.go:68`)。
4. `Stat` の実体は `blobStatter.Stat` (`registry/storage/blobstore.go:165`)。digest から blob データパスを算出し `driver.Stat` を呼ぶ (`blobstore.go:166-173`)。無ければ `PathNotFoundError` を `ErrBlobUnknown` に翻訳 (`blobstore.go:176-177`)。
5. `ServeBlob` の実体は `blobServer.ServeBlob` (`registry/storage/blobserver.go:26`)。再度 statter でメタ取得 (`blobserver.go:27`)、パス算出 (`:32`)、`redirect` が有効なら `driver.RedirectURL` を試し、URL が返れば **307 でクライアントをオブジェクトストレージへ直接リダイレクト** (`blobserver.go:37-46`)。返らなければ `newFileReader` でドライバからストリーム読みし `http.ServeContent` で返す (`blobserver.go:50-73`)。
6. ドライバ境界は `StorageDriver` インターフェイス (`registry/storage/driver/storagedriver.go:54`)。`Reader` (`:72`)、`RedirectURL` (`:101`) など。実装は s3/gcs/azure/filesystem/inmemory。

### 効いている設計判断

- **content-addressable storage**: blob は digest をキーに `blobs/<algorithm>/...` へ 1 度だけ保存し、リポジトリからは link ファイルで参照する。同一 blob が複数リポジトリで共有されるので重複排除が効く (レイアウト図 `registry/storage/paths.go:24-52`、link 書き込み `linkedblobstore.go:327`)。
- **RedirectURL による直接配信**: クラウドドライバでは registry がバイト列を中継せず、presigned URL へリダイレクトする (`blobserver.go:37-46`)。大規模配信でレジストリをボトルネックにしない要。
- **プラガブルなドライバ**: ドライバは factory 経由で登録・生成する key/value 的なファイルシステム抽象 (`storagedriver.go:49-53` のコメント、`driver/factory`)。
- **cross-repo blob mount**: 既に別リポジトリにある blob は再アップロード不要で mount できる (`linkedblobstore.go:143` の mount 短絡、`mount` 本体 `:274`)。

## 内部実装の素材

### 重要ディレクトリ

- `registry/handlers/` — HTTP エンドポイント。`app.go` がルータ/dispatcher の中枢。
- `registry/storage/` — ストレージ抽象とレイアウト。`paths.go` がパス設計の単一の真実。
- `registry/storage/driver/` — バックエンド実装 (`filesystem` / `inmemory` / `s3-aws` / `gcs` / `azure`) と共通 IF (`storagedriver.go`)。
- `registry/api/v2/` — ルート記述子と URL 構築 (`routes.go`, `descriptors.go`, `urls.go`)。

### 中核データ構造

- `StorageDriver` インターフェイス (`registry/storage/driver/storagedriver.go:54`): `GetContent`/`PutContent`/`Reader`/`Writer`/`Stat`/`List`/`Move`/`Delete`/`RedirectURL`/`Walk`。全ドライバがこれを満たす。書き込みは `FileWriter` (`storagedriver.go:114`、`Commit` で確定)。
- `blobStore` / `blobStatter` (`registry/storage/blobstore.go:19`, `:156`): リポジトリ所属を問わないグローバル blob store。digest→パス→ドライバ。
- `blobServer` (`registry/storage/blobserver.go:19`): HTTP へ blob を出す層。redirect 可否フラグを持つ。
- `linkedBlobStore` / `linkedBlobStatter` (`registry/storage/linkedblobstore.go`): リポジトリ単位の blob 集合を link ファイルで表現する層。所属チェックはここ。

### ストレージレイアウト (paths.go:24-52 のコメント図)

- ルートは `/docker/registry/` + バージョン `v2` (`paths.go:12-13`)。
- `blobs/<algorithm>/<digest>/data` にコンテンツ本体 (content-addressable)。
- `repositories/<name>/_layers/...` はリポジトリから blob への link、`_manifests/revisions/.../link`、`_manifests/tags/<tag>/current/link`、`_uploads/<id>/{data,hashstates,startedat}`。

### 追うパス: blob upload (PUT) の完了

チャンク upload は POST(開始)→PATCH(データ)→PUT(確定) の 3 段。

1. `blobUploadDispatcher` が POST→`StartBlobUpload`、PATCH→`PatchBlobData`、PUT→`PutBlobUploadComplete` を割当 (`registry/handlers/blobupload.go:21`, `:33`, `:35`)。
2. `StartBlobUpload` が `blobs.Create` で upload セッションを確保 (`blobupload.go:81`)。
3. `linkedBlobStore.Create` (`registry/storage/linkedblobstore.go:128`): mount オプションがあれば `mount` を試し、成功なら `ErrBlobMounted` を返してアップロードを省く (`:143`)。それ以外は uuid を発番し `_uploads/<id>` に `startedat` を書いて `newBlobUpload` を返す (`:148-172`)。
4. `PutBlobUploadComplete` (`registry/handlers/blobupload.go:187`): クエリの `digest` をパースし、残ペイロードを `copyFullPayload` で書き込み (`:209`)、`buh.Upload.Commit` で確定 (`:214`)。失敗時は `Upload.Cancel` でバックエンドを掃除 (`:242` 付近)。
5. `blobWriter.Commit` (`registry/storage/blobwriter.go:58`): `validateBlob` で受信データの digest を検証 (`:164`)、`moveBlob` で upload データを最終的な hash 修飾パスへ移動 (`:73`, 本体 `:291`)、`linkBlob` でリポジトリから canonical digest への link を張る (`:77`)。
6. `linkBlob` (`linkedblobstore.go:327`): link ファイルの中身は canonical digest 文字列そのもの。重複 link は張らない (`:334-350`)。

### 気づき

- link ファイルの中身が「digest の文字列そのもの」というのが単純で強い (`blobstore.go:135-138` の `link`、`readlink` `:142-153`)。所属や別名 (aliases) もこの間接参照で表現。
- `blobStore.Put` は「小さいオブジェクト (manifest 等) 用」と明記され、大 blob は `blobWriter` 経由 (`blobstore.go:60-62`)。責務を分けている。
- `paths.go:15-18` に `storagePathRoot` を消したい旨の TODO。歴史的経緯 (Docker 由来の `/docker/registry/` prefix) がそのまま残っている。

## 採用事例の素材 (出典付きのみ)

ADOPTERS ファイルは無い。以下は README とドナー発表からの引用。

- README 冒頭が「Docker Hub, GitHub Container Registry, GitLab Container Registry, DigitalOcean Container Registry を含む多くのレジストリオペレータのコアライブラリ。加えて CNCF Harbor と VMware Harbor Registry」と明言 [出典 1]。
- Docker の寄贈ブログが、大口ユーザーからメンテナを迎えたとして Docker / GitHub / GitLab / DigitalOcean / Mirantis / Harbor / OCI を列挙 [出典 3]。
- Harbor は Distribution をコアに拡張機能 (署名・スキャン等) を足した CNCF Graduated レジストリ [出典 3, 出典 9: goharbor/harbor]。
- GitHub シグナル (2026-07-08): stars 10,503 / forks 2,756 [出典 12]。

注: 「GitHub Container Registry / GitLab Container Registry の内部が今も Distribution 由来か」は README とドナー発表が根拠。個別企業の現行アーキテクチャの一次ソースまでは未確認 (二次パスで補強余地)。

## 代替・エコシステム

- **Harbor** (CNCF Graduated): Distribution をコアにした「エンタープライズ向けレジストリ」。RBAC、脆弱性スキャン (Trivy)、署名、レプリケーションを足す [出典 9]。
- **Zot** (CNCF): OCI ネイティブの軽量レジストリ。Distribution とは別実装で OCI Distribution Spec 準拠。
- **Quay** (Red Hat): 独立実装のレジストリ (Clair スキャン統合等)。
- **クラウドマネージド**: Amazon ECR / Google Artifact Registry / Azure Container Registry / GitHub Container Registry など。API はいずれも OCI Distribution Spec / Docker Registry HTTP API V2 準拠なので、クライアント側は互換。
- **仕様**: OCI Distribution Specification がこの実装の API を標準化したもの。Distribution は OCI Conformance テストを CI で回している (README バッジ)。

エコシステム上の位置づけ: Distribution は「レジストリの参照実装 / ライブラリ土台」。多くの製品がこれを内包し、その上に認証・スキャン・レプリケーションを重ねる。単体では認証やスキャンは薄い。
