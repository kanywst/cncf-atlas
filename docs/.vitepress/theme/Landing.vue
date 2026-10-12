<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { withBase } from 'vitepress'
import { tools, type Maturity } from '../tools'
import { linesWithStations, lineStyle, lineOf, MATURITY_JA } from '../lines'
import { SECTIONS } from '../sections'
import StationMark from './StationMark.vue'

type Tool = (typeof tools)[number]

const props = defineProps<{ locale?: 'en' | 'ja' }>()
const ja = computed(() => props.locale === 'ja')
const prefix = computed(() => (ja.value ? '/ja' : ''))

const lines = linesWithStations()
const longest = Math.max(...lines.map((l) => l.stations.length))
const deepCount = tools.filter((t) => t.tier !== 'card').length

function href(t: Tool) {
  return t.tier === 'card' ? t.repo! : withBase(`${prefix.value}/tools/${t.slug}/`)
}
function catalogAnchor(code: string) {
  return withBase(`${prefix.value}/tools/#${code.toLowerCase()}`)
}
function maturityLabel(m: Maturity) {
  if (m === 'Independent') return ja.value ? MATURITY_JA.Independent : 'Not in CNCF'
  return m
}
function stopLabel(t: Tool) {
  const where =
    t.tier === 'card'
      ? ja.value ? 'リポジトリを新しいタブで開く' : 'opens its repository in a new tab'
      : ja.value ? 'ディープダイブ' : 'deep-dive'
  return `${t.name}, ${maturityLabel(t.maturity)}, ${where}`
}

// One tooltip for the whole map, positioned over whichever stop has hover or focus.
// It repeats what the link's aria-label already says, so it is hidden from assistive tech.
const mapEl = ref<HTMLElement | null>(null)
const tip = ref<null | { t: Tool; x: number; y: number; align: 'start' | 'center' | 'end'; below: boolean }>(null)
const activeLine = ref<string | null>(null)

function show(e: Event, t: Tool) {
  const host = mapEl.value
  if (!host) return
  const a = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const h = host.getBoundingClientRect()
  const x = a.left + a.width / 2 - h.left
  // Keep the card on screen: anchor it to whichever edge the stop is near, and drop
  // it below the stop on the first rows, where above would cover the legend.
  const align = x < 150 ? 'start' : x > h.width - 150 ? 'end' : 'center'
  const below = a.top - h.top < 190
  tip.value = { t, x, y: below ? a.bottom - h.top : a.top - h.top, align, below }
  activeLine.value = t.category
}
function hide() {
  tip.value = null
  activeLine.value = null
}

// Keyboard: each line is one tab stop, and the arrow keys move along it (left and
// right) or to the same position on the neighbouring line (up and down). Without
// this, reaching the section below the map meant tabbing through all 234 stops.
const cursor = ref<number[]>(lines.map(() => 0))
async function move(e: KeyboardEvent, li: number, j: number) {
  let nl = li
  let nj = j
  if (e.key === 'ArrowRight') nj = j + 1
  else if (e.key === 'ArrowLeft') nj = j - 1
  else if (e.key === 'Home') nj = 0
  else if (e.key === 'End') nj = lines[li].stations.length - 1
  else if (e.key === 'ArrowDown') nl = li + 1
  else if (e.key === 'ArrowUp') nl = li - 1
  else return
  e.preventDefault()
  if (nl < 0 || nl >= lines.length) return
  nj = Math.max(0, Math.min(nj, lines[nl].stations.length - 1))
  cursor.value[nl] = nj
  await nextTick()
  mapEl.value?.querySelector<HTMLElement>(`[data-stop="${nl}-${nj}"]`)?.focus()
}
function onFocus(e: Event, li: number, j: number, t: Tool) {
  cursor.value[li] = j
  show(e, t)
}

const kubernetes = tools.find((t) => t.slug === 'kubernetes')
const exampleStyle = kubernetes ? lineStyle(kubernetes.category) : {}

const c = computed(() =>
  ja.value
    ? {
        h1: ['CNCF の全プロジェクトが、', '何をして、', '中でどう動くのか。'],
        lede: `${tools.length} のプロジェクトを、役割ごとに ${lines.length} の路線に並べた。うち ${deepCount} 件には、上流のコードをコミット固定で読んだディープダイブがあり、主張にはすべて出典がつく。残りは一行の説明と、リポジトリへのリンク。`,
        browse: 'カタログを見る',
        start: 'Kubernetes から読む',
        mapLabel: 'CNCF プロジェクトの路線図',
        keyNote: '1 駅が 1 プロジェクトで、路線が長いほどプロジェクトが多い。駅を選ぶとディープダイブを、まだないものはリポジトリを開く。キーボードでは Tab で路線を選び、矢印キーで駅を移動する。',
        deep: 'ディープダイブ',
        repo: 'リポジトリを開く',
        routeH: 'ディープダイブは、いつも同じ 6 駅を通る',
        routeNote: 'どのプロジェクトでも順序は同じ。各ページの上部にこの帯があり、いまどこを読んでいるかが分かる。例は Kubernetes。',
      }
    : {
        h1: ['What every CNCF project does,', 'and how it works inside.'],
        lede: `${tools.length} projects on ${lines.length} lines, one line per role. ${deepCount} of them have a deep-dive read from the upstream code at a pinned commit, with every claim cited. The rest say what they are and link to their repository.`,
        browse: 'Browse the catalog',
        start: 'Start with Kubernetes',
        mapLabel: 'Map of CNCF projects',
        keyNote: 'One stop per project, so a longer line means a bigger category. Select a stop to open its deep-dive, or its repository if it has none yet. With a keyboard, Tab reaches each line and the arrow keys move along it.',
        deep: 'Deep-dive',
        repo: 'Opens repository',
        routeH: 'Every deep-dive makes the same six stops',
        routeNote: 'Same order for every project. Each page carries this strip at the top, so you can see where you are. Shown here for Kubernetes.',
      },
)

const maturities = computed(() =>
  (['Graduated', 'Incubating', 'Sandbox', 'Independent'] as const).map((m) => ({ m, label: maturityLabel(m) })),
)

const DESCRIPTIONS = {
  en: [
    'What it is, when to use it, the key facts.',
    'Where it came from and how it got here.',
    'The components, and how a request flows.',
    'Who runs it and the real alternatives, cited.',
    'The code paths that matter, read from source.',
    'Install it and get a first setup working.',
  ],
  ja: [
    '何で、いつ使うか。主要な事実。',
    'どこから来て、どうここまで来たか。',
    'コンポーネントと、リクエストの流れ。',
    '誰が運用しているか。代替は何か。出典つき。',
    'ソースから読んだ、要になるコードパス。',
    'インストールして最初の構成を動かす。',
  ],
}
const stops = computed(() =>
  SECTIONS.map((s, i) => ({
    key: s.key,
    t: ja.value ? s.ja : s.en,
    d: DESCRIPTIONS[ja.value ? 'ja' : 'en'][i],
  })),
)
</script>

<template>
  <div class="ah">
    <header class="ah-hero">
      <h1 class="ah-h1">
        <template v-for="(ph, i) in c.h1" :key="i"><span class="ph">{{ ph }}</span>{{ !ja && i < c.h1.length - 1 ? ' ' : '' }}</template>
      </h1>
      <p class="ah-lede">{{ c.lede }}</p>
      <div class="ah-actions">
        <a class="ah-btn primary" :href="withBase(`${prefix}/tools/`)">{{ c.browse }}</a>
        <a v-if="kubernetes" class="ah-btn" :href="withBase(`${prefix}/tools/kubernetes/`)">{{ c.start }}</a>
      </div>
    </header>

    <section ref="mapEl" class="ah-map" :aria-label="c.mapLabel" @mouseleave="hide">
      <div class="ah-key">
        <ul class="ah-key-marks">
          <li v-for="m in maturities" :key="m.m"><StationMark :m="m.m" stub /> {{ m.label }}</li>
        </ul>
        <p>{{ c.keyNote }}</p>
      </div>

      <ol class="ah-lines" :class="{ focusing: activeLine }" :style="{ '--max': longest }">
        <li
          v-for="(l, li) in lines"
          :key="l.category"
          class="ah-line ln"
          :class="{ active: activeLine === l.category }"
          :style="{ ...lineStyle(l.category), '--i': li, '--n': l.stations.length }"
        >
          <a class="ah-line-name" :href="catalogAnchor(l.line.code)">
            <span class="badge">{{ l.line.code }}</span>
            <span class="nm" :title="ja ? l.line.ja : l.line.en">{{ ja ? l.line.ja : l.line.en }}</span>
            <span class="ah-count-m">{{ l.stations.length }}</span>
          </a>
          <div class="ah-track">
            <span class="bar" aria-hidden="true" />
            <a
              v-for="(t, j) in l.stations"
              :key="t.slug"
              class="ah-stop"
              :data-stop="`${li}-${j}`"
              :tabindex="cursor[li] === j ? 0 : -1"
              :href="href(t)"
              :target="t.tier === 'card' ? '_blank' : undefined"
              :rel="t.tier === 'card' ? 'noreferrer' : undefined"
              :aria-label="stopLabel(t)"
              @mouseenter="show($event, t)"
              @mouseleave="hide"
              @focus="onFocus($event, li, j, t)"
              @blur="hide"
              @keydown="move($event, li, j)"
            >
              <StationMark :m="t.maturity" />
            </a>
            <span class="ah-count" aria-hidden="true">{{ l.stations.length }}</span>
          </div>
        </li>
      </ol>

      <div
        v-if="tip"
        class="ah-tip ln"
        :class="[`a-${tip.align}`, { below: tip.below }]"
        :style="{ left: `${tip.x}px`, top: `${tip.y}px`, ...lineStyle(tip.t.category) }"
        aria-hidden="true"
      >
        <span class="t-head">
          <span class="badge">{{ lineOf(tip.t.category).code }}</span>
          <strong>{{ tip.t.name }}</strong>
        </span>
        <span class="t-desc">{{ ja ? tip.t.taglineJa : tip.t.tagline }}</span>
        <span class="t-meta">
          {{ maturityLabel(tip.t.maturity) }}, {{ tip.t.tier === 'card' ? c.repo : c.deep }}
        </span>
      </div>
    </section>

    <section class="ah-route">
      <h2 class="ah-h2">{{ c.routeH }}</h2>
      <p class="ah-note">{{ c.routeNote }}</p>
      <ol class="ah-stops ln" :style="exampleStyle">
        <li v-for="s in stops" :key="s.key">
          <a :href="withBase(`${prefix}/tools/kubernetes/${s.key}`)">
            <span class="stop" aria-hidden="true" />
            <span class="t">{{ s.t }}</span>
            <span class="d">{{ s.d }}</span>
          </a>
        </li>
      </ol>
    </section>
  </div>
</template>
