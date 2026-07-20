<script setup lang="ts">
import { ref, watch } from 'vue'

interface DialogProps {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
  visible: boolean
  onConfirm?: () => void
  onCancel?: () => void
  onClose?: () => void
}

const props = withDefaults(defineProps<DialogProps>(), {
  title: '',
  confirmText: '确定',
  cancelText: '取消',
  showCancel: true,
})

const isClosing = ref(false)

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    isClosing.value = true
    setTimeout(() => {
      isClosing.value = false
      props.onClose?.()
    }, 250)
  }
})

function handleConfirm(): void {
  isClosing.value = true
  setTimeout(() => {
    isClosing.value = false
    props.onConfirm?.()
  }, 250)
}

function handleCancel(): void {
  isClosing.value = true
  setTimeout(() => {
    isClosing.value = false
    props.onCancel?.()
  }, 250)
}
</script>

<template>
  <Teleport to="body">
    <div :class="['dialog-overlay', { closing: isClosing }]" @click.self="handleCancel">
      <div :class="['dialog-container', { closing: isClosing }]">
        <h3 v-if="title" class="dialog-title">{{ title }}</h3>
        <p class="dialog-message">{{ message }}</p>
        <div class="dialog-actions">
          <button v-if="showCancel" class="dialog-cancel" type="button" @click="handleCancel">
            {{ cancelText }}
          </button>
          <button class="dialog-confirm" type="button" @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
  z-index: 9999;
  animation: overlayIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.dialog-overlay.closing {
  animation: overlayOut 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes overlayIn {
  from {
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
  }

  to {
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }
}

@keyframes overlayOut {
  from {
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }

  to {
    background: rgba(0, 0, 0, 0);
    backdrop-filter: blur(0px);
  }
}

.dialog-container {
  width: min(100%, 340px);
  border-radius: 16px;
  background: #1a1a1a;
  border: 1px solid #353535;
  overflow: hidden;
  opacity: 0;
  transform: scale(0.92) translateY(12px);
  animation: containerIn 0.25s cubic-bezier(0.2, 0, 0, 1) forwards;
}

.dialog-container.closing {
  animation: containerOut 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
}

@keyframes containerIn {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes containerOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }

  to {
    opacity: 0;
    transform: scale(0.92) translateY(12px);
  }
}

.dialog-title {
  margin: 0;
  padding: 20px 20px 0;
  color: #ffffff;
  font-size: 1.125rem;
  font-weight: 800;
}

.dialog-message {
  margin: 0;
  padding: 16px 20px;
  color: #cecece;
  line-height: 1.6;
}

.dialog-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-top: 1px solid #2a2a2a;
}

.dialog-actions button {
  min-height: 52px;
  border: 0;
  font-weight: 700;
  transition: background 0.15s ease;
}

.dialog-cancel {
  color: #bdbdbd;
  background: transparent;
}

.dialog-cancel:active {
  background: #242424;
}

.dialog-confirm {
  color: #080808;
  background: #f5c451;
  border-left: 1px solid #2a2a2a;
}

.dialog-confirm:active {
  background: #e6b540;
}
</style>