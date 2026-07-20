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
  (e: 'swipe-up'): void
  (e: 'swipe-down'): void
  (e: 'swipe-start'): void
  (e: 'swipe-end'): void
}>()

const isSwiping = ref(false)
const startY = ref(0)
const startX = ref(0)
const currentY = ref(0)
const containerRef = ref<HTMLElement | null>(null)
let touchStartTarget: EventTarget | null = null

function handleTouchStart(event: TouchEvent): void {
  const touch = event.touches[0]
  startY.value = touch.clientY
  startX.value = touch.clientX
  currentY.value = touch.clientY
  isSwiping.value = true
  touchStartTarget = event.target
  emit('swipe-start')
}

function handleTouchMove(event: TouchEvent): void {
  if (!isSwiping.value) return

  const touch = event.touches[0]
  currentY.value = touch.clientY

  const deltaX = Math.abs(touch.clientX - startX.value)

  if (deltaX > props.cancelThreshold) {
    isSwiping.value = false
    emit('swipe-end')
  }
}

function handleTouchEnd(event: TouchEvent): void {
  if (!isSwiping.value) return

  const deltaY = currentY.value - startY.value

  if (Math.abs(deltaY) > props.threshold) {
    if (deltaY < 0) {
      emit('swipe-up')
    } else {
      emit('swipe-down')
    }
    // 阻止合成 click 事件，避免影响新页面交互
    event.preventDefault()
    // 主动失焦触摸起始元素，清除 :active/:focus 状态，防止残留影响新页面
    if (touchStartTarget instanceof HTMLElement) {
      touchStartTarget.blur()
    }
  }

  isSwiping.value = false
  touchStartTarget = null
  emit('swipe-end')
}

onMounted(() => {
  // 等待过渡动画完成（250ms）后再聚焦，确保焦点真正落到新页面
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
  /* 使用 manipulation 减少移动端点击延迟，避免 pan-x 导致滑动后浏览器卡在让出垂直控制的状态 */
  touch-action: manipulation;
  outline: none;
}
</style>