<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project'
import SwipeGesture from '../components/SwipeGesture.vue'
import { confirm } from '../components/dialog'
import { downloadProjectsJson, parseProjectsJson } from '../utils/json'

const router = useRouter()
const projectStore = useProjectStore()
const title = ref('')
const errorMessage = ref('')
const isCreating = ref(false)
const deletingId = ref('')
const deleteError = ref('')

const fileInput = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const isExporting = ref(false)
const fileMessage = ref('')

onMounted(async () => {
  await projectStore.initialize()

  if (projectStore.projects.length === 0) {
    await router.replace({ name: 'home' })
  }
})

async function createProject(): Promise<void> {
  if (isCreating.value) {
    return
  }

  errorMessage.value = ''
  isCreating.value = true

  try {
    await projectStore.initialize()
    const project = await projectStore.createProject(title.value)
    projectStore.setNavigationDirection('forward')
    await router.push({ name: 'watch', params: { projectId: project.id } })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '创建项目失败，请重试。'
  } finally {
    isCreating.value = false
  }
}

async function openProject(projectId: string): Promise<void> {
  projectStore.setNavigationDirection('forward')
  await projectStore.openProject(projectId)
  await router.push({ name: 'watch', params: { projectId } })
}

/** 向上滑动：返回上次观看的项目（观看页面在项目管理下方，所以向上滑动是进入）。 */
async function handleSwipeUp(): Promise<void> {
  const lastId = projectStore.lastProjectId

  if (!lastId) {
    return
  }

  projectStore.setNavigationDirection('forward')
  await projectStore.openProject(lastId)
  await router.push({ name: 'watch', params: { projectId: lastId } })
}

/** 删除项目，使用 confirm 防止误操作。 */
async function deleteProject(projectId: string, projectTitle: string): Promise<void> {
  if (deletingId.value) {
    return
  }

  const confirmed = await confirm(`确定要删除《${projectTitle}》吗？此操作不可恢复。`, '删除项目')

  if (!confirmed) {
    return
  }

  deletingId.value = projectId
  deleteError.value = ''

  try {
    await projectStore.deleteProject(projectId)

    if (projectStore.projects.length === 0) {
      await router.replace({ name: 'home' })
    }
  } catch (error) {
    deleteError.value = error instanceof Error ? error.message : '删除项目失败，请重试。'
  } finally {
    deletingId.value = ''
  }
}

/** 下载所有项目的批量 JSON 文件。 */
async function exportAllProjects(): Promise<void> {
  if (isExporting.value) {
    return
  }

  isExporting.value = true
  fileMessage.value = ''

  try {
    downloadProjectsJson(projectStore.projects, projectStore.tags)
    fileMessage.value = `已导出 ${projectStore.projects.length} 个项目。`
  } catch (error) {
    fileMessage.value = error instanceof Error ? error.message : '导出失败，请重试。'
  } finally {
    isExporting.value = false
  }
}

/** 打开系统文件选择器。 */
function chooseImportFile(): void {
  fileMessage.value = ''
  fileInput.value?.click()
}

/** 读取并批量导入项目文件。 */
async function importProjects(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file || isImporting.value) {
    return
  }

  isImporting.value = true
  fileMessage.value = ''

  try {
    const { projects, tags } = parseProjectsJson(await file.text())
    const importedCount = await projectStore.importProjects(projects)
    for (const tag of tags) {
      await projectStore.createTag(tag.name, tag.color, tag.category)
    }
    fileMessage.value = `已成功导入 ${importedCount} 个项目。`
  } catch (error) {
    fileMessage.value = error instanceof Error ? error.message : '导入失败，请检查文件后重试。'
  } finally {
    input.value = ''
    isImporting.value = false
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <SwipeGesture @swipe-up="handleSwipeUp">
    <main class="page">
      <section class="header">
        <p class="eyebrow">SceneNote</p>
        <h1>我的项目</h1>
        <p class="description">管理和继续你的观影记录</p>
      </section>

      <div v-if="projectStore.projects.length > 0" class="project-list">
        <h2 class="list-title">最近项目</h2>

        <div class="project-actions" aria-label="项目数据操作">
          <button type="button" :disabled="isExporting" @click="exportAllProjects">
            {{ isExporting ? '导出中…' : '导出全部' }}
          </button>
          <button type="button" :disabled="isImporting" @click="chooseImportFile">
            {{ isImporting ? '导入中…' : '导入项目' }}
          </button>
          <input ref="fileInput" class="file-input" type="file" accept="application/json,.json" @change="importProjects" />
        </div>
        <p v-if="fileMessage" class="file-message" role="status">{{ fileMessage }}</p>

        <ul class="projects">
          <li v-for="project in projectStore.projects" :key="project.id" class="project-item">
            <div class="project-card">
              <button type="button" class="project-main" @click="openProject(project.id)">
                <div class="project-info">
                  <h3 class="project-title">{{ project.title }}</h3>
                  <p class="project-meta">
                    <span>{{ project.markers.length }} 条记录</span>
                    <span class="separator">·</span>
                    <span>{{ formatDate(project.updatedAt) }}</span>
                  </p>
                </div>
                <span class="project-arrow">→</span>
              </button>
              <button
                type="button"
                class="project-delete"
                :disabled="deletingId === project.id"
                :aria-label="`删除《${project.title}》`"
                @click="deleteProject(project.id, project.title)"
              >
                {{ deletingId === project.id ? '删除中…' : '删除' }}
              </button>
            </div>
          </li>
        </ul>
        <p v-if="deleteError" class="error" role="alert">{{ deleteError }}</p>
      </div>

      <form class="create-form" @submit.prevent="createProject">
        <label for="project-title">新电影名称</label>
        <input id="project-title" v-model="title" type="text" maxlength="120" placeholder="例如：盗梦空间" autocomplete="off" required />
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <button type="submit" :disabled="isCreating">
          {{ isCreating ? '正在创建…' : '开始新记录' }}
        </button>
      </form>
    </main>
  </SwipeGesture>
</template>

<style scoped>
.page {
  display: grid;
  min-height: 100dvh;
  padding: calc(32px + env(safe-area-inset-top)) 24px calc(32px + env(safe-area-inset-bottom));
  gap: 32px;
}

.header,
.project-list,
.create-form {
  display: grid;
  gap: 14px;
}

.eyebrow,
h1,
.description,
label,
.error {
  margin: 0;
}

.eyebrow {
  color: #f5c451;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  color: #ffffff;
  font-size: clamp(2rem, 9vw, 3rem);
  line-height: 1.1;
}

.description,
label {
  color: #b8b8b8;
  line-height: 1.6;
}

.list-title {
  margin: 0;
  color: #9f9f9f;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.project-actions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.project-actions button {
  min-height: 46px;
  border: 1px solid #464646;
  border-radius: 10px;
  color: #e9e9e9;
  background: #1d1d1d;
  font-weight: 700;
}

.project-actions button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.file-input {
  display: none;
}

.file-message {
  margin: 0;
  color: #a7a7a7;
  font-size: 0.875rem;
  text-align: center;
}

.projects {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.project-item {
  margin: 0;
  opacity: 0;
  transform: translateY(8px);
  animation: fadeInUp 0.25s ease forwards;
}

.project-item:nth-child(1) { animation-delay: 0ms; }
.project-item:nth-child(2) { animation-delay: 50ms; }
.project-item:nth-child(3) { animation-delay: 100ms; }
.project-item:nth-child(4) { animation-delay: 150ms; }
.project-item:nth-child(5) { animation-delay: 200ms; }
.project-item:nth-child(n+6) { animation-delay: 250ms; }

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.project-card {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: stretch;
  border: 1px solid #2a2a2a;
  border-radius: 14px;
  background: #151515;
  overflow: hidden;
  transition: transform 0.1s ease, box-shadow 0.15s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.project-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border: 0;
  background: transparent;
  text-align: left;
  min-height: 0;
}

.project-main:active {
  background: #1d1d1d;
}

.project-delete {
  flex: none;
  align-self: stretch;
  padding: 0 16px;
  border: 0;
  border-left: 1px solid #2a2a2a;
  color: #ff8a8a;
  background: transparent;
  font-size: 0.85rem;
  font-weight: 700;
}

.project-delete:disabled {
  cursor: wait;
  opacity: 0.65;
}

.project-info {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.project-title {
  margin: 0;
  color: #ffffff;
  font-size: 1.125rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-meta {
  margin: 0;
  color: #989898;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.separator {
  opacity: 0.5;
}

.project-arrow {
  color: #5a5a5a;
  font-size: 1.25rem;
  flex: none;
}

.create-form {
  width: 100%;
}

input,
button {
  min-height: 58px;
  border-radius: 14px;
  font-size: 1rem;
}

input {
  width: 100%;
  border: 1px solid #3a3a3a;
  padding: 0 16px;
  color: #ffffff;
  background: #151515;
}

input:focus {
  outline: 2px solid #f5c451;
  outline-offset: 2px;
}

button {
  border: 0;
  color: #080808;
  background: #f5c451;
  font-weight: 800;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.error {
  margin: 0;
  color: #ff9898;
}
</style>