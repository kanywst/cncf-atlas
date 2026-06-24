// Single source of truth for the tool catalog.
// The oss-tech-write skill appends one entry here per documented tool; the sidebar
// (config.ts) and the homepage catalog (ToolCatalog.vue) both read from it.
//
// Product premise: the CNCF landscape is a wall of logos with no context. This catalog
// is the readable map: every entry links to a real deep-dive, grouped and labelled.

export type Maturity = 'Graduated' | 'Incubating' | 'Sandbox' | 'Archived' | 'Independent'

export interface ToolEntry {
  /** URL slug; must match docs/tools/<slug> and docs/ja/tools/<slug>. */
  slug: string
  /** Display name, e.g. "Argo CD". */
  name: string
  /** One-line English tagline shown on the catalog card. */
  tagline: string
  /** One-line Japanese tagline shown on the catalog card. */
  taglineJa: string
  /** Category. Must be one of CATEGORY_ORDER below. */
  category: string
  /** CNCF maturity (or "Independent" for non-CNCF projects). */
  maturity: Maturity
}

// Catalog sections, in display order. Mirrors the CNCF landscape but trimmed to the
// categories this site actually covers. Add a category here before using it.
export const CATEGORY_ORDER: string[] = [
  'Orchestration & Scheduling',
  'App Definition & GitOps',
  'Service Mesh & Networking',
  'API Gateway',
  'Observability',
  'Security & Compliance',
  'Identity & Policy',
  'Supply Chain',
  'Storage & Database',
  'Messaging & Streaming',
  'Runtime',
  'Container Registry',
  'Chaos Engineering',
  'Developer Tools',
]

export const tools: ToolEntry[] = [
  {
    slug: 'authelia',
    name: 'Authelia',
    tagline: 'SSO and 2FA for your reverse proxy, plus an OpenID Connect provider',
    taglineJa: 'リバースプロキシ向けの SSO と 2FA、加えて OpenID Connect プロバイダ',
    category: 'Identity & Policy',
    maturity: 'Independent',
  },
  {
    slug: 'openfga',
    name: 'OpenFGA',
    tagline: 'Zanzibar-style fine-grained authorization from relationship tuples and a declarative model',
    taglineJa: 'Zanzibar 系のきめ細かい認可。関係タプルと宣言的モデルで判定する',
    category: 'Identity & Policy',
    maturity: 'Incubating',
  },
  {
    slug: 'spicedb',
    name: 'SpiceDB',
    tagline: 'A Zanzibar-inspired permissions database that answers checks by traversing a relationship graph',
    taglineJa: '関係グラフを辿って認可判定を返す Zanzibar 由来のパーミッション DB',
    category: 'Identity & Policy',
    maturity: 'Independent',
  },
  {
    slug: 'permify',
    name: 'Permify',
    tagline: 'A Zanzibar-style authorization engine backed by relation tuples in PostgreSQL',
    taglineJa: 'PostgreSQL のリレーションタプルに基づく Zanzibar 系の認可エンジン',
    category: 'Identity & Policy',
    maturity: 'Independent',
  },
  {
    slug: 'authentik',
    name: 'authentik',
    tagline: 'A self-hosted identity provider: SSO, OAuth2/OIDC, SAML, and LDAP with a visual flow editor',
    taglineJa: 'SSO・OIDC・SAML・LDAP をまとめ、ビジュアルフローエディタを持つセルフホスト IdP',
    category: 'Identity & Policy',
    maturity: 'Independent',
  },
  {
    slug: 'zitadel',
    name: 'ZITADEL',
    tagline: 'API-first, event-sourced identity platform with multi-tenancy built in',
    taglineJa: 'API ファースト・イベントソーシングで、初期からマルチテナントな ID 基盤',
    category: 'Identity & Policy',
    maturity: 'Independent',
  },
  {
    slug: 'oauth2-proxy',
    name: 'OAuth2 Proxy',
    tagline: 'A reverse proxy that puts OAuth2/OIDC login in front of a service that has none',
    taglineJa: '認証を持たないサービスの前段に OAuth2/OIDC ログインを置くリバースプロキシ',
    category: 'Identity & Policy',
    maturity: 'Sandbox',
  },
  {
    slug: 'in-toto',
    name: 'in-toto',
    tagline: 'Verifies every step of a software supply chain was done as planned by authorized parties',
    taglineJa: 'サプライチェーンの各ステップが計画通り・権限者により実行されたか検証する',
    category: 'Supply Chain',
    maturity: 'Graduated',
  },
  {
    slug: 'tuf',
    name: 'The Update Framework (TUF)',
    tagline: 'Secures software update systems so a compromised repo or key cannot push malicious updates',
    taglineJa: 'リポジトリや鍵が侵害されても悪意ある更新を送り込めないよう更新システムを保護する',
    category: 'Supply Chain',
    maturity: 'Graduated',
  },
  {
    slug: 'guac',
    name: 'GUAC',
    tagline: 'Aggregates software supply chain metadata into a queryable graph',
    taglineJa: 'ソフトウェアサプライチェーンのメタデータをクエリ可能なグラフに集約する',
    category: 'Supply Chain',
    maturity: 'Independent',
  },
  { slug: 'argo', name: 'Argo CD', tagline: 'Pull-based GitOps continuous delivery for Kubernetes, reconciling cluster state against Git.', taglineJa: 'Git とクラスタ状態を突き合わせる、Kubernetes 向けの pull 型 GitOps 継続デリバリ。', category: 'App Definition & GitOps', maturity: 'Graduated' },
  { slug: 'cert-manager', name: 'cert-manager', tagline: 'Issues and renews X.509 certificates from ACME, Vault, Venafi, and private CAs as native Kubernetes resources.', taglineJa: 'ACME・Vault・Venafi・プライベート CA から X.509 証明書を発行・更新し、Kubernetes ネイティブなリソースとして扱う。', category: 'Security & Compliance', maturity: 'Graduated' },
  { slug: 'cilium', name: 'Cilium', tagline: 'eBPF-based networking, security, and observability for Kubernetes, with policy written against workload identity.', taglineJa: 'Kubernetes 向けの eBPF ベースのネットワーキング・セキュリティ・可観測性。ポリシーはワークロードの identity に対して書く。', category: 'Service Mesh & Networking', maturity: 'Graduated' },
  { slug: 'cloudevents', name: 'CloudEvents', tagline: 'A vendor-neutral specification for event data, with SDKs that carry events across HTTP, Kafka, and MQTT.', taglineJa: 'イベントデータのベンダー中立な仕様。SDK が HTTP・Kafka・MQTT 越しにイベントを運ぶ。', category: 'App Definition & GitOps', maturity: 'Graduated' },
  { slug: 'containerd', name: 'containerd', tagline: 'An OCI-compliant container runtime daemon, the runtime layer beneath Kubernetes and Docker.', taglineJa: 'Kubernetes や Docker の下回りでコンテナを実行する OCI 準拠のコンテナランタイムデーモン。', category: 'Runtime', maturity: 'Graduated' },
  { slug: 'coredns', name: 'CoreDNS', tagline: 'A DNS server that resolves each query through a configured chain of plugins; the default Kubernetes cluster DNS.', taglineJa: 'クエリを設定済みプラグインの連鎖に通して解決する DNS サーバ。Kubernetes の既定クラスタ DNS。', category: 'Service Mesh & Networking', maturity: 'Graduated' },
  { slug: 'cri-o', name: 'CRI-O', tagline: 'A lightweight, Kubernetes-only Container Runtime Interface implementation for running OCI containers.', taglineJa: 'Kubernetes 専用に絞った軽量な Container Runtime Interface 実装。OCI コンテナを動かす。', category: 'Runtime', maturity: 'Graduated' },
  { slug: 'crossplane', name: 'Crossplane', tagline: 'A Kubernetes control-plane framework: define your own APIs and reconcile cloud and in-cluster resources.', taglineJa: '自前の API を定義し、クラウドおよびクラスタ内リソースを reconcile する Kubernetes コントロールプレーン基盤。', category: 'App Definition & GitOps', maturity: 'Graduated' },
  { slug: 'cubefs', name: 'CubeFS', tagline: 'A distributed file and object store that separates metadata from data, per-volume replication or erasure coding.', taglineJa: 'メタデータとデータを分離し、ボリュームごとに複製かイレイジャーコーディングを選べる分散ストレージ。', category: 'Storage & Database', maturity: 'Graduated' },
  { slug: 'dapr', name: 'Dapr', tagline: 'A sidecar runtime giving any app portable building-block APIs for state, pub/sub, invocation, and actors.', taglineJa: '状態・pub/sub・サービス呼び出し・actor のビルディングブロック API を提供するサイドカー型ランタイム。', category: 'App Definition & GitOps', maturity: 'Graduated' },
  { slug: 'dragonfly', name: 'Dragonfly', tagline: 'Peer-to-peer distribution of container images, files, and AI models across large clusters.', taglineJa: 'コンテナイメージ・ファイル・AI モデルを大規模クラスタ全体で P2P 配布する。', category: 'Runtime', maturity: 'Graduated' },
  { slug: 'envoy', name: 'Envoy', tagline: 'An out-of-process L4/L7 proxy and universal data plane for polyglot microservices.', taglineJa: 'ポリグロットなマイクロサービスのための、アウトオブプロセスな L4/L7 プロキシかつユニバーサルデータプレーン。', category: 'Service Mesh & Networking', maturity: 'Graduated' },
  { slug: 'etcd', name: 'etcd', tagline: 'A distributed key-value store that uses Raft to keep a small, critical dataset consistent across a cluster.', taglineJa: 'Raft で小さく重要なデータをクラスタ全体で一貫させる分散キーバリューストア。', category: 'Storage & Database', maturity: 'Graduated' },
  { slug: 'falco', name: 'Falco', tagline: 'A runtime security engine that watches Linux kernel events and alerts when activity matches a rule.', taglineJa: 'Linux カーネルイベントを監視し、ルール一致時にアラートするランタイムセキュリティエンジン。', category: 'Security & Compliance', maturity: 'Graduated' },
  { slug: 'fluentd', name: 'Fluentd', tagline: 'A unified logging layer that collects events, routes them by tag, buffers, and ships them to many destinations.', taglineJa: '入力からイベントを集め、タグでルーティングし、バッファして多様な出力へ送る統合ロギング層。', category: 'Observability', maturity: 'Graduated' },
  { slug: 'flux', name: 'Flux', tagline: 'A GitOps tool that keeps a Kubernetes cluster continuously reconciled with manifests stored in Git.', taglineJa: 'Git のマニフェストと Kubernetes クラスタを継続的に一致させ続ける GitOps ツール。', category: 'App Definition & GitOps', maturity: 'Graduated' },
  { slug: 'harbor', name: 'Harbor', tagline: 'An OCI registry that adds RBAC, vulnerability scanning, replication, and signature verification.', taglineJa: 'RBAC・脆弱性スキャン・レプリケーション・署名検証を加えた OCI レジストリ。', category: 'Supply Chain', maturity: 'Graduated' },
  { slug: 'helm', name: 'Helm', tagline: 'The package manager for Kubernetes: bundle, version, and install related resources as a chart.', taglineJa: 'Kubernetes のパッケージマネージャ。関連リソースをチャートとしてまとめ、管理しインストールする。', category: 'App Definition & GitOps', maturity: 'Graduated' },
  { slug: 'istio', name: 'Istio', tagline: 'A service mesh that puts a programmable proxy next to every workload, moving traffic, mTLS, and telemetry out of app code.', taglineJa: '各ワークロードの隣にプロキシを置き、トラフィック管理・mTLS・テレメトリをアプリ外に出すサービスメッシュ。', category: 'Service Mesh & Networking', maturity: 'Graduated' },
  { slug: 'jaeger', name: 'Jaeger', tagline: 'A distributed tracing platform; in v2 it ships as an OpenTelemetry Collector distribution.', taglineJa: '分散トレーシング基盤。v2 では OpenTelemetry Collector のディストリビューションとして提供される。', category: 'Observability', maturity: 'Graduated' },
  { slug: 'keda', name: 'KEDA', tagline: 'Event-driven autoscaling for Kubernetes, including scale-to-zero, by feeding external events into the HPA.', taglineJa: '外部イベントを HPA に橋渡しし、ゼロスケール込みの Kubernetes イベント駆動オートスケールを実現する。', category: 'Orchestration & Scheduling', maturity: 'Graduated' },
  { slug: 'knative', name: 'Knative', tagline: 'Runs containers as request-driven serverless workloads on Kubernetes, including scale to zero.', taglineJa: 'コンテナを Kubernetes 上でリクエスト駆動のサーバーレスとして動かし、ゼロスケールも行う。', category: 'Orchestration & Scheduling', maturity: 'Graduated' },
  { slug: 'kubeedge', name: 'KubeEdge', tagline: 'Extends a Kubernetes control plane to edge nodes and IoT devices over unreliable networks.', taglineJa: '信頼できないネットワーク越しに Kubernetes をエッジノードと IoT デバイスへ延伸する。', category: 'Orchestration & Scheduling', maturity: 'Graduated' },
  { slug: 'kubernetes', name: 'Kubernetes', tagline: 'Run containers across many machines by declaring desired state; controllers drive the cluster toward it.', taglineJa: '望ましい状態を宣言すると、コントローラがクラスタをそこへ収束させるコンテナ基盤。', category: 'Orchestration & Scheduling', maturity: 'Graduated' },
  { slug: 'kyverno', name: 'Kyverno', tagline: 'A Kubernetes admission engine where each policy is itself a Kubernetes resource written as YAML.', taglineJa: 'ポリシーそのものが Kubernetes リソースで、YAML として書ける admission エンジン。', category: 'Security & Compliance', maturity: 'Graduated' },
  { slug: 'linkerd', name: 'Linkerd', tagline: 'A Kubernetes service mesh adding mTLS, metrics, and reliability through a lightweight Rust sidecar proxy.', taglineJa: '軽量な Rust 製サイドカーで mTLS・メトリクス・信頼性を足す Kubernetes サービスメッシュ。', category: 'Service Mesh & Networking', maturity: 'Graduated' },
  { slug: 'open-policy-agent', name: 'Open Policy Agent (OPA)', tagline: 'A general-purpose policy engine that decouples authorization from app code, evaluated via the Rego language.', taglineJa: '認可をアプリコードから切り離し、Rego 言語で評価する汎用ポリシーエンジン。', category: 'Identity & Policy', maturity: 'Graduated' },
  { slug: 'opentelemetry', name: 'OpenTelemetry', tagline: 'A vendor-neutral standard and toolchain for generating, collecting, and exporting traces, metrics, and logs.', taglineJa: 'トレース・メトリクス・ログを生成・収集・転送するベンダー中立な標準とツールチェーン。', category: 'Observability', maturity: 'Graduated' },
  { slug: 'prometheus', name: 'Prometheus', tagline: 'Metrics-based monitoring that pulls time series over HTTP, stores them in a local TSDB, and queries with PromQL.', taglineJa: '時系列を HTTP で pull し、ローカル TSDB に保存し、PromQL でクエリするメトリクス監視。', category: 'Observability', maturity: 'Graduated' },
  { slug: 'rook', name: 'Rook', tagline: 'A Kubernetes operator that runs Ceph as declarative custom resources for block, file, and object storage.', taglineJa: 'Ceph を宣言的なカスタムリソースとして運用し、ブロック・ファイル・オブジェクトを提供する Kubernetes オペレータ。', category: 'Storage & Database', maturity: 'Graduated' },
  { slug: 'spiffe', name: 'SPIFFE', tagline: 'Standards for giving workloads a short-lived, cryptographically verifiable identity without pre-shared secrets.', taglineJa: '秘密の事前共有なしに、ワークロードへ短命で暗号学的に検証可能な ID を与える標準群。', category: 'Identity & Policy', maturity: 'Graduated' },
  { slug: 'spire', name: 'SPIRE', tagline: 'Issues short-lived, attested workload identities (X509-SVID and JWT-SVID); the SPIFFE reference implementation.', taglineJa: '短命で attest 済みのワークロード ID (X509-SVID/JWT-SVID) を発行する SPIFFE 参照実装。', category: 'Identity & Policy', maturity: 'Graduated' },
  { slug: 'vitess', name: 'Vitess', tagline: 'A clustering system that shards MySQL horizontally behind a single MySQL-compatible endpoint.', taglineJa: 'MySQL を水平シャーディングし、単一の MySQL 互換エンドポイントの裏に隠すクラスタリングシステム。', category: 'Storage & Database', maturity: 'Graduated' },
  { slug: 'tikv', name: 'TiKV', tagline: 'A distributed, transactional key-value database, the storage layer behind TiDB.', taglineJa: 'TiDB の下回りを担う分散トランザクショナル・キーバリューデータベース。', category: 'Storage & Database', maturity: 'Graduated' },
]
