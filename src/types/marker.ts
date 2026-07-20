import type { Identifiable, Timestamped, Extensible, MarkerType } from './common'

export interface Marker extends Identifiable, Timestamped, Extensible {
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
}