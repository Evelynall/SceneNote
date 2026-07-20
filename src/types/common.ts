export interface Identifiable {
  id: string
}

export interface Timestamped {
  createdAt: number
  updatedAt: number
}

export interface Extensible {
  metadata?: Record<string, unknown>
}

export interface JsonExport {
  schemaVersion: number
  exportTime: number
  appVersion: string
  data: ExportData
}

export interface ExportData {
  projects: ProjectExport[]
  tags: TagExport[]
}

export interface ProjectExport {
  id: string
  title: string
  originalTitle?: string
  description?: string
  cover?: string
  status: ProjectStatus
  duration?: number
  tags: string[]
  sessions: WatchSessionExport[]
  markers: MarkerExport[]
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

export interface WatchSessionExport {
  id: string
  projectId: string
  name?: string
  startTime: number
  endTime?: number
  duration?: number
  markers: string[]
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

export interface MarkerExport {
  id: string
  projectId: string
  sessionId?: string
  time: number
  timeText: string
  endTime?: number
  type: MarkerType
  title?: string
  note: string
  tags: string[]
  rating: number
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

export interface TagExport {
  id: string
  name: string
  color?: string
  category?: TagCategory
  createdAt: number
  updatedAt: number
}

export type ProjectStatus = 'planned' | 'watching' | 'finished' | 'reviewing' | 'editing'

export type MarkerType = 'emotion' | 'music' | 'shot' | 'dialogue' | 'transition' | 'favorite' | 'custom'

export type TagCategory = 'emotion' | 'character' | 'theme' | 'style' | 'custom'