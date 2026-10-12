import { defineConfig, type DefaultTheme } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { tools } from './tools'
import { linesWithStations } from './lines'
import { SECTIONS } from './sections'

// GitHub Pages project site is served from /<repo>/.
const base = '/cncf-atlas/'

// Deep-dives in sidebar order (line by line, stations in line order). Prev/next links
// and search titles are derived from it.
const deepOrder = linesWithStations().flatMap((l) => l.stations.filter((t) => t.tier !== 'card'))
const deepBySlug = new Map(deepOrder.map((t, i) => [t.slug, { tool: t, i }]))

// tools/<slug>/<section>.md (optionally under ja/) -> the tool, its section, and locale.
function sectionPage(relativePath: string) {
  const m = relativePath.match(/^(ja\/)?tools\/([^/]+)\/([^/]+)\.md$/)
  if (!m) return null
  const hit = deepBySlug.get(m[2])
  const section = SECTIONS.find((s) => s.key === (m[3] === 'index' ? '' : m[3]))
  if (!hit || !section) return null
  return { ...hit, section, lang: (m[1] ? 'ja' : 'en') as 'en' | 'ja' }
}

// Card-tier entries have no pages, so they get no sidebar section. They are reachable
// from the catalog, which links them straight to their upstream repo. Deep-dives are
// grouped under their line, whose badge is plain HTML (VitePress renders sidebar
// text with v-html), coloured by the same custom properties the theme uses.
function toolSidebar(prefix: string, lang: 'en' | 'ja'): DefaultTheme.SidebarItem[] {
  return linesWithStations()
    .map(({ line, stations }) => ({ line, deep: stations.filter((t) => t.tier !== 'card') }))
    .filter(({ deep }) => deep.length)
    .map(({ line, deep }) => ({
      text:
        `<span class="sb-line ln" style="--line:${line.color};--line-dark:${line.dark ?? line.color}">` +
        `<span class="badge">${line.code}</span>${lang === 'ja' ? line.ja : line.en}</span>`,
      collapsed: true,
      items: deep.map((t) => ({
        text: t.name,
        collapsed: true,
        items: SECTIONS.map((s) => ({
          text: lang === 'ja' ? s.ja : s.en,
          link: `${prefix}/tools/${t.slug}/${s.key}`.replace(/\/$/, '/'),
        })),
      })),
    }))
}

function catalogLink(prefix: string, lang: 'en' | 'ja') {
  return [
    {
      text: lang === 'ja' ? 'カタログ' : 'Catalog',
      items: [{ text: lang === 'ja' ? 'すべてのプロジェクト' : 'All projects', link: `${prefix}/tools/` }],
    },
    ...toolSidebar(prefix, lang),
  ]
}

export default withMermaid(defineConfig({
  base,
  title: 'CNCF Atlas',
  description:
    'A readable map of the cloud native ecosystem: history, architecture, adoption, and code internals for every CNCF project.',
  cleanUrls: true,
  lastUpdated: true,
  metaChunk: true,
  head: [
    ['link', { rel: 'icon', href: `${base}favicon.svg` }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Overpass:ital,wght@0,400..800;1,400..600&family=Overpass+Mono:wght@400..600&family=BIZ+UDPGothic:wght@400;700&display=swap',
      },
    ],
  ],

  // Neutral is mermaid's ink-on-paper theme, which keeps diagrams out of the line colours.
  // theme/MermaidDiagram.vue switches to mermaid's dark theme when the page is dark.
  mermaid: {
    theme: 'neutral',
    themeVariables: { fontFamily: "Overpass, 'BIZ UDPGothic', sans-serif" },
  },

  // Section pages all have bare titles ("Architecture"), so tabs, history, and search
  // results could not tell projects apart. The tab title gets the project name, and the
  // footer link that leaves a project says which project it goes to.
  transformPageData(pageData) {
    const page = sectionPage(pageData.relativePath)
    if (!page) return
    const label = (s: (typeof SECTIONS)[number]) => (page.lang === 'ja' ? s.ja : s.en)
    if (page.section.key !== '') pageData.title = `${page.tool.name}: ${label(page.section)}`
    const prevTool = deepOrder[page.i - 1]
    const nextTool = deepOrder[page.i + 1]
    if (page.section.key === '' && prevTool && pageData.frontmatter.prev === undefined)
      pageData.frontmatter.prev = `${prevTool.name}: ${label(SECTIONS[SECTIONS.length - 1])}`
    if (page.section.key === 'getting-started' && nextTool && pageData.frontmatter.next === undefined)
      pageData.frontmatter.next = nextTool.name
  },

  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-dark.svg', alt: '' },
    search: {
      provider: 'local',
      options: {
        // Same reason as transformPageData: index section pages under
        // "<Project>: <Section>" so a result says which project it belongs to.
        _render(src, env, md) {
          const html = md.render(src, env)
          if (env.frontmatter?.search === false) return ''
          const page = sectionPage(env.relativePath)
          if (!page || page.section.key === '') return html
          return html.replace(/<h1([^>]*)>/, `<h1$1>${page.tool.name}: `)
        },
        locales: {
          ja: {
            translations: {
              button: { buttonText: '検索', buttonAriaLabel: '検索' },
              modal: {
                displayDetails: '詳細を表示',
                resetButtonTitle: '検索をリセット',
                backButtonTitle: '閉じる',
                noResultsText: '一致する結果はない',
                footer: { selectText: '開く', navigateText: '移動', closeText: '閉じる' },
              },
            },
          },
        },
      },
    },
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
        notFound: {
          title: 'This stop does not exist',
          quote: 'The page may have moved, or the link has a typo. Every project is listed in the catalog, and search covers every page.',
          linkLabel: 'Go to the home page',
          linkText: 'Back to the map',
        },
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
        sidebarMenuLabel: 'メニュー',
        returnToTopLabel: 'ページの先頭へ',
        darkModeSwitchLabel: '表示モード',
        lightModeSwitchTitle: 'ライトモードに切り替え',
        darkModeSwitchTitle: 'ダークモードに切り替え',
        langMenuLabel: '言語を切り替え',
        notFound: {
          title: 'この駅は存在しない',
          quote: 'ページが移動したか、リンクが間違っている。全プロジェクトはカタログにあり、検索は全ページを対象にしている。',
          linkLabel: 'ホームへ戻る',
          linkText: '路線図に戻る',
        },
      },
    },
  },
}))
