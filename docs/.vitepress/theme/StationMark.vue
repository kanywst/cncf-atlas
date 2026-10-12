<script setup lang="ts">
// A station marker. The shape carries the CNCF maturity, so it reads without colour:
// Graduated is the big interchange ring, Incubating a smaller ring in the line colour,
// Sandbox a plain stop, and a non-CNCF project a square. `stub` draws a short piece of
// line behind it, for markers shown outside a line (legend, filters), since a sandbox
// stop only shows up against its line.
defineProps<{ m: string; stub?: boolean }>()
</script>

<template>
  <span v-if="stub" class="stub" aria-hidden="true"><i class="stn" :data-m="m" /></span>
  <i v-else class="stn" :data-m="m" aria-hidden="true" />
</template>
