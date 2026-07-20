<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from './stores/project'

const route = useRoute()
const projectStore = useProjectStore()

const transitionName = computed(() => {
  return projectStore.navigationDirection === 'forward' ? 'page-up' : 'page-down'
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
.page-up-enter-active,
.page-up-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-up-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.page-up-leave-to {
  opacity: 0;
  transform: translateY(-100%);
}

.page-down-enter-active,
.page-down-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.page-down-enter-from {
  opacity: 0;
  transform: translateY(-100%);
}

.page-down-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>