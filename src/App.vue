<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from './stores/project'

const route = useRoute()
const projectStore = useProjectStore()

const transitionName = computed(() => {
  return projectStore.navigationDirection === 'forward' ? 'page-left' : 'page-right'
})
</script>

<template>
  <RouterView v-slot="{ Component }">
    <Transition :name="transitionName" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>

<style>
.page-left-enter-active,
.page-left-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-left-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.page-left-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}

.page-right-enter-active,
.page-right-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-right-enter-from {
  opacity: 0;
  transform: translateX(-100%);
}

.page-right-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
