// Validates the catalog registry against the files on disk.
// Every entry in docs/.vitepress/tools.ts must have all six section pages in both
// locales, and its category must be a known one. Run in CI as the repo's "test".

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const toolsFile = resolve(root, 'docs/.vitepress/tools.ts')

const SECTIONS = ['index', 'history', 'architecture', 'adoption', 'internals', 'getting-started']

const src = readFileSync(toolsFile, 'utf8')

// Parse the CATEGORY_ORDER array and the active (non-commented) tool entries
// without importing TypeScript. Comment lines starting with // are ignored.
const code = src
  .split('\n')
  .filter((line) => !line.trim().startsWith('//'))
  .join('\n')

const categories = [...(code.match(/CATEGORY_ORDER[^=]*=\s*\[([^\]]*)\]/s)?.[1] ?? '').matchAll(/'([^']+)'/g)].map(
  (m) => m[1],
)

const entries = [...code.matchAll(/\{[^{}]*?slug:\s*'([^']+)'[^{}]*?category:\s*'([^']+)'[^{}]*?\}/gs)].map((m) => ({
  slug: m[1],
  category: m[2],
}))

const errors = []

if (categories.length === 0) errors.push('CATEGORY_ORDER could not be parsed from tools.ts')

for (const { slug, category } of entries) {
  if (!categories.includes(category)) {
    errors.push(`tool "${slug}": category "${category}" is not in CATEGORY_ORDER`)
  }
  for (const locale of ['', 'ja/']) {
    for (const section of SECTIONS) {
      const file = section === 'index' ? 'index.md' : `${section}.md`
      const rel = `docs/${locale}tools/${slug}/${file}`
      if (!existsSync(resolve(root, rel))) errors.push(`tool "${slug}": missing ${rel}`)
    }
  }
}

if (errors.length) {
  console.error(`check-tools: ${errors.length} problem(s) found`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

console.log(`check-tools: ${entries.length} tool(s) registered, all pages present, categories valid`)
