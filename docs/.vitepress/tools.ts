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
]
