<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProjectHeader from '../components/ProjectHeader.vue'
import SwipeGesture from '../components/SwipeGesture.vue'
import Timeline from '../components/Timeline.vue'
import { useProjectStore } from '../stores/project'
import type { MarkerType } from '../types'
import { MARKER_TYPE_OPTIONS } from '../utils/marker'
import { downloadProjectJson, parseProjectJson } from '../utils/json'
import { parseTime } from '../utils/time'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const fileInput = ref<HTMLInputElement | null>(null)
const isLoading = ref(true)
const isImporting = ref(false)
const fileMessage = ref('')
const projectId = computed(() => String(route.params.projectId))

const isAdding = ref<'idle' | 'expanding' | 'adding' | 'collapsing'>('idle')
const isSaving = ref(false)
const addError = ref('')
const newTime = ref('')
const newType = ref<MarkerType>('emotion')
const newTag = ref('')
const newNote = ref('')

/** 进入时间轴前加载对应项目，防止直接访问链接时没有数据。 */
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

/** 向右滑动：返回观看页面（观看页面在时间轴左侧）。 */
async function handleSwipeRight(): Promise<void> {
  projectStore.setNavigationDirection('backward')
  await router.push({ name: 'watch', params: { projectId: projectId.value } })
}

/** 下载当前项目的稳定 JSON 格式。 */
function exportProject(): void {
  if (!projectStore.currentProject) {
    return
  }

  downloadProjectJson(projectStore.currentProject)
  fileMessage.value = '已开始下载 JSON 文件。'
}

/** 打开系统文件选择器，仅接受 JSON 文件。 */
function chooseImportFile(): void {
  fileMessage.value = ''
  fileInput.value?.click()
}

/** 读取、校验并导入项目 JSON，成功后切换到导入的项目。 */
async function importProject(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file || isImporting.value) {
    return
  }

  isImporting.value = true
  fileMessage.value = ''

  try {
    const importedProject = parseProjectJson(await file.text())
    const project = await projectStore.importProject(importedProject)
    await router.replace({ name: 'timeline', params: { projectId: project.id } })
    fileMessage.value = `已导入《${project.title}》。`
  } catch (error) {
    fileMessage.value = error instanceof Error ? error.message : '导入失败，请检查文件后重试。'
  } finally {
    input.value = ''
    isImporting.value = false
  }
}

/** 打开新增表单并预填默认值。 */
function openAddForm(): void {
  newTime.value = ''
  newType.value = 'emotion'
  newTag.value = ''
  newNote.value = ''
  addError.value = ''
  isAdding.value = 'expanding'

  setTimeout(() => {
    if (isAdding.value === 'expanding') {
      isAdding.value = 'adding'
    }
  }, 200)
}

/** 取消新增，回到时间轴列表视图。 */
function cancelAdd(): void {
  isAdding.value = 'collapsing'

  setTimeout(() => {
    isAdding.value = 'idle'
    addError.value = ''
  }, 200)
}

/** 校验并保存一条新的 Marker 到当前项目。 */
async function saveNewMarker(): Promise<void> {
  const time = parseTime(newTime.value)

  if (time === null) {
    addError.value = '时间格式应为 HH:mm:ss，例如 00:13:42。'
    return
  }

  isSaving.value = true
  addError.value = ''

  try {
    await projectStore.addMarker({
      time,
      type: newType.value,
      note: newNote.value.trim(),
      tags: newTag.value.trim() ? [newTag.value.trim()] : [],
    })
    isAdding.value = 'collapsing'

    setTimeout(() => {
      isAdding.value = 'idle'
    }, 200)
  } catch (error) {
    addError.value = error instanceof Error ? error.message : '保存失败，请重试。'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  void loadProject()
})

watch(projectId, () => {
  void loadProject()
})
</script>

<template>
  <SwipeGesture @swipe-right="handleSwipeRight">
    <main class="page">
      <p v-if="isLoading" class="status">正在载入时间轴…</p>
      <template v-else-if="projectStore.currentProject">
        <div class="heading">
        <ProjectHeader :project="projectStore.currentProject" eyebrow="项目时间轴" @update:title="projectStore.updateProjectTitle" />
        <button type="button" class="back-link" @click="handleSwipeRight">返回观看</button>
      </div>

        <div class="project-actions" aria-label="项目数据操作">
          <button type="button" @click="exportProject">导出 JSON</button>
          <button type="button" :disabled="isImporting" @click="chooseImportFile">
            {{ isImporting ? '正在导入…' : '导入 JSON' }}
          </button>
          <input ref="fileInput" class="file-input" type="file" accept="application/json,.json" @change="importProject" />
        </div>
        <p v-if="fileMessage" class="file-message" role="status">{{ fileMessage }}</p>

        <div :class="['add-section', isAdding]">
          <button v-if="isAdding === 'idle'" type="button" class="add-trigger" @click="openAddForm">+ 添加时间节点</button>

          <form v-else class="add-form" @submit.prevent="saveNewMarker">
            <label class="field">
              <span>时间</span>
              <input v-model="newTime" type="text" inputmode="numeric" placeholder="00:13:42" required />
            </label>
            <label class="field">
              <span>类型</span>
              <select v-model="newType">
                <option v-for="option in MARKER_TYPE_OPTIONS" :key="option.type" :value="option.type">
                  {{ option.emoji }} {{ option.label }}
                </option>
              </select>
            </label>
            <label class="field">
              <span>标签</span>
              <input v-model="newTag" type="text" maxlength="50" placeholder="例如：情绪爆发" />
            </label>
            <label class="field">
              <span>备注</span>
              <textarea v-model="newNote" rows="3" maxlength="500" placeholder="补充这一刻的剪辑灵感" />
            </label>
            <p v-if="addError" class="error" role="alert">{{ addError }}</p>
            <div class="add-actions">
              <button type="button" class="cancel" :disabled="isSaving" @click="cancelAdd">取消</button>
              <button type="submit" class="save" :disabled="isSaving">添加</button>
            </div>
          </form>
        </div>

        <Timeline :markers="projectStore.currentProject.markers" />
      </template>
    </main>
  </SwipeGesture>
</template>

<style scoped>
.page {
  display: grid;
  min-height: 100vh;
  padding: calc(28px + env(safe-area-inset-top)) 24px calc(32px + env(safe-area-inset-bottom));
  align-content: start;
  gap: 24px;
}

.heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
}

.back-link {
  flex: none;
  padding-top: 4px;
  border: none;
  color: #f5c451;
  background: none;
  font-size: 0.9rem;
  cursor: pointer;
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

.file-message,
.status {
  margin: 0;
  color: #a7a7a7;
  font-size: 0.875rem;
  text-align: center;
}

.add-section {
  display: grid;
  gap: 10px;
}

.add-trigger {
  width: 100%;
  min-height: 50px;
  border: 1px dashed #4a4a4a;
  border-radius: 12px;
  color: #f5c451;
  background: transparent;
  font-size: 0.95rem;
  font-weight: 700;
}

.add-form {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: 1px solid #3a3a3a;
  border-radius: 14px;
  background: #171717;
}

.add-section.expanding .add-form,
.add-section.adding .add-form {
  animation: addFormExpand 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.add-section.collapsing .add-form {
  animation: addFormCollapse 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes addFormExpand {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0;
  }

  to {
    opacity: 1;
    max-height: 600px;
    padding-top: 18px;
    padding-bottom: 18px;
    border-width: 1px;
  }
}

@keyframes addFormCollapse {
  from {
    opacity: 1;
    max-height: 600px;
    padding-top: 18px;
    padding-bottom: 18px;
    border-width: 1px;
  }

  to {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0;
  }
}

.field {
  display: grid;
  gap: 5px;
}

.field span {
  color: #b8b8b8;
  font-size: 0.8rem;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid #484848;
  border-radius: 9px;
  padding: 10px;
  color: #ffffff;
  background: #242424;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: 2px solid #f5c451;
  outline-offset: 1px;
}

.field textarea {
  resize: vertical;
}

.error {
  margin: 0;
  color: #ff9898;
  font-size: 0.85rem;
}

.add-actions {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 8px;
}

.add-actions button {
  min-height: 46px;
  border-radius: 9px;
  font-weight: 700;
}

.cancel {
  border: 1px solid #4a4a4a;
  color: #e7e7e7;
  background: transparent;
}

.save {
  border: 0;
  color: #080808;
  background: #f5c451;
}

.add-actions button:disabled {
  cursor: wait;
  opacity: 0.65;
}
</style>
