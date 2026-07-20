<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProjectStore } from '../stores/project'
import type { Marker, MarkerType } from '../types'
import { MARKER_TYPE_OPTIONS, getMarkerTypeOption } from '../utils/marker'
import { formatTime, parseTime } from '../utils/time'
import { confirm } from './dialog'

const props = defineProps<{
  marker: Marker
}>()

const projectStore = useProjectStore()
const editState = ref<'view' | 'expanding' | 'editing' | 'collapsing'>('view')
const isSaving = ref(false)
const isDeleting = ref(false)
const errorMessage = ref('')
const draftTime = ref('')
const draftType = ref<MarkerType>('emotion')
const draftTag = ref('')
const draftNote = ref('')
const markerOption = computed(() => getMarkerTypeOption(props.marker.type))

function startEditing(): void {
  draftTime.value = formatTime(props.marker.time)
  draftType.value = props.marker.type
  draftTag.value = props.marker.tags.join(', ')
  draftNote.value = props.marker.note
  errorMessage.value = ''
  editState.value = 'expanding'

  setTimeout(() => {
    if (editState.value === 'expanding') {
      editState.value = 'editing'
    }
  }, 200)
}

function cancelEditing(): void {
  editState.value = 'collapsing'

  setTimeout(() => {
    editState.value = 'view'
    errorMessage.value = ''
  }, 200)
}

async function saveChanges(): Promise<void> {
  const time = parseTime(draftTime.value)

  if (time === null) {
    errorMessage.value = '时间格式应为 HH:mm:ss，例如 00:13:42。'
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    await projectStore.updateMarker(props.marker.id, {
      time,
      type: draftType.value,
      note: draftNote.value,
      tags: draftTag.value.split(',').map(t => t.trim()).filter(t => t),
    })
    editState.value = 'collapsing'

    setTimeout(() => {
      editState.value = 'view'
    }, 200)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '保存修改失败，请重试。'
  } finally {
    isSaving.value = false
  }
}

async function deleteMarker(): Promise<void> {
  if (isDeleting.value) {
    return
  }

  const confirmed = await confirm('确定要删除这条记录吗？此操作不可恢复。', '删除记录')

  if (!confirmed) {
    return
  }

  isDeleting.value = true
  errorMessage.value = ''

  try {
    await projectStore.deleteMarker(props.marker.id)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '删除失败，请重试。'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <article :class="['marker-card', editState]" @click="editState === 'view' && startEditing()">
    <template v-if="editState === 'view'">
      <time class="time">{{ marker.timeText }}</time>
      <div class="content">
        <div class="type-row">
          <p class="type"><span aria-hidden="true">{{ markerOption.emoji }}</span> {{ markerOption.label }}</p>
          <button class="delete-trigger" type="button" :disabled="isDeleting" @click.stop="deleteMarker">
            {{ isDeleting ? '删除中…' : '删除' }}
          </button>
        </div>
        <p v-if="marker.tags.length" class="tag">{{ marker.tags.join(', ') }}</p>
        <p v-if="marker.note" class="note">{{ marker.note }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      </div>
    </template>

    <form v-else class="edit-form" @submit.prevent="saveChanges">
      <label class="field">
        <span>时间</span>
        <input v-model="draftTime" type="text" inputmode="numeric" placeholder="00:13:42" required />
      </label>
      <label class="field">
        <span>类型</span>
        <select v-model="draftType">
          <option v-for="option in MARKER_TYPE_OPTIONS" :key="option.type" :value="option.type">
            {{ option.emoji }} {{ option.label }}
          </option>
        </select>
      </label>
      <label class="field">
        <span>标签</span>
        <input v-model="draftTag" type="text" maxlength="50" placeholder="例如：情绪爆发" />
      </label>
      <label class="field">
        <span>备注</span>
        <textarea v-model="draftNote" rows="3" maxlength="500" placeholder="补充这一刻的剪辑灵感" />
      </label>
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      <div class="edit-actions">
        <button type="button" class="cancel" :disabled="isSaving" @click="cancelEditing">取消</button>
        <button type="submit" class="save" :disabled="isSaving">保存</button>
      </div>
    </form>
  </article>
</template>

<style scoped>
.marker-card {
  display: grid;
  grid-template-columns: minmax(88px, 0.45fr) 1fr;
  gap: 16px;
  position: relative;
  padding-bottom: 24px;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.marker-card:hover:not(.expanding):not(.editing):not(.collapsing) {
  opacity: 0.85;
}

.marker-card::before {
  position: absolute;
  top: 5px;
  left: -26px;
  width: 12px;
  height: 12px;
  border: 3px solid #080808;
  border-radius: 999px;
  background: #f5c451;
  content: '';
}

.time,
.type,
.tag,
.note,
.field span,
.error {
  margin: 0;
}

.time {
  color: #f5c451;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.content {
  display: grid;
  gap: 5px;
  min-width: 0;
}

.type-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.type {
  color: #ffffff;
  font-weight: 800;
}

.tag {
  color: #cecece;
}

.note {
  color: #989898;
  line-height: 1.5;
  white-space: pre-wrap;
}

.delete-trigger {
  flex: none;
  border: 0;
  padding: 3px 0;
  color: #ff8a8a;
  background: transparent;
  font-size: 0.8rem;
  text-decoration: underline;
}

.delete-trigger:disabled {
  cursor: wait;
  opacity: 0.65;
}

.edit-form {
  display: grid;
  grid-column: 1 / -1;
  gap: 10px;
  padding: 16px;
  border: 1px solid #3a3a3a;
  border-radius: 14px;
  background: #171717;
  cursor: default;
}

.marker-card.expanding .edit-form,
.marker-card.editing .edit-form {
  animation: formExpand 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.marker-card.collapsing .edit-form {
  animation: formCollapse 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes formExpand {
  from {
    opacity: 0;
    max-height: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0;
  }

  to {
    opacity: 1;
    max-height: 500px;
    padding-top: 16px;
    padding-bottom: 16px;
    border-width: 1px;
  }
}

@keyframes formCollapse {
  from {
    opacity: 1;
    max-height: 500px;
    padding-top: 16px;
    padding-bottom: 16px;
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
  color: #ff9898;
  font-size: 0.85rem;
}

.edit-actions {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 8px;
}

.edit-actions button {
  min-height: 42px;
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

.edit-actions button:disabled {
  cursor: wait;
  opacity: 0.65;
}
</style>