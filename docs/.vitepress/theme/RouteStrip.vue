<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, withBase } from 'vitepress'
import { tools } from '../tools'
import { lineOf, lineStyle, MATURITY_JA } from '../lines'
import { SECTIONS } from '../sections'
import StationMark from './StationMark.vue'

// The six sections of a deep-dive drawn as stops on the project's own line, with the
// current page marked. Rendered above every deep-dive page through the doc-before slot.
const props = defineProps<{ locale?: 'en' | 'ja' }>()
const ja = computed(() => props.locale === 'ja')
const prefix = computed(() => (ja.value ? '/ja' : ''))
const route = useRoute()


const here = computed(() => {
  const m = route.path.match(/\/tools\/([^/]+)\/?([^/.]*)/)
  if (!m) return null
  const tool = tools.find((t) => t.slug === m[1] && t.tier !== 'card')
  if (!tool) return null
  const idx = SECTIONS.findIndex((s) => s.key === m[2].replace(/\.html$/, '').replace(/^index$/, ''))
  return { tool, idx, line: lineOf(tool.category) }
})

// On a phone the strip scrolls sideways. Bring the current stop into view so the
// "you are here" marker is never off-screen (scrollLeft only: no vertical jump).
const strip = ref<HTMLOListElement | null>(null)
async function centreHere() {
  await nextTick()
  const ol = strip.value
  const li = ol?.querySelector<HTMLElement>('li.here')
  if (!ol || !li || ol.scrollWidth <= ol.clientWidth) return
  ol.scrollLeft = li.offsetLeft - (ol.clientWidth - li.offsetWidth) / 2
}
onMounted(centreHere)
watch(() => route.path, centreHere)
</script>

<template>
  <nav
    v-if="here"
    class="route ln"
    :style="lineStyle(here.tool.category)"
    :aria-label="ja ? `${here.tool.name} の各セクション` : `Sections of the ${here.tool.name} deep-dive`"
  >
    <p class="route-head">
      <span class="route-id">
        <span class="badge">{{ here.line.code }}</span>
        <a class="route-tool" :href="withBase(`${prefix}/tools/${here.tool.slug}/`)">{{ here.tool.name }}</a>
        <a class="route-line" :href="withBase(`${prefix}/tools/#${here.line.code.toLowerCase()}`)">
          {{ ja ? `${here.line.ja}線` : `${here.line.en} line` }}
        </a>
      </span>
      <span class="route-mat">
        <StationMark :m="here.tool.maturity" stub />
        {{ here.tool.maturity === 'Independent' ? (ja ? MATURITY_JA.Independent : 'Not in CNCF') : here.tool.maturity }}
      </span>
    </p>
    <ol ref="strip" class="route-stops">
      <li
        v-for="(s, i) in SECTIONS"
        :key="s.key"
        :class="{ past: i < here.idx, here: i === here.idx }"
      >
        <a
          :href="withBase(`${prefix}/tools/${here.tool.slug}/${s.key}`)"
          :aria-current="i === here.idx ? 'page' : undefined"
        >
          <span class="stop" aria-hidden="true" />
          <span class="t">{{ ja ? s.ja : s.en }}</span>
        </a>
      </li>
    </ol>
  </nav>
</template>
