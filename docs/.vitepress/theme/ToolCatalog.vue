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
  return ordered.filter((c) => byCat.has(c)).map((c) => ({ category: c, items: byCat.get(c)! }))
})

function toCard(t: (typeof tools)[number]) {
  return {
    slug: t.slug,
    name: t.name,
    maturity: t.maturity,
    tagline: lang.value === 'ja' ? t.taglineJa : t.tagline,
    link: withBase(`${prefix.value}/tools/${t.slug}/`),
  }
}

const heading = computed(() => (lang.value === 'ja' ? 'カテゴリから探す' : 'Browse by category'))

const empty = computed(() =>
  lang.value === 'ja'
    ? 'まだツールがありません。oss-tech-recon → oss-tech-write で最初のディープダイブを生成してください。'
    : 'No tools yet. Run oss-tech-recon → oss-tech-write to generate the first deep-dive.',
)
</script>

<template>
  <section class="catalog-section">
    <h2 class="catalog-heading">{{ heading }}</h2>
    <template v-if="groups.length">
      <section v-for="g in groups" :key="g.category" class="catalog-group">
        <h3 class="catalog-group-title">{{ g.category }}</h3>
        <div class="catalog">
          <a v-for="t in g.items" :key="t.slug" class="catalog-card" :href="t.link">
            <span class="card-top">
              <span class="name">{{ t.name }}</span>
              <span class="maturity" :data-m="t.maturity">{{ t.maturity }}</span>
            </span>
            <span class="tagline">{{ t.tagline }}</span>
          </a>
        </div>
      </section>
    </template>
    <div v-else class="catalog-empty">{{ empty }}</div>
  </section>
</template>
