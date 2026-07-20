import type { Marker, MarkerType, Project, Tag } from '../types'
import type { JsonExport, MarkerExport, ProjectExport, TagExport, WatchSessionExport, TagCategory } from '../types/common'

const MARKER_TYPES: MarkerType[] = ['emotion', 'music', 'shot', 'dialogue', 'transition', 'favorite', 'custom']
const CURRENT_SCHEMA_VERSION = 1
const APP_VERSION = import.meta.env.npm_package_version ?? '1.0.0'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string') {
    throw new Error(`导入失败：${fieldName} 必须是字符串。`)
  }

  return value
}

function readNumber(value: unknown, fieldName: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`导入失败：${fieldName} 必须是有效数字。`)
  }

  return value
}

function readOptionalNumber(value: unknown, fieldName: string): number | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  return readNumber(value, fieldName)
}

function readOptionalString(value: unknown, fieldName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined
  }

  return readString(value, fieldName)
}

function readMarkerExport(value: unknown, index: number): MarkerExport {
  if (!isRecord(value)) {
    throw new Error(`导入失败：markers[${index}] 必须是对象。`)
  }

  const type = readString(value.type, `markers[${index}].type`)

  if (!MARKER_TYPES.includes(type as MarkerType)) {
    throw new Error(`导入失败：markers[${index}].type 不受支持。`)
  }

  const time = readNumber(value.time, `markers[${index}].time`)

  if (time < 0) {
    throw new Error(`导入失败：markers[${index}].time 不能小于 0。`)
  }

  const tags = Array.isArray(value.tags) ? value.tags.map((t) => String(t)) : []
  const rating = readOptionalNumber(value.rating, `markers[${index}].rating`) ?? 3

  return {
    id: readString(value.id, `markers[${index}].id`),
    projectId: readString(value.projectId, `markers[${index}].projectId`),
    sessionId: readOptionalString(value.sessionId, `markers[${index}].sessionId`),
    time,
    timeText: readString(value.timeText, `markers[${index}].timeText`),
    endTime: readOptionalNumber(value.endTime, `markers[${index}].endTime`),
    type: type as MarkerType,
    title: readOptionalString(value.title, `markers[${index}].title`),
    note: readString(value.note, `markers[${index}].note`),
    tags,
    rating,
    createdAt: readNumber(value.createdAt, `markers[${index}].createdAt`),
    updatedAt: readNumber(value.updatedAt, `markers[${index}].updatedAt`),
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  }
}

function readSessionExport(value: unknown, index: number): WatchSessionExport {
  if (!isRecord(value)) {
    throw new Error(`导入失败：sessions[${index}] 必须是对象。`)
  }

  const markers = Array.isArray(value.markers) ? value.markers.map((m) => String(m)) : []

  return {
    id: readString(value.id, `sessions[${index}].id`),
    projectId: readString(value.projectId, `sessions[${index}].projectId`),
    name: readOptionalString(value.name, `sessions[${index}].name`),
    startTime: readNumber(value.startTime, `sessions[${index}].startTime`),
    endTime: readOptionalNumber(value.endTime, `sessions[${index}].endTime`),
    duration: readOptionalNumber(value.duration, `sessions[${index}].duration`),
    markers,
    createdAt: readNumber(value.createdAt, `sessions[${index}].createdAt`),
    updatedAt: readNumber(value.updatedAt, `sessions[${index}].updatedAt`),
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  }
}

function readProjectExport(value: unknown): ProjectExport {
  if (!isRecord(value)) {
    throw new Error('导入失败：项目必须是对象。')
  }

  if (!Array.isArray(value.markers)) {
    throw new Error('导入失败：markers 必须是数组。')
  }

  const duration = readOptionalNumber(value.duration, 'duration')

  if (duration !== undefined && duration < 0) {
    throw new Error('导入失败：duration 不能小于 0。')
  }

  const tags = Array.isArray(value.tags) ? value.tags.map((t) => String(t)) : []
  const sessions = Array.isArray(value.sessions) ? value.sessions.map(readSessionExport) : []

  return {
    id: readString(value.id, 'id'),
    title: readString(value.title, 'title'),
    originalTitle: readOptionalString(value.originalTitle, 'originalTitle'),
    description: readOptionalString(value.description, 'description'),
    cover: readOptionalString(value.cover, 'cover'),
    status: readString(value.status, 'status') as ProjectExport['status'],
    duration,
    tags,
    sessions,
    markers: value.markers.map(readMarkerExport),
    createdAt: readNumber(value.createdAt, 'createdAt'),
    updatedAt: readNumber(value.updatedAt, 'updatedAt'),
    metadata: isRecord(value.metadata) ? value.metadata : undefined,
  }
}

const TAG_CATEGORIES: TagCategory[] = ['emotion', 'character', 'theme', 'style', 'custom']

function readTagExport(value: unknown, index: number): TagExport {
  if (!isRecord(value)) {
    throw new Error(`导入失败：tags[${index}] 必须是对象。`)
  }

  const category = readOptionalString(value.category, `tags[${index}].category`)
  const isValidCategory = !category || TAG_CATEGORIES.includes(category as TagCategory)

  return {
    id: readString(value.id, `tags[${index}].id`),
    name: readString(value.name, `tags[${index}].name`),
    color: readOptionalString(value.color, `tags[${index}].color`),
    category: isValidCategory ? (category as TagCategory) : undefined,
    createdAt: readNumber(value.createdAt, `tags[${index}].createdAt`),
    updatedAt: readNumber(value.updatedAt, `tags[${index}].updatedAt`),
  }
}

function exportMarker(marker: Marker): MarkerExport {
  return {
    id: marker.id,
    projectId: marker.projectId,
    sessionId: marker.sessionId,
    time: marker.time,
    timeText: marker.timeText,
    endTime: marker.endTime,
    type: marker.type,
    title: marker.title,
    note: marker.note,
    tags: marker.tags,
    rating: marker.rating,
    createdAt: marker.createdAt,
    updatedAt: marker.updatedAt ?? marker.createdAt,
    metadata: marker.metadata,
  }
}

function exportSession(session: Project['sessions'][number]): WatchSessionExport {
  return {
    id: session.id,
    projectId: session.projectId,
    name: session.name,
    startTime: session.startTime,
    endTime: session.endTime,
    duration: session.duration,
    markers: session.markers,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    metadata: session.metadata,
  }
}

function exportProject(project: Project): ProjectExport {
  return {
    id: project.id,
    title: project.title,
    originalTitle: project.originalTitle,
    description: project.description,
    cover: project.cover,
    status: project.status,
    duration: project.duration,
    tags: project.tags,
    sessions: project.sessions.map(exportSession),
    markers: project.markers.map(exportMarker),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    metadata: project.metadata,
  }
}

function exportTag(tag: Tag): TagExport {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    category: tag.category,
    createdAt: tag.createdAt,
    updatedAt: tag.updatedAt,
  }
}

export function serializeProject(project: Project): string {
  const exportData: JsonExport = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportTime: Date.now(),
    appVersion: APP_VERSION,
    data: {
      projects: [exportProject(project)],
      tags: [],
    },
  }

  return JSON.stringify(exportData, null, 2)
}

export function serializeProjects(projects: Project[], tags: Tag[]): string {
  const exportData: JsonExport = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportTime: Date.now(),
    appVersion: APP_VERSION,
    data: {
      projects: projects.map(exportProject),
      tags: tags.map(exportTag),
    },
  }

  return JSON.stringify(exportData, null, 2)
}

export function parseProjectJson(jsonText: string): Project {
  try {
    const data = JSON.parse(jsonText) as unknown

    if (isRecord(data) && data.schemaVersion !== undefined) {
      const exportData = data as unknown as JsonExport
      if (!isRecord(exportData.data) || !Array.isArray(exportData.data.projects)) {
        throw new Error('导入失败：数据格式不正确。')
      }

      const projectExport = exportData.data.projects[0]
      if (!projectExport) {
        throw new Error('导入失败：未找到项目数据。')
      }

      return convertProjectExportToProject(readProjectExport(projectExport))
    }

    return convertProjectExportToProject(readProjectExport(data))
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('导入失败：文件不是有效的 JSON。')
    }

    throw error
  }
}

export function parseProjectsJson(jsonText: string): { projects: Project[]; tags: Tag[] } {
  try {
    const data = JSON.parse(jsonText) as unknown

    if (!isRecord(data)) {
      throw new Error('导入失败：文件格式不正确。')
    }

    if (data.schemaVersion !== undefined) {
      const exportData = data as unknown as JsonExport

      if (!isRecord(exportData.data)) {
        throw new Error('导入失败：data 字段必须是对象。')
      }

      if (!Array.isArray(exportData.data.projects)) {
        throw new Error('导入失败：data.projects 必须是数组。')
      }

      const projects = exportData.data.projects.map((project: unknown, index: number) => {
        try {
          return convertProjectExportToProject(readProjectExport(project))
        } catch (error) {
          throw new Error(`导入失败：项目[${index}] ${(error as Error).message}`)
        }
      })

      const tags = Array.isArray(exportData.data.tags)
        ? exportData.data.tags.map((tag: unknown, index: number) => {
            try {
              return convertTagExportToTag(readTagExport(tag, index))
            } catch (error) {
              throw new Error(`导入失败：标签[${index}] ${(error as Error).message}`)
            }
          })
        : []

      return { projects, tags }
    }

    if (data.type === 'scenenote-bundle' && Array.isArray(data.projects)) {
      const projects = data.projects.map((project: unknown, index: number) => {
        try {
          return convertProjectExportToProject(readProjectExport(project))
        } catch (error) {
          throw new Error(`导入失败：项目[${index}] ${(error as Error).message}`)
        }
      })

      return { projects, tags: [] }
    }

    return { projects: [convertProjectExportToProject(readProjectExport(data))], tags: [] }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('导入失败：文件不是有效的 JSON。')
    }

    throw error
  }
}

function convertProjectExportToProject(exportData: ProjectExport): Project {
  return {
    id: exportData.id,
    title: exportData.title,
    originalTitle: exportData.originalTitle,
    description: exportData.description,
    cover: exportData.cover,
    status: exportData.status,
    duration: exportData.duration,
    tags: exportData.tags,
    sessions: exportData.sessions.map((s) => ({
      id: s.id,
      projectId: s.projectId,
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      duration: s.duration,
      markers: s.markers,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      metadata: s.metadata,
    })),
    markers: exportData.markers.map((m) => ({
      id: m.id,
      projectId: m.projectId,
      sessionId: m.sessionId,
      time: m.time,
      timeText: m.timeText,
      endTime: m.endTime,
      type: m.type,
      title: m.title,
      note: m.note,
      tags: m.tags,
      rating: m.rating,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      metadata: m.metadata,
    })),
    createdAt: exportData.createdAt,
    updatedAt: exportData.updatedAt,
    metadata: exportData.metadata,
  }
}

function convertTagExportToTag(exportData: TagExport): Tag {
  return {
    id: exportData.id,
    name: exportData.name,
    color: exportData.color,
    category: exportData.category,
    createdAt: exportData.createdAt,
    updatedAt: exportData.updatedAt,
  }
}

export function downloadProjectJson(project: Project): void {
  const content = serializeProject(project)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeTitle = project.title.replace(/[\\/:*?"<>|]/g, '_').trim() || 'SceneNote'

  link.href = objectUrl
  link.download = `${safeTitle}-SceneNote.json`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

export function downloadProjectsJson(projects: Project[], tags: Tag[]): void {
  const content = serializeProjects(projects, tags)
  const blob = new Blob([content], { type: 'application/json;charset=utf-8' })
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = `SceneNote-全项目备份-${new Date().toISOString().split('T')[0]}.json`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}