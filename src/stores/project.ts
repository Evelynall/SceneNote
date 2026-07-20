import { defineStore } from 'pinia'
import { toRaw } from 'vue'
import { projectStorage, tagStorage } from '../services/storage'
import type { Marker, MarkerType, Project, Tag, WatchSession } from '../types'
import type { ProjectStatus, TagCategory } from '../types/common'
import { formatTime } from '../utils/time'

interface TimerState {
  elapsedSeconds: number
  hasStarted: boolean
  isRunning: boolean
  startedAt: number | null
  currentSessionId: string | null
}

let timerIntervalId: ReturnType<typeof window.setInterval> | undefined
let initializationPromise: Promise<void> | null = null

function createId(prefix: 'marker' | 'project' | 'session' | 'tag'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getMonotonicTime(): number {
  return performance.now()
}

function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((first, second) => second.updatedAt - first.updatedAt)
}

function createStorageSnapshot<T>(value: T): T {
  return structuredClone(toRaw(value))
}

function stopTimerLoop(): void {
  if (timerIntervalId !== undefined) {
    window.clearInterval(timerIntervalId)
    timerIntervalId = undefined
  }
}

function startTimerLoop(onTick: () => void): void {
  stopTimerLoop()
  timerIntervalId = window.setInterval(onTick, 250)
}

function clampRating(rating: number): number {
  return Math.max(1, Math.min(5, Math.round(rating)))
}

export const useProjectStore = defineStore('project', {
  state: () => ({
    currentProject: null as Project | null,
    isInitialized: false,
    projects: [] as Project[],
    tags: [] as Tag[],
    timer: {
      elapsedSeconds: 0,
      hasStarted: false,
      isRunning: false,
      startedAt: null,
      currentSessionId: null,
    } as TimerState,
    lastProjectId: null as string | null,
    navigationDirection: 'forward' as 'forward' | 'backward',
  }),

  actions: {
    async initialize(): Promise<void> {
      if (this.isInitialized) {
        return
      }

      if (initializationPromise) {
        return initializationPromise
      }

      initializationPromise = Promise.all([
        projectStorage.getProjects(),
        tagStorage.getTags(),
      ])
        .then(([projects, tags]) => {
          this.projects = sortProjects(projects)
          this.tags = tags
          this.isInitialized = true
        })
        .finally(() => {
          initializationPromise = null
        })

      return initializationPromise
    },

    async createProject(title: string): Promise<Project> {
      const trimmedTitle = title.trim()

      if (!trimmedTitle) {
        throw new Error('请输入电影名称。')
      }

      const now = Date.now()
      const project: Project = {
        id: createId('project'),
        title: trimmedTitle,
        status: 'watching',
        createdAt: now,
        updatedAt: now,
        tags: [],
        sessions: [],
        markers: [],
      }

      await projectStorage.saveProject(createStorageSnapshot(project))
      this.currentProject = project
      this.projects = sortProjects([project, ...this.projects])
      this.resetTimer()

      return project
    },

    async openProject(projectId: string): Promise<Project | null> {
      if (this.currentProject?.id === projectId) {
        return this.currentProject
      }

      if (this.timer.isRunning) {
        await this.pauseTimer()
      }

      const project = await projectStorage.getProject(projectId)

      if (!project) {
        return null
      }

      this.currentProject = project
      this.restoreTimer(project.duration)
      this.upsertProject(project)

      return project
    },

    async persistCurrentProject(): Promise<void> {
      if (!this.currentProject) {
        return
      }

      this.currentProject.updatedAt = Date.now()
      await projectStorage.saveProject(createStorageSnapshot(this.currentProject))
      this.upsertProject(this.currentProject)
    },

    async addMarker(input: {
      time: number
      type: MarkerType
      title?: string
      note: string
      tags?: string[]
      rating?: number
      endTime?: number
    }): Promise<Marker> {
      if (!this.currentProject) {
        throw new Error('请先创建或打开一个项目。')
      }

      const now = Date.now()
      const time = Math.max(0, Math.floor(input.time))
      const marker: Marker = {
        id: createId('marker'),
        projectId: this.currentProject.id,
        sessionId: this.timer.currentSessionId ?? undefined,
        time,
        timeText: formatTime(time),
        endTime: input.endTime !== undefined ? Math.max(time, Math.floor(input.endTime)) : undefined,
        type: input.type,
        title: input.title,
        note: input.note,
        tags: input.tags ?? [],
        rating: clampRating(input.rating ?? 3),
        createdAt: now,
        updatedAt: now,
      }

      this.currentProject.markers.push(marker)

      if (this.timer.currentSessionId) {
        const session = this.currentProject.sessions.find(s => s.id === this.timer.currentSessionId)
        if (session) {
          session.markers.push(marker.id)
          session.updatedAt = now
        }
      }

      await this.persistCurrentProject()

      return marker
    },

    async updateMarker(
      markerId: string,
      input: { time: number; type: MarkerType; title?: string; note: string; tags?: string[]; rating?: number; endTime?: number },
    ): Promise<void> {
      if (!this.currentProject) {
        throw new Error('请先创建或打开一个项目。')
      }

      const marker = this.currentProject.markers.find((item) => item.id === markerId)

      if (!marker) {
        throw new Error('未找到需要编辑的记录。')
      }

      const time = Math.max(0, Math.floor(input.time))
      marker.time = time
      marker.timeText = formatTime(time)
      marker.endTime = input.endTime !== undefined ? Math.max(time, Math.floor(input.endTime)) : undefined
      marker.type = input.type
      marker.title = input.title
      marker.note = input.note
      marker.tags = input.tags ?? []
      marker.rating = clampRating(input.rating ?? 3)
      marker.updatedAt = Date.now()

      await this.persistCurrentProject()
    },

    async deleteMarker(markerId: string): Promise<void> {
      if (!this.currentProject) {
        throw new Error('请先创建或打开一个项目。')
      }

      const index = this.currentProject.markers.findIndex((item) => item.id === markerId)

      if (index === -1) {
        return
      }

      this.currentProject.markers.splice(index, 1)

      for (const session of this.currentProject.sessions) {
        const markerIndex = session.markers.indexOf(markerId)
        if (markerIndex !== -1) {
          session.markers.splice(markerIndex, 1)
        }
      }

      await this.persistCurrentProject()
    },

    async createSession(name?: string): Promise<WatchSession> {
      if (!this.currentProject) {
        throw new Error('请先创建或打开一个项目。')
      }

      const now = Date.now()
      const session: WatchSession = {
        id: createId('session'),
        projectId: this.currentProject.id,
        name,
        startTime: now,
        markers: [],
        createdAt: now,
        updatedAt: now,
      }

      this.currentProject.sessions.push(session)
      this.timer.currentSessionId = session.id

      await this.persistCurrentProject()

      return session
    },

    async endSession(): Promise<void> {
      if (!this.currentProject || !this.timer.currentSessionId) {
        return
      }

      const session = this.currentProject.sessions.find(s => s.id === this.timer.currentSessionId)

      if (session) {
        const now = Date.now()
        session.endTime = now
        session.duration = Math.floor((now - session.startTime) / 1000)
        session.updatedAt = now
      }

      this.timer.currentSessionId = null
      await this.persistCurrentProject()
    },

    async deleteProject(projectId: string): Promise<void> {
      await projectStorage.deleteProject(projectId)
      this.projects = this.projects.filter((item) => item.id !== projectId)

      if (this.currentProject?.id === projectId) {
        this.currentProject = null
        this.resetTimer()
      }
    },

    async createTag(name: string, color?: string, category?: TagCategory): Promise<Tag> {
      const trimmedName = name.trim()

      if (!trimmedName) {
        throw new Error('标签名称不能为空。')
      }

      const existingTag = this.tags.find(t => t.name === trimmedName)
      if (existingTag) {
        return existingTag
      }

      const now = Date.now()
      const tag: Tag = {
        id: createId('tag'),
        name: trimmedName,
        color,
        category,
        createdAt: now,
        updatedAt: now,
      }

      await tagStorage.saveTag(tag)
      this.tags.push(tag)

      return tag
    },

    async deleteTag(tagId: string): Promise<void> {
      await tagStorage.deleteTag(tagId)
      this.tags = this.tags.filter(t => t.id !== tagId)

      for (const project of this.projects) {
        project.tags = project.tags.filter(t => t !== tagId)
        for (const marker of project.markers) {
          marker.tags = marker.tags.filter(t => t !== tagId)
        }
      }

      if (this.currentProject) {
        await this.persistCurrentProject()
      }
    },

    async importProject(project: Project): Promise<Project> {
      if (this.timer.isRunning) {
        await this.pauseTimer()
      }

      const importedProject = createStorageSnapshot(project)
      await projectStorage.saveProject(importedProject)
      this.currentProject = importedProject
      this.restoreTimer(importedProject.duration)
      this.upsertProject(importedProject)

      for (const tagName of importedProject.tags) {
        await this.createTag(tagName)
      }

      return importedProject
    },

    async importProjects(projects: Project[]): Promise<number> {
      for (const project of projects) {
        await this.importProject(project)
      }

      return projects.length
    },

    async updateProjectTitle(title: string): Promise<void> {
      if (!this.currentProject) {
        return
      }

      const trimmedTitle = title.trim()

      if (!trimmedTitle) {
        throw new Error('标题不能为空。')
      }

      this.currentProject.title = trimmedTitle
      await this.persistCurrentProject()
    },

    async updateProjectStatus(status: ProjectStatus): Promise<void> {
      if (!this.currentProject) {
        return
      }

      this.currentProject.status = status
      await this.persistCurrentProject()
    },

    saveLastProjectId(): void {
      if (this.currentProject) {
        this.lastProjectId = this.currentProject.id
      }
    },

    setNavigationDirection(direction: 'forward' | 'backward'): void {
      this.navigationDirection = direction
    },

    async setTimerElapsed(seconds: number): Promise<void> {
      const elapsedSeconds = Math.max(0, Math.floor(seconds))

      this.timer.elapsedSeconds = elapsedSeconds
      this.timer.hasStarted = true

      if (this.timer.isRunning) {
        this.timer.startedAt = getMonotonicTime() - elapsedSeconds * 1000
      }

      if (this.currentProject) {
        this.currentProject.duration = elapsedSeconds
        await this.persistCurrentProject()
      }
    },

    restoreTimer(duration?: number): void {
      stopTimerLoop()
      this.timer = {
        elapsedSeconds: Math.max(0, Math.floor(duration ?? 0)),
        hasStarted: duration !== undefined,
        isRunning: false,
        startedAt: null,
        currentSessionId: null,
      }
    },

    startTimer(): void {
      if (!this.currentProject || this.timer.isRunning) {
        return
      }

      this.timer.hasStarted = true
      this.timer.isRunning = true
      this.timer.startedAt = getMonotonicTime() - this.timer.elapsedSeconds * 1000
      this.tickTimer()
      startTimerLoop(() => this.tickTimer())
    },

    tickTimer(): void {
      if (!this.timer.isRunning || this.timer.startedAt === null) {
        return
      }

      const elapsed = (getMonotonicTime() - this.timer.startedAt) / 1000
      this.timer.elapsedSeconds = Math.max(0, Math.floor(elapsed))
    },

    async pauseTimer(): Promise<void> {
      if (!this.timer.isRunning) {
        return
      }

      this.tickTimer()
      this.timer.isRunning = false
      this.timer.startedAt = null
      stopTimerLoop()

      if (this.currentProject) {
        this.currentProject.duration = this.timer.elapsedSeconds
        await this.persistCurrentProject()
      }
    },

    resetTimer(): void {
      stopTimerLoop()
      this.timer = {
        elapsedSeconds: 0,
        hasStarted: false,
        isRunning: false,
        startedAt: null,
        currentSessionId: null,
      }
    },

    upsertProject(project: Project): void {
      const projectIndex = this.projects.findIndex((item) => item.id === project.id)

      if (projectIndex === -1) {
        this.projects = sortProjects([...this.projects, project])
        return
      }

      const nextProjects = [...this.projects]
      nextProjects[projectIndex] = project
      this.projects = sortProjects(nextProjects)
    },
  },
})