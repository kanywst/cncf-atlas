<script setup lang="ts">
// Replaces the plugin's <Mermaid> component (registered under the same name in
// enhanceApp). Same props as the markdown transform emits; renders through the
// serial queue in mermaid-render.ts and re-renders only when the theme flips.
// Not carried over from the plugin: the per-page `mermaidTheme` frontmatter key and
// the re-render after embedded <img> loads. No page uses either.
import { onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
// Provided by vitepress-plugin-mermaid: the `mermaid` block of config.ts.
import settings from 'virtual:mermaid-config'
import { renderMermaid } from './mermaid-render'

const props = defineProps<{ graph: string; id: string; class?: string }>()
const { isDark } = useData()
const svg = ref('')
const failed = ref(false)
const source = decodeURIComponent(props.graph)

// Mermaid sizes the SVG to the column (width 100%, max-width = natural width), which
// shrinks a wide diagram's labels to a few pixels on a phone. A floor at 70% of the
// natural width (capped below the desktop column, so desktop never scrolls) keeps them
// legible; the wrapper scrolls sideways past that.
function withMinWidth(markup: string) {
  return markup.replace(
    /style="max-width: ([\d.]+)px;/,
    (m, w) => `${m} min-width: ${Math.round(Math.min(Number(w) * 0.7, 640))}px;`,
  )
}

async function draw() {
  const base = settings as { themeVariables?: Record<string, unknown> } & Record<string, unknown>
  const config: Record<string, unknown> = {
    ...base,
    themeVariables: { ...base.themeVariables, edgeLabelBackground: isDark.value ? '#14171b' : '#ffffff' },
  }
  if (isDark.value) config.theme = 'dark'
  try {
    svg.value = withMinWidth(await renderMermaid(source, config))
    failed.value = false
  } catch {
    failed.value = true
  }
}

onMounted(draw)
watch(isDark, draw)
</script>

<template>
  <div :class="props.class ?? 'mermaid'">
    <div v-if="!failed" v-html="svg" />
    <pre v-else class="mermaid-failed"><code>{{ source }}</code></pre>
  </div>
</template>
