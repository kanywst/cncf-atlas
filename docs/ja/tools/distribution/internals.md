# 内部実装

> コミット `472c9d38` (タグ `v3.1.1` の 1 コミット後) のソースを読んだもの。ここでの主張はすべてファイルと行を指す。

## コードマップ

| パス | 責務 |
| --- | --- |
| `registry/handlers/` | HTTP エンドポイント。`app.go` がルータとルートごとのディスパッチャを持つ |
| `registry/storage/` | ストレージ抽象とディスク上レイアウト。`paths.go` がパスの単一の真実 |
| `registry/storage/driver/` | `StorageDriver` インターフェースの背後のバックエンド実装 (`filesystem`・`inmemory`・`s3-aws`・`gcs`・`azure`) |
| `registry/api/v2/` | ルート記述子と URL 構築 (`routes.go`・`descriptors.go`・`urls.go`) |

## 中核データ構造

`StorageDriver` (`registry/storage/driver/storagedriver.go:56`) は全バックエンドが満たすインターフェースだ。`GetContent`/`PutContent`/`Reader`/`Writer`/`Stat`/`List`/`Move`/`Delete`/`RedirectURL`/`Walk`。書き込みは `FileWriter` (`registry/storage/driver/storagedriver.go:116`) を通り、その内容は `Commit` の後にのみ永続化される。このインターフェースより上はすべてバックエンド非依存だ。

`blobStore` と `blobStatter` (`registry/storage/blobstore.go:19`, `registry/storage/blobstore.go:156`) は、リポジトリ非依存のグローバルな blob ビューだ。digest → パス → ドライバ。`blobStore.Put` は manifest のような小さいオブジェクト用と明記され (`registry/storage/blobstore.go:62`)、大きい blob は upload writer 経由なので、2 つの責務は分離されたままだ。

`linkedBlobStore` (`registry/storage/linkedblobstore.go`) はリポジトリ単位のビューだ。あるリポジトリの blob への所属は link ファイルで表現され、その link ファイルの中身は単に canonical digest の文字列である (`registry/storage/blobstore.go:135` が書き込み、`registry/storage/blobstore.go:142` が読む)。この 1 段の間接参照こそが、同じ物理 blob を複数のリポジトリに同時に属させる仕組みだ。

## ストレージレイアウト

レイアウトは `registry/storage/paths.go:24` のコメントブロックに記されている。すべてのパスはルート `/docker/registry/` とレイアウトバージョン `v2` を共有する (`registry/storage/paths.go:12`, `registry/storage/paths.go:13`)。その下では次のようになる。

- `blobs/<algorithm>/<digest>/data` がコンテンツ本体を持ち、digest でアドレスされる。
- `repositories/<name>/_layers/...` が、リポジトリを blob に向ける link ファイルを持ち、`_manifests/` や進行中アップロード用の `_uploads/<id>/` と並ぶ。

## 追う価値のあるパス

blob upload の完了、すなわち `docker push` の書き込み側を取る。チャンク upload は 3 リクエストだ。開始の POST、データの PATCH、確定の PUT。`blobUploadDispatcher` がそれらを `StartBlobUpload`・`PatchBlobData`・`PutBlobUploadComplete` に割り当てる (`registry/handlers/blobupload.go:33`, `registry/handlers/blobupload.go:34`, `registry/handlers/blobupload.go:35`)。

```text
PutBlobUploadComplete        registry/handlers/blobupload.go:187
  copyFullPayload            blobupload.go:209   末尾のバイト列を書く
  Upload.Commit              blobupload.go:214   確定
    -> blobWriter.Commit     registry/storage/blobwriter.go:58
         validateBlob        blobwriter.go:68    digest が一致すること
         moveBlob            blobwriter.go:73    hash 修飾パスへ移動
         linkBlob            blobwriter.go:77    リポジトリ -> canonical digest の link
```

`StartBlobUpload` は `blobs.Create` でセッションを確保する (`registry/handlers/blobupload.go:81`)。これは `linkedBlobStore.Create` (`registry/storage/linkedblobstore.go:128`) に解決され、まず mount を確認する。クライアントが既存 blob の mount を要求し、その mount が成功すれば `distribution.ErrBlobMounted` を返し、upload セッションはまったく作られない (`registry/storage/linkedblobstore.go:139`)。それ以外は UUID を発番し、`startedat` マーカーを書き、新しい blob upload を返す (`registry/storage/linkedblobstore.go:148`, `registry/storage/linkedblobstore.go:172`)。

確定は `PutBlobUploadComplete` (`registry/handlers/blobupload.go:187`) だ。残りのペイロードを `copyFullPayload` で書き (`registry/handlers/blobupload.go:209`)、`buh.Upload.Commit` を呼ぶ (`registry/handlers/blobupload.go:214`)。失敗時は `buh.Upload.Cancel` で後始末する (`registry/handlers/blobupload.go:243`)。

`Commit` 自体は `blobWriter.Commit` (`registry/storage/blobwriter.go:58`) だ。順に 3 ステップ。`validateBlob` が受信データの digest を再計算し不一致を拒否する (`registry/storage/blobwriter.go:68`, `registry/storage/blobwriter.go:164`)。`moveBlob` がアップロードデータを最終的な hash 修飾パスへ移す (`registry/storage/blobwriter.go:73`, `registry/storage/blobwriter.go:294`)。`linkBlob` がリポジトリから canonical digest への link を書く (`registry/storage/blobwriter.go:77`)。検証を通って初めて、blob はその content-addressed な定位置に着く。

`linkBlob` (`registry/storage/linkedblobstore.go:327`) は digest ごとに link ファイルを書き、`seenDigests` セットで重複をスキップする (`registry/storage/linkedblobstore.go:334`)。link の中身は canonical digest の文字列で、これが読み取りパスと輪を閉じる。GET はその link を読んで共有 blob を見つける。

## 読んで驚いた点

link ファイルは symlink でもメタデータ付きポインタでもない。中身が digest 文字列そのものであるファイルだ (`registry/storage/blobstore.go:135`, `registry/storage/blobstore.go:142`)。リポジトリの所属も、別名 (aliases) さえも、すべてこの 1 段のフラットな間接参照で表現される。単純すぎるほどで、だからこそ壊れない。同期すべきものが何も無いのだ。

`blobStore.Put` と upload writer の分離は、意図的なサイズ境界だ。`Put` は manifest のような小さいオブジェクト用と注記され (`registry/storage/blobstore.go:62`)、大きいコンテンツは `blobWriter` を通してストリームされ `Commit` で検証される。レジストリは、大きい blob をただ保存するためだけに丸ごとメモリに抱えることはしない。

歴史的な `/docker/registry/` のパス接頭辞は今もハードコードされており、それを消したい旨の `TODO` がある (`registry/storage/paths.go:15`)。`docker/distribution` からの改称から何年も経っても、Docker の系譜が保存される全オブジェクトのパスに文字通り残っている。
