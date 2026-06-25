# recon: Notary Project (notation)

調査メモ。出典は URL を添える。path:line は `research/notary-project/src/` 配下の clone を指す。

## 基本情報

- repo: `notaryproject/notation` (Notary Project の旗艦実装。仕様は `notaryproject/specifications`、ライブラリは `notation-go` / `notation-core-go`)
- pinned commit: `51ff5eca6686f4990631435017e50121f8057baf` (2026-03-26, `feat: add retry with exponential backoff for network interactions (#1342)`)
- 近いタグ: `v2.0.0-alpha.1` (2025-03-13) 以降の main 開発線。module は `github.com/notaryproject/notation/v2`、`internal/version/version.go:18` の `Version = "v2.0.0-alpha.1"`。安定最新は `v1.3.2` (2025-04-27)
- 言語 / ビルド: Go (go.mod `go 1.24.0`) / `make build` または `make install` (`Makefile:46` で `go build $(GO_BUILD_FLAGS)`、`LDFLAGS` は `Makefile:29`)
- ライセンス: Apache-2.0 (`LICENSE` は Apache 2.0 全文、各 `.go` 先頭にライセンスヘッダ。`gh repo view` の licenseInfo も `apache-2.0`)
- 主エントリポイント: `cmd/notation/main.go:77` `func main()` -> `run():30`
- CNCF 成熟度: Incubating (2017-10-24 受理。<https://www.cncf.io/projects/notary-project/>)
- カテゴリ: Supply Chain (確定済み、verbatim)

## 歴史の素材

- 起源は Docker が 2015 年に開始し CNCF へ寄贈した Notary (= Docker Content Trust, DCT)。これが Notary v1 で、The Update Framework (TUF) ベースのサーバ/クライアント構成。Notary Project の現行仕様は実装していない。出典: <https://www.howtogeek.com/devops/how-docker-image-signing-will-evolve-with-notary-v2/>, FAQ <https://notaryproject.dev/docs/faq/>
- 後継 (旧称 "Notary v2") の検討は 2019 年 12 月にマルチベンダ WG として発足。Docker / Microsoft / Google / Amazon が参加。v1 の課題 (レジストリ間ポータビリティ欠如、1 イメージ 1 署名のみ、コンテナイメージ以外の OCI アーティファクトに署名不可) を解決する狙い。出典: 同上 howtogeek
- マイルストーン: 2021-10 alpha、2023 メジャーリリース (<https://notaryproject.dev/blog/2023/announcing-major-release/>)。"Notary v2" の呼称は廃止され現在は "Notary Project"、ツール名は "Notation"
- DCT 廃止が採用を後押し: Azure Container Registry は 2025-03-31 に DCT deprecation 開始、2028-03-31 に完全削除予定で Notary Project ベースの署名を代替として案内。出典: <https://learn.microsoft.com/en-us/azure/container-registry/container-registry-content-trust-deprecation>
- 2025-01 に 2 回目のセキュリティ監査完了 (CNCF プロジェクトページ記載)

## アーキテクチャの素材

トップレベル構成は `cmd/notation/` がコマンド層、`internal/` が補助、コア署名/検証ロジックは依存ライブラリ `notation-go` / `notation-core-go` 側にある。

- `cmd/notation/main.go:57-70` で cobra ルートに全サブコマンドを登録: `blob`, `sign`, `verify`, `list`, `cert`, `policy`, `key`, `plugin`, `login`, `logout`, `version`, `inspect`
- `internal/envelope/` は署名エンベロープのメディアタイプ変換 (JWS / COSE) とペイロード型
- `internal/auth`, `internal/config`, `internal/httputil`, `internal/x509`, `internal/revocation`, `internal/trace` がレジストリ認証・TLS・失効・ログの補助
- レジストリアクセスは ORAS (`oras.land/oras-go/v2`) を直接利用 (`cmd/notation/registry.go:100`)

代表オペレーション `notation sign` の end-to-end トレース:

1. `cmd/notation/sign.go:60` `signCommand` がフラグ定義。`RunE` (`sign.go:119`) は timestamp フラグの整合性チェック後に `runSign` (`sign.go:149`) を呼ぶ
2. `runSign` でロガー初期化後、署名者を取得する。`sign.GetSigner(ctx, ...)` (`sign.go:154`) -> `cmd/notation/internal/sign/sign.go:36`。ローカル鍵なら `signer.NewGenericSignerFromFiles` (`sign.go:55`)、KMS 等の外部鍵ならプラグイン署名者 `signer.NewPluginSigner` (`sign.go:45` / `:66`)。鍵は `config.LoadSigningKeys()` で `config.json` から解決 (`sign.go:73-84`)
3. リポジトリ解決は `getRepository` (`sign.go:158`) -> `cmd/notation/registry.go:44`。リモートなら `getRemoteRepository:71` -> `getRepositoryClient:95` が ORAS `remote.Repository` を構築 (`registry.go:100`)。OCI layout 入力なら `notationregistry.NewOCIRepository` (`registry.go:53`、Experimental)
4. 署名オプション組み立ては `prepareSigningOpts` (`sign.go:162` -> `:191`)。エンベロープ種別を `envelope.GetEnvelopeMediaType` で JWS / COSE のメディアタイプに変換 (`internal/envelope/envelope.go:42`)。`--timestamp-url` 指定時は RFC 3161 TSA 用 `tspclient.NewHTTPTimestamper` と TSA 失効バリデータを設定 (`sign.go:214-230`)
5. タグからダイジェストへの解決は `resolveReference` (`sign.go:166`)。タグ参照には可変性の警告を stderr に出す (`sign.go:167`)。署名対象はダイジェストに固定 (`sign.go:172`)
6. コア処理は `notation.SignOCI(ctx, signer, sigRepo, signOpts)` (`sign.go:175`、実体は `notation-go`)。署名は OCI Referrer としてサブジェクトに紐づけて push される。Referrers index 削除失敗時は GC 警告 (`sign.go:177-183`)
7. 結果出力 (`sign.go:186-187`): `Successfully signed ...@<digest>` と `Pushed the signature to ...@<sig digest>`

`notation verify` も対称的に動く。`cmd/notation/verify.go:103` `runVerify` -> `verify.GetVerifier` -> `notation.Verify` (`verify.go:147`) -> outcome を `display` ハンドラで描画。trust policy scope は Experimental の `--scope` で OCI layout 検証時に指定する (`verify.go:97`)。

## 内部実装の素材

中核データ構造:

1. `signOpts` 構造体 (`cmd/notation/sign.go:45`): 署名フラグ集約。`expiry`, `tsaServerURL`, `forceReferrersTag`, `ociLayout`, `inputType` など。埋め込みで `flag.SignerFlagOpts` / `SecureFlagOpts` を合成
2. `envelope.Payload` (`internal/envelope/envelope.go:37`): `TargetArtifact ocispec.Descriptor` の一フィールド。これが実際に署名される内容 (= 対象アーティファクトの OCI Descriptor)
3. `MediaTypePayloadV1` (`internal/envelope/envelope.go:33`): `application/vnd.cncf.notary.payload.v1+json`。検証時は `ValidatePayloadContentType` (`envelope.go:53`) でこの型のみ許可
4. `inputType` 列挙 (`cmd/notation/registry.go:35-40`): `inputTypeRegistry` (デフォルト) と `inputTypeOCILayout` (Experimental) を区別
5. `notation.SignOptions` / `notation.VerifyOptions` (`sign.go:206` / `verify.go:141` で組み立て、定義は `notation-go`): CLI とライブラリの境界となる DTO

非自明な設計判断:

- 署名を OCI Referrer として保管しレジストリ間ポータビリティを得る。`registry.go:59-93` のコメント通り、まず Referrers API で referrer として push し、未対応レジストリなら Referrers tag schema へ自動フォールバックする。これにより署名がアーティファクト本体と同じリポジトリにダイジェスト紐づけで同居し、レジストリをまたいだ copy でも署名が追随する。v1 (TUF サーバ別管理) との決定的な差
- 認証情報の env 漏洩防止: ルートコマンドの `PersistentPreRun` でレジストリ認証情報を env から読み取った後に即 `os.Unsetenv` する (`cmd/notation/main.go:36-39`)
- trust policy の検証レベルは strict / permissive / audit / skip。permissive は revocation と expiry を log 扱いにするため、レジストリ侵害時の rollback 攻撃に対し脆弱になりうる (署名 expiry を短くし strict 推奨)。出典: 仕様 <https://github.com/notaryproject/specifications/blob/v1.1.0/specs/trust-store-trust-policy.md>、advisory <https://github.com/notaryproject/specifications/security/advisories/GHSA-57wx-m636-g3g8>

最小セットアップ: `go >= 1.24` 必須 (`building.md`)。`git clone` のあと `make install` で `~/bin/notation` に配置する。署名前に `notation key add`、検証前に trust store へ証明書追加と trust policy 作成が前提 (`verify.go:51`)。

## 採用事例の素材

出典付きの組織/サービスのみ記載する。

- Microsoft Azure Container Registry / AKS: DCT の代替として Notary Project ベース署名を公式案内。Artifact Signing は GA。出典: <https://learn.microsoft.com/en-us/azure/container-registry/container-registry-content-trust-deprecation>, <https://techcommunity.microsoft.com/blog/appsonazureblog/simplifying-image-signing-with-notary-project-and-artifact-signing-ga/4487942>
- AWS Signer: Notation を使ったコンテナイメージ署名ワークフローを提供。出典: <https://docs.aws.amazon.com/signer/latest/developerguide/container-workflow.html> (README からもリンク)
- Harbor: Notary Project 署名をアーティファクトと並べてレジストリ保管対応 (CNCF Harbor)
- Zot registry: Notation 署名を OCI アーティファクトとして保管対応

上記以外の組織名は未確認のため記載しない。

## 採用シグナル (数値 + 日付)

- `notaryproject/notation`: stars 487 / forks 95 / open issues 66 / contributors 40 (gh API, 2026-06-24)
- `notaryproject/specifications`: stars 177 (2026-06-24)
- `notaryproject/notary` (旧 v1, TUF): stars 3286 (別プロジェクト扱い、deep-dive 対象外)

## ガバナンス

- Notary Project ガバナンス文書: <https://github.com/notaryproject/.github/blob/main/GOVERNANCE.md>。CNCF Slack `#notary-project`、定例コミュニティミーティングあり (README "Community" 節)

## 代替・エコシステム

- Sigstore / cosign: 最大の代替。keyless (OIDC + Fulcio + Rekor 透明性ログ) が主流。Notation は標準 PKI / X.509 とプラグインによる KMS 連携が軸で、透明性ログ非依存・既存 CA 信頼モデル前提という差。比較: <https://snyk.io/blog/signing-container-images/>
- Docker Content Trust (Notary v1): 前身。TUF ベースでレジストリ間ポータビリティ無し、1 署名のみ。Notation が後継
- エコシステム/統合: Ratify (CNCF Sandbox, Kubernetes admission で検証強制)、Kyverno (image verification ルール)、notation-action (GitHub Actions)、notation-hashicorp-vault プラグイン、ORAS (レジストリ操作)、TSA は RFC 3161 (tspclient-go)
</content>
