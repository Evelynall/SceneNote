<script setup lang="ts">
import { computed } from 'vue'
import type { Marker } from '../types'
import MarkerCard from './MarkerCard.vue'

const props = defineProps<{
  markers: Marker[]
}>()

/** 按影片内时间排序；创建先后只作为同一秒 Marker 的稳定次序。 */
const sortedMarkers = computed(() => {
  return [...props.markers].sort((first, second) => first.time - second.time || first.createdAt - second.createdAt)
})
</script>

<template>
  <section class="timeline" aria-label="Marker 时间轴">
    <p v-if="sortedMarkers.length === 0" class="empty">还没有记录。回到观看页，捕捉第一个瞬间吧。</p>
    <ol v-else class="marker-list">
      <li v-for="marker in sortedMarkers" :key="marker.id">
        <MarkerCard :marker="marker" />
      </li>
    </ol>
  </section>
</template>

<style scoped>
.timeline {
  width: 100%;
}

.empty {
  margin: 0;
  padding: 32px 0;
  color: #a7a7a7;
  text-align: center;
  line-height: 1.6;
}

.marker-list {
  position: relative;
  display: grid;
  gap: 4px;
  margin: 0;
  padding: 0 0 0 26px;
  list-style: none;
}

.marker-list::before {
  position: absolute;
  top: 7px;
  bottom: 30px;
  left: 5px;
  width: 2px;
  background: #343434;
  content: '';
}
</style>
