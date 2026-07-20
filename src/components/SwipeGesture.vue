<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

interface SwipeGestureProps {
  threshold?: number
  cancelThreshold?: number
}

const props = withDefaults(defineProps<SwipeGestureProps>(), {
  threshold: 80,
  cancelThreshold: 50,
})

const emit = defineEmits<{
  (e: 'swipe-left'): void
  (e: 'swipe-right'): void
  (e: 'swipe-start'): void
  (e: 'swipe-end'): void
}>()

const isSwiping = ref(false)
const startX = ref(0)
const startY = ref(0)
const currentX = ref(0)
const containerRef = ref<HTMLElement | null>(null)
let touchStartTarget: EventTarget | null = null

function handleTouchStart(event: TouchEvent): void {
  const touch = event.touches[0]
  startX.value = touch.clientX
  startY.value = touch.clientY
  currentX.value = touch.clientX
  isSwiping.value = true
  touchStartTarget = event.target
  emit('swipe-start')
}

function handleTouchMove(event: TouchEvent): void {
  if (!isSwiping.value) return

  const touch = event.touches[0]
  currentX.value = touch.clientX

  const deltaY = Math.abs(touch.clientY - startY.value)

  if (deltaY > props.cancelThreshold) {
    isSwiping.value = false
    emit('swipe-end')
  }
}

function handleTouchEnd(event: TouchEvent): void {
  if (!isSwiping.value) return

  const deltaX = currentX.value - startX.value

  if (Math.abs(deltaX) > props.threshold) {
    if (deltaX < 0) {
      emit('swipe-left')
    } else {
      emit('swipe-right')
    }
    if (event.cancelable) {
      event.preventDefault()
    }
    if (touchStartTarget instanceof HTMLElement) {
      touchStartTarget.blur()
    }
  }

  isSwiping.value = false
  touchStartTarget = null
  emit('swipe-end')
}

onMounted(() => {
  void nextTick(() => {
    window.setTimeout(() => {
      containerRef.value?.focus()
    }, 280)
  })
})
</script>

<template>
  <div
    ref="containerRef"
    class="swipe-gesture"
    tabindex="-1"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <slot />
  </div>
</template>

<style scoped>
.swipe-gesture {
  position: relative;
  width: 100%;
  height: 100%;
  touch-action: pan-y;
  outline: none;
}
</style>
