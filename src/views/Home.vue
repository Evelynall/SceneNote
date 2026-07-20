<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project'

const router = useRouter()
const projectStore = useProjectStore()
const title = ref('')
const errorMessage = ref('')
const isCreating = ref(false)

onMounted(async () => {
  await projectStore.initialize()
  if (projectStore.projects.length > 0) {
    await router.replace({ name: 'projects' })
  }
})

/** 创建项目后立即进入观看页，减少开始记录前的操作。 */
async function startWatching(): Promise<void> {
  if (isCreating.value) {
    return
  }

  errorMessage.value = ''
  isCreating.value = true

  try {
    await projectStore.initialize()
    const project = await projectStore.createProject(title.value)
    await router.push({ name: 'watch', params: { projectId: project.id } })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '创建项目失败，请重试。'
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <main class="page">
    <section class="intro">
      <p class="eyebrow">SceneNote</p>
      <h1>记录每一个值得剪辑的瞬间</h1>
      <p class="description">在观看影片时开始独立计时，灵感出现时快速留下时间点。</p>
    </section>

    <form class="create-form" @submit.prevent="startWatching">
      <label for="project-title">电影名称</label>
      <input id="project-title" v-model="title" type="text" maxlength="120" placeholder="例如：盗梦空间" autocomplete="off" required />
      <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
      <button type="submit" :disabled="isCreating">
        {{ isCreating ? '正在创建…' : '开始观看' }}
      </button>
    </form>
  </main>
</template>

<style scoped>
.page {
  display: grid;
  min-height: 100dvh;
  padding: 32px 24px calc(32px + env(safe-area-inset-bottom));
  align-content: space-between;
  gap: 48px;
}

.intro,
.create-form {
  display: grid;
  gap: 14px;
}

.eyebrow,
h1,
.description,
label,
.error {
  margin: 0;
}

.eyebrow {
  color: #f5c451;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  max-width: 10ch;
  color: #ffffff;
  font-size: clamp(2.4rem, 11vw, 4rem);
  line-height: 1.08;
}

.description,
label {
  color: #b8b8b8;
  line-height: 1.6;
}

.create-form {
  width: 100%;
}

input,
button {
  min-height: 58px;
  border-radius: 14px;
  font-size: 1rem;
}

input {
  width: 100%;
  border: 1px solid #3a3a3a;
  padding: 0 16px;
  color: #ffffff;
  background: #151515;
}

input:focus {
  outline: 2px solid #f5c451;
  outline-offset: 2px;
}

button {
  border: 0;
  color: #080808;
  background: #f5c451;
  font-weight: 800;
}

button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.error {
  color: #ff9898;
}
</style>
