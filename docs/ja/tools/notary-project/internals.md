# 内部実装

> コミット `51ff5ec` のソースを読んだもの。ここでの主張はすべてファイルと行を指すこと。

## コードマップ

| パス | 責務 |
| --- | --- |
| `cmd/notation/main.go` | cobra ルート、サブコマンド登録、認証情報のクリーンアップ (`cmd/notation/main.go:30`) |
| `cmd/notation/sign.go` | `sign` コマンド、フラグ集合、署名の end-to-end フロー (`cmd/notation/sign.go:60`) |
| `cmd/notation/verify.go` | `verify` コマンドと検証フロー (`cmd/notation/verify.go:43`) |
| `cmd/notation/registry.go` | リポジトリ解決、ORAS クライアント、認証 (`cmd/notation/registry.go:44`) |
| `internal/envelope/` | 署名ペイロード型と JWS / COSE メディアタイプ変換 (`internal/envelope/envelope.go:42`) |
| `internal/version/` | バイナリに埋め込むバージョン文字列 (`internal/version/version.go:18`) |

## 中核データ構造

- `signOpts` (`cmd/notation/sign.go:45`) は全署名フラグを集約する: `expiry`、`tsaServerURL`、`forceReferrersTag`、`ociLayout`、`inputType`、加えて埋め込みの `flag.SignerFlagOpts` と `flag.SecureFlagOpts`。
- `envelope.Payload` (`internal/envelope/envelope.go:37`) は単一フィールド `TargetArtifact ocispec.Descriptor` を持つ。この対象アーティファクトの descriptor が実際に署名される内容だ。
- `MediaTypePayloadV1` (`internal/envelope/envelope.go:33`) は `application/vnd.cncf.notary.payload.v1+json`。検証時、`ValidatePayloadContentType` (`internal/envelope/envelope.go:53`) はこの content type のみ許可する。
- `inputType` (`cmd/notation/registry.go:35-40`) は `inputTypeRegistry` (デフォルト) と `inputTypeOCILayout` (Experimental) を区別する。
- `notation.SignOptions` と `notation.VerifyOptions` (`cmd/notation/sign.go:206` と `cmd/notation/verify.go:141` で組み立て、定義は `notation-go`) は CLI とライブラリの境界の DTO だ。

## 追う価値のあるパス

署名ペイロードはアーティファクトの OCI descriptor であり、署名前に必ずダイジェストへ固定される。`runSign` ではタグを解決し、タグ参照には可変性の警告を出し、descriptor のダイジェストをアーティファクト参照として格納する:

```go
manifestDesc, resolvedRef, err := resolveReference(ctx, cmdOpts.inputType, cmdOpts.reference, sigRepo, func(ref string, manifestDesc ocispec.Descriptor) {
    fmt.Fprintf(os.Stderr, "Warning: Always sign the artifact using digest(@sha256:...) rather than a tag(:%s) ...", ref)
})
if err != nil {
    return err
}
signOpts.ArtifactReference = manifestDesc.Digest.String()
```

これが `cmd/notation/sign.go:166-172`。署名されるペイロード型自体は descriptor だけだ:

```go
type Payload struct {
    TargetArtifact ocispec.Descriptor `json:"targetArtifact"`
}
```

これが `internal/envelope/envelope.go:37-39`。中核呼び出し `notation.SignOCI` (`cmd/notation/sign.go:175`) が署名を OCI Referrer として push する。

## 読んで驚いた点

- 環境変数から読んだレジストリ認証情報を即座に unset する。ルートコマンドの `PersistentPreRun` は username と password の env を読んだ直後に `os.Unsetenv` を呼び、子プロセスへの漏洩を防ぐ (`cmd/notation/main.go:35-39`)。
- Referrers 戦略は固定選択ではなく実行時フォールバックだ。`forceReferrersTag` が false のとき、`notation` はまず Referrers API を試し、未対応なら Referrers tag schema へフォールバックする。sign では両者が排他フラグだ (`cmd/notation/registry.go:59-93`、`cmd/notation/sign.go:143`)。
- verify は常に `forceReferrersTag` に false を渡すため、検証・list・inspect は tag schema を強制せず常に API を先に試す (`cmd/notation/verify.go:130`)。
- 古い Referrers index の削除失敗は致命的ではない。sign を失敗させず GC 警告を出すだけだ (`cmd/notation/sign.go:177-183`)。
- OCI layout 入力は Experimental でゲートされる。`--oci-layout` フラグは experimental チェックの裏に隠され、`inputType` を切り替えるのは `PreRunE` のみだ (`cmd/notation/sign.go:113-117`、`cmd/notation/sign.go:145`)。
