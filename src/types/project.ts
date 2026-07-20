import type { Identifiable, Timestamped, Extensible, ProjectStatus } from './common'
import type { WatchSession } from './session'
import type { Marker } from './marker'

export interface Project extends Identifiable, Timestamped, Extensible {
  title: string
  originalTitle?: string
  description?: string
  cover?: string
  status: ProjectStatus
  duration?: number
  tags: string[]
  sessions: WatchSession[]
  markers: Marker[]
}