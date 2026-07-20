<script setup lang="ts">
import { ref } from 'vue'
import type { Project } from '../types'

const props = withDefaults(defineProps<{
  project: Project
  eyebrow?: string
}>(), {
  eyebrow: '正在观看',
})

const emit = defineEmits<{
  (e: 'update:title', title: string): void
}>()

const isEditing = ref(false)
const editTitle = ref(props.project.title)
const inputRef = ref<HTMLInputElement | null>(null)

function startEditing(): void {
  editTitle.value = props.project.title
  isEditing.value = true

  setTimeout(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  }, 50)
}

function saveTitle(): void {
  const trimmed = editTitle.value.trim()

  if (trimmed && trimmed !== props.project.title) {
    emit('update:title', trimmed)
  }

  isEditing.value = false
}

function cancelEditing(): void {
  isEditing.value = false
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter') {
    event.preventDefault()
    saveTitle()
  } else if (event.key === 'Escape') {
    cancelEditing()
  }
}
</script>

<template>
  <header class="project-header">
    <p>{{ eyebrow }}</p>
    <div class="title-area">
      <input
        v-if="isEditing"
        ref="inputRef"
        v-model="editTitle"
        type="text"
        maxlength="120"
        @blur="saveTitle"
        @keydown="handleKeydown"
      />
      <h1 v-else @click="startEditing">{{ project.title }}</h1>
    </div>
  </header>
</template>

<style scoped>
.project-header {
  display: grid;
  gap: 6px;
}

p,
h1 {
  margin: 0;
}

p {
  color: #9f9f9f;
  font-size: 0.875rem;
}

.title-area {
  position: relative;
}

h1 {
  color: #ffffff;
  font-size: clamp(1.5rem, 7vw, 2.25rem);
  line-height: 1.2;
  cursor: pointer;
  transition: color 0.15s ease;
}

h1:hover {
  color: #f5c451;
}

.title-area input {
  width: 100%;
  border: 2px solid #f5c451;
  border-radius: 8px;
  padding: 6px 12px;
  color: #ffffff;
  background: #242424;
  font-size: clamp(1.5rem, 7vw, 2.25rem);
  font-weight: 700;
  line-height: 1.2;
}

.title-area input:focus {
  outline: none;
}
</style>