# recon: SPIFFE (go-spiffe)

調査メモ。SPIFFE はフレームワーク/標準仕様であり、複数リポジトリに跨る。SVID 仕様と Workload API 仕様の本体は `spiffe/spiffe`、リファレンス実装のサーバ/エージェントは `spiffe/spire`（別ターゲットで扱う）。本ディープダイブはアプリ側から SPIFFE を使う際の正準クライアントライブラリである `spiffe/go-spiffe` のコードを主対象とする。仕様・歴史・採用は SPIFFE プロジェクト全体として記述する。

## 基本情報

- repo: spiffe/go-spiffe（SPIFFE プロジェクトの Go クライアントライブラリ。仕様本体は `spiffe/spiffe`、実装サーバは `spiffe/spire`）
- pinned commit: `e9973f6314a3fa0e36eb1f00fbfe37bdc1554b96` / 近いタグ: `v2.8.1`（2026-06-19 リリース）
- 言語 / ビルド: Go（`go 1.24.0`、`go.mod` 1 行目 `module github.com/spiffe/go-spiffe/v2`）/ `make build` または `go build ./...`、テストは `make test` / `go test ./...`
- ライセンス: Apache-2.0（`LICENSE` 冒頭 "Apache License Version 2.0" を実ファイルで確認。`gh api` でも `spdx_id: Apache-2.0`）
- CNCF 成熟度: Graduated（2022-08-23 卒業）
- カテゴリ (tools.ts の CATEGORY_ORDER から): Identity & Policy
- エントリポイント: ライブラリのため `main` なし。`module .../v2` だがコードはリポジトリルート直下に置かれる（`v2/` サブディレクトリではない点に注意）。実行可能例は `examples/spiffe-tls/server/main.go` などにある

## 歴史の素材

- SPIFFE = Secure Production Identity Framework For Everyone。サービス間通信で「ワークロードに短命で暗号学的に検証可能な ID を、秘密の事前配布なしに発行する」課題を解く標準。出自は Scytale 社（後に HPE が買収）と CNCF コミュニティ。
- CNCF タイムライン: 2018-03-29 CNCF 受理 → 2020-06-22 Incubating → 2022-08-23 Graduated。go-spiffe リポジトリ自体は 2017-05-07 作成（`gh api repos/spiffe/go-spiffe .created_at`）。
- コアの 3 標準: SPIFFE ID（`spiffe://` URI）、SVID（X509-SVID / JWT-SVID という検証可能 ID ドキュメント）、Workload API（SVID を発行/取得する gRPC API）。go-spiffe README がこの 3 つへのリンクを張る（`README.md:5-8`）。
- 出典は sources.md の #1〜#5。

## アーキテクチャの素材

トップレベルのパッケージ（リポジトリルート直下、いずれも `module .../v2` 配下）:

- `spiffeid/` — SPIFFE ID と TrustDomain の型・パース・マッチング（`id.go`, `trustdomain.go`, `match.go`）
- `svid/x509svid/`, `svid/jwtsvid/` — SVID 型と検証（`svid.go`, `verify.go`）
- `bundle/x509bundle/`, `bundle/jwtbundle/`, `bundle/spiffebundle/` — トラストバンドル（信頼アンカー集合）
- `workloadapi/` — Workload API クライアント本体。低レベル `Client` と高レベルの `X509Source` / `JWTSource` / `BundleSource`（`client.go`, `x509source.go`, `watcher.go`）
- `spiffetls/` + `spiffetls/tlsconfig/` — mTLS の `Listen` / `Dial` ヘルパと `tls.Config` 生成
- `spiffegrpc/grpccredentials/` — gRPC 向けトランスポートクレデンシャル
- `federation/` — バンドルエンドポイント越しのトラストドメイン連携
- `proto/spiffe/workload/` — Workload API の gRPC スタブ
- `exp/` — 実験的な WIT-SVID（Workload Identity Token、`exp/svid/witsvid/`）

依存の流れ（mTLS サーバの典型）: アプリ → `spiffetls.ListenWithMode` → `tlsconfig` が `X509Source` を `tls.Config.GetCertificate` / `VerifyPeerCertificate` に結線 → `X509Source` が `workloadapi.Client` 経由で Workload API（SPIRE Agent の Unix ソケット）を watch。例は `examples/spiffe-tls/server/main.go:35-40`（`spiffetls.MTLSServerWithSourceOptions(tlsconfig.AuthorizeID(clientID), ...)`）。

Workload API のアドレス解決: 環境変数 `SPIFFE_ENDPOINT_SOCKET`（`workloadapi/addr.go:13` の `SocketEnv`）。`TargetFromAddress`（`addr.go:31`）が URI をパースし、`tcp://IP:port` か Unix ドメインソケット（`unix://...`、POSIX は `addr_posix.go`、Windows は named pipe 対応の `addr_windows.go`）を gRPC ターゲットへ変換。接続は常に `insecure` トランスポート（`client.go:519`）で張る。ソケット自体への到達権がワークロード認証の境界だからである。

非自明な設計判断（追記）: gRPC 呼び出しに必ず `withHeader`（`client.go:661-664`）でメタデータ `workload.spiffe.io: true` を付与する。これは Workload API 仕様が security header の付与を要求しており、ヘッダ無しリクエストをサーバ側で弾けるようにするため。クライアントは毎回これを設定する。

## 内部実装の素材

追う価値のあるコアパス（X509-SVID 取得 end-to-end）:

1. `workloadapi.NewX509Source`（`x509source.go:31`）が `newWatcher` を呼び、コールバック `s.setX509Context` を渡す。`New()` は初回更新を受け取るまでブロックする（`x509source.go:28` の doc どおり）。
2. `newWatcher`（`watcher.go:101`）が `Client` を生成し、バックグラウンド goroutine で `w.client.WatchX509Context(watchCtx, w)` を起動（`watcher.go:147-150`）。`waitFor(w.x509ContextSet)` で初回確定までブロック。
3. `Client.WatchX509Context`（`client.go:158`）→ `watchX509Context`（`client.go:547`）が gRPC ストリーム `c.wlClient.FetchX509SVID(ctx, &workload.X509SVIDRequest{})`（`client.go:552`）を開き、`stream.Recv()` ループで更新を受ける。エラー時は `handleWatchError`（`client.go:524`）が指数バックオフで再試行。`codes.Canceled` / `codes.InvalidArgument` は即終了。
4. 各レスポンスを `parseX509Context`（`client.go:673`）→ `parseX509SVIDs`（`client.go:693`）が処理。`hint` 重複は先勝ちでスキップ（`client.go:708`、仕様の "first message ... SHOULD be selected"）。生バイトは `x509svid.ParseRaw(svid.X509Svid, svid.X509SvidKey)`（`client.go:714`）でデコード。
5. `x509svid.ParseRaw`（`svid/x509svid/svid.go:75`）が DER 証明書連結と PKCS#8 秘密鍵をパースし `newSVID`（`svid.go:126`）へ。`validateCertificates`（`svid.go:146`）がリーフから SPIFFE ID を抽出（URI SAN は厳密に 1 個、`verify.go:94` `IDFromCert`）、リーフは非 CA・`digitalSignature` 必須・`keyCertSign`/`cRLSign` 禁止（`svid.go:198-208`）、中間証明書は CA かつ `keyCertSign` 必須（`svid.go:185-196`）。`validatePrivateKey`（`svid.go:210`）が公開鍵と秘密鍵の一致を RSA/ECDSA/Ed25519 別に検証。
6. watcher の `OnX509ContextUpdate`（`watcher.go:187`）が `s.setX509Context` を呼ぶ → `X509Source.setX509Context`（`x509source.go:102`）が `picker`（無指定なら `DefaultSVID()` = 先頭）で SVID を選び、`mtx` ロック下で `s.svid` / `s.bundles` を差し替え。
7. アプリは `X509Source.GetX509SVID()`（`x509source.go:63`）で最新 SVID を読む（`x509svid.Source` インタフェース実装）。`tlsconfig` がこれを `tls.Config` に結線して mTLS を成立させる。

ピア検証パス（受信側）: `x509svid.Verify`（`verify.go:30`）がリーフから SPIFFE ID を取り、リーフの CA/keyUsage を再チェックし、`bundleSource.GetX509BundleForTrustDomain(id.TrustDomain())`（`verify.go:58`）でそのトラストドメインのルートを引き、Go 標準 `leaf.Verify`（`verify.go:63`、`ExtKeyUsageAny`）でチェーン検証する。SPIFFE ではピアの ID（URI SAN）とチェーンの信頼アンカーで認可するため DNS SAN は使わない。

中核データ構造（3〜5 個）:

- `spiffeid.ID`（`spiffeid/id.go:95-101`）: フィールドは `id string` と `pathidx int` の 2 個のみ。正準文字列全体を保持し、トラストドメイン/パスは添字スライスで取り出す（`TrustDomain()` は `id[9:pathidx]`、`Path()` は `id[pathidx:]`、`id.go:104-119`）。
- `spiffeid.TrustDomain`（`trustdomain.go`）: `name string` 1 フィールド。`ID.MemberOf` は TrustDomain の `==` 比較で済む（`id.go:112`）。
- `x509svid.SVID`（`svid/x509svid/svid.go:20-36`）: `ID spiffeid.ID` / `Certificates []*x509.Certificate`（先頭がリーフ）/ `PrivateKey crypto.Signer` / `Hint string`。
- `workloadapi.X509Context`（`workloadapi/x509context.go`）: `SVIDs []*x509svid.SVID` と `Bundles *x509bundle.Set`。Workload API の 1 レスポンスに SVID とバンドルが同梱される構造を反映。
- `workloadapi.Client`（`client.go:29-33`）: `conn *grpc.ClientConn` / `wlClient workload.SpiffeWorkloadAPIClient` / `config clientConfig`。

非自明な設計判断（中核）: `spiffeid.ID` を「トラストドメイン文字列 + パス文字列」の 2 フィールドではなく「正準文字列 1 本 + パス開始添字 `pathidx`」で持つ。利点は (1) `==` で値比較・map キー化が可能、(2) `String()` がアロケーション無し、(3) トラストドメイン/パス取り出しが部分文字列スライスのみで割当ゼロ。代償としてパース時（`FromString`、`id.go:51`）に手書きの文字走査でトラストドメイン文字の妥当性を検証する（`net/url` だけに頼らない）。SPIFFE ID は mTLS のたびに大量に生成・比較されるため、この軽量で比較可能な表現は性能上の意図的選択。

## 採用事例の素材

出典付きの組織名のみ（捏造禁止。出典は `spiffe/spire` の ADOPTERS.md と CNCF 卒業アナウンス、各社の公開トーク/ブログ）:

- Uber — マルチクラウド（GCP/OCI/AWS/オンプレ）でステートレス/ステートフル/バッチ/CI ジョブにワークロード ID を付与。MySQL リードレプリカ対応などを upstream に還元。出典: Uber Engineering ブログ + CNCF 卒業アナウンス（sources #6, #2）。
- ByteDance / TikTok — SPIFFE/SPIRE でゼロトラスト基盤を構築し数十万ワークロードを保護。SPIFFE Community Day 2020 で発表。出典: CNCF 卒業アナウンス（#2）。
- Square（現 Block）— ハイブリッド基盤の mTLS ID、Lambda への ID 付与。SPIFFE Community Day 2019 で発表。出典: CNCF 卒業アナウンス / spiffe.io ケーススタディ（#2, #5）。
- Bloomberg — 本番アダプタとして掲載。TPM ノードアテステーションを発表。出典: SPIRE ADOPTERS.md / CNCF アナウンス（#7, #2）。go-spiffe の最新メンテナコミットも Bloomberg の Carlo Teubner。
- その他 ADOPTERS / アナウンス記載: GitHub, Netflix, Pinterest, Niantic, Twilio, Duke Energy, Unity Technologies, Z Lab。ベンダ統合は HashiCorp, F5, Intel, IBM, Google, VMware など（#2, #7）。

採用シグナル（数値、2026-06-24 取得、`gh api`）:

- `spiffe/go-spiffe`: stars 200 / forks 85 / contributors 38+ / 最新リリース v2.8.1（2026-06-19）。
- `spiffe/spiffe`（仕様本体）: stars 1788 / forks 200 / contributors 54+。
- `spiffe/spire`（実装、別ターゲット）: stars 2407。

## 代替・エコシステム

- 統合先: Envoy（SDS で SPIFFE SVID を配布）, gRPC, Istio（SPIFFE ID 体系を採用）, Kubernetes, Sigstore, Tekton。go-spiffe は `spiffetls` / `spiffegrpc` でこれらの mTLS 結線を提供。
- 言語ライブラリ群: go-spiffe（本対象）, java-spiffe, c-spiffe, py-spiffe, spiffe-rs 等。go-spiffe のみ Workload API の named pipe（Windows）転送に対応する点が差別化（README / メンテナ発言）。
- 実装としての対: SPIRE（SPIFFE のリファレンス実装サーバ/エージェント。別ターゲット）。他実装に HashiCorp Vault のワークロード ID、各クラウドの IAM/Workload Identity（GKE Workload Identity, AWS IAM Roles Anywhere）。
- 本質的な差: SPIFFE はクラウド/オーケストレータ非依存の「ベンダ中立な ID 標準 + Workload API」を定義する点が独自。クラウド固有の Workload Identity は単一プロバイダに閉じるのに対し、SPIFFE はトラストドメイン連携（`federation/`）でドメイン横断の相互認証を成立させる。
