<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { tools, CATEGORY_ORDER } from '../tools'

const props = defineProps<{ locale?: 'en' | 'ja' }>()
const lang = computed(() => props.locale ?? 'en')
const prefix = computed(() => (lang.value === 'ja' ? '/ja' : ''))

const groups = computed(() => {
  const byCat = new Map<string, ReturnType<typeof toCard>[]>()
  for (const t of tools) {
    const card = toCard(t)
    if (!byCat.has(t.category)) byCat.set(t.category, [])
    byCat.get(t.category)!.push(card)
  }
  const ordered = [...CATEGORY_ORDER, ...[...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c))]
  return ordered
    .filter((c) => byCat.has(c))
    .map((c) => {
      // Deep-dives lead each category; cards follow, alphabetically so the long tail
      // is scannable. Registry order is meaningless once there are a hundred of them.
      const items = byCat.get(c)!
      return {
        category: c,
        items: [...items.filter((i) => !i.card), ...items.filter((i) => i.card).sort((a, b) => a.name.localeCompare(b.name))],
      }
    })
})

function toCard(t: (typeof tools)[number]) {
  const card = t.tier === 'card'
  return {
    slug: t.slug,
    name: t.name,
    maturity: t.maturity,
    card,
    tagline: lang.value === 'ja' ? t.taglineJa : t.tagline,
    // A deep-dive links to its own pages; a card has none, so it links upstream.
    link: card ? t.repo! : withBase(`${prefix.value}/tools/${t.slug}/`),
  }
}

const heading = computed(() => (lang.value === 'ja' ? 'カテゴリから探す' : 'Browse by category'))

const legend = computed(() =>
  lang.value === 'ja'
    ? 'ディープダイブがあるプロジェクトはサイト内の解説に、ないものは上流リポジトリに直接リンクします。'
    : 'Projects with a deep-dive link to it. The rest link straight to their upstream repository.',
)

const repoLabel = computed(() => (lang.value === 'ja' ? 'リポジトリ' : 'repo'))

const empty = computed(() =>
  lang.value === 'ja'
    ? 'まだツールがありません。atlas-recon → atlas-write で最初のディープダイブを生成してください。'
    : 'No tools yet. Run atlas-recon → atlas-write to generate the first deep-dive.',
)
</script>

<template>
  <section class="catalog-section">
    <h2 class="catalog-heading">{{ heading }}</h2>
    <p class="catalog-legend">{{ legend }}</p>
    <template v-if="groups.length">
      <section v-for="g in groups" :key="g.category" class="catalog-group">
        <h3 class="catalog-group-title">{{ g.category }}</h3>
        <div class="catalog">
          <a
            v-for="t in g.items"
            :key="t.slug"
            class="catalog-card"
            :class="{ 'is-card': t.card }"
            :href="t.link"
            :target="t.card ? '_blank' : undefined"
            :rel="t.card ? 'noreferrer' : undefined"
          >
            <span class="card-top">
              <span class="name">{{ t.name }}</span>
              <span class="maturity" :data-m="t.maturity">{{ t.maturity }}</span>
            </span>
            <span class="tagline">{{ t.tagline }}</span>
            <span v-if="t.card" class="card-repo">{{ repoLabel }} ↗</span>
          </a>
        </div>
      </section>
    </template>
    <div v-else class="catalog-empty">{{ empty }}</div>
  </section>
</template>
