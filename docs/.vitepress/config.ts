import { defineConfig, type DefaultTheme } from 'vitepress'
import { tools } from './tools'

// GitHub Pages project site is served from /<repo>/.
const base = '/cncf-atlas/'

const SECTIONS = [
  { key: '', en: 'Overview', ja: '概要' },
  { key: 'history', en: 'History', ja: '歴史' },
  { key: 'architecture', en: 'Architecture', ja: 'アーキテクチャ' },
  { key: 'adoption', en: 'Adoption & Ecosystem', ja: '採用事例・エコシステム' },
  { key: 'internals', en: 'Internals', ja: '内部実装' },
  { key: 'getting-started', en: 'Getting Started', ja: 'はじめに' },
]

function toolSidebar(prefix: string, lang: 'en' | 'ja'): DefaultTheme.SidebarItem[] {
  return tools.map((t) => ({
    text: t.name,
    collapsed: true,
    items: SECTIONS.map((s) => ({
      text: lang === 'ja' ? s.ja : s.en,
      link: `${prefix}/tools/${t.slug}/${s.key}`.replace(/\/$/, '/'),
    })),
  }))
}

function catalogLink(prefix: string, lang: 'en' | 'ja') {
  return [
    {
      text: lang === 'ja' ? 'カタログ' : 'Catalog',
      items: [{ text: lang === 'ja' ? 'すべてのツール' : 'All tools', link: `${prefix}/tools/` }],
    },
    ...toolSidebar(prefix, lang),
  ]
}

export default defineConfig({
  base,
  title: 'CNCF Atlas',
  description:
    'A readable map of the cloud native ecosystem: history, architecture, adoption, and code internals for every CNCF project.',
  cleanUrls: true,
  lastUpdated: true,
  metaChunk: true,
  head: [['link', { rel: 'icon', href: `${base}favicon.svg` }]],

  themeConfig: {
    logo: '/favicon.svg',
    search: { provider: 'local' },
    socialLinks: [{ icon: 'github', link: 'https://github.com/kanywst/cncf-atlas' }],
  },

  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Catalog', link: '/tools/' },
        ],
        sidebar: { '/tools/': catalogLink('', 'en') },
        outline: { label: 'On this page', level: [2, 3] },
      },
    },
    ja: {
      label: '日本語',
      lang: 'ja',
      link: '/ja/',
      themeConfig: {
        nav: [
          { text: 'ホーム', link: '/ja/' },
          { text: 'カタログ', link: '/ja/tools/' },
        ],
        sidebar: { '/ja/tools/': catalogLink('/ja', 'ja') },
        outline: { label: 'このページの内容', level: [2, 3] },
        docFooter: { prev: '前へ', next: '次へ' },
        lastUpdatedText: '最終更新',
      },
    },
  },
})
