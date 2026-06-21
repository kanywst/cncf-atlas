import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import { useData } from 'vitepress'
import type { Theme } from 'vitepress'
import ToolCatalog from './ToolCatalog.vue'
import './custom.css'

// Inject the catalog through layout slots instead of writing the component tag in
// markdown. Keeps the .md files plain (no inline-HTML lint) while staying app-like.
// Home page (layout: home) → after the feature grid.
// Catalog page (frontmatter `catalog: true`) → below the page intro.
export default {
  extends: DefaultTheme,
  Layout() {
    const { lang, frontmatter } = useData()
    const locale = lang.value.startsWith('ja') ? 'ja' : 'en'
    const catalog = () => h(ToolCatalog, { locale })
    const slots: Record<string, () => unknown> = {}
    if (frontmatter.value.layout === 'home') slots['home-features-after'] = catalog
    else if (frontmatter.value.catalog) slots['page-bottom'] = catalog
    return h(DefaultTheme.Layout, null, slots)
  },
} satisfies Theme
