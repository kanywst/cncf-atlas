// Seeds one tracking issue per CNCF project into the repo, titled
//   [Maturity] Name · Category
// and labelled maturity/<level> + area/<category>. Idempotent: skips a project if an
// open or closed issue with the same title already exists. Creates/updates labels first.
//
// Usage:
//   node scripts/seed-cncf-issues.mjs [--repo owner/name] [--dry-run] [--limit N]
//
// Requires the gh CLI, authenticated. gh uses its own token, so this does not touch
// git commit identity.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const argv = process.argv.slice(2)
const DRY = argv.includes('--dry-run')
const repoIdx = argv.indexOf('--repo')
const REPO = repoIdx >= 0 ? argv[repoIdx + 1] : 'kanywst/cncf-atlas'
const limitIdx = argv.indexOf('--limit')
const LIMIT = limitIdx >= 0 ? Number(argv[limitIdx + 1]) : Infinity

const MATURITY = {
  graduated: { label: 'maturity/graduated', color: '2ea44f', display: 'Graduated' },
  incubating: { label: 'maturity/incubating', color: 'dbab09', display: 'Incubating' },
  sandbox: { label: 'maturity/sandbox', color: '8957e5', display: 'Sandbox' },
}

const data = JSON.parse(readFileSync(resolve(root, 'data/cncf-projects.json'), 'utf8'))

function categorySlug(category) {
  return (
    'area/' +
    category
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[()]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  )
}

function gh(args) {
  return execFileSync('gh', args, { encoding: 'utf8' })
}

function sleep(ms) {
  // Busy-free sleep via Atomics so we can throttle without async plumbing.
  const sab = new Int32Array(new SharedArrayBuffer(4))
  Atomics.wait(sab, 0, 0, ms)
}

// Build the flat work list.
const projects = []
for (const [key, meta] of Object.entries(MATURITY)) {
  for (const p of data[key] ?? []) {
    projects.push({
      name: p.name,
      category: p.category,
      maturityKey: key,
      maturityLabel: meta.label,
      maturityDisplay: meta.display,
      title: `[${meta.display}] ${p.name} · ${p.category}`,
      areaLabel: categorySlug(p.category),
    })
  }
}

// 1. Labels. Maturity labels, then one area label per distinct category.
const labels = new Map()
for (const meta of Object.values(MATURITY)) {
  labels.set(meta.label, { color: meta.color, desc: `CNCF maturity: ${meta.display}` })
}
for (const p of projects) {
  if (!labels.has(p.areaLabel)) labels.set(p.areaLabel, { color: '1d76db', desc: `CNCF area: ${p.category}` })
}
labels.set('deep-dive', { color: '0e8a16', desc: 'Tracking issue for a project deep-dive' })

console.log(`Repo: ${REPO}`)
console.log(`Projects: ${projects.length}  Labels: ${labels.size}  ${DRY ? '(dry-run)' : ''}`)

for (const [name, { color, desc }] of labels) {
  if (DRY) {
    console.log(`label: ${name} (#${color})`)
    continue
  }
  gh(['label', 'create', name, '--repo', REPO, '--color', color, '--description', desc, '--force'])
}

// 2. Existing titles, to stay idempotent.
let existing = new Set()
if (!DRY) {
  const json = gh(['issue', 'list', '--repo', REPO, '--state', 'all', '--limit', '1000', '--json', 'title'])
  existing = new Set(JSON.parse(json).map((i) => i.title))
}

// 3. Create issues.
let created = 0
let skipped = 0
for (const p of projects.slice(0, LIMIT)) {
  if (existing.has(p.title)) {
    skipped++
    continue
  }
  const body = [
    `Tracking issue for the **${p.name}** deep-dive.`,
    '',
    `- Maturity: ${p.maturityDisplay}`,
    `- Category: ${p.category}`,
    `- CNCF projects: https://www.cncf.io/projects/`,
    '',
    '## Checklist',
    '',
    '- [ ] recon (`atlas-recon`)',
    '- [ ] write English (`atlas-write`)',
    '- [ ] write Japanese',
    '- [ ] published to the catalog',
  ].join('\n')

  if (DRY) {
    console.log(`issue: ${p.title}  [${p.maturityLabel}, ${p.areaLabel}, deep-dive]`)
    created++
    continue
  }

  gh([
    'issue',
    'create',
    '--repo',
    REPO,
    '--title',
    p.title,
    '--body',
    body,
    '--label',
    p.maturityLabel,
    '--label',
    p.areaLabel,
    '--label',
    'deep-dive',
  ])
  created++
  if (created % 10 === 0) console.log(`  ...${created} created`)
  sleep(700)
}

console.log(`Done. created=${created} skipped=${skipped}`)
