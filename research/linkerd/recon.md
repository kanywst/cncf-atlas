# recon: linkerd

調査メモ。自分用の密度。出典は URL と `path:line` を必ず添える。

## 基本情報

- repo: `linkerd/linkerd2` (主実装。コントロールプレーン + CLI)
- データプレーンは別リポ: `linkerd/linkerd2-proxy` (Rust 製マイクロプロキシ) [6]
- pinned commit: `7977d505fc3d9ae7dddddd11779a82f813e405ac` / 近いタグ: `edge-26.6.3`
- 言語: Go (control plane + CLI) と Rust (`policy-controller/`、データプレーンの proxy)
- ビルド: Go modules (`go 1.25.11`、`go.mod:3`)、`bin/` シェルスクリプト群 + Docker (`bin/docker-build`)、Rust 部分は cargo (`policy-controller/Cargo.toml`)
- ライセンス: Apache-2.0 (`LICENSE:1` で確認。`policy-controller/Cargo.toml:5` も `license = "Apache-2.0"`)
- CNCF 成熟度: Graduated (2017-01-23 受理、2018-04-06 Incubating、2021-07-28 Graduated) [1][3]
- カテゴリ (このバケット): Service Mesh & Networking
- 主エントリポイント: CLI は `cli/main.go`、コントロールプレーンは `controller/cmd/main.go` が argv でサブコマンドを分岐 (`controller/cmd/main.go:22-33`)

## 歴史の素材

- 2015 から 2016 に Buoyant (William Morgan、Oliver Gould) が開発。Twitter などを支えた Finagle (Scala/JVM) を下敷きにした最初期のサービスメッシュで、この用語自体を業界に持ち込んだ [4][13]
- 2017-01 に CNCF へ参加。Kubernetes、Prometheus、OpenTracing、Fluentd に続く 5 番目のホストプロジェクト [4]
- 1.x は JVM ベースで重かった。2018 に Linkerd 2.x として全面書き直し。データプレーンを Rust のマイクロプロキシ (`linkerd2-proxy`) に置き換え、CNCF プロジェクトとして初めて Rust を採用 [1][6]
- 2021-07-28 に CNCF Graduated。サービスメッシュとして史上初の卒業 [1][2]
- 2022 に CNCF が「2021 年に欧州・北米で Istio を上回る 118% 成長」と報告 [9]
- 2024 にサードパーティのセキュリティ監査を実施 (2025-02 公開) [10]
- 2024 に CNCF TAG Contributor Strategy がガバナンスレビューを実施しベンダー中立性を確認 [11]

## アーキテクチャの素材

トップレベルのコンポーネント (リポジトリのディレクトリ実体に対応):

- `cli/` : `linkerd` CLI 本体 (install / inject / check など)。`cli/main.go`
- `controller/` : Go 製コントロールプレーン。サブコマンドを `controller/cmd/main.go:22-33` で分岐
  - `destination` : サービスディスカバリの gRPC サーバ。proxy へエンドポイントと ServiceProfile を流す (`controller/api/destination/server.go:142` `Get`、`:307` `GetProfile`)
  - `identity` : mTLS の CA。proxy の CSR を受けて短命リーフ証明書を発行 (`pkg/identity/service.go:212` `Certify`)
  - `proxy-injector` : Pod 作成時に sidecar を注入する mutating admission webhook (`controller/proxy-injector/webhook.go:31`)
  - `sp-validator` : ServiceProfile の validating webhook
  - `heartbeat` / `service-mirror` (multicluster)
- `policy-controller/` : Rust 製。サーバ側認可ポリシー (Server や ServerAuthorization など) を CRD から解決し proxy に配信。`policy-controller/Cargo.toml`、配下に `core/grpc/k8s/runtime/src`
- `proxy-identity/` : データプレーン側で identity サービスと CSR をやり取りするヘルパ
- `viz/` : 可観測性拡張 (Prometheus メトリクス、tap、ダッシュボード)
- `multicluster/` : クラスタ跨ぎのサービスミラーリング
- `web/` : ダッシュボード
- `charts/` : Helm チャート群。コントロールプレーン、CRD、そして注入用パッチチャートを含む (後述の設計判断)
- `proto/` : gRPC の protobuf 定義

データプレーンの実体 (各 Pod の sidecar `linkerd-proxy`) はこのリポには無く、`linkerd/linkerd2-proxy` (Rust) でビルドされる [6]。Envoy ではなく自前のマイクロプロキシなのが Linkerd の核。

## 内部実装の素材

### 代表的コア操作: Pod へのプロキシ注入 (mutating admission webhook) を端から端まで

1. webhook サーバが admission リクエストを受ける。ボディは 10MB 上限で読み、`processReq` に渡す。`controller/webhook/server.go:124` (`serve`)、`server.go:142`
2. `processReq` が `AdmissionReview` をデコードし、Request の UID を検証してから登録済みハンドラを呼ぶ。`controller/webhook/server.go:160-171`
3. ハンドラ実体は `Inject`。まず ConfigMap マウントから Helm Values を読み (`pkgK8s.MountPathValuesConfig`)、信頼アンカー PEM を読み込んで `IdentityTrustAnchorsPEM` に詰める。`controller/proxy-injector/webhook.go:43-52`
4. `inject.NewResourceConfig(...)` を組み、`ParseMetaAndYAML(request.Object.Raw)` で対象ワークロードをパースして注入レポートを作る。`controller/proxy-injector/webhook.go:58-64`
5. `report.Injectable()` で注入可否を判定。可なら `created-by` アノテーション付与、namespace アノテーションの継承、opaque ports のデフォルト補完を行う。`controller/proxy-injector/webhook.go:102-123`
6. パッチ生成は `resourceConfig.GetPodPatch(true, overrider)`。`controller/proxy-injector/webhook.go:125`
7. `GetPodPatch` が overrider で最終 Values を確定し、`podPatch` を構築、`injectObjectMeta` と `injectPodSpec` を呼んで proxy / proxy-init コンテナ分を組み立てる。`pkg/inject/inject.go:770-807`
8. その `podPatch` を YAML 化し、Helm の埋め込み FS から `patch` チャート (`templates/patch.json`) をレンダリングして JSON Patch を得る。`pkg/inject/inject.go:814-831`
9. レンダリング結果の不正な末尾カンマを正規表現で除去して返す。`pkg/inject/inject.go:834`
10. ハンドラは `PatchType: JSONPatch` の `AdmissionResponse` を返す。`controller/proxy-injector/webhook.go:143-149`。`processReq` がそれを `AdmissionReview.Response` に詰めて JSON で応答。`controller/webhook/server.go:183`

### mTLS ブートストラップ (identity)

proxy は起動時に ServiceAccount トークンと CSR を `Certify` に送る。`pkg/identity/service.go:212`。サーバは CSR の妥当性 (`checkCSR`、`:234`)、トークンを Kubernetes TokenReview で検証 (`svc.validator.Validate`、`:241`)、要求 identity とトークンの identity 一致を確認 (`:260`) してから `issuer.IssueEndEntityCrt(csr)` で短命リーフ証明書を発行する (`:269`)。これで sidecar 間 mTLS が成立する。

### 中核データ構造

- `ResourceConfig` (`pkg/inject/inject.go:120`): 注入処理の中心。Helm `values`、namespace、nsAnnotations、対象 workload (`obj/metaType/Meta/ownerRef`)、pod (`meta/labels/annotations/spec`) を保持
- `podPatch` (`pkg/inject/inject.go:156`): `l5dcharts.Values` を埋め込み、加えて `PathPrefix` と `AddRoot*` フラグを持つ。patch チャートのレンダリング入力
- `Report` (`pkg/inject/report.go:57`): 注入レポート。`Injectable()` が可否と不可の理由を返す
- `l5dcharts.Values`: install チャートと注入の両方を駆動する単一の Values 構造
- identity `Service` (`pkg/identity/service.go`): issuer、validator、issuerMutex を持つ CA サービス

### 非自明な設計判断

注入パッチを手書きの JSON Patch で組まず、`install` と同じ Helm チャート (`patch` チャートの `templates/patch.json`) を実行時にレンダリングして作る (`pkg/inject/inject.go:814-828`)。インストール時のテンプレートと実行時の sidecar 注入が同一のテンプレート経路と同一の Values 型を共有する。代償として、テンプレートが吐く JSON の末尾カンマを正規表現 `rTrail` で事後修正している (`pkg/inject/inject.go:834`)。テンプレートエンジンに JSON Patch を吐かせる選択の副作用。

## 採用事例の素材

出典付きのみ。`ADOPTERS.md` (リポ内) [8] と公式 adopters ページ [7] が一次情報。

- リポ `ADOPTERS.md` 記載例: Adidas、AT&T、Bosch Thermotechnology、Clover Health、Docker、Expedia、HP Inc、Buoyant ほか多数 (`ADOPTERS.md:3-40`) [8]
- 公式 adopters / ケーススタディ [7]: loveholidays、Xbox Cloud Gaming、Adidas、DB Schenker AG、Penn State、Entain、Elkjop、finleap connect、Nordstrom、Paybase、Subspace、Salt Security
- Imagine Learning のケーススタディ (InfoQ、2025-09): コンピュート要件 80% 超削減、サービスメッシュ関連 CVE を 2024 年に 97% 削減と報告 [14]
- H-E-B (Justin Turner) が卒業時のリファレンスとして CNCF アナウンスに登場 [1]

数値 (2026-06-22 時点、`linkerd/linkerd2` リポ): GitHub stars 11,421、forks 1,354、open issues 214、2017-12-04 作成、主言語 Go [5]。contributors はおよそ 377 (GitHub contributors API のページネーション末尾)。

## 代替・エコシステム

- Istio: 最大手。データプレーンは Envoy (C++) sidecar。近年は ambient mode (ztunnel + waypoint) で sidecar 廃止に動く。機能は最も豊富だが運用が重い [12]
- Cilium (Service Mesh): eBPF でカーネル内処理。多くのケースで sidecar 不要。L7 では node ごとに Envoy [12]
- Consul (Connect)、Kuma / Kong Mesh: 他の選択肢
- Linkerd の本質的な差: Envoy ではなく用途特化の Rust マイクロプロキシ (`linkerd2-proxy`) を使い、軽量・低レイテンシ・メモリ安全を狙う。デフォルト mTLS、CLI 主導の単純な運用、小さなコードベース [12][13]
- 統合: Kubernetes Gateway API、Prometheus / Grafana (viz)、Helm、Flux / Argo (GitOps デプロイ)。商用は Buoyant Enterprise for Linkerd と Buoyant Cloud
- セキュリティ: 2024 年に第三者監査を実施し結果を公開 [10]

## インストール最小構成

CLI 導入後の最短経路 (コマンドは `linkerd ...`):

```bash
linkerd install --crds | kubectl apply -f -
linkerd install | kubectl apply -f -
linkerd check
kubectl get deploy <app> -o yaml | linkerd inject - | kubectl apply -f -
```

Helm でも導入可能 (`linkerd-crds` と `linkerd-control-plane` チャート)。CLI は `run.linkerd.io/install` のスクリプトで入れるのが公式手順。

## 出典リンク

[1]: https://www.cncf.io/announcements/2021/07/28/cloud-native-computing-foundation-announces-linkerd-graduation/
[2]: https://linkerd.io/2021/07/28/announcing-cncf-graduation/
[3]: https://www.cncf.io/projects/linkerd/
[4]: https://linkerd.io/2017/01/24/linkerd-joins-the-cloud-native-computing-foundation/
[5]: https://github.com/linkerd/linkerd2
[6]: https://github.com/linkerd/linkerd2-proxy
[7]: https://linkerd.io/community/adopters/
[8]: https://github.com/linkerd/linkerd2/blob/main/ADOPTERS.md
[9]: https://www.cncf.io/blog/2022/03/04/linkerd-surpasses-istio-adoption-in-europe-and-north-america-with-118-growth-in-2021/
[10]: https://linkerd.io/2025/02/18/linkerd-2024-security-audit/
[11]: https://github.com/cncf/tag-contributor-strategy/issues/648
[12]: https://www.buoyant.io/linkerd-vs-istio
[13]: https://linkerd.io/what-is-a-service-mesh/
[14]: https://www.infoq.com/news/2025/09/linkerd-cost-savings/
