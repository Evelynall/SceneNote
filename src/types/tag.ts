import type { Identifiable, Timestamped, TagCategory } from './common'

export interface Tag extends Identifiable, Timestamped {
  name: string
  color?: string
  category?: TagCategory
}