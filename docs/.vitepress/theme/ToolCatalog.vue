<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { withBase } from 'vitepress'
import { tools, type Maturity } from '../tools'
import { linesWithStations, lineStyle, MATURITY_JA } from '../lines'
import StationMark from './StationMark.vue'

const props = defineProps<{ locale?: 'en' | 'ja' }>()
const ja = computed(() => props.locale === 'ja')
const prefix = computed(() => (ja.value ? '/ja' : ''))

const lines = linesWithStations()

type Tier = 'all' | 'deep' | 'card'
const q = ref('')
const picked = ref<Maturity[]>([])
const tier = ref<Tier>('all')

const MATURITIES: Maturity[] = ['Graduated', 'Incubating', 'Sandbox', 'Independent']

// Filter state lives in the query string so a filtered view can be linked to.
// Unknown values (a stale or hand-edited link) are dropped rather than applied.
function readQuery() {
  const p = new URLSearchParams(location.search)
  q.value = p.get('q') ?? ''
  picked.value = (p.get('m')?.split(',') ?? []).filter((m): m is Maturity => MATURITIES.includes(m as Maturity))
  const t = p.get('tier')
  tier.value = t === 'deep' || t === 'card' ? t : 'all'
}

// Links to /tools/#<line> land with the line heading under the sticky filter bar:
// the VitePress router scrolls by its own fixed offset and ignores scroll-margin.
// Scroll again once it is done, letting scroll-margin-top account for the bar.
function landOnHash() {
  const id = decodeURIComponent(location.hash.slice(1))
  if (!id) return
  requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView()))
}

// In-page jumps from the badge row. Going through the router would scroll by its fixed
// offset; scrollIntoView honours scroll-margin-top, which clears the sticky filters.
function jump(code: string) {
  const id = code.toLowerCase()
  history.replaceState(history.state, '', `${location.pathname}${location.search}#${id}`)
  document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

// Publish the sticky filter bar's height (0 where it is not sticky) so each line's
// scroll-margin-top clears it.
const root = ref<HTMLElement | null>(null)
const filtersEl = ref<HTMLElement | null>(null)
let ro: ResizeObserver | undefined
function measureFilters() {
  const f = filtersEl.value
  if (!f || !root.value) return
  const h = getComputedStyle(f).position === 'sticky' ? f.offsetHeight : 0
  root.value.style.setProperty('--filters-h', `${h}px`)
}

onMounted(() => {
  readQuery()
  measureFilters()
  ro = new ResizeObserver(measureFilters)
  if (filtersEl.value) ro.observe(filtersEl.value)
  window.addEventListener('resize', measureFilters)
  landOnHash()
  window.addEventListener('hashchange', landOnHash)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  window.removeEventListener('resize', measureFilters)
  window.removeEventListener('hashchange', landOnHash)
})
watch([q, picked, tier], () => {
  const p = new URLSearchParams()
  if (q.value.trim()) p.set('q', q.value.trim())
  if (picked.value.length) p.set('m', picked.value.join(','))
  if (tier.value !== 'all') p.set('tier', tier.value)
  const s = p.toString()
  history.replaceState(history.state, '', `${location.pathname}${s ? `?${s}` : ''}${location.hash}`)
}, { deep: true })

const needle = computed(() => q.value.trim().toLowerCase())
function matchesText(t: (typeof tools)[number]) {
  if (!needle.value) return true
  return [t.name, t.tagline, t.taglineJa].some((s) => s.toLowerCase().includes(needle.value))
}
function matchesTier(t: (typeof tools)[number]) {
  return tier.value === 'all' || (tier.value === 'card') === (t.tier === 'card')
}
function matchesMaturity(t: (typeof tools)[number]) {
  return !picked.value.length || picked.value.includes(t.maturity)
}

// Each facet counts what it would show given the other facets, the way a faceted
// index should: the numbers tell you what a click will leave on screen.
const maturityCounts = computed(() =>
  Object.fromEntries(MATURITIES.map((m) => [m, tools.filter((t) => t.maturity === m && matchesText(t) && matchesTier(t)).length])),
)
const tierCounts = computed(() => {
  const base = tools.filter((t) => matchesText(t) && matchesMaturity(t))
  return { all: base.length, deep: base.filter((t) => t.tier !== 'card').length, card: base.filter((t) => t.tier === 'card').length }
})

const shown = computed(() =>
  lines
    .map((l) => ({ ...l, stations: l.stations.filter((t) => matchesText(t) && matchesTier(t) && matchesMaturity(t)) }))
    .filter((l) => l.stations.length),
)
const total = computed(() => shown.value.reduce((n, l) => n + l.stations.length, 0))
const filtered = computed(() => Boolean(needle.value || picked.value.length || tier.value !== 'all'))

function toggle(m: Maturity) {
  picked.value = picked.value.includes(m) ? picked.value.filter((x) => x !== m) : [...picked.value, m]
}
function reset() {
  q.value = ''
  picked.value = []
  tier.value = 'all'
}

function href(t: (typeof tools)[number]) {
  return t.tier === 'card' ? t.repo! : withBase(`${prefix.value}/tools/${t.slug}/`)
}
function maturityLabel(m: Maturity) {
  if (m === 'Independent') return ja.value ? MATURITY_JA.Independent : 'Not in CNCF'
  return m
}

const c = computed(() =>
  ja.value
    ? {
        search: '名前や説明で絞り込む',
        maturity: '成熟度',
        tierLabel: '解説',
        all: 'すべて',
        deep: 'ディープダイブ',
        card: 'リポジトリのみ',
        showing: (n: number) => `${n} 件を表示`,
        reset: '絞り込みを解除',
        none: (s: string) => `「${s}」に一致するプロジェクトはない。`,
        noneBare: 'この条件に一致するプロジェクトはない。',
        repo: 'リポジトリ',
        jump: '路線へ移動',
      }
    : {
        search: 'Filter by name or description',
        maturity: 'Maturity',
        tierLabel: 'Write-up',
        all: 'All',
        deep: 'Deep-dive',
        card: 'Repository only',
        showing: (n: number) => `Showing ${n} ${n === 1 ? 'project' : 'projects'}`,
        reset: 'Clear filters',
        none: (s: string) => `No project matches “${s}”.`,
        noneBare: 'No project matches these filters.',
        repo: 'repository',
        jump: 'Jump to a line',
      },
)
</script>

<template>
  <div ref="root" class="cat">
    <div ref="filtersEl" class="cat-filters" role="search">
      <input
        v-model="q"
        class="cat-q"
        type="search"
        :placeholder="c.search"
        :aria-label="c.search"
        autocomplete="off"
        spellcheck="false"
      />
      <fieldset class="cat-facet">
        <legend>{{ c.maturity }}</legend>
        <button
          v-for="m in MATURITIES"
          :key="m"
          type="button"
          class="chip"
          :class="{ empty: !maturityCounts[m] }"
          :aria-pressed="picked.includes(m)"
          @click="toggle(m)"
        >
          <StationMark :m="m" stub />
          <span>{{ maturityLabel(m) }}</span>
          <span class="n">{{ maturityCounts[m] }}</span>
        </button>
      </fieldset>
      <fieldset class="cat-facet">
        <legend>{{ c.tierLabel }}</legend>
        <button
          v-for="k in (['all', 'deep', 'card'] as const)"
          :key="k"
          type="button"
          class="chip"
          :class="{ empty: !tierCounts[k] }"
          :aria-pressed="tier === k"
          @click="tier = k"
        >
          <span>{{ c[k] }}</span>
          <span class="n">{{ tierCounts[k] }}</span>
        </button>
      </fieldset>
      <p class="cat-status" aria-live="polite">
        {{ c.showing(total) }}
        <button v-if="filtered" type="button" class="cat-reset" @click="reset">{{ c.reset }}</button>
      </p>
    </div>

    <nav class="cat-jump" :aria-label="c.jump">
      <a
        v-for="l in lines"
        :key="l.category"
        class="ln"
        :class="{ off: !shown.some((x) => x.category === l.category) }"
        :style="lineStyle(l.category)"
        :href="`#${l.line.code.toLowerCase()}`"
        @click.prevent="jump(l.line.code)"
        :title="ja ? l.line.ja : l.line.en"
        :aria-label="ja ? l.line.ja : l.line.en"
      ><span class="badge">{{ l.line.code }}</span></a>
    </nav>

    <div v-if="shown.length" class="cat-lines">
      <section
        v-for="l in shown"
        :id="l.line.code.toLowerCase()"
        :key="l.category"
        class="cat-line ln"
        :style="lineStyle(l.category)"
      >
        <h2 class="cat-line-head">
          <span class="badge">{{ l.line.code }}</span>
          <span class="nm">{{ ja ? l.line.ja : l.line.en }}</span>
          <span class="n">{{ l.stations.length }}</span>
        </h2>
        <ol class="cat-stops">
          <li v-for="t in l.stations" :key="t.slug" :class="{ card: t.tier === 'card' }">
            <StationMark :m="t.maturity" />
            <a
              :href="href(t)"
              :target="t.tier === 'card' ? '_blank' : undefined"
              :rel="t.tier === 'card' ? 'noreferrer' : undefined"
            >
              <span class="nm">{{ t.name }}</span>
              <svg v-if="t.tier === 'card'" class="ext" viewBox="0 0 12 12" :aria-label="c.repo" role="img">
                <path d="M4.5 2.5h5v5M9.5 2.5 3 9" fill="none" stroke="currentColor" stroke-width="1.4" />
              </svg>
            </a>
            <span class="tag">{{ ja ? t.taglineJa : t.tagline }}</span>
            <span class="mat">{{ maturityLabel(t.maturity) }}</span>
          </li>
        </ol>
      </section>
    </div>
    <div v-else class="cat-empty">
      <p>{{ needle ? c.none(q.trim()) : c.noneBare }}</p>
      <button type="button" class="cat-reset" @click="reset">{{ c.reset }}</button>
    </div>
  </div>
</template>
