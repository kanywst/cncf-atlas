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
  'Observability',
  'Security & Compliance',
  'Identity & Policy',
  'Supply Chain',
  'Storage & Database',
  'Runtime',
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
]
