// The six sections of every deep-dive, in reading order, with the one label each
// gets everywhere it is shown (sidebar, route strip, home page, page titles).
// `key` is the URL segment: '' is the Overview at /tools/<slug>/.
// scripts/check-tools.mjs keeps its own copy of the file names (index, history, ...),
// because it reads files on disk and never imports TypeScript.

export const SECTIONS = [
  { key: '', en: 'Overview', ja: '概要' },
  { key: 'history', en: 'History', ja: '歴史' },
  { key: 'architecture', en: 'Architecture', ja: 'アーキテクチャ' },
  { key: 'adoption', en: 'Adoption', ja: '採用事例' },
  { key: 'internals', en: 'Internals', ja: '内部実装' },
  { key: 'getting-started', en: 'Getting started', ja: 'はじめに' },
] as const

export type SectionKey = (typeof SECTIONS)[number]['key']
