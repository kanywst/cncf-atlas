<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { tools } from '../tools'
import cncf from '../../../data/cncf-projects.json'

const props = defineProps<{ locale?: 'en' | 'ja' }>()
const lang = computed(() => props.locale ?? 'en')
const ja = computed(() => lang.value === 'ja')
const prefix = computed(() => (ja.value ? '/ja' : ''))

const maturities = [
  { key: 'graduated', cls: 'g' },
  { key: 'incubating', cls: 'i' },
  { key: 'sandbox', cls: 's' },
] as const

const totals = computed(() => ({
  graduated: cncf.graduated.length,
  incubating: cncf.incubating.length,
  sandbox: cncf.sandbox.length,
  total: cncf.graduated.length + cncf.incubating.length + cncf.sandbox.length,
}))

const categories = computed(() => {
  const map = new Map<string, { g: number; i: number; s: number; total: number }>()
  const add = (name: string, k: 'g' | 'i' | 's') => {
    const e = map.get(name) ?? { g: 0, i: 0, s: 0, total: 0 }
    e[k]++
    e.total++
    map.set(name, e)
  }
  cncf.graduated.forEach((p) => add(p.category, 'g'))
  cncf.incubating.forEach((p) => add(p.category, 'i'))
  cncf.sandbox.forEach((p) => add(p.category, 's'))
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.total - a.total)
})

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
        eyebrow: 'クラウドネイティブ・フィールドガイド',
        h1a: 'クラウドネイティブを、',
        h1em: '読める地図',
        h1b: 'に。',
        lede: 'CNCF landscape は 200 を超えるプロジェクトをグリッド上のロゴとして並べる。CNCF Atlas は一つずつ読んで書き留める。何で、どう動き、誰が運用し、コードがどう組み上がっているか。',
        ctaA: 'カタログを開く',
        ctaB: 'ディープダイブを読む',
        cProjects: 'プロジェクト',
        cGrad: 'Graduated',
        cInc: 'Incubating',
        cSand: 'Sandbox',
        cDives: 'ディープダイブ',
        pKicker: '課題',
        pH2: 'ロゴの壁は地図ではない。',
        pNote: 'landscape はプロジェクトが存在することは教えてくれる。何で、なぜ重要かは教えてくれない。Atlas はその空白を埋める。',
        pOld: '今日の landscape',
        pNew: 'Atlas の索引',
        mKicker: '地図',
        mH2: 'すべてのカテゴリ、すべてのプロジェクト、成熟度つき。',
        mNote: 'CNCF の全プロジェクトを役割でまとめ、成熟度で色分け。1000 個のアイコンではなく、エコシステムの形が見える。',
        dKicker: 'ディープダイブ',
        dH2: 'マーケティングページではなく、ソースから書く。',
        dNote: '各ディープダイブはピン留めしたコミットの上流コードを実際に読み、出典を添える。',
        sKicker: '得られるもの',
        sH2: '6 セクション、同じ順序、毎回。',
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
        eyebrow: 'Cloud Native · Field Guide',
        h1a: 'The cloud native ecosystem, ',
        h1em: 'made legible',
        h1b: '.',
        lede: 'The CNCF landscape lists 200+ projects as logos in a grid. CNCF Atlas reads each one and writes it down: what it is, how it works, who runs it, and how the code fits together.',
        ctaA: 'Open the catalog',
        ctaB: 'Read a deep-dive',
        cProjects: 'projects',
        cGrad: 'graduated',
        cInc: 'incubating',
        cSand: 'sandbox',
        cDives: 'deep-dives',
        pKicker: 'The problem',
        pH2: 'A wall of logos is not a map.',
        pNote: 'The landscape tells you a project exists. It does not tell you what it is or why it matters. Atlas fills that gap.',
        pOld: "Today's landscape",
        pNew: 'The Atlas index',
        mKicker: 'The map',
        mH2: 'Every category, every project, by maturity.',
        mNote: 'All of CNCF grouped by what each project does and coloured by maturity. The shape of the ecosystem, not a thousand icons.',
        dKicker: 'Deep-dives',
        dH2: 'Written from the source, not the marketing page.',
        dNote: 'Each deep-dive reads the upstream code at a pinned commit and cites where every claim came from.',
        sKicker: 'What you get',
        sH2: 'Six sections. Same order. Every time.',
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

const demoRows = computed(() =>
  ja.value
    ? [
        ['Cilium', 'eBPF のネットワーク & セキュリティ'],
        ['Istio', 'サービスメッシュ'],
        ['Falco', 'ランタイム脅威検知'],
      ]
    : [
        ['Cilium', 'eBPF networking & security'],
        ['Istio', 'service mesh'],
        ['Falco', 'runtime threat detection'],
      ],
)
</script>

<template>
  <div class="atlas">
    <!-- Hero -->
    <header class="atlas-hero">
      <svg class="atlas-contours" viewBox="0 0 1200 520" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M-50 420 C 200 360 320 300 520 320 S 920 420 1260 340" stroke="currentColor" stroke-width="1" />
        <path d="M-50 470 C 220 410 360 350 560 372 S 940 470 1260 392" stroke="currentColor" stroke-width="1" />
        <path d="M-50 360 C 180 310 300 250 500 268 S 900 360 1260 286" stroke="currentColor" stroke-width="1" />
        <path d="M-50 300 C 160 258 280 206 480 222 S 880 300 1260 232" stroke="currentColor" stroke-width="1" />
        <path d="M-50 240 C 150 206 270 162 470 176 S 860 240 1260 184" stroke="currentColor" stroke-width="1" />
      </svg>
      <p class="atlas-eyebrow">{{ t.eyebrow }}</p>
      <h1 class="atlas-h1">{{ t.h1a }}<em>{{ t.h1em }}</em>{{ t.h1b }}</h1>
      <p class="atlas-lede">{{ t.lede }}</p>
      <div class="atlas-cta">
        <a class="atlas-btn" :href="withBase(`${prefix}/tools/`)">{{ t.ctaA }}</a>
        <a v-if="dives.length" class="atlas-btn ghost" :href="dives[0].link">{{ t.ctaB }}</a>
      </div>
      <div class="atlas-coords">
        <div class="atlas-coord"><div class="n">{{ totals.total }}</div><div class="l">{{ t.cProjects }}</div></div>
        <div class="atlas-coord"><div class="n">{{ totals.graduated }}</div><div class="l">{{ t.cGrad }}</div></div>
        <div class="atlas-coord"><div class="n">{{ totals.incubating }}</div><div class="l">{{ t.cInc }}</div></div>
        <div class="atlas-coord"><div class="n">{{ totals.sandbox }}</div><div class="l">{{ t.cSand }}</div></div>
        <div class="atlas-coord"><div class="n">{{ dives.length }}</div><div class="l">{{ t.cDives }}</div></div>
      </div>
    </header>

    <!-- Problem -->
    <section class="atlas-section">
      <p class="atlas-kicker">{{ t.pKicker }}</p>
      <h2 class="atlas-h2">{{ t.pH2 }}</h2>
      <p class="atlas-note">{{ t.pNote }}</p>
      <div class="atlas-split">
        <div>
          <div class="atlas-logowall">
            <span v-for="i in 40" :key="i" />
          </div>
          <p class="atlas-note" style="font-size: 13px">{{ t.pOld }}</p>
        </div>
        <div>
          <div class="atlas-index-demo">
            <div class="row" v-for="r in demoRows" :key="r[0]">
              <span><strong>{{ r[0] }}</strong></span>
              <span class="k">{{ r[1] }}</span>
            </div>
          </div>
          <p class="atlas-note" style="font-size: 13px">{{ t.pNew }}</p>
        </div>
      </div>
    </section>

    <!-- The map -->
    <section class="atlas-section">
      <p class="atlas-kicker">{{ t.mKicker }}</p>
      <h2 class="atlas-h2">{{ t.mH2 }}</h2>
      <p class="atlas-note">{{ t.mNote }}</p>
      <div class="atlas-legend">
        <span><i class="atlas-dot g" />{{ t.cGrad }}</span>
        <span><i class="atlas-dot i" />{{ t.cInc }}</span>
        <span><i class="atlas-dot s" />{{ t.cSand }}</span>
      </div>
      <div class="atlas-map">
        <div class="atlas-cat" v-for="c in categories" :key="c.name">
          <div class="atlas-cat-top">
            <span class="atlas-cat-name">{{ c.name }}</span>
            <span class="atlas-cat-count">{{ c.total }}</span>
          </div>
          <div class="atlas-dots">
            <i v-for="n in c.g" :key="'g' + n" class="atlas-dot g" />
            <i v-for="n in c.i" :key="'i' + n" class="atlas-dot i" />
            <i v-for="n in c.s" :key="'s' + n" class="atlas-dot s" />
          </div>
        </div>
      </div>
    </section>

    <!-- Deep-dives -->
    <section class="atlas-section" v-if="dives.length">
      <p class="atlas-kicker">{{ t.dKicker }}</p>
      <h2 class="atlas-h2">{{ t.dH2 }}</h2>
      <p class="atlas-note">{{ t.dNote }}</p>
      <div class="atlas-dives">
        <a class="atlas-dive" v-for="d in dives" :key="d.name" :href="d.link">
          <div class="top">
            <span class="name">{{ d.name }}</span>
            <span class="maturity" :data-m="d.maturity">{{ d.maturity }}</span>
          </div>
          <span class="desc">{{ d.desc }}</span>
          <span class="go">{{ ja ? '読む →' : 'Read →' }}</span>
        </a>
      </div>
    </section>

    <!-- Six sections -->
    <section class="atlas-section" style="border-bottom: none">
      <p class="atlas-kicker">{{ t.sKicker }}</p>
      <h2 class="atlas-h2">{{ t.sH2 }}</h2>
      <div class="atlas-steps">
        <div class="atlas-step" v-for="s in t.steps" :key="s[0]">
          <div class="num">{{ s[0] }}</div>
          <div class="t">{{ s[1] }}</div>
          <div class="d">{{ s[2] }}</div>
        </div>
      </div>
    </section>
  </div>
</template>
