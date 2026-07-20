<script setup lang="ts">
import { computed, ref } from 'vue'
import { useProjectStore } from '../stores/project'
import { formatTime } from '../utils/time'

const projectStore = useProjectStore()
const isSaving = ref(false)
const adjustState = ref<'idle' | 'opening' | 'adjusting' | 'closing'>('idle')
const adjustmentError = ref('')
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)

const timeText = computed(() => formatTime(projectStore.timer.elapsedSeconds))
const actionText = computed(() => {
  if (projectStore.timer.isRunning) {
    return '暂停'
  }

  return projectStore.timer.hasStarted ? '继续' : '开始'
})

async function toggleTimer(): Promise<void> {
  if (isSaving.value) {
    return
  }

  isSaving.value = true

  try {
    if (projectStore.timer.isRunning) {
      await projectStore.pauseTimer()
    } else {
      projectStore.startTimer()
    }
  } finally {
    isSaving.value = false
  }
}

function syncInputsFromTimer(): void {
  const currentTime = projectStore.timer.elapsedSeconds
  hours.value = Math.floor(currentTime / 3600)
  minutes.value = Math.floor((currentTime % 3600) / 60)
  seconds.value = currentTime % 60
}

function toggleAdjusting(): void {
  if (adjustState.value === 'idle') {
    syncInputsFromTimer()
    adjustmentError.value = ''
    adjustState.value = 'opening'

    setTimeout(() => {
      if (adjustState.value === 'opening') {
        adjustState.value = 'adjusting'
      }
    }, 150)
  } else if (adjustState.value === 'adjusting') {
    adjustState.value = 'closing'

    setTimeout(() => {
      adjustState.value = 'idle'
      adjustmentError.value = ''
    }, 150)
  }
}

async function applyTimeAdjustment(): Promise<void> {
  const values = [hours.value, minutes.value, seconds.value]
  const hasInvalidValue = values.some((value) => !Number.isInteger(value) || value < 0)

  if (hasInvalidValue || minutes.value > 59 || seconds.value > 59) {
    adjustmentError.value = '请输入有效的 HH:mm:ss 时间。'
    return
  }

  adjustmentError.value = ''

  try {
    await projectStore.setTimerElapsed(hours.value * 3600 + minutes.value * 60 + seconds.value)
  } catch (error) {
    adjustmentError.value = error instanceof Error ? error.message : '校时失败，请重试。'
  }
}
</script>

<template>
  <section class="timer" aria-label="观看计时器">
    <p class="label">当前记录时间</p>

    <output v-if="adjustState === 'idle'" class="time" aria-live="off">{{ timeText }}</output>
    <div v-else :class="['time-inputs', adjustState]" role="group" aria-label="手动校时">
      <label>
        <span>时</span>
        <input v-model.number="hours" type="number" min="0" inputmode="numeric" @change="applyTimeAdjustment" />
      </label>
      <label>
        <span>分</span>
        <input v-model.number="minutes" type="number" min="0" max="59" inputmode="numeric" @change="applyTimeAdjustment" />
      </label>
      <label>
        <span>秒</span>
        <input v-model.number="seconds" type="number" min="0" max="59" inputmode="numeric" @change="applyTimeAdjustment" />
      </label>
    </div>

    <p v-if="adjustmentError" class="error" role="alert">{{ adjustmentError }}</p>

    <button class="action" type="button" :disabled="isSaving" @click="toggleTimer">
      {{ actionText }}
    </button>

    <button
      class="adjust-toggle"
      :class="{ active: adjustState !== 'idle' }"
      type="button"
      :disabled="isSaving"
      :aria-pressed="adjustState !== 'idle'"
      @click="toggleAdjusting"
    >
      {{ adjustState !== 'idle' ? '完成校时' : '手动校时' }}
    </button>
  </section>
</template>

<style scoped>
.timer {
  display: grid;
  justify-items: center;
  gap: 14px;
  width: 100%;
}

.label,
.error {
  margin: 0;
}

.label {
  color: #9f9f9f;
  font-size: 0.875rem;
  letter-spacing: 0.12em;
}

.time {
  color: #ffffff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(3.25rem, 18vw, 5.5rem);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  line-height: 1;
}

.time-inputs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: min(100%, 340px);
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.time-inputs.adjusting {
  opacity: 1;
  transform: scale(1);
}

.time-inputs label {
  display: grid;
  gap: 5px;
  color: #9f9f9f;
  font-size: 0.75rem;
  text-align: center;
}

.time-inputs input {
  width: 100%;
  min-height: 64px;
  border: 1px solid #494949;
  border-radius: 12px;
  padding: 0 6px;
  color: #ffffff;
  background: #242424;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: clamp(1.5rem, 7vw, 2rem);
  font-weight: 700;
  text-align: center;
}

.time-inputs input:focus {
  outline: 2px solid #f5c451;
  outline-offset: 1px;
}

.action {
  width: min(100%, 340px);
  min-height: 64px;
  border: 0;
  border-radius: 16px;
  color: #ffffff;
  background: #3a3a3a;
  font-size: 1.125rem;
  font-weight: 800;
  transition: background 0.15s ease;
}

.action:active {
  background: #4a4a4a;
}

.adjust-toggle {
  border: 1px solid #4a4a4a;
  border-radius: 999px;
  padding: 6px 18px;
  color: #bdbdbd;
  background: transparent;
  font-size: 0.85rem;
  font-weight: 700;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.adjust-toggle.active {
  border-color: #f5c451;
  color: #080808;
  background: #f5c451;
}

.action:disabled,
.adjust-toggle:disabled {
  cursor: wait;
  opacity: 0.65;
}

.error {
  color: #ff9898;
  font-size: 0.875rem;
}
</style>