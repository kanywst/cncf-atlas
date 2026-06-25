<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { tools } from '../tools'
import cncf from '../../../data/cncf-projects.json'

const props = defineProps<{ locale?: 'en' | 'ja' }>()
const lang = computed(() => props.locale ?? 'en')
const ja = computed(() => lang.value === 'ja')
const prefix = computed(() => (ja.value ? '/ja' : ''))

const totals = computed(() => ({
  graduated: cncf.graduated.length,
  incubating: cncf.incubating.length,
  sandbox: cncf.sandbox.length,
  total: cncf.graduated.length + cncf.incubating.length + cncf.sandbox.length,
}))

// Resolve a CNCF project name to a documented deep-dive slug, if one exists.
function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
const docBySlug = new Set(tools.map((t) => t.slug))
const docByName = new Map(tools.map((t) => [t.name, t.slug]))
function docSlug(name: string): string | null {
  const s = slugify(name)
  if (docBySlug.has(s)) return s
  return docByName.get(name) ?? null
}

const panels = computed(() => {
  type Tile = { name: string; m: 'g' | 'i' | 's'; link: string | null }
  const map = new Map<string, Tile[]>()
  const push = (cat: string, name: string, m: 'g' | 'i' | 's') => {
    if (!map.has(cat)) map.set(cat, [])
    const slug = docSlug(name)
    const link = slug ? withBase(`${prefix.value}/tools/${slug}/`) : null
    map.get(cat)!.push({ name, m, link })
  }
  cncf.graduated.forEach((p) => push(p.category, p.name, 'g'))
  cncf.incubating.forEach((p) => push(p.category, p.name, 'i'))
  cncf.sandbox.forEach((p) => push(p.category, p.name, 's'))
  return [...map.entries()]
    .map(([name, projects]) => ({ name, projects, total: projects.length }))
    .sort((a, b) => b.total - a.total)
})

const catCount = computed(() => panels.value.length)

const dives = computed(() =>
  tools.map((t) => ({
    name: t.name,
    maturity: t.maturity,
    desc: ja.value ? t.taglineJa : t.tagline,
    link: withBase(`${prefix.value}/tools/${t.slug}/`),
  })),
)

const t = computed(() =>
  ja.value
    ? {
        kicker: `${totals.value.total} プロジェクト · ${catCount.value} カテゴリ · CNCF`,
        h1a: 'クラウドネイティブの',
        h1accent: 'コントロールサーフェス',
        h1b: '。',
        lede: 'CNCF landscape は 200 を超えるプロジェクトをロゴの壁として並べる。CNCF Atlas は同じエコシステムを 1 枚の制御盤にする。役割ごとにまとめ、成熟度で色分けし、一つずつ実際に読んで書いた解説に繋ぐ。',
        ctaA: 'カタログを開く',
        ctaB: 'ディープダイブを読む',
        cProjects: 'projects',
        cGrad: 'graduated',
        cInc: 'incubating',
        cSand: 'sandbox',
        cDives: 'deep-dives',
        mEyebrow: '// THE MAP',
        mH2: 'エコシステム全体を、成熟度つきの制御盤で。',
        mNote: 'CNCF の全プロジェクトを役割でまとめ、左の帯で成熟度を示す。ロゴの壁ではなく、ヘルスボードとして読める。',
        dEyebrow: '// DEEP-DIVES',
        dH2: 'マーケティングページではなく、ソースから。',
        dNote: '各ディープダイブはピン留めしたコミットの上流コードを実際に読み、出典を添える。',
        sEyebrow: '// THE FORMAT',
        sH2: '6 セクション、同じ順序、毎回。',
        read: '読む →',
        steps: [
          ['01', 'Overview', '何で、いつ使い、主要な事実。'],
          ['02', 'History', 'どこから来て、どうここまで来たか。'],
          ['03', 'Architecture', 'コンポーネントとリクエストの流れ。'],
          ['04', 'Adoption', '誰が運用し、代替は何か（出典付き）。'],
          ['05', 'Internals', 'ソースから読んだ重要なコードパス。'],
          ['06', 'Getting Started', 'インストールして最初の構成を動かす。'],
        ],
      }
    : {
        kicker: `${totals.value.total} projects · ${catCount.value} categories · CNCF`,
        h1a: 'A control surface for the ',
        h1accent: 'cloud native',
        h1b: ' ecosystem.',
        lede: 'The CNCF landscape lists 200+ projects as a wall of logos. CNCF Atlas turns the same ecosystem into one console: grouped by role, coloured by maturity, and wired to deep-dives that actually read the code.',
        ctaA: 'Open the catalog',
        ctaB: 'Read a deep-dive',
        cProjects: 'projects',
        cGrad: 'graduated',
        cInc: 'incubating',
        cSand: 'sandbox',
        cDives: 'deep-dives',
        mEyebrow: '// THE MAP',
        mH2: 'The whole ecosystem, as a status board.',
        mNote: 'Every CNCF project grouped by what it does, with a maturity status bar down the left edge. A health board you can read, not a wall of logos.',
        dEyebrow: '// DEEP-DIVES',
        dH2: 'Read from the source, not the marketing page.',
        dNote: 'Each deep-dive reads the upstream code at a pinned commit and cites where every claim came from.',
        sEyebrow: '// THE FORMAT',
        sH2: 'Six sections. Same order. Every time.',
        read: 'Read →',
        steps: [
          ['01', 'Overview', 'What it is, when to use it, the key facts.'],
          ['02', 'History', 'Where it came from and how it got here.'],
          ['03', 'Architecture', 'The components and how a request flows.'],
          ['04', 'Adoption', 'Who runs it and the real alternatives, cited.'],
          ['05', 'Internals', 'The code paths that matter, from source.'],
          ['06', 'Getting Started', 'Install it and get a first setup working.'],
        ],
      },
)
</script>

<template>
  <div class="cp">
    <!-- Hero -->
    <header class="cp-hero">
      <div class="cp-hero-bg" aria-hidden="true" />
      <div class="cp-wrap cp-hero-inner">
        <p class="cp-kicker">{{ t.kicker }}</p>
        <h1 class="cp-h1">{{ t.h1a }}<span class="accent">{{ t.h1accent }}</span>{{ t.h1b }}</h1>
        <p class="cp-lede">{{ t.lede }}</p>
        <div class="cp-cta">
          <a class="cp-btn" :href="withBase(`${prefix}/tools/`)">{{ t.ctaA }}</a>
          <a v-if="dives.length" class="cp-btn ghost" :href="dives[0].link">{{ t.ctaB }}</a>
        </div>
      </div>
    </header>

    <div class="cp-wrap">
      <!-- Readout -->
      <div class="cp-readout" style="margin-top: clamp(28px, 5vw, 44px)">
        <div class="cell"><div class="n">{{ totals.total }}</div><div class="l">{{ t.cProjects }}</div></div>
        <div class="cell"><div class="n">{{ totals.graduated }}</div><div class="l">{{ t.cGrad }}</div></div>
        <div class="cell"><div class="n">{{ totals.incubating }}</div><div class="l">{{ t.cInc }}</div></div>
        <div class="cell"><div class="n">{{ totals.sandbox }}</div><div class="l">{{ t.cSand }}</div></div>
        <div class="cell"><div class="n">{{ dives.length }}</div><div class="l">{{ t.cDives }}</div></div>
      </div>

      <!-- The map -->
      <section class="cp-section" style="border-top: 1px solid var(--cp-border)">
        <p class="cp-eyebrow">{{ t.mEyebrow }}</p>
        <h2 class="cp-h2">{{ t.mH2 }}</h2>
        <p class="cp-note">{{ t.mNote }}</p>
        <div class="cp-legend">
          <span><i class="cp-swatch g" />{{ t.cGrad }}</span>
          <span><i class="cp-swatch i" />{{ t.cInc }}</span>
          <span><i class="cp-swatch s" />{{ t.cSand }}</span>
        </div>
        <div class="cp-panels">
          <div class="cp-panel" v-for="p in panels" :key="p.name">
            <div class="cp-panel-head">
              <span class="t">{{ p.name }}</span>
              <span class="c">{{ p.total }}</span>
            </div>
            <div class="cp-tiles">
              <component
                :is="proj.link ? 'a' : 'span'"
                v-for="proj in p.projects"
                :key="proj.name"
                class="cp-tile"
                :class="[proj.m, { todo: !proj.link }]"
                :href="proj.link || undefined"
              >
                <i class="dot" />
                <span class="nm">{{ proj.name }}</span>
                <span v-if="proj.link" class="cp-arrow">→</span>
              </component>
            </div>
          </div>
        </div>
      </section>

      <!-- Deep-dives -->
      <section class="cp-section" v-if="dives.length">
        <p class="cp-eyebrow">{{ t.dEyebrow }}</p>
        <h2 class="cp-h2">{{ t.dH2 }}</h2>
        <p class="cp-note">{{ t.dNote }}</p>
        <div class="cp-dives">
          <a class="cp-dive" v-for="d in dives" :key="d.name" :href="d.link">
            <div class="top">
              <span class="nm">{{ d.name }}</span>
              <span class="cp-badge" :data-m="d.maturity">{{ d.maturity }}</span>
            </div>
            <span class="desc">{{ d.desc }}</span>
            <span class="go">{{ t.read }}</span>
          </a>
        </div>
      </section>

      <!-- Format -->
      <section class="cp-section" style="border-bottom: none">
        <p class="cp-eyebrow">{{ t.sEyebrow }}</p>
        <h2 class="cp-h2">{{ t.sH2 }}</h2>
        <div class="cp-steps">
          <div class="cp-step" v-for="s in t.steps" :key="s[0]">
            <div class="num">{{ s[0] }}</div>
            <div class="t">{{ s[1] }}</div>
            <div class="d">{{ s[2] }}</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
