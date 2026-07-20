import type { Identifiable, Timestamped, Extensible } from './common'

export interface WatchSession extends Identifiable, Timestamped, Extensible {
  projectId: string
  name?: string
  startTime: number
  endTime?: number
  duration?: number
  markers: string[]
}