// The site's colour language. Every catalog category is drawn as a transit line:
// one colour and one two-letter code, used everywhere the category appears (the
// home map, the catalog, the sidebar, the route strip on each deep-dive). Keys must
// match CATEGORY_ORDER in tools.ts. Kept out of tools.ts on purpose:
// scripts/check-tools.mjs parses that file with a regex and wants flat entries only.

import { CATEGORY_ORDER, tools, type ToolEntry, type Maturity } from './tools'

export interface Line {
  code: string
  en: string
  ja: string
  /** Line colour on a light ground. */
  color: string
  /** Optional lighter variant for the dark theme, when the base colour sinks into it. */
  dark?: string
}

export const LINES: Record<string, Line> = {
  'Orchestration & Scheduling': { code: 'OR', en: 'Orchestration & Scheduling', ja: 'オーケストレーション・スケジューリング', color: '#0079c2' },
  'App Definition & GitOps': { code: 'AD', en: 'App Definition & GitOps', ja: 'アプリ定義・GitOps', color: '#f39700' },
  'Provisioning & Infrastructure': { code: 'PI', en: 'Provisioning & Infrastructure', ja: 'プロビジョニング・インフラ', color: '#8fa3ad' },
  'Service Mesh & Networking': { code: 'SM', en: 'Service Mesh & Networking', ja: 'サービスメッシュ・ネットワーク', color: '#00a7db' },
  'API Gateway': { code: 'GW', en: 'API Gateway', ja: 'API ゲートウェイ', color: '#00a19c' },
  Observability: { code: 'OB', en: 'Observability', ja: 'オブザーバビリティ', color: '#e60012' },
  'Security & Compliance': { code: 'SC', en: 'Security & Compliance', ja: 'セキュリティ・コンプライアンス', color: '#009944' },
  'Identity & Policy': { code: 'ID', en: 'Identity & Policy', ja: 'アイデンティティ・ポリシー', color: '#b6007a', dark: '#e0429f' },
  'Supply Chain': { code: 'SU', en: 'Supply Chain', ja: 'サプライチェーン', color: '#bb641d' },
  'Storage & Database': { code: 'ST', en: 'Storage & Database', ja: 'ストレージ・データベース', color: '#1d2088', dark: '#6b70e0' },
  'Messaging & Streaming': { code: 'MS', en: 'Messaging & Streaming', ja: 'メッセージング・ストリーミング', color: '#e85298' },
  Runtime: { code: 'RT', en: 'Runtime', ja: 'ランタイム', color: '#6cbb5a' },
  WebAssembly: { code: 'WA', en: 'WebAssembly', ja: 'WebAssembly', color: '#654ff0', dark: '#8b7bff' },
  'AI & Machine Learning': { code: 'AI', en: 'AI & Machine Learning', ja: 'AI・機械学習', color: '#d7c447' },
  'Container Registry': { code: 'CR', en: 'Container Registry', ja: 'コンテナレジストリ', color: '#5e7c8c' },
  'Chaos Engineering': { code: 'CE', en: 'Chaos Engineering', ja: 'カオスエンジニアリング', color: '#8f8c2b' },
  'Developer Tools': { code: 'DT', en: 'Developer Tools', ja: '開発者ツール', color: '#9b7cb6' },
}

const FALLBACK: Line = { code: '??', en: 'Other', ja: 'その他', color: '#7a838c' }

export function lineOf(category: string): Line {
  return LINES[category] ?? { ...FALLBACK, en: category, ja: category }
}

/** CSS custom properties that colour one line. Spread onto a `style` binding. */
export function lineStyle(category: string): Record<string, string> {
  const l = lineOf(category)
  return { '--line': l.color, '--line-dark': l.dark ?? l.color }
}

// Stations along a line run from the most established project to the newest, so the
// big interchange markers bunch at the start the way trunk stations do on a real map.
const MATURITY_RANK: Record<Maturity, number> = { Graduated: 0, Incubating: 1, Independent: 2, Sandbox: 3, Archived: 4 }

export function byStationOrder(a: ToolEntry, b: ToolEntry) {
  return MATURITY_RANK[a.maturity] - MATURITY_RANK[b.maturity] || a.name.localeCompare(b.name)
}

export function linesWithStations() {
  const ordered = [...CATEGORY_ORDER, ...new Set(tools.map((t) => t.category).filter((c) => !CATEGORY_ORDER.includes(c)))]
  return ordered
    .map((category) => ({
      category,
      line: lineOf(category),
      stations: tools.filter((t) => t.category === category).sort(byStationOrder),
    }))
    .filter((l) => l.stations.length)
}

export const MATURITY_JA: Record<Maturity, string> = {
  Graduated: 'Graduated',
  Incubating: 'Incubating',
  Sandbox: 'Sandbox',
  Archived: 'Archived',
  Independent: 'CNCF 外',
}
