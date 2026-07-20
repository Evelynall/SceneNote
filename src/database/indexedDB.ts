import type { Project, Tag } from '../types'

const DATABASE_NAME = 'scene-note'
const DATABASE_VERSION = 3
const PROJECT_STORE_NAME = 'projects'
const TAG_STORE_NAME = 'tags'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

    request.onupgradeneeded = (event) => {
      const database = request.result
      const oldVersion = (event as { oldVersion?: number }).oldVersion ?? 0

      if (!database.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        const projectStore = database.createObjectStore(PROJECT_STORE_NAME, { keyPath: 'id' })
        projectStore.createIndex('updatedAt', 'updatedAt')
      }

      if (!database.objectStoreNames.contains(TAG_STORE_NAME)) {
        const tagStore = database.createObjectStore(TAG_STORE_NAME, { keyPath: 'id' })
        tagStore.createIndex('name', 'name', { unique: true })
        tagStore.createIndex('updatedAt', 'updatedAt')
      }

      if (oldVersion === 1 && database.objectStoreNames.contains(PROJECT_STORE_NAME)) {
        const transaction = request.transaction
        if (transaction) {
          const projectStore = transaction.objectStore(PROJECT_STORE_NAME)
          projectStore.openCursor().onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result
            if (!cursor) return

            const project = cursor.value as Project
            project.status = project.status ?? 'watching'
            project.tags = project.tags ?? []
            project.sessions = project.sessions ?? []
            for (const marker of project.markers) {
              marker.projectId = marker.projectId ?? project.id
              marker.tags = marker.tags ?? []
              marker.rating = marker.rating ?? 3
              marker.updatedAt = marker.updatedAt ?? marker.createdAt
            }
            cursor.update(project)
            cursor.continue()
          }
        }
      }

      if (oldVersion <= 2 && database.objectStoreNames.contains(TAG_STORE_NAME)) {
        const transaction = request.transaction
        if (transaction) {
          const tagStore = transaction.objectStore(TAG_STORE_NAME)
          tagStore.openCursor().onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result
            if (!cursor) return

            const tag = cursor.value as Tag
            cursor.update(tag)
            cursor.continue()
          }
        }
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('无法打开本地数据库。'))
    request.onblocked = () => reject(new Error('本地数据库正被其他页面占用，请关闭其他 SceneNote 页面后重试。'))
  })
}

export async function saveProject(project: Project): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE_NAME, 'readwrite')
    transaction.objectStore(PROJECT_STORE_NAME).put(project)

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('保存项目失败。'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('保存项目已取消。'))
    }
  })
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE_NAME, 'readonly')
    const request = transaction.objectStore(PROJECT_STORE_NAME).get(projectId)

    request.onsuccess = () => resolve((request.result as Project | undefined) ?? null)
    request.onerror = () => reject(request.error ?? new Error('读取项目失败。'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('读取项目失败。'))
    }
  })
}

export async function getAllProjects(): Promise<Project[]> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE_NAME, 'readonly')
    const request = transaction.objectStore(PROJECT_STORE_NAME).getAll()

    request.onsuccess = () => resolve(request.result as Project[])
    request.onerror = () => reject(request.error ?? new Error('读取项目列表失败。'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('读取项目列表失败。'))
    }
  })
}

export async function deleteProject(projectId: string): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PROJECT_STORE_NAME, 'readwrite')
    transaction.objectStore(PROJECT_STORE_NAME).delete(projectId)

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('删除项目失败。'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('删除项目已取消。'))
    }
  })
}

export async function saveTag(tag: Tag): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TAG_STORE_NAME, 'readwrite')
    transaction.objectStore(TAG_STORE_NAME).put(tag)

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('保存标签失败。'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('保存标签已取消。'))
    }
  })
}

export async function getTagById(tagId: string): Promise<Tag | null> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TAG_STORE_NAME, 'readonly')
    const request = transaction.objectStore(TAG_STORE_NAME).get(tagId)

    request.onsuccess = () => resolve((request.result as Tag | undefined) ?? null)
    request.onerror = () => reject(request.error ?? new Error('读取标签失败。'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('读取标签失败。'))
    }
  })
}

export async function getAllTags(): Promise<Tag[]> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TAG_STORE_NAME, 'readonly')
    const request = transaction.objectStore(TAG_STORE_NAME).getAll()

    request.onsuccess = () => resolve(request.result as Tag[])
    request.onerror = () => reject(request.error ?? new Error('读取标签列表失败。'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('读取标签列表失败。'))
    }
  })
}

export async function deleteTag(tagId: string): Promise<void> {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(TAG_STORE_NAME, 'readwrite')
    transaction.objectStore(TAG_STORE_NAME).delete(tagId)

    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('删除标签失败。'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('删除标签已取消。'))
    }
  })
}