<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkerButton from '../components/MarkerButton.vue'
import ProjectHeader from '../components/ProjectHeader.vue'
import SwipeGesture from '../components/SwipeGesture.vue'
import Timer from '../components/Timer.vue'
import { useProjectStore } from '../stores/project'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const isLoading = ref(true)
const projectId = computed(() => String(route.params.projectId))

/** 根据路由项目 id 加载数据；无效 id 自动返回首页。 */
async function loadProject(): Promise<void> {
  isLoading.value = true

  try {
    const project = await projectStore.openProject(projectId.value)

    if (!project) {
      await router.replace({ name: 'home' })
    }
  } finally {
    isLoading.value = false
  }
}

/** 向左滑动：跳转到时间轴页面（时间轴在观看页面右侧）。 */
async function handleSwipeLeft(): Promise<void> {
  projectStore.setNavigationDirection('forward')
  await router.push({ name: 'timeline', params: { projectId: projectId.value } })
}

/** 向右滑动：跳转到项目管理页面（项目管理在观看页面左侧）。 */
async function handleSwipeRight(): Promise<void> {
  projectStore.saveLastProjectId()
  projectStore.setNavigationDirection('backward')
  await router.push({ name: 'projects' })
}

onMounted(() => {
  void loadProject()
})

watch(projectId, () => {
  void loadProject()
})
</script>

<template>
  <SwipeGesture @swipe-left="handleSwipeLeft" @swipe-right="handleSwipeRight">
    <main class="page">
      <p v-if="isLoading" class="status">正在载入项目…</p>
      <template v-else-if="projectStore.currentProject">
        <div class="header-row">
        <ProjectHeader :project="projectStore.currentProject" @update:title="projectStore.updateProjectTitle" />
        <button type="button" class="back-to-projects" @click="handleSwipeRight">项目列表</button>
      </div>
      <Timer />
      <MarkerButton />
      <button type="button" class="timeline-link" @click="handleSwipeLeft">
        查看时间轴（{{ projectStore.currentProject.markers.length }}）
      </button>
      </template>
    </main>
  </SwipeGesture>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: calc(32px + env(safe-area-inset-top)) 24px calc(32px + env(safe-area-inset-bottom));
  gap: 28px;
}

.header-row {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.back-to-projects {
  flex: none;
  padding-top: 4px;
  border: none;
  color: #f5c451;
  background: none;
  font-size: 0.9rem;
  cursor: pointer;
}

.status {
  margin: auto 0;
  color: #a7a7a7;
  text-align: center;
}

.timeline-link {
  margin-top: auto;
  border: none;
  color: #cfcfcf;
  background: none;
  font-size: 0.9rem;
  text-align: center;
  cursor: pointer;
}
</style>
