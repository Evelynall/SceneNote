<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

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
  const deltaY = Math.abs(touch.clientY - startY.value)

  // 当垂直滑动明显大于水平滑动时，阻止浏览器默认行为（如下拉刷新）
  if (deltaY > deltaX && deltaY > 10) {
    event.preventDefault()
  }

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
  const el = containerRef.value
  if (!el) return

  // 使用非 passive 监听器，以便可以调用 preventDefault 阻止下拉刷新
  el.addEventListener('touchmove', handleTouchMove, { passive: false })

  // 等待过渡动画完成（250ms）后再聚焦，确保焦点真正落到新页面
  void nextTick(() => {
    window.setTimeout(() => {
      el.focus()
    }, 280)
  })
})

onUnmounted(() => {
  const el = containerRef.value
  if (el) {
    el.removeEventListener('touchmove', handleTouchMove)
  }
})
</script>

<template>
  <div
    ref="containerRef"
    class="swipe-gesture"
    tabindex="-1"
    @touchstart="handleTouchStart"
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
  /* 禁用浏览器默认触摸行为，防止下拉刷新等干扰滑动导航 */
  touch-action: none;
  outline: none;
}
</style>
