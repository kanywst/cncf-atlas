# recon: SPIRE

SPIFFE Runtime Environment。ワークロードに対して短命の暗号学的アイデンティティ (X509-SVID / JWT-SVID) を、共有シークレットなしで発行するアイデンティティ基盤。SPIFFE 仕様の参照実装。自分用メモ、密度優先。

## 基本情報

- repo: `spiffe/spire` (<https://github.com/spiffe/spire>)
- pinned commit: `73215a39879e40d3e50cbac1e6a845d518df00aa` (2026-06-22) / 近いタグ: `v1.15.1` (HEAD はこのタグの 50 commit 先、`git merge-base --is-ancestor v1.15.1 HEAD` で祖先確認済み)
- 言語 / ビルド: Go 1.26.4 (`go.mod:3`) / `make build` → `bin/spire-server` と `bin/spire-agent` (`Makefile:256` の `build: tidy $(addprefix bin/,$(binaries))`)
- ライセンス: Apache-2.0 (`LICENSE:1-3` で Apache License Version 2.0 を確認、`gh api` の `spdx_id` も `Apache-2.0`)
- CNCF 成熟度: Graduated (SPIRE は 2022-08-22 に Graduated 入り、公式アナウンスは 2022-09-20)
- カテゴリ: Identity & Policy

## 全体像

SPIRE は 2 つのバイナリで構成される。

- `spire-server`: 信頼ドメインの認証局。ノードを attest し、登録エントリ (RegistrationEntry) に基づいて SVID を署名・発行する。エントリ DB (datastore) を持つ。
- `spire-agent`: 各ノードで動く。起動時にノード attestation でサーバから自身の SVID を取得し、その後はローカルのワークロードに Workload API (Unix domain socket) 経由で SVID を配る。

エントリポイント。

- `cmd/spire-server/main.go`: `entrypoint.NewEntryPoint(new(cli.CLI).Run).Main()` (薄い、CLI に委譲)
- `cmd/spire-agent/main.go`: 同型

両者ともすべての機能がプラグイン化されている。ビルトインプラグインのファミリは以下。

- server 側 (`pkg/server/plugin/`): `nodeattestor`, `upstreamauthority`, `keymanager`, `bundlepublisher`, `credentialcomposer`, `notifier`
- agent 側 (`pkg/agent/plugin/`): `nodeattestor`, `keymanager`, `svidstore`, `workloadattestor`

`grep -rc "builtin(" pkg/server/plugin` で server だけでもビルトイン登録が 124 箇所。プラグイン catalog の実装は `pkg/common/catalog/` (`catalog.go`, `builtin.go`, `bind.go`)。ビルトインも外部 (HashiCorp go-plugin) も同じ catalog インターフェースで読み込む。

## 中核オペレーションのトレース: ワークロードが X509-SVID を取得する

代表的な 1 本のフローを end-to-end で追う。ワークロードが Workload API の `FetchX509SVID` を呼ぶところから。

1. ワークロードが UDS 上の gRPC streaming RPC `FetchX509SVID` を呼ぶ。ハンドラは `pkg/agent/endpoints/workload/handler.go:251`。リクエスト body は空 (`_ *workload.X509SVIDRequest`)、認証情報も渡さない。

2. ワークロード attestation。`selectors, err := h.c.Attestor.Attest(ctx)` (`handler.go:256`)。呼び出し元の PID は接続そのものから取る。`spire-agent` は UDS の peer credential をカーネルから読む。Linux は `pkg/common/peertracker/uds_linux.go:10` の `unix.GetsockoptUcred(fd, SOL_SOCKET, SO_PEERCRED)`、BSD/macOS は `pkg/common/peertracker/uds_bsd.go:13` の `LOCAL_PEERPID`。

3. attestor 本体は `pkg/agent/attestor/workload/workload.go:49` の `Attest(ctx, pid)`。catalog から workload attestor プラグイン群を取り、各プラグインを goroutine で並列起動して PID からセレクタを集める (`workload.go:55-87`)。プラグイン例: `unix` (uid/gid/path)、`docker`、`k8s`。全プラグインが失敗した場合のみエラー (`workload.go:89-91`)。返り値は `[]*common.Selector`。

4. レート制限。`h.rateLimit(ctx, MethodFetchX509SVID, selectors)` (`handler.go:262`)。agent 自身の呼び出し (health check) は `isAgent(ctx)` で免除 (`handler.go:86`)。

5. キャッシュ購読。`subscriber, err := h.c.Manager.SubscribeToCacheChanges(ctx, selectors)` (`handler.go:266`)。manager 側は `pkg/agent/manager/manager.go:258` → `m.cache.SubscribeToWorkloadUpdates(ctx, selectors)`。SVID はリクエストごとにサーバへ問い合わせるのではなく、agent の manager が事前にキャッシュ・ローテーションしておいたものを返す。

6. ストリーミングループ (`handler.go:273-283`)。`subscriber.Updates()` でキャッシュ更新を受け、`filterIdentities` でこの呼び出し元に対応する identity だけ残し、`sendX509SVIDResponse` で証明書チェーンと秘密鍵をストリームへ書く。`ctx.Done()` で終了。つまり SVID がローテーションされるたび、開いたままの stream に push される (poll ではない)。

サーバ側の署名はこのフローの外で起きる。agent の SVID rotator がローカルで鍵ペアを生成し、CSR をサーバに送る (`pkg/agent/svid/rotator.go:43` の `RenewSVID(ctx, csr []byte)`)。サーバの CA は `pkg/server/ca/ca.go:335` の `SignWorkloadX509SVID` で、`params.PublicKey` だけを受け取りテンプレートを組んで署名し (`ca.go:341-353`)、`CredValidator.ValidateX509SVID` で SPIFFE ID を検証 (`ca.go:358`) してチェーンを返す。

## 中核データ構造

- `common.Selector` (`proto/spire/common/common.pb.go:118`): `Type` と `Value` の 2 文字列。attestation の単位 (例: `unix:uid:1000`, `k8s:ns:default`)。
- `common.RegistrationEntry` (`proto/spire/common/common.pb.go:339`): SPIRE のポリシーの中心。`Selectors`, `ParentId`, `SpiffeId`, `FederatesWith`, `EntryId`, `Admin`, `Downstream`, `DnsNames`, `RevisionNumber`, `StoreSvid`, `JwtSvidTtl`, `Hint` など。「この parent (ノード/中間) の下でこのセレクタ集合に一致するワークロードへ、この SPIFFE ID を発行する」という宣言。
- `cache.Identity` (`pkg/agent/manager/cache/workload.go:15`): `Entry *common.RegistrationEntry`, `SVID []*x509.Certificate`, `PrivateKey crypto.Signer`。発行済み 1 アイデンティティの実体。
- `cache.WorkloadUpdate` (`pkg/agent/manager/cache/workload.go:29`): `Identities []Identity`, `Bundle *spiffebundle.Bundle`, `FederatedBundles map[TrustDomain]*Bundle`。subscriber に渡すスナップショット。
- `cache.X509SVID` (`pkg/agent/manager/cache/workload.go:40`): `Chain []*x509.Certificate`, `PrivateKey crypto.Signer`。

## 非自明な設計判断

ワークロードは Workload API を呼ぶときに一切クレデンシャルを提示しない。アイデンティティは「カーネルが検証したプロセスのメタデータ」(UDS の `SO_PEERCRED` で取った PID、そこから導いた uid/gid/コンテナ ID など) だけから導出される。ブートストラップ用のシークレットが存在しないので、シークレットの配布・ローテーション問題そのものが消える。これが SPIFFE/SPIRE の核心の設計。

二点目: 秘密鍵がネットワークに出ない。agent (および store 経由のワークロード) がローカルで鍵ペアを生成し、CSR だけをサーバへ送る。サーバ CA は公開鍵を受け取って署名するだけ (`SignWorkloadX509SVID` は `params.PublicKey` のみ参照)。サーバが鍵を握らない。

三点目: 二要素 attestation。ノード attestation (agent がノードのプラットフォーム証跡で自身を証明) と workload attestation (プロセス属性) の二段で、エントリの `ParentId` がノード、`Selectors` がワークロードに対応する階層構造になっている。

## 採用事例の素材 (出典付き、捏造禁止)

`ADOPTERS.md` の End users (notable contributions ありと明記): Anthem, Bloomberg, ByteDance, Duke Energy, GitHub, Netflix, Niantic, Pinterest, Square, Twilio, Uber, Unity Technologies, Z Lab Corporation (`ADOPTERS.md:7-19`)。

公開ケーススタディ / トーク (`ADOPTERS.md:69-111`):

- AWS: App Mesh on EKS で SPIFFE/SPIRE による mTLS (<https://aws.amazon.com/blogs/containers/using-mtls-with-spiffe-spire-in-app-mesh-on-eks/>)
- Anthem: zero trust framework (<https://upshotstories.com/stories/developing-a-zero-trust-framework-at-anthem-using-spiffe-and-spire>)
- Anthropic: SPIRE 発行ワークロードを JWT-SVID + SPIRE OIDC Discovery Provider で Claude API に認証 (<https://platform.claude.com/docs/en/manage-claude/wif-providers/spiffe>)
- Bloomberg: TPM ノード attestation トーク (<https://youtu.be/30S0sKRxzjM>)
- Uber: workload scheduler との統合トーク (<https://youtu.be/H5IlmYmEDKk?t=4703>)
- Square: ハイブリッドインフラ / Lambda への mTLS アイデンティティ (<https://developer.squareup.com/blog/providing-mtls-identities-to-lambdas/>)

CNCF 公式の graduation アナウンスでも end user として Anthem, GitHub, Netflix, Niantic, Pinterest, Uber を名指し (<https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/>)。

## 採用シグナル (数値、2026-06-23 時点)

- GitHub stars: 2,407 / forks: 623 / watchers: 79 (`gh api repos/spiffe/spire`、2026-06-23)
- contributors: 222 (`gh api 'repos/spiffe/spire/contributors?per_page=1'` の last ページ番号、2026-06-23)
- repo 作成: 2017-08-11、最新リリース: `v1.15.1` (2026-05-28)

## 歴史の素材

- SPIFFE は元々コードのない「設計ドキュメント」として始まった。Joe Beda が約 10 年前に設計ドキュメントを書き GlueCon で発表 (<https://joe.dev/posts/10-years-of-spiffe/>)。
- Sunil James が Scytale を創業し CNCF に持ち込み、参照実装 SPIRE を Scytale が書いた (<https://thenewstack.io/sunil-james-ceo-of-scytale-explains-spiffe/>)。
- SPIFFE/SPIRE は 2017-12 に公開ローンチ、初の公開プレゼンは KubeCon NA 2017 (Evan Gilman, 2017-12-15)。CNCF sandbox 入りは 2018-03 (<https://scytale.io/opensource-spiffe/>)。
- 2019-02 に HPE が Scytale を買収、チームが founding contributor として合流 (<https://developer.hpe.com/blog/spiffe-spire-graduates-enabling-greater-security-solutions/>)。
- CNCF 受理 2018-03-29 → Incubating 2020-06-22 → Graduated 2022-08-22 (SPIRE)。公開アナウンス 2022-09-20。graduation 要件として Cure53 のサードパーティ監査と TAG Security レビューを通過 (<https://www.cncf.io/announcements/2022/09/20/spiffe-and-spire-projects-graduate-from-cloud-native-computing-foundation-incubator/>)。

## ガバナンス

CNCF Graduated プロジェクト。メンテナは `MAINTAINERS.md` で管理され、`CODEOWNERS` がレビュー担当を規定。コミッタープロセスと Apache-2.0 ライセンス、CII Best Practices Badge を graduation 要件として満たしている (CNCF アナウンス)。SPIFFE 仕様 (spec) は別リポジトリ `spiffe/spiffe` で、SPIRE はその実装という関係。

## 代替・エコシステム

統合先 (`ADOPTERS.md:41-67`): Envoy (SDS でSVID 配布), Istio, Linkerd, Consul, Dapr, cert-manager の `csi-driver-spiffe`, Sigstore Fulcio, Tekton Chains, HashiCorp Vault, Traefik, Tornjak (SPIRE 管理 UI), go-spiffe ライブラリ。SPIRE OIDC Discovery Provider は JWT-SVID を OIDC として外部 (クラウド IAM 等) に出す橋渡し。

代替と差:

- Istio の Citadel/istiod: SPIFFE ID を使うが独自 CA でメッシュ内に閉じる。SPIRE はメッシュ非依存・プラットフォーム横断で、VM/ベアメタル/Lambda まで対応。
- HashiCorp Vault PKI: 汎用シークレット/PKI。アイデンティティの「attestation」(誰が鍵を要求してよいかをプラットフォーム証跡で決める) が無い。SPIRE は attestation が中核。
- クラウドマネージド (AWS IAM Roles Anywhere, GCP Workload Identity): 単一クラウドに閉じる。SPIRE はマルチクラウド + オンプレを 1 つの信頼ドメイン/フェデレーションで統一。
- Teleport Machine ID, cert-manager 単体: 証明書発行はするが、SPIFFE の SVID/Workload API/federation の標準には準拠しない。

本質的な差: プラグイン式の多段 attestation (ノード + ワークロード)、X509-SVID と JWT-SVID の両方、信頼ドメイン間 federation、秘密ゼロのブートストラップ、ベンダ非依存の SPIFFE 標準準拠。

## インストールと最小構成

1. リリースの tarball を取得するか `make build` で `bin/spire-server` / `bin/spire-agent` をビルド (`Makefile:256`)。
2. サーバ設定 `conf/server/server.conf` を用意 (`trust_domain`, `data_dir`, plugins の `DataStore`/`KeyManager`/`NodeAttestor` 等)。`conf/server/server_full.conf` に全項目例あり。`spire-server run -config conf/server/server.conf` で起動。
3. agent をノード attestation で参加させる。最小は join token: `spire-server token generate -spiffeID spiffe://example.org/myagent` でトークン発行 → agent 設定 `conf/agent/agent.conf` を用意し `spire-agent run -config conf/agent/agent.conf -joinToken <token>`。
4. 登録エントリを作成。`spire-server entry create -parentID spiffe://example.org/myagent -spiffeID spiffe://example.org/myworkload -selector unix:uid:1000`。
5. ワークロードは agent の UDS (`/tmp/spire-agent/public/api.sock` 等) に対し Workload API を呼ぶ。`spire-agent api fetch x509 -socketPath ...` で動作確認。

詳細クイックスタートは `doc/` および <https://spiffe.io/docs/latest/try/getting-started-k8s/>。
