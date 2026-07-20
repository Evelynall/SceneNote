<script setup lang="ts">
import { ref } from 'vue'
import { useProjectStore } from '../stores/project'
import { MARKER_TYPE_OPTIONS, type MarkerTypeOption } from '../utils/marker'
import { formatTime } from '../utils/time'

const projectStore = useProjectStore()
const animationState = ref<'idle' | 'extending' | 'picker' | 'collapsing'>('idle')
const isSaving = ref(false)
const errorMessage = ref('')
const lastSavedTime = ref('')
const pendingTime = ref<number | null>(null)

function openTypePicker(): void {
  pendingTime.value = projectStore.timer.elapsedSeconds
  animationState.value = 'extending'
  errorMessage.value = ''
  lastSavedTime.value = ''

  setTimeout(() => {
    if (animationState.value === 'extending') {
      animationState.value = 'picker'
    }
  }, 200)
}

async function saveMarker(option: MarkerTypeOption): Promise<void> {
  if (pendingTime.value === null || isSaving.value) {
    return
  }

  isSaving.value = true
  errorMessage.value = ''

  try {
    await projectStore.addMarker({
      time: pendingTime.value,
      type: option.type,
      note: '',
      tags: [option.label],
    })
    lastSavedTime.value = formatTime(pendingTime.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '记录保存失败，请重试。'
  } finally {
    animationState.value = 'collapsing'

    setTimeout(() => {
      animationState.value = 'idle'
      pendingTime.value = null
      isSaving.value = false
    }, 200)
  }
}
</script>

<template>
  <section class="marker-button" aria-label="快速记录">
    <div :class="['container', animationState]">
      <button v-if="animationState === 'idle'" class="capture" type="button" @click="openTypePicker">
        记录瞬间
      </button>

      <div v-else class="type-picker" aria-label="选择记录类型">
        <p>这一刻是什么？</p>
        <div class="type-grid">
          <button
            v-for="option in MARKER_TYPE_OPTIONS"
            :key="option.type"
            class="type-option"
            type="button"
            :disabled="isSaving"
            @click="saveMarker(option)"
          >
            <span aria-hidden="true">{{ option.emoji }}</span>
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="lastSavedTime" class="saved" role="status">已记录 {{ lastSavedTime }}</p>
    <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.marker-button {
  display: grid;
  gap: 14px;
  width: 100%;
}

.container {
  width: 100%;
  min-height: 82px;
  border-radius: 20px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.container.idle {
  background: #f5c451;
}

.container.extending,
.container.picker,
.container.collapsing {
  background: #151515;
  border: 1px solid #353535;
}

.container.extending,
.container.collapsing {
  min-height: 82px;
}

.container.picker {
  min-height: auto;
  padding: 18px;
}

.capture {
  width: 100%;
  min-height: 82px;
  border: 0;
  border-radius: 20px;
  color: #080808;
  background: #f5c451;
  font-size: 1.35rem;
  font-weight: 900;
  transition: opacity 0.15s ease;
}

.type-picker {
  display: grid;
  gap: 14px;
  opacity: 0;
  transform: translateY(-10px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.container.picker .type-picker {
  opacity: 1;
  transform: translateY(0);
}

.type-picker p,
.saved,
.error {
  margin: 0;
  text-align: center;
}

.type-picker p {
  color: #d2d2d2;
}

.type-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.type-option {
  min-height: 54px;
  border: 1px solid #3f3f3f;
  border-radius: 12px;
  color: #f5f5f5;
  background: #202020;
  font-size: 0.95rem;
  font-weight: 700;
  transition: transform 0.1s ease, background 0.1s ease;
}

.type-option:active {
  transform: scale(0.98);
  background: #2a2a2a;
}

.type-option:disabled {
  cursor: wait;
  opacity: 0.65;
}

.saved {
  color: #f5c451;
  font-size: 0.875rem;
  animation: fadeIn 0.2s ease;
}

.error {
  color: #ff9898;
  font-size: 0.875rem;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>