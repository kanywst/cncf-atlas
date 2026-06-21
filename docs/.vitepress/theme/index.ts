import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import { useData } from 'vitepress'
import type { Theme } from 'vitepress'
import ToolCatalog from './ToolCatalog.vue'
import Landing from './Landing.vue'
import './custom.css'

// Custom pages are rendered through layout slots rather than as component tags in
// markdown, so the .md files stay plain (no inline-HTML lint).
// `home: true`    -> the custom Landing replaces the page body.
// `catalog: true` -> the tool catalog renders below the page intro.
export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('ToolCatalog', ToolCatalog)
    app.component('Landing', Landing)
  },
  Layout() {
    const { lang, frontmatter } = useData()
    const locale = lang.value.startsWith('ja') ? 'ja' : 'en'
    const slots: Record<string, () => unknown> = {}
    if (frontmatter.value.home) slots['page-top'] = () => h(Landing, { locale })
    else if (frontmatter.value.catalog) slots['page-bottom'] = () => h(ToolCatalog, { locale })
    return h(DefaultTheme.Layout, null, slots)
  },
} satisfies Theme
