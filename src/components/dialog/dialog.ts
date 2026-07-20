import { createApp, type Component } from 'vue'
import Dialog from './Dialog.vue'

export interface DialogOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  showCancel?: boolean
}

interface DialogInstance {
  close(): void
}

let currentInstance: DialogInstance | null = null

export function openDialog(options: DialogOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (currentInstance) {
      currentInstance.close()
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    const instance: DialogInstance = {
      close: () => {
        app.unmount()
        container.remove()
        currentInstance = null
      },
    }

    const app = createApp(Dialog as Component, {
      title: options.title,
      message: options.message,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      showCancel: options.showCancel !== false,
      visible: true,
      onConfirm: () => {
        resolve(true)
        instance.close()
      },
      onCancel: () => {
        resolve(false)
        instance.close()
      },
      onClose: () => {
        instance.close()
      },
    })

    app.mount(container)
    currentInstance = instance
  })
}

export function confirm(message: string, title?: string): Promise<boolean> {
  return openDialog({ title, message })
}