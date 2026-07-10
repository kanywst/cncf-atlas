# Internals

> Read from the source at commit `472c9d38` (one commit after tag `v3.1.1`). Every claim here points at a file and line.

## Code map

| Path | Responsibility |
| --- | --- |
| `registry/handlers/` | HTTP endpoints; `app.go` holds the router and per-route dispatchers |
| `registry/storage/` | Storage abstraction and the on-disk layout; `paths.go` is the single source of truth for paths |
| `registry/storage/driver/` | Backend implementations (`filesystem`, `inmemory`, `s3-aws`, `gcs`, `azure`) behind the `StorageDriver` interface |
| `registry/api/v2/` | Route descriptors and URL construction (`routes.go`, `descriptors.go`, `urls.go`) |

## Core data structures

`StorageDriver` (`registry/storage/driver/storagedriver.go:56`) is the interface every backend satisfies: `GetContent`/`PutContent`/`Reader`/`Writer`/`Stat`/`List`/`Move`/`Delete`/`RedirectURL`/`Walk`. Writes go through a `FileWriter` (`registry/storage/driver/storagedriver.go:116`) whose content is only durable after `Commit`. Everything above this interface is backend-agnostic.

`blobStore` and `blobStatter` (`registry/storage/blobstore.go:19`, `registry/storage/blobstore.go:156`) are the global, repository-independent view of blobs: digest to path to driver. `blobStore.Put` is documented as being for small objects such as manifests (`registry/storage/blobstore.go:62`); large blobs go through the upload writer instead, so the two responsibilities stay separated.

`linkedBlobStore` (`registry/storage/linkedblobstore.go`) is the per-repository view. A repository's membership in a blob is expressed by a link file, and the content of that link file is simply the canonical digest string (`registry/storage/blobstore.go:135` writes it, `registry/storage/blobstore.go:142` reads it). That one level of indirection is how the same physical blob belongs to many repositories at once.

## The storage layout

The layout is described in a comment block in `registry/storage/paths.go:24`. All paths share the root `/docker/registry/` and the layout version `v2` (`registry/storage/paths.go:12`, `registry/storage/paths.go:13`). Under that:

- `blobs/<algorithm>/<digest>/data` holds the content itself, addressed by digest.
- `repositories/<name>/_layers/...` holds the link files that point a repository at blobs, alongside `_manifests/` and `_uploads/<id>/` for in-progress uploads.

## A path worth tracing

Take the completion of a blob upload, the write half of `docker push`. A chunked upload is three requests: POST to start, PATCH to send data, PUT to finalize. `blobUploadDispatcher` maps them to `StartBlobUpload`, `PatchBlobData`, and `PutBlobUploadComplete` (`registry/handlers/blobupload.go:33`, `registry/handlers/blobupload.go:34`, `registry/handlers/blobupload.go:35`).

```text
PutBlobUploadComplete        registry/handlers/blobupload.go:187
  copyFullPayload            blobupload.go:209   write the trailing bytes
  Upload.Commit              blobupload.go:214   finalize
    -> blobWriter.Commit     registry/storage/blobwriter.go:58
         validateBlob        blobwriter.go:68    digest must match
         moveBlob            blobwriter.go:73    move to hash-qualified path
         linkBlob            blobwriter.go:77    link repo -> canonical digest
```

`StartBlobUpload` allocates the session with `blobs.Create` (`registry/handlers/blobupload.go:81`). That resolves to `linkedBlobStore.Create` (`registry/storage/linkedblobstore.go:128`), which first checks for a mount: if the client asked to mount an existing blob and the mount succeeds, it returns `distribution.ErrBlobMounted` and no upload session is created at all (`registry/storage/linkedblobstore.go:139`). Otherwise it mints a UUID, writes a `startedat` marker, and returns a fresh blob upload (`registry/storage/linkedblobstore.go:148`, `registry/storage/linkedblobstore.go:172`).

The finalize is `PutBlobUploadComplete` (`registry/handlers/blobupload.go:187`): it writes any remaining payload with `copyFullPayload` (`registry/handlers/blobupload.go:209`) and calls `buh.Upload.Commit` (`registry/handlers/blobupload.go:214`); on failure it cleans up with `buh.Upload.Cancel` (`registry/handlers/blobupload.go:243`).

`Commit` itself is `blobWriter.Commit` (`registry/storage/blobwriter.go:58`). Three steps in order: `validateBlob` recomputes the digest of the received data and rejects a mismatch (`registry/storage/blobwriter.go:68`, `registry/storage/blobwriter.go:164`); `moveBlob` moves the uploaded data to its final hash-qualified path (`registry/storage/blobwriter.go:73`, `registry/storage/blobwriter.go:294`); `linkBlob` writes the repository's link to the canonical digest (`registry/storage/blobwriter.go:77`). Only after validation does the blob land at its content-addressed home.

`linkBlob` (`registry/storage/linkedblobstore.go:327`) writes a link file per digest and skips duplicates by tracking a `seenDigests` set (`registry/storage/linkedblobstore.go:334`). The link content is the canonical digest string, which closes the loop with the read path: a GET reads that link to find the shared blob.

## Things that surprised me

The link file is not a symlink or a pointer with metadata. It is a file whose entire content is a digest string (`registry/storage/blobstore.go:135`, `registry/storage/blobstore.go:142`). Repository membership, and even aliases, are all expressed by this one flat indirection. It is almost too simple, and that is why it holds up: there is nothing to keep in sync.

The split between `blobStore.Put` and the upload writer is a deliberate size boundary. `Put` is annotated as being for small objects like manifests (`registry/storage/blobstore.go:62`), while large content is streamed through `blobWriter` and validated on `Commit`. The registry never buffers a whole large blob in memory just to store it.

The historical `/docker/registry/` path prefix is still hard-coded, with a `TODO` to remove it (`registry/storage/paths.go:15`). Years after the rename from `docker/distribution`, the Docker lineage is still literally in every stored object's path.
