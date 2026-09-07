// Validates the catalog registry against the files on disk.
// Every tier "deep" entry in docs/.vitepress/tools.ts must have all six section pages
// in both locales; every tier "card" entry must have a repo URL and no pages at all.
// Categories must be known. Run in CI as the repo's "test".

import { readFileSync, existsSync, readdirSync } from 'node:fs'
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

const entries = [...code.matchAll(/\{[^{}]*?slug:\s*['"]([^'"]+)['"][^{}]*?category:\s*['"]([^'"]+)['"][^{}]*?\}/gs)].map((m) => ({
  slug: m[1],
  category: m[2],
  // Tier and repo are optional and can sit anywhere in the object literal, so read
  // them off the whole matched entry rather than pinning them to a field order.
  tier: m[0].match(/tier:\s*['"]([^'"]+)['"]/)?.[1] ?? 'deep',
  repo: m[0].match(/repo:\s*['"]([^'"]+)['"]/)?.[1] ?? null,
}))

const errors = []

if (categories.length === 0) errors.push('CATEGORY_ORDER could not be parsed from tools.ts')

const TIERS = ['deep', 'card']

for (const { slug, category, tier, repo } of entries) {
  if (!categories.includes(category)) {
    errors.push(`tool "${slug}": category "${category}" is not in CATEGORY_ORDER`)
  }
  if (!TIERS.includes(tier)) {
    errors.push(`tool "${slug}": tier "${tier}" is not one of ${TIERS.join(', ')}`)
  }

  // A card is a catalog row that links upstream, so the repo URL is the whole entry.
  // A deep-dive links to its own pages and must have all twelve of them.
  if (tier === 'card') {
    if (!repo) errors.push(`tool "${slug}": tier "card" needs a repo URL to link to`)
    const pages = ['', 'ja/']
      .map((locale) => `docs/${locale}tools/${slug}`)
      .filter((rel) => existsSync(resolve(root, rel)))
    if (pages.length) {
      errors.push(
        `tool "${slug}": tier "card" but ${pages.join(' and ')} exists; promote it to tier "deep" (and drop repo) or delete the pages`,
      )
    }
    continue
  }

  if (repo) errors.push(`tool "${slug}": tier "deep" links to its own pages, so the repo field is unused`)
  for (const locale of ['', 'ja/']) {
    for (const section of SECTIONS) {
      const file = section === 'index' ? 'index.md' : `${section}.md`
      const rel = `docs/${locale}tools/${slug}/${file}`
      if (!existsSync(resolve(root, rel))) errors.push(`tool "${slug}": missing ${rel}`)
    }
  }
}

// The check above only runs registry -> disk. A deep-dive written but never added to
// tools.ts passes it while being unreachable: no catalog card, no sidebar entry, no way
// in except by typing the URL. Nine of them accumulated before anyone noticed, so walk
// the other direction too.
const registered = new Set(entries.map((e) => e.slug))
for (const locale of ['', 'ja/']) {
  const dir = resolve(root, `docs/${locale}tools`)
  if (!existsSync(dir)) continue
  for (const slug of readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)) {
    if (!registered.has(slug)) {
      errors.push(`docs/${locale}tools/${slug}/ has pages but no entry in tools.ts, so it is unreachable`)
    }
  }
}

if (errors.length) {
  console.error(`check-tools: ${errors.length} problem(s) found`)
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}

const deep = entries.filter((e) => e.tier !== 'card').length
console.log(
  `check-tools: ${entries.length} tool(s) registered (${deep} deep-dive, ${entries.length - deep} card), ` +
    'all pages present and reachable, categories valid',
)
